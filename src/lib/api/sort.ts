import { sortSchema } from "@/validate";

import type { CrudRegistryEntry } from "./registry";
import type { SortOptions } from "./types";

export function getSorting(
  searchParams: URLSearchParams,
  registry: CrudRegistryEntry
): {
  orderBy: Record<string, "asc" | "desc">;
  sort: SortOptions;
} {
  const { sort, order } = sortSchema.parse({
    sort:
      searchParams.get("sort") ??
      undefined,

    order:
      searchParams.get("order") ??
      undefined,
  });

  const defaultOrderBy =
    registry.defaultOrderBy ?? {
      createdAt: "desc",
    };

  if (
    !sort ||
    !registry.sortableFields.includes(sort)
  ) {
    const [field, direction] =
      Object.entries(
        defaultOrderBy
      )[0];

    return {
      orderBy: defaultOrderBy,

      sort: {
        field,
        order: direction,
      },
    };
  }

  return {
    orderBy: {
      [sort]: order,
    },

    sort: {
      field: sort,
      order,
    },
  };
}
