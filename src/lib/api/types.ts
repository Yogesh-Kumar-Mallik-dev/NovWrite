import { registry } from "./registry";

export type Domain = keyof typeof registry;

export type CrudRegistryEntry =
  (typeof registry)[Domain];

export type PaginationOptions = {
  page: number;
  limit: number;
  skip: number;
};

export type SortOrder = "asc" | "desc";

export type SortOptions = {
  field?: string;
  order: SortOrder;
};

export type SearchOptions = {
  value?: string;
};

export type FilterOptions = Record<
  string,
  string | number | boolean
>;

export type QueryOptions = {
  pagination: PaginationOptions;
  sort: SortOptions;
  search: SearchOptions;
  filters: FilterOptions;
};
