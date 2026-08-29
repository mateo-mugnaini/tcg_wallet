import { describe, expect, it } from "vitest";
import {
  DEFAULT_RARITY_RULES,
  drawPackCards,
  normalizeRarityKey,
} from "../src/domain/pack-opening.js";

const cards = [
  { id: "common-1", rarity: "Common" },
  { id: "common-2", rarity: "Common" },
  { id: "uncommon-1", rarity: "Uncommon" },
  { id: "rare-1", rarity: "Rare" },
  { id: "holo-1", rarity: "Rare Holo" },
  { id: "ultra-1", rarity: "Rare Ultra" },
];

describe("pack opening domain", () => {
  it("normalizes provider rarity names to canonical keys", () => {
    expect(normalizeRarityKey("Rare Secret")) .toBe("secret_rare");
    expect(normalizeRarityKey("Rare Holo")) .toBe("holo_rare");
    expect(normalizeRarityKey("Uncommon")) .toBe("uncommon");
    expect(normalizeRarityKey(null)).toBe("common");
  });

  it("generates five cards per pack and preserves pack positions", () => {
    const result = drawPackCards(cards, DEFAULT_RARITY_RULES, 2);

    expect(result).toHaveLength(10);
    expect(result.slice(0, 5).map((card) => card.packNumber)).toEqual([1, 1, 1, 1, 1]);
    expect(result.slice(0, 5).map((card) => card.slotNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(result.slice(5).every((card) => card.packNumber === 2)).toBe(true);
    expect(result.every((card) => card.rarityKey)).toBe(true);
  });

  it("uses only the configured rarity pool", () => {
    const result = drawPackCards(
      cards,
      [{ rarity_key: "ultra_rare", weight: 1 }],
      1,
    );

    expect(result).toHaveLength(5);
    expect(result.every((card) => card.card.id === "ultra-1")).toBe(true);
  });

  it("falls back to the available rarity when a set has no common cards", () => {
    const result = drawPackCards(
      [{ id: "rare-only", rarity: "Rare" }],
      [{ rarityKey: "common", weight: 1 }],
      1,
    );

    expect(result.every((card) => card.card.id === "rare-only")).toBe(true);
  });
});
