import { z } from "zod";

type CrudModel = {
  findMany: (
    ...args: any[]
  ) => Promise<any>;

  findUnique: (
    ...args: any[]
  ) => Promise<any>;

  create: (
    ...args: any[]
  ) => Promise<any>;

  update: (
    ...args: any[]
  ) => Promise<any>;

  delete: (
    ...args: any[]
  ) => Promise<any>;

  count: (
    ...args: any[]
  ) => Promise<number>;
};

export type CrudRegistryEntry = {
  model: CrudModel;

  createSchema: z.ZodTypeAny;

  updateSchema: z.ZodTypeAny;

  searchableFields: readonly string[];

  filterableFields: readonly string[];

  sortableFields: readonly string[];

  defaultOrderBy?: Record<
    string,
    "asc" | "desc"
  >;

  include?: Record<
    string,
    boolean
  >;
};
