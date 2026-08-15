import { z } from "zod";

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
  }),
});
