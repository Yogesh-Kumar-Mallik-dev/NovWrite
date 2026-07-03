import test from "node:test";
import assert from "node:assert/strict";

import { getFilters } from "@/lib/api/filters";

import type { CrudRegistryEntry } from "@/lib/api/registry";

const registry = {
  filterableFields: [
    "name",
    "power",
    "alive",
    "age",
  ],
} as unknown as CrudRegistryEntry;

test(
  "getFilters returns an empty object when no filters are provided",
  () => {
    const filters = getFilters(
      new URLSearchParams(),
      registry
    );

    assert.deepEqual(filters, {});
  }
);

test(
  "getFilters returns string filters",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        name: "Xiao Yan",
      }),
      registry
    );

    assert.deepEqual(filters, {
      name: "Xiao Yan",
    });
  }
);

test(
  "getFilters converts numeric values",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        power: "9000",
        age: "18",
      }),
      registry
    );

    assert.deepEqual(filters, {
      power: 9000,
      age: 18,
    });
  }
);

test(
  "getFilters converts true to boolean",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        alive: "true",
      }),
      registry
    );

    assert.deepEqual(filters, {
      alive: true,
    });
  }
);

test(
  "getFilters converts false to boolean",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        alive: "false",
      }),
      registry
    );

    assert.deepEqual(filters, {
      alive: false,
    });
  }
);

test(
  "getFilters ignores unknown filter fields",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        unknown: "value",
      }),
      registry
    );

    assert.deepEqual(filters, {});
  }
);

test(
  "getFilters ignores reserved query parameters",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        page: "2",
        limit: "20",
        sort: "name",
        order: "asc",
        search: "Xiao",
      }),
      registry
    );

    assert.deepEqual(filters, {});
  }
);

test(
  "getFilters handles mixed filter types",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        name: "Lin Ming",
        power: "12000",
        alive: "true",
      }),
      registry
    );

    assert.deepEqual(filters, {
      name: "Lin Ming",
      power: 12000,
      alive: true,
    });
  }
);

test(
  "getFilters preserves empty string values",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        name: "",
      }),
      registry
    );

    assert.deepEqual(filters, {
      name: "",
    });
  }
);

test(
  "getFilters preserves non numeric strings",
  () => {
    const filters = getFilters(
      new URLSearchParams({
        power: "Nine Thousand",
      }),
      registry
    );

    assert.deepEqual(filters, {
      power: "Nine Thousand",
    });
  }
);
