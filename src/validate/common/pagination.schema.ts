import { z } from "zod";

const pageSchema = z.preprocess(
  (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return undefined;
    }

    return value;
  },
  z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
);

const limitSchema = z.preprocess(
  (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return undefined;
    }

    return value;
  },
  z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10)
);

export const paginationSchema = z.object({
  page: pageSchema,

  limit: limitSchema,
});

export type PaginationInput = z.infer<
  typeof paginationSchema
>;
