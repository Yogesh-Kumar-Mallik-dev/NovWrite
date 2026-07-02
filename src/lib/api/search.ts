import { searchSchema } from "@/validate";

import type { CrudRegistryEntry } from "./registry";

export function getSearch(
  searchParams: URLSearchParams,
  registry: CrudRegistryEntry
) {
  const { search } = searchSchema.parse({
    search:
      searchParams.get("search") ??
      undefined,
  });

  if (
    !search ||
    registry.searchableFields.length === 0
  ) {
    return {
      where: {},
      search: undefined,
    };
  }

  return {
    where: {
      OR: registry.searchableFields.map(
        (field) => ({
          [field]: {
            contains: search,
            mode: "insensitive",
          },
        })
      ),
    },

    search,
  };
}
