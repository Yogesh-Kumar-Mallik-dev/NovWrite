import test from "node:test";
import assert from "node:assert/strict";

import { getSorting } from "@/lib/api/sort";

import type { CrudRegistryEntry } from "@/lib/api/registry";

const registry = {
  sortableFields: [
    "createdAt",
    "updatedAt",
    "name",
    "power",
  ],

  defaultOrderBy: {
    createdAt: "desc",
  },
} as unknown as CrudRegistryEntry;

test(
  "getSorting returns default sort when no sort parameter is provided",
  () => {
    const result = getSorting(
      new URLSearchParams(),
      registry
    );

    assert.deepEqual(result, {
      orderBy: {
        createdAt: "desc",
      },
      sort: {
        field: "createdAt",
        order: "desc",
      },
    });
  }
);

test(
  "getSorting returns default sort for invalid field",
  () => {
    const result = getSorting(
      new URLSearchParams({
        sort: "invalid",
      }),
      registry
    );

    assert.deepEqual(result, {
      orderBy: {
        createdAt: "desc",
      },
      sort: {
        field: "createdAt",
        order: "desc",
      },
    });
  }
);

test(
  "getSorting accepts valid ascending sort",
  () => {
    const result = getSorting(
      new URLSearchParams({
        sort: "name",
        order: "asc",
      }),
      registry
    );

    assert.deepEqual(result, {
      orderBy: {
        name: "asc",
      },
      sort: {
        field: "name",
        order: "asc",
      },
    });
  }
);

test(
  "getSorting accepts valid descending sort",
  () => {
    const result = getSorting(
      new URLSearchParams({
        sort: "power",
        order: "desc",
      }),
      registry
    );

    assert.deepEqual(result, {
      orderBy: {
        power: "desc",
      },
      sort: {
        field: "power",
        order: "desc",
      },
    });
  }
);

test(
  "getSorting defaults order to asc when omitted",
  () => {
    const result = getSorting(
      new URLSearchParams({
        sort: "name",
      }),
      registry
    );

    assert.deepEqual(result, {
      orderBy: {
        name: "asc",
      },
      sort: {
        field: "name",
        order: "asc",
      },
    });
  }
);

test(
  "getSorting rejects invalid order values",
  () => {
    assert.throws(() =>
      getSorting(
        new URLSearchParams({
          sort: "name",
          order: "invalid",
        }),
        registry
      )
    );
  }
);

test(
  "getSorting preserves registry defaultOrderBy",
  () => {
    const result = getSorting(
      new URLSearchParams({
        sort: "__invalid__",
      }),
      registry
    );

    assert.equal(
      result.orderBy,
      registry.defaultOrderBy
    );
  }
);

test(
  "getSorting falls back to createdAt descending when registry has no defaultOrderBy",
  () => {
    const result = getSorting(
      new URLSearchParams(),
      {
        ...registry,
        defaultOrderBy: undefined,
      } as unknown as CrudRegistryEntry
    );

    assert.deepEqual(result, {
      orderBy: {
        createdAt: "desc",
      },
      sort: {
        field: "createdAt",
        order: "desc",
      },
    });
  }
);
