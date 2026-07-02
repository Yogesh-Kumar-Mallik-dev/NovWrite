import type { CrudRegistryEntry } from "./registry";

const RESERVED_PARAMS = new Set([
  "page",
  "limit",
  "sort",
  "order",
  "search",
]);

export function getFilters(
  searchParams: URLSearchParams,
  registry: CrudRegistryEntry
) {
  const where: Record<string, unknown> = {};

  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_PARAMS.has(key)) {
      continue;
    }

    if (
      !registry.filterableFields.includes(key)
    ) {
      continue;
    }

    if (value === "true") {
      where[key] = true;
      continue;
    }

    if (value === "false") {
      where[key] = false;
      continue;
    }

    const number = Number(value);

    if (
      !Number.isNaN(number) &&
      value.trim() !== ""
    ) {
      where[key] = number;
      continue;
    }

    where[key] = value;
  }

  return where;
}
