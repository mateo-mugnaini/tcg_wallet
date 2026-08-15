import {
  findCardPrices,
  countCardPrices,
  findLatestCardPrice,
  createCardPrice,
  getCardPriceStats,
  findLatestCardPrices,
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

  /* ====================================
          CALCULAR TOTAL PÁGINAS
  ==================================== */

  const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedLimit);

  return {
    data: prices,

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
  /* ====================================
          COMPROBAR CARD
  ==================================== */

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  /* ====================================
          BUSCAR ÚLTIMO PRECIO
  ==================================== */

  const price = await findLatestCardPrice({
    cardId,
    source,
    condition,
  });

  if (!price) {
    throw createAppError("No existen precios registrados para esta Card", 404);
  }

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
  /* ====================================
          COMPROBAR CARD
  ==================================== */

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  /* ====================================
          VALIDAR CONDITION
  ==================================== */

  if (!condition || typeof condition !== "string") {
    throw createAppError("La condición del precio es obligatoria", 400);
  }

  /* ====================================
          VALIDAR PRICE
  ==================================== */

  const normalizedPrice = Number(price);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw createAppError("El precio debe ser un número mayor o igual a 0", 400);
  }

  /* ====================================
          VALIDAR CURRENCY
  ==================================== */

  if (!currency || typeof currency !== "string") {
    throw createAppError("La moneda es obligatoria", 400);
  }

  /* ====================================
          VALIDAR SOURCE
  ==================================== */

  if (!source || typeof source !== "string") {
    throw createAppError("La fuente del precio es obligatoria", 400);
  }

  /* ====================================
          CREAR REGISTRO
  ==================================== */

  return createCardPrice({
    cardId,
    condition,
    price: normalizedPrice,
    currency,
    source,
  });
}

/* ====================================
        ESTADÍSTICAS CARD PRICE
==================================== */

export async function getCardPriceStatistics({ cardId, source, condition }) {
  /* ====================================
          COMPROBAR CARD
  ==================================== */

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  /* ====================================
          OBTENER ESTADÍSTICAS
  ==================================== */

  const stats = await getCardPriceStats({
    cardId,
    source,
    condition,
  });

  /* ====================================
          SIN PRECIOS
  ==================================== */

  if (Number(stats.total) === 0) {
    throw createAppError("No existen precios registrados para esta Card", 404);
  }

  /* ====================================
          NORMALIZAR RESULTADO
  ==================================== */

  return {
    total: Number(stats.total),
    minimumPrice:
      stats.minimum_price !== null ? Number(stats.minimum_price) : null,
    maximumPrice:
      stats.maximum_price !== null ? Number(stats.maximum_price) : null,
    averagePrice:
      stats.average_price !== null ? Number(stats.average_price) : null,
  };
}

/* ====================================
        VARIACIÓN CARD PRICE
==================================== */

export async function getCardPriceVariation({ cardId, source, condition }) {
  /* ====================================
          COMPROBAR CARD
  ==================================== */

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }

  /* ====================================
          OBTENER ÚLTIMOS PRECIOS
  ==================================== */

  const prices = await findLatestCardPrices({
    cardId,
    source,
    condition,
  });

  /* ====================================
          VALIDAR HISTORIAL
  ==================================== */

  if (prices.length === 0) {
    throw createAppError("No existen precios registrados para esta Card", 404);
  }

  if (prices.length < 2) {
    throw createAppError(
      "No existen suficientes precios históricos para calcular una variación",
      404,
    );
  }

  /* ====================================
          OBTENER PRECIOS
  ==================================== */

  const currentPrice = Number(prices[0].price);
  const previousPrice = Number(prices[1].price);

  /* ====================================
          VALIDAR PRECIOS
  ==================================== */

  if (!Number.isFinite(currentPrice) || !Number.isFinite(previousPrice)) {
    throw createAppError("Los precios registrados no son válidos", 500);
  }

  /* ====================================
          CALCULAR VARIACIÓN ABSOLUTA
  ==================================== */

  const absoluteVariation = currentPrice - previousPrice;

  /* ====================================
          CALCULAR VARIACIÓN PORCENTUAL
  ==================================== */

  let percentageVariation = null;

  if (previousPrice !== 0) {
    percentageVariation = (absoluteVariation / previousPrice) * 100;
  }

  /* ====================================
          DETERMINAR DIRECCIÓN
  ==================================== */

  let direction = "unchanged";

  if (absoluteVariation > 0) {
    direction = "up";
  } else if (absoluteVariation < 0) {
    direction = "down";
  }

  /* ====================================
              RESULTADO
  ==================================== */

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
