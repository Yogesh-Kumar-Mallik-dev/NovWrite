/**
 * @file validationParity.test.ts
 * @description Unit tests verifying backend zero-trust validation parity, formula computation, and dynamic field slate wipe.
 * Block Standard: BLOCK_TEST_VALIDATION_PARITY_001
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateAndSanitizeBlueprint,
  validateAndSanitizeEntity,
  evaluateFormula,
  validateFormulaSyntax,
  extractFormulaVariables,
  BlueprintDef,
  EntityItem,
} from "../index.js";

describe("Backend Validation Parity & Zero-Trust Schema/Entity Sanitization", () => {
  it("BLOCK_TEST_VALIDATION_PARITY_001: should force lowercase machine keys and trim names in Blueprint", () => {
    const rawBlueprint: BlueprintDef = {
      id: "bp-hero",
      name: " Hero Blueprint ",
      blueprintClass: "FIRST_CLASS",
      category: "Character",
      fields: [
        {
          id: "f-1",
          name: "Attack_Power",
          label: "Attack Power",
          fieldType: "NUMBER",
          min: 0,
          max: 1000,
        },
        {
          id: "f-2",
          name: "Special_Titles",
          label: "Special Titles",
          fieldType: "ARRAY",
        },
      ],
    };

    const res = validateAndSanitizeBlueprint(rawBlueprint);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.sanitizedBlueprint?.name, "Hero Blueprint");
    assert.strictEqual(res.sanitizedBlueprint?.fields[0].name, "attack_power");
    assert.strictEqual(res.sanitizedBlueprint?.fields[1].name, "special_titles");
  });

  it("BLOCK_TEST_VALIDATION_PARITY_001: should reject duplicate field machine keys in Blueprint", () => {
    const dupBlueprint: BlueprintDef = {
      id: "bp-invalid",
      name: "Duplicate Keys",
      blueprintClass: "FIRST_CLASS",
      category: "Character",
      fields: [
        {
          id: "f-1",
          name: "mana_capacity",
          label: "Mana Capacity",
          fieldType: "NUMBER",
        },
        {
          id: "f-2",
          name: "MANA_CAPACITY",
          label: "Duplicate Mana",
          fieldType: "NUMBER",
        },
      ],
    };

    const res = validateAndSanitizeBlueprint(dupBlueprint);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.errors.length, 1);
    assert.strictEqual(res.errors[0].code, "DUPLICATE_FIELD_KEY");
  });

  it("BLOCK_TEST_VALIDATION_PARITY_001: should wipe slate for field type changes (strip irrelevant attributes)", () => {
    const bpWithTypeSwitch: BlueprintDef = {
      id: "bp-switched",
      name: "Switched Type",
      blueprintClass: "FIRST_CLASS",
      category: "Character",
      fields: [
        {
          id: "f-1",
          name: "tier",
          label: "Tier",
          fieldType: "STRING",
          // Stale number bounds & formula from previous type
          min: 10,
          max: 100,
          formulaExpression: "level * 10",
        },
      ],
    };

    const res = validateAndSanitizeBlueprint(bpWithTypeSwitch);
    assert.strictEqual(res.valid, true);
    const sanitizedField = res.sanitizedBlueprint?.fields[0];
    assert.strictEqual(sanitizedField?.name, "tier");
    assert.strictEqual(sanitizedField?.fieldType, "STRING");
    assert.strictEqual(sanitizedField?.min, undefined);
    assert.strictEqual(sanitizedField?.max, undefined);
    assert.strictEqual(sanitizedField?.formulaExpression, undefined);
  });

  it("BLOCK_TEST_VALIDATION_PARITY_001: should validate number bounds and formula syntax in Blueprint", () => {
    const invalidBp: BlueprintDef = {
      id: "bp-bounds-err",
      name: "Bounds Error",
      blueprintClass: "FIRST_CLASS",
      category: "Character",
      fields: [
        {
          id: "f-1",
          name: "power",
          label: "Power",
          fieldType: "NUMBER",
          min: 500,
          max: 100, // Invalid: min > max
        },
        {
          id: "f-2",
          name: "calc",
          label: "Calc",
          fieldType: "FORMULA",
          formulaExpression: "power + (", // Unclosed paren
        },
      ],
    };

    const res = validateAndSanitizeBlueprint(invalidBp);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.errors.length, 2);
    assert.strictEqual(res.errors[0].code, "NUMERIC_BOUNDS_INVALID");
    assert.strictEqual(res.errors[1].code, "FORMULA_SYNTAX_ERROR");
  });

  it("BLOCK_TEST_VALIDATION_PARITY_001: should normalize entity properties to lowercase and deterministically recompute formulas", () => {
    const bp: BlueprintDef = {
      id: "bp-combatant",
      name: "Combatant",
      blueprintClass: "FIRST_CLASS",
      category: "Character",
      fields: [
        {
          id: "f-base-atk",
          name: "base_attack",
          label: "Base Attack",
          fieldType: "NUMBER",
        },
        {
          id: "f-multiplier",
          name: "multiplier",
          label: "Multiplier",
          fieldType: "NUMBER",
        },
        {
          id: "f-total-dps",
          name: "total_dps",
          label: "Total DPS",
          fieldType: "FORMULA",
          formulaExpression: "base_attack * multiplier + 50",
        },
      ],
    };

    const rawEntity: EntityItem = {
      id: "ent-1",
      name: "Warrior",
      blueprintId: bp.id,
      properties: {
        Base_Attack: 100, // Mixed casing
        MULTIPLIER: 2.5,  // Uppercase
      },
    };

    const res = validateAndSanitizeEntity(bp, rawEntity);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.sanitizedEntity?.properties["base_attack"], 100);
    assert.strictEqual(res.sanitizedEntity?.properties["multiplier"], 2.5);
    // Backend computed formulas
    assert.strictEqual(res.sanitizedEntity?.computedFormulas?.["total_dps"], 300);
  });

  it("BLOCK_TEST_VALIDATION_PARITY_001: should evaluate complex formulas with IF, CLAMP, MIN, MAX, and logical operators", () => {
    const vars = {
      level: 10,
      is_enraged: 1,
      base_power: 120,
    };

    const expr1 = "IF(is_enraged == 1, base_power * 2, base_power)";
    const res1 = evaluateFormula(expr1, vars);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.value, 240);

    const expr2 = "CLAMP(level * 25, 50, 200)";
    const res2 = evaluateFormula(expr2, vars);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.value, 200);

    const expr3 = "MIN(MAX(level * 10, 50), 80)";
    const res3 = evaluateFormula(expr3, vars);
    assert.strictEqual(res3.success, true);
    assert.strictEqual(res3.value, 80);

    const extracted = extractFormulaVariables("IF(a > 0 && b <= 10, c.val + d, 0)");
    assert.deepStrictEqual(extracted.sort(), ["a", "b", "c.val", "d"].sort());
  });
});
