import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  paginateArray,
  NovWriteApiClient,
  ApiError,
  type PaginatedApiResponse,
} from "../apiClient.ts";

describe("BLOCK_WEB_API_CLIENT_001: Standardized API Client and Array Paginator", () => {
  const sampleItems = Array.from({ length: 25 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`,
    value: (i + 1) * 10,
  }));

  it("should paginate items into standard 10-item pages with pagination meta", () => {
    // Page 1
    const p1: PaginatedApiResponse<(typeof sampleItems)[0]> = paginateArray(
      sampleItems,
      {
        page: 1,
        pageSize: 10,
      },
    );
    assert.equal(p1.data.length, 10);
    assert.equal(p1.data[0].id, "item-1");
    assert.equal(p1.data[9].id, "item-10");
    assert.equal(p1.pagination.page, 1);
    assert.equal(p1.pagination.pageSize, 10);
    assert.equal(p1.pagination.totalCount, 25);
    assert.equal(p1.pagination.totalPages, 3);
    assert.equal(p1.pagination.hasPreviousPage, false);
    assert.equal(p1.pagination.hasNextPage, true);
    assert.equal(p1.pagination.nextPage, 2);
    assert.equal(p1.pagination.previousPage, null);
    assert.ok(p1.meta.timestamp);
    assert.ok(p1.meta.requestId);

    // Page 2
    const p2 = paginateArray(sampleItems, { page: 2, pageSize: 10 });
    assert.equal(p2.data.length, 10);
    assert.equal(p2.data[0].id, "item-11");
    assert.equal(p2.pagination.page, 2);
    assert.equal(p2.pagination.hasPreviousPage, true);
    assert.equal(p2.pagination.hasNextPage, true);
    assert.equal(p2.pagination.nextPage, 3);
    assert.equal(p2.pagination.previousPage, 1);

    // Page 3 (final partial page)
    const p3 = paginateArray(sampleItems, { page: 3, pageSize: 10 });
    assert.equal(p3.data.length, 5);
    assert.equal(p3.data[0].id, "item-21");
    assert.equal(p3.data[4].id, "item-25");
    assert.equal(p3.pagination.page, 3);
    assert.equal(p3.pagination.hasPreviousPage, true);
    assert.equal(p3.pagination.hasNextPage, false);
    assert.equal(p3.pagination.nextPage, null);
    assert.equal(p3.pagination.previousPage, 2);
  });

  it("should handle empty arrays gracefully", () => {
    const emptyResult = paginateArray([], { page: 1, pageSize: 10 });
    assert.equal(emptyResult.data.length, 0);
    assert.equal(emptyResult.pagination.totalCount, 0);
    assert.equal(emptyResult.pagination.totalPages, 1);
    assert.equal(emptyResult.pagination.hasNextPage, false);
    assert.equal(emptyResult.pagination.hasPreviousPage, false);
  });

  it("should handle out-of-bound page requests safely (clamping)", () => {
    const clampedResult = paginateArray(sampleItems, {
      page: 999,
      pageSize: 10,
    });
    assert.equal(clampedResult.pagination.page, 3); // Clamped to totalPages
    assert.equal(clampedResult.data.length, 5);
  });

  it("should construct ApiError with RFC 7807 problem details", () => {
    const problem = {
      type: "https://novwrite.io/errors/invalid-entity",
      title: "Invalid Entity Definition",
      status: 422,
      detail: "Entity schema failed invariant validation",
      timestamp: new Date().toISOString(),
    };

    const error = new ApiError(problem);
    assert.equal(error.message, "Entity schema failed invariant validation");
    assert.equal(error.name, "ApiError");
    assert.equal(error.problem.status, 422);
  });
});
