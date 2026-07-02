import { paginationSchema } from "@/validate";

import { PaginationOptions } from "@/lib/api/types";

export function getPagination(
  searchParams: URLSearchParams
): PaginationOptions {
  const parsed = paginationSchema.parse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });

  return {
    page: parsed.page,
    limit: parsed.limit,
    skip: (parsed.page - 1) * parsed.limit,
  };
}
