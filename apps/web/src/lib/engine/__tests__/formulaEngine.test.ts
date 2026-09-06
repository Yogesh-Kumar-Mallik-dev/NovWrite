/**
 * @file formulaEngine.test.ts
 * @description Unit tests for dynamic formula parsing and evaluation engine.
 * Block Standard: BLOCK_WORLD_FORMULA_ENGINE_TEST_001
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateFormula,
  extractFormulaVariables,
  validateFormulaSyntax,
} from "../formulaEngine.ts";

describe("BLOCK_WORLD_FORMULA_ENGINE_001: Formula Parsing & Math Evaluator", () => {
  it("should evaluate basic arithmetic and parentheses", () => {
    const res = evaluateFormula("(10 + 20) * 3 - 40 / 2");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.value, 70);
  });

  it("should evaluate the user defined cultivation combat power formula with nested dot properties", () => {
    const formula =
      "(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery";

    const context = {
      cultivation: {
        major_realm: 3,
        minor_realm: 5,
      },
      special_Physique: 2.0,
      attack: 1000,
      attack_technique_Mastery: 1.5,
      defence: 400,
      defence_technique_mastery: 1.0,
    };

    const res = evaluateFormula(formula, context);
    assert.strictEqual(res.success, true);
    // (3 * 5) * 2.0 + 1000 * 1.5 - 400 * 1.0 = 30 + 1500 - 400 = 1130
    assert.strictEqual(res.value, 1130);
  });

  it("should extract all referenced variables correctly from formula", () => {
    const formula =
      "(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery";

    const vars = extractFormulaVariables(formula);
    assert.deepStrictEqual(
      vars.sort(),
      [
        "attack",
        "attack_technique_Mastery",
        "cultivation.major_realm",
        "cultivation.minor_realm",
        "defence",
        "defence_technique_mastery",
        "special_Physique",
      ].sort(),
    );
  });

  it("should evaluate mathematical functions (CLAMP, MIN, MAX, SQRT, POW)", () => {
    const resClamp = evaluateFormula("CLAMP(50, 10, 100)");
    assert.strictEqual(resClamp.success, true);
    assert.strictEqual(resClamp.value, 50);

    const resClampMax = evaluateFormula("CLAMP(150, 10, 100)");
    assert.strictEqual(resClampMax.success, true);
    assert.strictEqual(resClampMax.value, 100);

    const resSqrt = evaluateFormula("SQRT(144) + POW(2, 3)");
    assert.strictEqual(resSqrt.success, true);
    assert.strictEqual(resSqrt.value, 20); // 12 + 8
  });

  it("should evaluate logical IF statements and comparisons", () => {
    const resIfTrue = evaluateFormula(
      "IF(affection_level >= 500, attack * 1.5, attack)",
      {
        affection_level: 600,
        attack: 200,
      },
    );
    assert.strictEqual(resIfTrue.success, true);
    assert.strictEqual(resIfTrue.value, 300);

    const resIfFalse = evaluateFormula(
      "IF(affection_level >= 500, attack * 1.5, attack)",
      {
        affection_level: 200,
        attack: 200,
      },
    );
    assert.strictEqual(resIfFalse.success, true);
    assert.strictEqual(resIfFalse.value, 200);
  });

  it("should validate syntax and catch division by zero or unbalanced parentheses", () => {
    const validRes = validateFormulaSyntax("attack * 2 + 10");
    assert.strictEqual(validRes.valid, true);

    const invalidParen = validateFormulaSyntax("(attack * 2 + 10");
    assert.strictEqual(invalidParen.valid, false);

    const divZero = evaluateFormula("100 / 0");
    assert.strictEqual(divZero.success, false);
    assert.match(divZero.error || "", /division by zero/i);
  });
});
