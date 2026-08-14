import Joi from "joi";

/* ====================================
        CARD ID PARAM
==================================== */

export const cardPriceCardIdParamsSchema = Joi.object({
  cardId: Joi.number().integer().positive().required(),
});

/* ====================================
        LISTAR CARD PRICES
==================================== */

export const getCardPricesQuerySchema = Joi.object({
  source: Joi.string().trim().min(1).max(100).optional(),

  condition: Joi.string().trim().min(1).max(100).optional(),

  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(20),

  sortOrder: Joi.string().valid("ASC", "DESC", "asc", "desc").default("DESC"),
});

/* ====================================
        ÚLTIMO CARD PRICE
==================================== */

export const getLatestCardPriceQuerySchema = Joi.object({
  source: Joi.string().trim().min(1).max(100).optional(),

  condition: Joi.string().trim().min(1).max(100).optional(),
});

/* ====================================
        CREAR CARD PRICE
==================================== */

export const createCardPriceSchema = Joi.object({
  condition: Joi.string().trim().min(1).max(100).required(),

  price: Joi.number().min(0).required(),

  currency: Joi.string().trim().min(1).max(10).required(),

  source: Joi.string().trim().min(1).max(100).required(),
});
