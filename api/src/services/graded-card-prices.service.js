import { findCardById } from "../repositories/cards.repository.js";

import {
  findGradedCardPrices,
  countGradedCardPrices,
} from "../repositories/graded-card-prices.repository.js";

import { createAppError } from "../errors/app.errors.js";

function normalizeGradedCardPrice(price) {
  return {
    ...price,
    grade: Number(price.grade),
    price: Number(price.price),
    recorded_at: new Date(price.recorded_at).toISOString(),
  };
}

export async function getGradedCardPrices({
  cardId,
  gradingCompanyId,
  grade,
  page = 1,
  limit = 20,
  sortOrder = "DESC",
}) {
  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);

  if (!Number.isInteger(normalizedPage) || normalizedPage < 1) {
    throw createAppError(
      "La página debe ser un número entero mayor o igual a 1",
      400,
    );
  }

  if (
    !Number.isInteger(normalizedLimit) ||
    normalizedLimit < 1 ||
    normalizedLimit > 100
  ) {
    throw createAppError(
      "El límite debe ser un número entero entre 1 y 100",
      400,
    );
  }

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  const offset = (normalizedPage - 1) * normalizedLimit;

  const [prices, total] = await Promise.all([
    findGradedCardPrices({
      cardId,
      gradingCompanyId,
      grade,
      limit: normalizedLimit,
      offset,
      sortOrder,
    }),
    countGradedCardPrices({
      cardId,
      gradingCompanyId,
      grade,
    }),
  ]);

  return {
    data: prices.map(normalizeGradedCardPrice),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / normalizedLimit),
    },
  };
}
