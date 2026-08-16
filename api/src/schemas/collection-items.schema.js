import { z } from "zod";
import { sortOrderSchema } from "./common.schema.js";

const booleanQuerySchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },
  z.boolean().optional(),
);

const nullableGradeSchema = z
  .union([z.coerce.number().min(0).max(10), z.null()])
  .default(null);

export const collectionItemIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const getCollectionItemsQuerySchema = z.object({
  cardId: z.string().uuid().optional(),
  condition: z.string().trim().min(1).max(100).optional(),
  isGraded: booleanQuerySchema,
  setId: z.string().uuid().optional(),
  tcgId: z.string().uuid().optional(),
  rarity: z.string().trim().min(1).max(100).optional(),
  gradingCompanyId: z.string().uuid().optional(),
  minGrade: z.coerce.number().min(0).max(10).optional(),
  maxGrade: z.coerce.number().min(0).max(10).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z
    .enum(["created_at", "updated_at", "quantity", "grade", "card_name", "name"])
    .default("created_at"),
  sortOrder: sortOrderSchema.default("DESC"),
});

export const createCollectionItemSchema = z.object({
  cardId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1),
  condition: z.string().trim().min(1).max(100),
  isGraded: z.boolean().default(false),
  gradingCompanyId: z.string().uuid().nullable().default(null),
  grade: nullableGradeSchema,
});

export const updateCollectionItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).optional(),
  condition: z.string().trim().min(1).max(100).optional(),
  isGraded: z.boolean().optional(),
  gradingCompanyId: z.string().uuid().nullable().optional(),
  grade: z.union([z.coerce.number().min(0).max(10), z.null()]).optional(),
});

const collectionValueItemSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  cardName: z.string(),
  cardNumber: z.string().nullable(),
  imageUrl: z.string().nullable(),
  setName: z.string(),
  tcgName: z.string(),
  quantity: z.number().int(),
  condition: z.string(),
  isGraded: z.boolean(),
  gradingCompanyId: z.string().uuid().nullable(),
  gradingCompanyName: z.string().nullable(),
  grade: z.number().nullable(),
  unitPrice: z.number(),
  totalItemValue: z.number(),
});

export const collectionValueResponseSchema = z.object({
  data: z.object({
    summary: z.object({
      totalEstimatedValue: z.number(),
      currency: z.string(),
      itemsEvaluatedCount: z.number().int(),
      itemsMissingPriceCount: z.number().int(),
      gradedItemsEvaluatedCount: z.number().int(),
      gradedItemsMissingPriceCount: z.number().int(),
    }),
    topValuedItems: z.array(collectionValueItemSchema),
    bySet: z.array(
      z.object({
        setId: z.string().uuid(),
        setName: z.string(),
        setCode: z.string().nullable(),
        estimatedValue: z.number(),
        totalQuantity: z.number().int(),
      }),
    ),
    byTcg: z.array(
      z.object({
        tcgId: z.string().uuid(),
        tcgName: z.string(),
        estimatedValue: z.number(),
        totalQuantity: z.number().int(),
      }),
    ),
    byGradingCompany: z.array(
      z.object({
        gradingCompanyId: z.string().uuid(),
        gradingCompanyName: z.string(),
        estimatedValue: z.number(),
        totalQuantity: z.number().int(),
      }),
    ),
  }),
});

const collectionItemBaseResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  card_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  condition: z.string(),
  is_graded: z.boolean(),
  grading_company_id: z.string().uuid().nullable(),
  grade: z.number().nullable(),
  created_at: z.union([z.string(), z.date()]),
  updated_at: z.union([z.string(), z.date()]),
});

const collectionCardResponseSchema = z.object({
  id: z.string().uuid(),
  set_id: z.string().uuid(),
  external_id: z.string().nullable(),
  name: z.string(),
  card_number: z.string().nullable(),
  rarity: z.string().nullable(),
  image_url: z.string().nullable(),
});

const collectionSetResponseSchema = z.object({
  id: z.string().uuid(),
  tcg_id: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable(),
  release_date: z.union([z.string(), z.date()]).nullable(),
});

const collectionTcgResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const collectionGradingCompanyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const collectionItemResponseSchema = collectionItemBaseResponseSchema.extend({
  card: collectionCardResponseSchema,
  set: collectionSetResponseSchema,
  tcg: collectionTcgResponseSchema,
  grading_company: collectionGradingCompanyResponseSchema.nullable(),
});

export const collectionItemsListResponseSchema = z.object({
  data: z.array(collectionItemResponseSchema),
  pagination: z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
  }),
});

export const collectionItemDataResponseSchema = z.object({
  data: collectionItemResponseSchema,
});

export const collectionItemMutationResponseSchema = z.object({
  message: z.string(),
  data: z.union([collectionItemResponseSchema, collectionItemBaseResponseSchema]),
});

const collectionStatsBreakdownSchema = z.object({
  distinctCards: z.number().int().min(0),
  totalQuantity: z.number().int().min(0),
});

export const collectionStatsResponseSchema = z.object({
  data: z.object({
    summary: z.object({
      totalDistinctCards: z.number().int().min(0),
      totalQuantity: z.number().int().min(0),
      gradedQuantity: z.number().int().min(0),
      ungradedQuantity: z.number().int().min(0),
    }),
    byCondition: z.array(
      collectionStatsBreakdownSchema.extend({ condition: z.string() }),
    ),
    bySet: z.array(
      collectionStatsBreakdownSchema.extend({
        setId: z.string().uuid(),
        setName: z.string(),
        setCode: z.string().nullable(),
      }),
    ),
    byTcg: z.array(
      collectionStatsBreakdownSchema.extend({
        tcgId: z.string().uuid(),
        tcgName: z.string(),
      }),
    ),
    byGradingCompany: z.array(
      collectionStatsBreakdownSchema.extend({
        gradingCompanyId: z.string().uuid(),
        gradingCompanyName: z.string(),
      }),
    ),
  }),
});
