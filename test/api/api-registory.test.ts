import test from "node:test";
import assert from "node:assert/strict";

import { registry } from "@/lib/api/registry";

test(
  "registry contains at least one domain",
  () => {
    assert.ok(
      Object.keys(registry).length > 0
    );
  }
);

test(
  "every registry entry exposes required properties",
  () => {
    for (const [
      name,
      entry,
    ] of Object.entries(registry)) {
      assert.ok(
        entry.model,
        `${name}: missing model`
      );

      assert.ok(
        entry.createSchema,
        `${name}: missing createSchema`
      );

      assert.ok(
        entry.updateSchema,
        `${name}: missing updateSchema`
      );

      assert.ok(
        Array.isArray(
          entry.searchableFields
        ),
        `${name}: searchableFields must be an array`
      );

      assert.ok(
        Array.isArray(
          entry.filterableFields
        ),
        `${name}: filterableFields must be an array`
      );

      assert.ok(
        Array.isArray(
          entry.sortableFields
        ),
        `${name}: sortableFields must be an array`
      );
    }
  }
);

test(
  "every registry model exposes required CRUD methods",
  () => {
    for (const [
      name,
      entry,
    ] of Object.entries(registry)) {
      const model = entry.model;

      assert.equal(
        typeof model.findMany,
        "function",
        `${name}: missing findMany`
      );

      assert.equal(
        typeof model.findUnique,
        "function",
        `${name}: missing findUnique`
      );

      assert.equal(
        typeof model.create,
        "function",
        `${name}: missing create`
      );

      assert.equal(
        typeof model.update,
        "function",
        `${name}: missing update`
      );

      assert.equal(
        typeof model.delete,
        "function",
        `${name}: missing delete`
      );

      assert.equal(
        typeof model.count,
        "function",
        `${name}: missing count`
      );
    }
  }
);

test(
  "defaultOrderBy fields are sortable",
  () => {
    for (const [
      name,
      entry,
    ] of Object.entries(registry)) {
      if (!entry.defaultOrderBy) {
        continue;
      }

      const sortable =
        entry.sortableFields as readonly string[];

      for (const field of Object.keys(
        entry.defaultOrderBy
      )) {
        assert.ok(
          sortable.includes(field),
          `${name}: defaultOrderBy field "${field}" is not sortable`
        );
      }
    }
  }
);

test(
  "searchable fields are unique",
  () => {
    for (const [
      name,
      entry,
    ] of Object.entries(registry)) {
      assert.equal(
        new Set(
          entry.searchableFields
        ).size,
        entry.searchableFields.length,
        `${name}: duplicate searchable field`
      );
    }
  }
);

test(
  "filterable fields are unique",
  () => {
    for (const [
      name,
      entry,
    ] of Object.entries(registry)) {
      assert.equal(
        new Set(
          entry.filterableFields
        ).size,
        entry.filterableFields.length,
        `${name}: duplicate filterable field`
      );
    }
  }
);

test(
  "sortable fields are unique",
  () => {
    for (const [
      name,
      entry,
    ] of Object.entries(registry)) {
      assert.equal(
        new Set(
          entry.sortableFields
        ).size,
        entry.sortableFields.length,
        `${name}: duplicate sortable field`
      );
    }
  }
);

test(
  "every update schema accepts an empty object",
  () => {
    for (const [
      name,
      entry,
    ] of Object.entries(registry)) {
      const result =
        entry.updateSchema.safeParse(
          {}
        );

      assert.equal(
        result.success,
        true,
        `${name}: update schema should accept partial updates`
      );
    }
  }
);
