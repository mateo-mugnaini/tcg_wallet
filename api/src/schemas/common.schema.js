import { z } from "zod";

/**
 * Query parameters arrive as strings and clients commonly send sort order in
 * lowercase. Normalize it once at the HTTP boundary so repositories receive a
 * single, safe representation.
 */
export const sortOrderSchema = z.preprocess(
  (value) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  z.enum(["ASC", "DESC"]),
);
