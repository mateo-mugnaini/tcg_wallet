import pool from "../config/database.js";
import { createAppError } from "../errors/app.errors.js";
import {
  COLLECTION_CONDITION,
  OPENING_COOLDOWN_SECONDS,
  drawPackCards,
  normalizeRarityKey,
} from "../domain/pack-opening.js";

function iso(value) {
  return new Date(value).toISOString();
}

function mapCard(card) {
  return {
    id: card.id,
    set_id: card.set_id,
    external_id: card.external_id,
    name: card.name,
    card_number: card.card_number,
    rarity: card.rarity,
    image_url: card.image_url,
  };
}

export async function openPackBatch({ userId, setId, quantity }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT id FROM users WHERE id = $1 FOR UPDATE",
      [userId],
    );
    if (userResult.rowCount === 0) {
      throw createAppError("El usuario no existe", 404);
    }

    const setResult = await client.query(
      `SELECT id, tcg_id, external_id, name, code, release_date
       FROM sets
       WHERE id = $1`,
      [setId],
    );
    if (setResult.rowCount === 0) {
      throw createAppError("Set no encontrado", 404);
    }

    const cooldownResult = await client.query(
      `SELECT next_open_at
       FROM pack_opening_cooldowns
       WHERE user_id = $1
       FOR UPDATE`,
      [userId],
    );
    const now = Date.now();
    const nextOpenAt = cooldownResult.rows[0]?.next_open_at;
    if (nextOpenAt && new Date(nextOpenAt).getTime() > now) {
      throw createAppError(
        "Debes esperar antes de abrir otro sobre",
        429,
        "OPENING_COOLDOWN",
        { nextOpenAt: iso(nextOpenAt) },
      );
    }

    const cardsResult = await client.query(
      `SELECT id, set_id, external_id, name, card_number, rarity, image_url
       FROM cards
       WHERE set_id = $1
       ORDER BY card_number NULLS LAST, id`,
      [setId],
    );
    if (cardsResult.rowCount === 0) {
      throw createAppError("El set no tiene cartas disponibles", 409, "SET_WITHOUT_CARDS");
    }

    const rulesResult = await client.query(
      `SELECT rarity_key, weight
       FROM pack_rarity_rules
       WHERE set_id = $1
       ORDER BY id`,
      [setId],
    );

    const draws = drawPackCards(cardsResult.rows, rulesResult.rows, quantity);
    const totalCards = draws.length;
    const openingResult = await client.query(
      `INSERT INTO pack_openings (user_id, set_id, pack_quantity, total_cards)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, set_id, pack_quantity, total_cards, opened_at`,
      [userId, setId, quantity, totalCards],
    );
    const opening = openingResult.rows[0];

    const resultCards = [];
    for (const draw of draws) {
      const result = await client.query(
        `INSERT INTO pack_opening_cards
          (opening_id, card_id, pack_number, slot_number, rarity_key)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, opening_id, card_id, pack_number, slot_number, rarity_key`,
        [opening.id, draw.card.id, draw.packNumber, draw.slotNumber, draw.rarityKey],
      );
      resultCards.push({ ...result.rows[0], card: mapCard(draw.card) });
    }

    const collectionByCard = new Map();
    for (const draw of draws) {
      collectionByCard.set(draw.card.id, (collectionByCard.get(draw.card.id) ?? 0) + 1);
    }

    for (const [cardId, amount] of collectionByCard) {
      const existingResult = await client.query(
        `SELECT id, quantity
         FROM collection_items
         WHERE user_id = $1
           AND card_id = $2
           AND condition = $3
           AND is_graded = FALSE
           AND grading_company_id IS NULL
           AND grade IS NULL
         ORDER BY created_at, id
         LIMIT 1
         FOR UPDATE`,
        [userId, cardId, COLLECTION_CONDITION],
      );

      if (existingResult.rowCount > 0) {
        await client.query(
          `UPDATE collection_items
           SET quantity = quantity + $1, updated_at = NOW()
           WHERE id = $2`,
          [amount, existingResult.rows[0].id],
        );
      } else {
        await client.query(
          `INSERT INTO collection_items
            (user_id, card_id, quantity, condition, is_graded)
           VALUES ($1, $2, $3, $4, FALSE)`,
          [userId, cardId, amount, COLLECTION_CONDITION],
        );
      }
    }

    const nextOpen = new Date(now + OPENING_COOLDOWN_SECONDS * 1000);
    await client.query(
      `INSERT INTO pack_opening_cooldowns (user_id, next_open_at)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET next_open_at = EXCLUDED.next_open_at, updated_at = NOW()`,
      [userId, nextOpen],
    );

    await client.query("COMMIT");

    return {
      opening_id: opening.id,
      set_id: opening.set_id,
      pack_quantity: Number(opening.pack_quantity),
      cards_per_pack: 5,
      total_cards: Number(opening.total_cards),
      opened_at: iso(opening.opened_at),
      next_open_at: nextOpen.toISOString(),
      cards: resultCards,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOpeningStatus(userId) {
  const result = await pool.query(
    `SELECT next_open_at
     FROM pack_opening_cooldowns
     WHERE user_id = $1`,
    [userId],
  );
  const nextOpenAt = result.rows[0]?.next_open_at ?? null;
  return {
    can_open: !nextOpenAt || new Date(nextOpenAt).getTime() <= Date.now(),
    next_open_at: nextOpenAt ? iso(nextOpenAt) : null,
  };
}

export async function getSetPokedex({ userId, setId }) {
  const result = await pool.query(
    `SELECT
       c.id,
       c.set_id,
       c.external_id,
       c.name,
       c.card_number,
       c.rarity,
       c.image_url,
       COALESCE(SUM(ci.quantity), 0)::integer AS owned_quantity
     FROM cards c
     LEFT JOIN collection_items ci
       ON ci.card_id = c.id
      AND ci.user_id = $1
      AND ci.is_graded = FALSE
      AND ci.condition = $2
     WHERE c.set_id = $3
     GROUP BY c.id
     ORDER BY c.card_number NULLS LAST, c.id`,
    [userId, COLLECTION_CONDITION, setId],
  );

  return result.rows.map((card) => ({
    ...mapCard(card),
    rarity_key: normalizeRarityKey(card.rarity),
    owned_quantity: Number(card.owned_quantity),
    owned: Number(card.owned_quantity) > 0,
  }));
}
