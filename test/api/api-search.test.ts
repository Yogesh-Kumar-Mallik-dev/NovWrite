import test from "node:test";
import assert from "node:assert/strict";

import { getSearch } from "@/lib/api/search";

import type { CrudRegistryEntry } from "@/lib/api/registry";

const registry = {
  searchableFields: [
    "name",
    "title",
    "description",
  ],
} as unknown as CrudRegistryEntry;

test(
  "getSearch returns empty search when search parameter is missing",
  () => {
    const result = getSearch(
      new URLSearchParams(),
      registry
    );

    assert.deepEqual(result, {
      where: {},
      search: undefined,
    });
  }
);

test(
  "getSearch returns empty search when searchableFields is empty",
  () => {
    const result = getSearch(
      new URLSearchParams({
        search: "Xiao",
      }),
      {
        ...registry,
        searchableFields: [],
      } as unknown as CrudRegistryEntry
    );

    assert.deepEqual(result, {
      where: {},
      search: undefined,
    });
  }
);

test(
  "getSearch builds OR search across all searchable fields",
  () => {
    const result = getSearch(
      new URLSearchParams({
        search: "Xiao",
      }),
      registry
    );

    assert.deepEqual(result, {
      search: "Xiao",

      where: {
        OR: [
          {
            name: {
              contains: "Xiao",
              mode: "insensitive",
            },
          },
          {
            title: {
              contains: "Xiao",
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: "Xiao",
              mode: "insensitive",
            },
          },
        ],
      },
    });
  }
);

test(
  "getSearch preserves search text",
  () => {
    const result = getSearch(
      new URLSearchParams({
        search: "Lin Ming",
      }),
      registry
    );

    assert.equal(
      result.search,
      "Lin Ming"
    );
  }
);

test(
  "getSearch supports a single searchable field",
  () => {
    const result = getSearch(
      new URLSearchParams({
        search: "Yun",
      }),
      {
        ...registry,
        searchableFields: [
          "name",
        ],
      } as unknown as CrudRegistryEntry
    );

    assert.deepEqual(result.where, {
      OR: [
        {
          name: {
            contains: "Yun",
            mode: "insensitive",
          },
        },
      ],
    });
  }
);

test(
  "getSearch rejects invalid search values",
  () => {
    assert.throws(() =>
      getSearch(
        new URLSearchParams({
          search: "",
        }),
        registry
      )
    );
  }
);
