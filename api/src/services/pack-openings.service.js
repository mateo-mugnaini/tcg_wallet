import { findSetById } from "../repositories/sets.repository.js";
import {
  getOpeningStatus,
  getSetPokedex,
  openPackBatch,
} from "../repositories/pack-openings.repository.js";
import {
  MAX_PACKS_PER_OPENING,
  PACK_SIZE,
} from "../domain/pack-opening.js";
import { createAppError } from "../errors/app.errors.js";

export async function openPacks({ userId, setId, quantity }) {
  const normalizedQuantity = Number(quantity);
  if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1 || normalizedQuantity > MAX_PACKS_PER_OPENING) {
    throw createAppError(`La cantidad de sobres debe estar entre 1 y ${MAX_PACKS_PER_OPENING}`, 400);
  }

  return openPackBatch({ userId, setId, quantity: normalizedQuantity });
}

export async function getPokedex({ userId, setId }) {
  const set = await findSetById(setId);
  if (!set) throw createAppError("Set no encontrado", 404);

  const cards = await getSetPokedex({ userId, setId });
  const ownedCards = cards.filter((card) => card.owned).length;

  return {
    set: {
      id: set.id,
      tcg_id: set.tcg_id,
      name: set.name,
      code: set.code,
    },
    summary: {
      total_cards: cards.length,
      owned_cards: ownedCards,
      missing_cards: cards.length - ownedCards,
      completion_percentage: cards.length === 0 ? 0 : Number(((ownedCards / cards.length) * 100).toFixed(2)),
      cards_per_pack: PACK_SIZE,
    },
    data: cards,
  };
}

export { getOpeningStatus };
