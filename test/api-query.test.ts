import test from "node:test";
import assert from "node:assert/strict";

import { buildQuery } from "@/lib/api/query";
import { registry } from "@/lib/api/registry";

const entry = registry.characters;

test(
  "buildQuery returns default query when no query parameters are provided",
  () => {
    const query = buildQuery(
      new URLSearchParams(),
      entry
    );

    assert.deepEqual(query, {
      where: {},
      orderBy: entry.defaultOrderBy,
      skip: 0,
      take: 10,
    });
  }
);

test(
  "buildQuery applies pagination",
  () => {
    const query = buildQuery(
      new URLSearchParams({
        page: "3",
        limit: "25",
      }),
      entry
    );

    assert.equal(query.skip, 50);
    assert.equal(query.take, 25);
  }
);

test(
  "buildQuery applies custom sorting",
  () => {
    const field =
      entry.sortableFields.find(
        (f) => f !== "createdAt"
      ) ?? entry.sortableFields[0];

    const query = buildQuery(
      new URLSearchParams({
        sort: field,
        order: "asc",
      }),
      entry
    );

    assert.deepEqual(query.orderBy, {
      [field]: "asc",
    });
  }
);

test(
  "buildQuery falls back to default sorting when sort field is invalid",
  () => {
    const query = buildQuery(
      new URLSearchParams({
        sort: "__invalid__",
      }),
      entry
    );

    assert.deepEqual(
      query.orderBy,
      entry.defaultOrderBy
    );
  }
);

test(
  "buildQuery ignores unknown filter fields",
  () => {
    const query = buildQuery(
      new URLSearchParams({
        unknown: "value",
      }),
      entry
    );

    assert.deepEqual(query.where, {});
  }
);

test(
  "buildQuery ignores reserved query parameters as filters",
  () => {
    const query = buildQuery(
      new URLSearchParams({
        page: "2",
        limit: "5",
        search: "test",
        sort: "createdAt",
        order: "desc",
      }),
      entry
    );

    assert.equal(
      "page" in query.where,
      false
    );

    assert.equal(
      "limit" in query.where,
      false
    );

    assert.equal(
      "search" in query.where,
      false
    );

    assert.equal(
      "sort" in query.where,
      false
    );

    assert.equal(
      "order" in query.where,
      false
    );
  }
);

test(
  "buildQuery creates search conditions when searchable fields exist",
  () => {
    if (
      entry.searchableFields.length === 0
    ) {
      return;
    }

    const query = buildQuery(
      new URLSearchParams({
        search: "Xiao",
      }),
      entry
    );

    assert.ok("OR" in query.where);

    assert.equal(
      (query.where as any).OR.length,
      entry.searchableFields.length
    );
  }
);

test(
  "buildQuery omits search conditions when search is empty",
  () => {
    const query = buildQuery(
      new URLSearchParams(),
      entry
    );

    assert.equal(
      "OR" in query.where,
      false
    );
  }
);
