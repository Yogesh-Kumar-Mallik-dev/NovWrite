import { z } from "zod";

export const positiveIntSchema = z
  .int()
  .positive();

export const nonNegativeIntSchema = z
  .int()
  .min(0);

export const multiplierSchema = z
  .int()
  .positive();

/* -------------------------------------------------------------------------- */
/*                                Percentages                                 */
/* -------------------------------------------------------------------------- */

// Whole-number percentage (0, 1, 2 ... 100)
export const wholePercentageSchema = z
  .int()
  .min(0)
  .max(100);

// Decimal percentage (65.75, 99.999, ...)
export const percentageSchema = z
  .coerce
  .number()
  .min(0)
  .max(100);
