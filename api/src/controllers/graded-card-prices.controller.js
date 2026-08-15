import {
  getGradedCardPrices,
  getLatestGradedCardPrice,
  getGradedCardPriceStatistics,
  getGradedCardPriceVariation,
  getGradedCardPriceAggregations,
} from "../services/graded-card-prices.service.js";

function getFilters(req) {
  const { cardId } = req.validated.params;
  const { gradingCompanyId, grade } = req.validated.query;

  return { cardId, gradingCompanyId, grade };
}

export async function getGradedCardPricesController(req, res, next) {
  try {
    const { page, limit, sortOrder } = req.validated.query;

    const result = await getGradedCardPrices({
      ...getFilters(req),
      page,
      limit,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getLatestGradedCardPriceController(req, res, next) {
  try {
    const result = await getLatestGradedCardPrice(getFilters(req));

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getGradedCardPriceStatisticsController(req, res, next) {
  try {
    const result = await getGradedCardPriceStatistics(getFilters(req));

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getGradedCardPriceVariationController(req, res, next) {
  try {
    const result = await getGradedCardPriceVariation(getFilters(req));

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getGradedCardPriceAggregationsController(
  req,
  res,
  next,
) {
  try {
    const { period } = req.validated.query;

    const result = await getGradedCardPriceAggregations({
      ...getFilters(req),
      period,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
