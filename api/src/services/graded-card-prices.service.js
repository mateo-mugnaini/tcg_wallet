import { findCardById } from "../repositories/cards.repository.js";
import { findGradingCompanyById } from "../repositories/grading-companies.repository.js";

import {
  createGradedCardPrice,
  findGradedCardPrices,
  countGradedCardPrices,
  findLatestGradedCardPrice,
  getGradedCardPriceStats,
  findLatestGradedCardPrices,
  getGradedCardPriceAggregations as findGradedCardPriceAggregations,
} from "../repositories/graded-card-prices.repository.js";

import { createAppError } from "../errors/app.errors.js";

function normalizeGradedCardPrice(price) {
  return {
    ...price,
    currency: String(price.currency).trim(),
    grade: Number(price.grade),
    price: Number(price.price),
    recorded_at: new Date(price.recorded_at).toISOString(),
  };
}

async function ensureCardExists(cardId) {
  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }
}

export async function registerGradedCardPrice({
  cardId,
  gradingCompanyId,
  grade,
  price,
  currency,
  source,
}) {
  await ensureCardExists(cardId);

  const gradingCompany = await findGradingCompanyById(gradingCompanyId);

  if (!gradingCompany) {
    throw createAppError("La empresa de grading no existe", 404);
  }

  const normalizedGrade = Number(grade);
  const normalizedPrice = Number(price);

  if (!Number.isFinite(normalizedGrade) || normalizedGrade < 0 || normalizedGrade > 10) {
    throw createAppError("El grade debe ser un número entre 0 y 10", 400);
  }

  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw createAppError("El precio debe ser un número mayor o igual a 0", 400);
  }

  const normalizedCurrency = String(currency ?? "").trim();
  const normalizedSource = String(source ?? "").trim();

  if (!normalizedCurrency) {
    throw createAppError("La moneda es obligatoria", 400);
  }

  if (!normalizedSource) {
    throw createAppError("La fuente del precio es obligatoria", 400);
  }

  const gradedCardPrice = await createGradedCardPrice({
    cardId,
    gradingCompanyId,
    grade: normalizedGrade,
    price: normalizedPrice,
    currency: normalizedCurrency,
    source: normalizedSource,
  });

  return {
    data: normalizeGradedCardPrice(gradedCardPrice),
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

  await ensureCardExists(cardId);

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

export async function getLatestGradedCardPrice({
  cardId,
  gradingCompanyId,
  grade,
}) {
  await ensureCardExists(cardId);

  const price = await findLatestGradedCardPrice({
    cardId,
    gradingCompanyId,
    grade,
  });

  if (!price) {
    throw createAppError(
      "No existen precios graded registrados para esta Card",
      404,
    );
  }

  return {
    data: normalizeGradedCardPrice(price),
  };
}

export async function getGradedCardPriceStatistics({
  cardId,
  gradingCompanyId,
  grade,
}) {
  await ensureCardExists(cardId);

  const stats = await getGradedCardPriceStats({
    cardId,
    gradingCompanyId,
    grade,
  });

  if (Number(stats.total) === 0) {
    throw createAppError(
      "No existen precios graded registrados para esta Card",
      404,
    );
  }

  return {
    data: {
      total: Number(stats.total),
      minimumPrice:
        stats.minimum_price === null ? null : Number(stats.minimum_price),
      maximumPrice:
        stats.maximum_price === null ? null : Number(stats.maximum_price),
      averagePrice:
        stats.average_price === null ? null : Number(stats.average_price),
    },
  };
}

export async function getGradedCardPriceVariation({
  cardId,
  gradingCompanyId,
  grade,
}) {
  await ensureCardExists(cardId);

  const prices = await findLatestGradedCardPrices({
    cardId,
    gradingCompanyId,
    grade,
  });

  if (prices.length === 0) {
    throw createAppError(
      "No existen precios graded registrados para esta Card",
      404,
    );
  }

  if (prices.length < 2) {
    throw createAppError(
      "No existen suficientes precios graded históricos para calcular una variación",
      404,
    );
  }

  const current = normalizeGradedCardPrice(prices[0]);
  const previous = normalizeGradedCardPrice(prices[1]);
  const absoluteVariation = current.price - previous.price;
  const percentageVariation =
    previous.price === 0
      ? null
      : (absoluteVariation / previous.price) * 100;

  let direction = "unchanged";

  if (absoluteVariation > 0) {
    direction = "up";
  } else if (absoluteVariation < 0) {
    direction = "down";
  }

  return {
    data: {
      currentPrice: current.price,
      previousPrice: previous.price,
      absoluteVariation,
      percentageVariation,
      direction,
      currency: current.currency,
      source: current.source,
      currentGradingCompanyId: current.grading_company_id,
      previousGradingCompanyId: previous.grading_company_id,
      currentGrade: current.grade,
      previousGrade: previous.grade,
      currentRecordedAt: current.recorded_at,
      previousRecordedAt: previous.recorded_at,
    },
  };
}

export async function getGradedCardPriceAggregations({
  cardId,
  gradingCompanyId,
  grade,
  period = "day",
}) {
  await ensureCardExists(cardId);

  if (!["day", "week", "month"].includes(period)) {
    throw createAppError("El período debe ser day, week o month", 400);
  }

  const aggregations = await findGradedCardPriceAggregations({
    cardId,
    gradingCompanyId,
    grade,
    period,
  });

  if (aggregations.length === 0) {
    throw createAppError(
      "No existen precios graded registrados para esta Card",
      404,
    );
  }

  return {
    data: aggregations.map((aggregation) => ({
      period: new Date(aggregation.period).toISOString(),
      total: Number(aggregation.total),
      minimumPrice:
        aggregation.minimum_price === null
          ? null
          : Number(aggregation.minimum_price),
      maximumPrice:
        aggregation.maximum_price === null
          ? null
          : Number(aggregation.maximum_price),
      averagePrice:
        aggregation.average_price === null
          ? null
          : Number(aggregation.average_price),
    })),
  };
}
