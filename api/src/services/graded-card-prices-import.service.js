import { findCardsByIds } from "../repositories/cards.repository.js";
import { findGradingCompaniesByIds } from "../repositories/grading-companies.repository.js";
import {
  createGradedCardPrices,
} from "../repositories/graded-card-prices.repository.js";
import { createAppError } from "../errors/app.errors.js";

export async function importGradedCardPrices(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    throw createAppError("Debe existir al menos un precio graded", 400);
  }

  const normalizedPrices = prices.map((price) => ({
    cardId: price.cardId,
    gradingCompanyId: price.gradingCompanyId,
    grade: Number(price.grade),
    price: Number(price.price),
    currency: String(price.currency ?? "").trim(),
    source: String(price.source ?? "").trim(),
    recordedAt: price.recordedAt ? new Date(price.recordedAt) : null,
  }));

  const cardIds = [...new Set(normalizedPrices.map((price) => price.cardId))];
  const gradingCompanyIds = [
    ...new Set(normalizedPrices.map((price) => price.gradingCompanyId)),
  ];

  const [cards, gradingCompanies] = await Promise.all([
    findCardsByIds(cardIds),
    findGradingCompaniesByIds(gradingCompanyIds),
  ]);

  const existingCardIds = new Set(cards.map((card) => card.id));
  const existingGradingCompanyIds = new Set(
    gradingCompanies.map((gradingCompany) => gradingCompany.id),
  );

  const missingCardIds = cardIds.filter((id) => !existingCardIds.has(id));
  const missingGradingCompanyIds = gradingCompanyIds.filter(
    (id) => !existingGradingCompanyIds.has(id),
  );

  if (missingCardIds.length > 0 || missingGradingCompanyIds.length > 0) {
    throw createAppError(
      "El lote contiene relaciones inexistentes",
      404,
      "GRADED_PRICE_RELATION_NOT_FOUND",
      { missingCardIds, missingGradingCompanyIds },
    );
  }

  const invalidPrice = normalizedPrices.find(
    (price) =>
      !Number.isFinite(price.grade) ||
      price.grade < 0 ||
      price.grade > 10 ||
      !Number.isFinite(price.price) ||
      price.price < 0 ||
      !price.currency ||
      !price.source ||
      (price.recordedAt !== null &&
        Number.isNaN(price.recordedAt.getTime())),
  );

  if (invalidPrice) {
    throw createAppError("El lote contiene un precio graded inválido", 400);
  }

  const createdPrices = await createGradedCardPrices(normalizedPrices);

  return {
    summary: {
      received: normalizedPrices.length,
      created: createdPrices.length,
    },
  };
}
