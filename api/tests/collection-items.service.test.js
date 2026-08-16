import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  findCardById: vi.fn(),
  createCollectionItem: vi.fn(),
  findCollectionItems: vi.fn(),
  findCollectionItemById: vi.fn(),
  updateCollectionItem: vi.fn(),
  deleteCollectionItem: vi.fn(),
  countCollectionItems: vi.fn(),
  findCollectionStats: vi.fn(),
  findCollectionValue: vi.fn(),
  findGradingCompanyById: vi.fn(),
}));

vi.mock("../src/repositories/cards.repository.js", () => ({
  findCardById: repositoryMocks.findCardById,
}));

vi.mock("../src/repositories/collection-items.repository.js", () => ({
  createCollectionItem: repositoryMocks.createCollectionItem,
  findCollectionItems: repositoryMocks.findCollectionItems,
  findCollectionItemById: repositoryMocks.findCollectionItemById,
  updateCollectionItem: repositoryMocks.updateCollectionItem,
  deleteCollectionItem: repositoryMocks.deleteCollectionItem,
  countCollectionItems: repositoryMocks.countCollectionItems,
  getCollectionStats: repositoryMocks.findCollectionStats,
  getCollectionValue: repositoryMocks.findCollectionValue,
}));

vi.mock("../src/repositories/grading-companies.repository.js", () => ({
  findGradingCompanyById: repositoryMocks.findGradingCompanyById,
}));

import {
  addCollectionItem,
  editCollectionItem,
  getCollectionItems,
  removeCollectionItem,
} from "../src/services/collection-items.service.js";

const userId = "11111111-1111-4111-8111-111111111111";
const cardId = "ffc52be3-19e1-4af4-a9b2-ed32340b4c7f";
const itemId = "22222222-2222-4222-8222-222222222222";
const gradingCompanyId = "37840a12-adc9-4ce2-be17-b5c58ecc1e4f";

describe("collection items service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.findCardById.mockResolvedValue({ id: cardId });
    repositoryMocks.findGradingCompanyById.mockResolvedValue({
      id: gradingCompanyId,
      name: "PSA",
    });
  });

  it("normalizes and persists an ungraded collection item", async () => {
    repositoryMocks.createCollectionItem.mockResolvedValue({ id: itemId });
    repositoryMocks.findCollectionItemById.mockResolvedValue({ id: itemId });

    const result = await addCollectionItem({
      userId,
      cardId,
      quantity: 2,
      condition: " Near Mint ",
    });

    expect(repositoryMocks.createCollectionItem).toHaveBeenCalledWith({
      userId,
      cardId,
      quantity: 2,
      condition: "Near Mint",
      isGraded: false,
      gradingCompanyId: null,
      grade: null,
    });
    expect(result).toEqual({ id: itemId });
  });

  it("validates graded data and converts the grade to a number", async () => {
    repositoryMocks.createCollectionItem.mockResolvedValue({ id: itemId });
    repositoryMocks.findCollectionItemById.mockResolvedValue({ id: itemId });

    await addCollectionItem({
      userId,
      cardId,
      quantity: 1,
      condition: "Gem Mint",
      isGraded: true,
      gradingCompanyId,
      grade: "9.5",
    });

    expect(repositoryMocks.findGradingCompanyById).toHaveBeenCalledWith(
      gradingCompanyId,
    );
    expect(repositoryMocks.createCollectionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        isGraded: true,
        gradingCompanyId,
        grade: 9.5,
      }),
    );
  });

  it("rejects graded items without a grading company", async () => {
    await expect(
      addCollectionItem({
        userId,
        cardId,
        quantity: 1,
        condition: "Near Mint",
        isGraded: true,
        grade: 9,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(repositoryMocks.createCollectionItem).not.toHaveBeenCalled();
  });

  it("forwards collection filters and returns pagination metadata", async () => {
    repositoryMocks.findCollectionItems.mockResolvedValue([{ id: itemId }]);
    repositoryMocks.countCollectionItems.mockResolvedValue(21);

    const result = await getCollectionItems({
      userId,
      isGraded: true,
      gradingCompanyId,
      minGrade: 8,
      limit: 10,
      offset: 10,
      sortBy: "grade",
      sortOrder: "ASC",
    });

    expect(repositoryMocks.findCollectionItems).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        isGraded: true,
        gradingCompanyId,
        minGrade: 8,
        limit: 10,
        offset: 10,
        sortBy: "grade",
        sortOrder: "ASC",
      }),
    );
    expect(result).toEqual({
      items: [{ id: itemId }],
      total: 21,
      limit: 10,
      offset: 10,
    });
  });

  it("enforces ownership when updating and deleting items", async () => {
    repositoryMocks.findCollectionItemById.mockResolvedValue({
      id: itemId,
      quantity: 1,
      condition: "Near Mint",
      is_graded: false,
      grading_company_id: null,
      grade: null,
    });
    repositoryMocks.updateCollectionItem.mockResolvedValue({ id: itemId });
    repositoryMocks.deleteCollectionItem.mockResolvedValue({ id: itemId });

    await editCollectionItem({
      id: itemId,
      userId,
      quantity: 2,
    });
    await removeCollectionItem({ id: itemId, userId });

    expect(repositoryMocks.findCollectionItemById).toHaveBeenCalledWith(
      itemId,
      userId,
    );
    expect(repositoryMocks.updateCollectionItem).toHaveBeenCalledWith(
      itemId,
      userId,
      expect.objectContaining({ quantity: 2, isGraded: false }),
    );
    expect(repositoryMocks.deleteCollectionItem).toHaveBeenCalledWith(
      itemId,
      userId,
    );
  });
});
