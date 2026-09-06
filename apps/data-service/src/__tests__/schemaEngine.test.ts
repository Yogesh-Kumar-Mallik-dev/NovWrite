/**
 * @file schemaEngine.test.ts
 * @description Comprehensive unit tests for Dynamic Entity Schema & Property Engine.
 * Block Standard: BLOCK_TEST_DYNAMIC_SCHEMA_001
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateSingleProperty,
  validateEntityProperties,
  DynamicSchemaEngine,
  DynamicPropertyDef,
} from "../index.js";

describe("Dynamic Entity Schema & Property Validation Engine", () => {
  const sampleNumberProp: DynamicPropertyDef = {
    id: "prop-mana",
    projectId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    entityTypeId: "et-character",
    name: "mana_capacity",
    propertyType: "NUMBER",
    defaultValue: 100,
    validation: { min: 0, max: 5000, required: true },
  };

  const sampleEnumProp: DynamicPropertyDef = {
    id: "prop-realm",
    projectId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    entityTypeId: "et-character",
    name: "cultivation_realm",
    propertyType: "ENUM_SINGLE",
    defaultValue: "Mortal",
    validation: {
      allowedValues: [
        "Mortal",
        "Qi Condensation",
        "Foundation Establishment",
        "Core Formation",
      ],
      required: true,
    },
  };

  const sampleMultiEnumProp: DynamicPropertyDef = {
    id: "prop-elements",
    projectId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    entityTypeId: "et-character",
    name: "elemental_affinities",
    propertyType: "ENUM_MULTI",
    validation: {
      allowedValues: ["Fire", "Water", "Lightning", "Wind", "Earth"],
    },
  };

  const sampleEntityRefProp: DynamicPropertyDef = {
    id: "prop-master",
    projectId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    entityTypeId: "et-character",
    name: "master_entity_id",
    propertyType: "ENTITY_REF",
    validation: { targetCategory: "CHARACTER" },
  };

  it("BLOCK_TEST_DYNAMIC_SCHEMA_001: should validate and coerce valid NUMBER property", () => {
    const res = validateSingleProperty(sampleNumberProp, 500);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.coercedVal, 500);

    // Test string coercion
    const stringNumRes = validateSingleProperty(sampleNumberProp, "750");
    assert.strictEqual(stringNumRes.valid, true);
    assert.strictEqual(stringNumRes.coercedVal, 750);
  });

  it("BLOCK_TEST_DYNAMIC_SCHEMA_001: should reject NUMBER exceeding bounds or invalid type", () => {
    const belowMin = validateSingleProperty(sampleNumberProp, -50);
    assert.strictEqual(belowMin.valid, false);
    assert.strictEqual(belowMin.error?.code, "NUMERIC_BELOW_MIN");

    const aboveMax = validateSingleProperty(sampleNumberProp, 9000);
    assert.strictEqual(aboveMax.valid, false);
    assert.strictEqual(aboveMax.error?.code, "NUMERIC_ABOVE_MAX");

    const invalidType = validateSingleProperty(
      sampleNumberProp,
      "not-a-number",
    );
    assert.strictEqual(invalidType.valid, false);
    assert.strictEqual(invalidType.error?.code, "TYPE_MISMATCH_NUMBER");
  });

  it("BLOCK_TEST_DYNAMIC_SCHEMA_001: should fallback to defaultValue when raw value is null/undefined", () => {
    const res = validateSingleProperty(sampleNumberProp, null);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.coercedVal, 100);
  });

  it("BLOCK_TEST_DYNAMIC_SCHEMA_001: should validate and reject ENUM_SINGLE values", () => {
    const validEnum = validateSingleProperty(
      sampleEnumProp,
      "Foundation Establishment",
    );
    assert.strictEqual(validEnum.valid, true);
    assert.strictEqual(validEnum.coercedVal, "Foundation Establishment");

    const invalidEnum = validateSingleProperty(sampleEnumProp, "God Tier");
    assert.strictEqual(invalidEnum.valid, false);
    assert.strictEqual(invalidEnum.error?.code, "ENUM_INVALID_OPTION");
    assert.ok(
      invalidEnum.error?.message.includes("BLOCK_WORLD_DYNAMIC_SCHEMA_001"),
    );
  });

  it("BLOCK_TEST_DYNAMIC_SCHEMA_001: should validate ENUM_MULTI array values", () => {
    const validMulti = validateSingleProperty(sampleMultiEnumProp, [
      "Fire",
      "Lightning",
    ]);
    assert.strictEqual(validMulti.valid, true);
    assert.deepStrictEqual(validMulti.coercedVal, ["Fire", "Lightning"]);

    const invalidMulti = validateSingleProperty(sampleMultiEnumProp, [
      "Fire",
      "Dark Matter",
    ]);
    assert.strictEqual(invalidMulti.valid, false);
    assert.strictEqual(invalidMulti.error?.code, "ENUM_MULTI_INVALID_ITEM");
  });

  it("BLOCK_TEST_DYNAMIC_SCHEMA_001: should validate ENTITY_REF UUID format", () => {
    const validRef = validateSingleProperty(
      sampleEntityRefProp,
      "a1111111-1111-1111-1111-111111111111",
    );
    assert.strictEqual(validRef.valid, true);

    const invalidRef = validateSingleProperty(
      sampleEntityRefProp,
      "invalid-uuid-format",
    );
    assert.strictEqual(invalidRef.valid, false);
    assert.strictEqual(invalidRef.error?.code, "INVALID_ENTITY_UUID");
  });

  it("BLOCK_TEST_DYNAMIC_SCHEMA_001: should validate full entity properties map and reject unregistered keys", () => {
    const defs = [sampleNumberProp, sampleEnumProp];

    const validPayload = {
      mana_capacity: 450,
      cultivation_realm: "Core Formation",
    };
    const res = validateEntityProperties(defs, validPayload);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.errors.length, 0);

    const unregPayload = {
      mana_capacity: 450,
      cultivation_realm: "Core Formation",
      unregistered_hax_skill: "instant-kill",
    };
    const unregRes = validateEntityProperties(defs, unregPayload);
    assert.strictEqual(unregRes.valid, false);
    assert.strictEqual(unregRes.errors.length, 1);
    assert.strictEqual(unregRes.errors[0].code, "UNDEFINED_PROPERTY_KEY");
  });

  it("BLOCK_TEST_DYNAMIC_SCHEMA_001: should register entity types and properties via DynamicSchemaEngine", async () => {
    const mockDb = {
      entityTypeDefinition: {
        create: async (args: any) => ({
          id: "et-cultivator-01",
          ...args.data,
          properties: [],
        }),
        findMany: async () => [],
        findUnique: async () => ({
          id: "et-cultivator-01",
          name: "Cultivator",
          category: "CHARACTER",
          properties: [sampleNumberProp],
        }),
        update: async () => ({}),
        delete: async () => ({}),
      },
      dynamicPropertyDefinition: {
        create: async (args: any) => ({
          id: "prop-new-01",
          ...args.data,
        }),
        findMany: async () => [],
        update: async () => ({}),
        delete: async () => ({}),
      },
    };

    const engine = new DynamicSchemaEngine(mockDb);

    const createdType = await engine.createEntityType(
      "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "Cultivator",
      "CHARACTER",
      "Immortal path seekers.",
    );

    assert.strictEqual(createdType.name, "Cultivator");
    assert.strictEqual(createdType.category, "CHARACTER");

    const createdProp = await engine.addPropertyToEntityType(
      "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      createdType.id,
      {
        name: "spirit_root",
        propertyType: "STRING",
        validation: { minLength: 2 },
      },
    );

    assert.strictEqual(createdProp.name, "spirit_root");

    // Test engine validation
    const valRes = await engine.validatePropertiesForEntityType(
      "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "et-cultivator-01",
      { mana_capacity: 350 },
    );

    assert.strictEqual(valRes.valid, true);
    assert.strictEqual(valRes.coercedProperties["mana_capacity"], 350);
  });
});
