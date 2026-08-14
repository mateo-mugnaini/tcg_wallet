import {
  getCardPrices,
  getCardPriceStatistics,
  getLatestCardPrice,
  registerCardPrice,
} from "../services/cards-prices.service.js";

/* ====================================
        LISTAR CARD PRICES
==================================== */

export async function getCardPricesController(req, res, next) {
  try {
    const { cardId } = req.params;

    const { source, condition, page, limit, sortOrder } = req.query;

    const result = await getCardPrices({
      cardId,
      source,
      condition,
      page,
      limit,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/* ====================================
        OBTENER ÚLTIMO PRECIO
==================================== */

export async function getLatestCardPriceController(req, res, next) {
  try {
    const { cardId } = req.params;

    const { source, condition } = req.query;

    const price = await getLatestCardPrice({
      cardId,
      source,
      condition,
    });

    return res.status(200).json({
      data: price,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
        CREAR CARD PRICE
==================================== */

export async function createCardPriceController(req, res, next) {
  try {
    const { cardId, condition, price, currency, source } = req.body;

    const cardPrice = await registerCardPrice({
      cardId,
      condition,
      price,
      currency,
      source,
    });

    return res.status(201).json({
      data: cardPrice,
    });
  } catch (error) {
    next(error);
  }
}
/* ====================================
        ESTADÍSTICAS CARD PRICE
==================================== */

export async function getCardPriceStatisticsController(req, res, next) {
  try {
    const { cardId } = req.params;

    const { source, condition } = req.query;

    const statistics = await getCardPriceStatistics({
      cardId,
      source,
      condition,
    });

    return res.status(200).json({
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
}
