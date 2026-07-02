import { z } from "zod";

export const sortSchema = z.object({
  sort: z.string().trim().optional(),

  order: z
    .enum(["asc", "desc"])
    .default("asc"),
});

export type SortInput = z.infer<
  typeof sortSchema
>;

export const searchSchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export type SearchInput = z.infer<
  typeof searchSchema
>;
