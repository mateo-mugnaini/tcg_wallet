import { syncPokemonCardPrices } from "../syncs/cards-prices-sync.service.js";

/* ====================================
        SYNC CARD PRICES
==================================== */

export async function syncPokemonCardPricesController(req, res, next) {
  try {
    const result = await syncPokemonCardPrices();

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
