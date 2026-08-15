import { z } from "zod";

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
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
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
