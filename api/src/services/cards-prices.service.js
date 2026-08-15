import {
  findCardPrices,
  countCardPrices,
  findLatestCardPrice,
  findLatestCardPrices,
  createCardPrice,
  getCardPriceStats,
  getCardPriceAggregations as findCardPriceAggregations,
} from "../repositories/cards-prices.repository.js";

import { findCardById } from "../repositories/cards.repository.js";

import { createAppError } from "../errors/app.errors.js";
import { formatTimestamp } from "../utils/dateformater.js";

/* ====================================
        LISTAR CARD PRICES
==================================== */

export async function getCardPrices({
  cardId,
  source,
  condition,
  page = 1,
  limit = 20,
  sortOrder = "DESC",
}) {
  console.log("[SERVICE] getCardPrices - START");

  /* ====================================
          NORMALIZAR PAGINACIÓN
  ==================================== */

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

  /* ====================================
          COMPROBAR CARD
  ==================================== */

  console.log("[SERVICE] getCardPrices - Checking card");

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  /* ====================================
          CALCULAR OFFSET
  ==================================== */

  const offset = (normalizedPage - 1) * normalizedLimit;

  /* ====================================
          CONSULTAR DATOS + TOTAL
  ==================================== */

  console.log("[SERVICE] getCardPrices - Querying prices");

  const [prices, total] = await Promise.all([
    findCardPrices({
      cardId,
      source,
      condition,
      limit: normalizedLimit,
      offset,
      sortOrder,
    }),

    countCardPrices({
      cardId,
      source,
      condition,
    }),
  ]);

  console.log("[SERVICE] getCardPrices - Queries completed");

  /* ====================================
          NORMALIZAR PRECIOS
  ==================================== */

  const normalizedPrices = prices.map((price) => ({
    ...price,
    price: Number(price.price),
  }));

  /* ====================================
          CALCULAR TOTAL PÁGINAS
  ==================================== */

  const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedLimit);

  console.log("[SERVICE] getCardPrices - END");

  return {
    data: normalizedPrices,

    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages,
    },
  };
}

/* ====================================
        OBTENER ÚLTIMO PRECIO
==================================== */

export async function getLatestCardPrice({ cardId, source, condition }) {
  console.log("[SERVICE] getLatestCardPrice - START");

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  const price = await findLatestCardPrice({
    cardId,
    source,
    condition,
  });

  if (!price) {
    throw createAppError("No existen precios registrados para esta Card", 404);
  }

  console.log("[SERVICE] getLatestCardPrice - END");

  return price;
}

/* ====================================
        CREAR CARD PRICE
==================================== */

export async function registerCardPrice({
  cardId,
  condition,
  price,
  currency,
  source,
}) {
  console.log("[SERVICE] registerCardPrice - START");

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  if (!condition || typeof condition !== "string") {
    throw createAppError("La condición del precio es obligatoria", 400);
  }

  const normalizedPrice = Number(price);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw createAppError("El precio debe ser un número mayor o igual a 0", 400);
  }

  if (!currency || typeof currency !== "string") {
    throw createAppError("La moneda es obligatoria", 400);
  }

  if (!source || typeof source !== "string") {
    throw createAppError("La fuente del precio es obligatoria", 400);
  }

  const cardPrice = await createCardPrice({
    cardId,
    condition,
    price: normalizedPrice,
    currency,
    source,
  });

  console.log("[SERVICE] registerCardPrice - END");

  return cardPrice;
}

/* ====================================
        ESTADÍSTICAS CARD PRICE
==================================== */

export async function getCardPriceStatistics({ cardId, source, condition }) {
  console.log("[SERVICE] getCardPriceStatistics - START");

  console.log("[SERVICE] getCardPriceStatistics - Checking card");

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  console.log("[SERVICE] getCardPriceStatistics - Card found");

  console.log("[SERVICE] getCardPriceStatistics - Querying statistics");

  const stats = await getCardPriceStats({
    cardId,
    source,
    condition,
  });

  console.log("[SERVICE] getCardPriceStatistics - Statistics received");

  if (Number(stats.total) === 0) {
    throw createAppError("No existen precios registrados para esta Card", 404);
  }

  const result = {
    total: Number(stats.total),

    minimumPrice:
      stats.minimum_price !== null ? Number(stats.minimum_price) : null,

    maximumPrice:
      stats.maximum_price !== null ? Number(stats.maximum_price) : null,

    averagePrice:
      stats.average_price !== null ? Number(stats.average_price) : null,
  };

  console.log("[SERVICE] getCardPriceStatistics - END");

  return result;
}

/* ====================================
        VARIACIÓN CARD PRICE
==================================== */

export async function getCardPriceVariation({ cardId, source, condition }) {
  console.log("[SERVICE] getCardPriceVariation - START");

  console.log("[SERVICE] getCardPriceVariation - Checking card");

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  console.log("[SERVICE] getCardPriceVariation - Card found");

  console.log("[SERVICE] getCardPriceVariation - Querying latest prices");

  const prices = await findLatestCardPrices({
    cardId,
    source,
    condition,
  });

  console.log(
    `[SERVICE] getCardPriceVariation - Prices received: ${prices.length}`,
  );

  if (prices.length === 0) {
    throw createAppError("No existen precios registrados para esta Card", 404);
  }

  if (prices.length < 2) {
    throw createAppError(
      "No existen suficientes precios históricos para calcular una variación",
      404,
    );
  }

  const currentPrice = Number(prices[0].price);
  const previousPrice = Number(prices[1].price);

  if (!Number.isFinite(currentPrice) || !Number.isFinite(previousPrice)) {
    throw createAppError("Los precios registrados no son válidos", 500);
  }

  const absoluteVariation = currentPrice - previousPrice;

  let percentageVariation = null;

  if (previousPrice !== 0) {
    percentageVariation = (absoluteVariation / previousPrice) * 100;
  }

  let direction = "unchanged";

  if (absoluteVariation > 0) {
    direction = "up";
  } else if (absoluteVariation < 0) {
    direction = "down";
  }

  console.log("[SERVICE] getCardPriceVariation - END");

  return {
    currentPrice,
    previousPrice,
    absoluteVariation,
    percentageVariation,
    direction,
    currency: prices[0].currency,
    source: prices[0].source,
    condition: prices[0].condition,
    currentRecordedAt: formatTimestamp(prices[0].recorded_at),
    previousRecordedAt: formatTimestamp(prices[1].recorded_at),
  };
}

/* ====================================
        AGREGACIONES CARD PRICE
==================================== */

export async function getCardPriceAggregations({
  cardId,
  source,
  condition,
  period = "day",
}) {
  console.log("====================================");
  console.log("[SERVICE] getCardPriceAggregations - START");
  console.log("====================================");

  console.log("[SERVICE] Card ID:", cardId);
  console.log("[SERVICE] Source:", source);
  console.log("[SERVICE] Condition:", condition);
  console.log("[SERVICE] Period:", period);

  /* ====================================
          COMPROBAR CARD
  ==================================== */

  console.log("[SERVICE] Checking card...");

  console.time("[SERVICE] findCardById");

  const card = await findCardById(cardId);

  console.timeEnd("[SERVICE] findCardById");

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  console.log("[SERVICE] Card found");

  /* ====================================
          VALIDAR PERÍODO
  ==================================== */

  console.log("[SERVICE] Validating period...");

  const allowedPeriods = ["day", "week", "month"];

  if (!allowedPeriods.includes(period)) {
    throw createAppError("El período debe ser day, week o month", 400);
  }

  console.log("[SERVICE] Period valid");

  /* ====================================
          OBTENER AGREGACIONES
  ==================================== */

  console.log("[SERVICE] Querying aggregations...");

  console.time("[SERVICE] findCardPriceAggregations");

  const aggregations = await findCardPriceAggregations({
    cardId,
    source,
    condition,
    period,
  });

  console.timeEnd("[SERVICE] findCardPriceAggregations");

  console.log(`[SERVICE] Aggregations received: ${aggregations.length}`);

  /* ====================================
          SIN DATOS
  ==================================== */

  if (aggregations.length === 0) {
    throw createAppError("No existen precios registrados para esta Card", 404);
  }

  /* ====================================
          NORMALIZAR RESULTADO
  ==================================== */

  console.log("[SERVICE] Normalizing aggregations...");

  const result = aggregations.map((aggregation) => ({
    period: aggregation.period,

    total: Number(aggregation.total),

    minimumPrice:
      aggregation.minimum_price !== null
        ? Number(aggregation.minimum_price)
        : null,

    maximumPrice:
      aggregation.maximum_price !== null
        ? Number(aggregation.maximum_price)
        : null,

    averagePrice:
      aggregation.average_price !== null
        ? Number(aggregation.average_price)
        : null,
  }));

  console.log("[SERVICE] Aggregations normalized");

  console.log("====================================");
  console.log("[SERVICE] getCardPriceAggregations - END");
  console.log("====================================");

  return result;
}