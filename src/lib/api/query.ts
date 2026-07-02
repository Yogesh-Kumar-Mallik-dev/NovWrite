import type { CrudRegistryEntry } from "./registry";

import { getFilters } from "./filters";
import { getPagination } from "./pagination";
import { getSearch } from "./search";
import { getSorting } from "./sort";

export function buildQuery(
  searchParams: URLSearchParams,
  registry: CrudRegistryEntry
) {
  const pagination = getPagination(searchParams);

  const filters = getFilters(
    searchParams,
    registry
  );

  const { where: searchWhere } =
    getSearch(searchParams, registry);

  const { orderBy } = getSorting(
    searchParams,
    registry
  );

  const where = {
    ...filters,

    ...(Object.keys(searchWhere).length > 0
      ? searchWhere
      : {}),
  };

  return {
    where,

    orderBy,

    skip: pagination.skip,

    take: pagination.limit,
  };
}
