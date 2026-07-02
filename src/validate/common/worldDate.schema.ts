import { z } from "zod";

export const worldDateSchema = z.object({
  year: z.int(),
  month: z.int().min(1).max(12),
  day: z.int().min(1).max(35),
});

export type WorldDateInput = z.infer<
  typeof worldDateSchema
>;
