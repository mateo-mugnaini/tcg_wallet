import { importGradedCardPrices } from "../services/graded-card-prices-import.service.js";

export async function importGradedCardPricesController(req, res, next) {
  try {
    const result = await importGradedCardPrices(req.validated.body.prices);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
