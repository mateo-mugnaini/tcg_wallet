import { getGradedCardPrices } from "../services/graded-card-prices.service.js";

export async function getGradedCardPricesController(req, res, next) {
  try {
    const { cardId } = req.validated.params;
    const { gradingCompanyId, grade, page, limit, sortOrder } =
      req.validated.query;

    const result = await getGradedCardPrices({
      cardId,
      gradingCompanyId,
      grade,
      page,
      limit,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
