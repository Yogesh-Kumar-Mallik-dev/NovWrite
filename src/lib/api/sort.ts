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
    sort: searchParams.get("sort") ?? undefined,
    order: searchParams.get("order") ?? undefined,
  });

  if (
    !sort ||
    !registry.sortableFields.includes(sort)
  ) {
    return {
      orderBy:
        registry.defaultOrderBy ?? {
          createdAt: "desc",
        },

      sort: {
        order,
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
