import { randomInt } from "node:crypto";

export const PACK_SIZE = 5;
export const MAX_PACKS_PER_OPENING = 10;
export const OPENING_COOLDOWN_SECONDS = 120;
export const COLLECTION_CONDITION = "normal";

export const DEFAULT_RARITY_RULES = [
  { rarityKey: "common", weight: 60 },
  { rarityKey: "uncommon", weight: 25 },
  { rarityKey: "rare", weight: 10 },
  { rarityKey: "holo_rare", weight: 4 },
  { rarityKey: "ultra_rare", weight: 1 },
];

const RARITY_ALIASES = [
  ["secret_rare", ["secret", "hyper"], 100],
  ["ultra_rare", ["ultra", "illustration", "special", "amazing", "shining"], 90],
  ["holo_rare", ["holo", "radiant", "prism"], 80],
  ["rare", ["rare"], 70],
  ["uncommon", ["uncommon", "infrequent", "infrecuente"], 60],
  ["common", ["common", "comun", "común"], 50],
];

export function normalizeRarityKey(rarity) {
  const normalized = String(rarity ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [rarityKey, aliases] of RARITY_ALIASES) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return rarityKey;
    }
  }

  return "common";
}

function weightedChoice(items) {
  const totalWeight = items.reduce((total, item) => total + Number(item.weight), 0);

  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    throw new Error("Las reglas de rareza no contienen pesos válidos");
  }

  const scale = 1_000_000;
  const target = randomInt(scale) / scale * totalWeight;
  let cursor = 0;

  for (const item of items) {
    cursor += Number(item.weight);
    if (target < cursor) return item;
  }

  return items.at(-1);
}

export function drawPackCards(cards, rules, quantity) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("El set no tiene cartas disponibles");
  }

  const cardsByRarity = new Map();
  for (const card of cards) {
    const rarityKey = normalizeRarityKey(card.rarity);
    const group = cardsByRarity.get(rarityKey) ?? [];
    group.push({ ...card, rarityKey });
    cardsByRarity.set(rarityKey, group);
  }

  const configuredRules = rules.length > 0
    ? rules.map((rule) => ({
        rarityKey: rule.rarityKey ?? rule.rarity_key,
        weight: Number(rule.weight),
      }))
    : DEFAULT_RARITY_RULES;
  const availableRules = configuredRules.filter((rule) => cardsByRarity.has(rule.rarityKey));
  const effectiveRules = availableRules.length > 0
    ? availableRules
    : [{ rarityKey: "common", weight: 1 }];

  if (effectiveRules.length === 1 && effectiveRules[0].rarityKey === "common" && !cardsByRarity.has("common")) {
    effectiveRules[0] = { rarityKey: normalizeRarityKey(cards[0].rarity), weight: 1 };
  }

  return Array.from({ length: quantity * PACK_SIZE }, (_, index) => {
    const selectedRule = weightedChoice(effectiveRules);
    const candidates = cardsByRarity.get(selectedRule.rarityKey) ?? cards;
    const selectedCard = candidates[randomInt(candidates.length)];

    return {
      card: selectedCard,
      packNumber: Math.floor(index / PACK_SIZE) + 1,
      slotNumber: (index % PACK_SIZE) + 1,
      rarityKey: selectedCard.rarityKey ?? normalizeRarityKey(selectedCard.rarity),
    };
  });
}
