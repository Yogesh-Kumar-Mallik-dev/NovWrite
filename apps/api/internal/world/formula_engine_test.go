package world

import (
	"math"
	"testing"
)

// Block Standard: BLOCK_TEST_WORLD_FORMULA_ENGINE_002

func TestFormulaEngine_BasicArithmetic(t *testing.T) {
	ctx := map[string]interface{}{
		"attack":  1000.0,
		"defense": 400.0,
		"bonus":   50.0,
	}

	val, err := EvaluateFormula("attack + defense * 2 - bonus", ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// 1000 + 400 * 2 - 50 = 1750
	if val != 1750.0 {
		t.Errorf("expected 1750.0, got %v", val)
	}
}

func TestFormulaEngine_FunctionsAndConditions(t *testing.T) {
	ctx := map[string]interface{}{
		"cultivation.major_realm": 3.0,
		"cultivation.minor_realm": 5.0,
		"special_physique":        2.0,
	}

	expr := "IF(cultivation.major_realm >= 3, cultivation.major_realm * cultivation.minor_realm * special_physique, 10)"
	val, err := EvaluateFormula(expr, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// 3 * 5 * 2 = 30
	if val != 30.0 {
		t.Errorf("expected 30.0, got %v", val)
	}
}

func TestFormulaEngine_ValidationAndVariableExtraction(t *testing.T) {
	expr := "MIN(attack * mastery, max_cap) + 100"
	res := ValidateFormulaSyntax(expr)
	if !res.Valid {
		t.Fatalf("expected valid formula, got error: %s", res.Error)
	}

	expectedVars := map[string]bool{"attack": true, "mastery": true, "max_cap": true}
	if len(res.ExtractedVariables) != len(expectedVars) {
		t.Fatalf("expected %d extracted variables, got %d", len(expectedVars), len(res.ExtractedVariables))
	}
	for _, v := range res.ExtractedVariables {
		if !expectedVars[v] {
			t.Errorf("unexpected variable extracted: %s", v)
		}
	}
}

func TestFormulaEngine_DivisionByZero(t *testing.T) {
	ctx := map[string]interface{}{"a": 10.0, "b": 0.0}
	_, err := EvaluateFormula("a / b", ctx)
	if err == nil {
		t.Errorf("expected division by zero error")
	}
}

func TestFormulaEngine_CaseInsensitiveVariables(t *testing.T) {
	ctx := map[string]interface{}{
		"Attack_Power": 500.0,
	}

	val, err := EvaluateFormula("attack_power * 2", ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if math.Abs(val-1000.0) > 1e-9 {
		t.Errorf("expected 1000, got %v", val)
	}
}

// Block Standard: BLOCK_TEST_FORMULA_ENGINE_REGRESSION_001
// Purpose: Regression tests for CLAMP, MIN, MAX, SQRT, POW, nested IF conditions, and unary operators.
func TestFormulaEngine_MathFunctions_And_NestedLogic_Regressions(t *testing.T) {
	// 1. Math functions (CLAMP, SQRT, POW, MAX, MIN)
	val1, err := EvaluateFormula("CLAMP(150, 10, 100) + SQRT(64) + POW(2, 4)", nil)
	if err != nil {
		t.Fatalf("BLOCK_TEST_FORMULA_ENGINE_REGRESSION_001: failed to evaluate math functions: %v", err)
	}
	// 100 + 8 + 16 = 124
	if val1 != 124.0 {
		t.Errorf("BLOCK_TEST_FORMULA_ENGINE_REGRESSION_001: expected 124, got %v", val1)
	}

	// 2. Nested IF expressions
	nestedExpr := "IF(level > 10, IF(rank >= 5, 500, 250), 100)"
	valHigh, err := EvaluateFormula(nestedExpr, map[string]interface{}{"level": 15.0, "rank": 6.0})
	if err != nil || valHigh != 500.0 {
		t.Errorf("BLOCK_TEST_FORMULA_ENGINE_REGRESSION_001: expected 500 for high level/rank, got %v (err: %v)", valHigh, err)
	}

	valMid, err := EvaluateFormula(nestedExpr, map[string]interface{}{"level": 15.0, "rank": 2.0})
	if err != nil || valMid != 250.0 {
		t.Errorf("BLOCK_TEST_FORMULA_ENGINE_REGRESSION_001: expected 250 for mid rank, got %v (err: %v)", valMid, err)
	}

	valLow, err := EvaluateFormula(nestedExpr, map[string]interface{}{"level": 5.0, "rank": 10.0})
	if err != nil || valLow != 100.0 {
		t.Errorf("BLOCK_TEST_FORMULA_ENGINE_REGRESSION_001: expected 100 for low level, got %v (err: %v)", valLow, err)
	}

	// 3. Unary minus & negative values
	valNeg, err := EvaluateFormula("-50 + 20 * -2", nil)
	if err != nil || valNeg != -90.0 {
		t.Errorf("BLOCK_TEST_FORMULA_ENGINE_REGRESSION_001: expected -90 for negative math, got %v (err: %v)", valNeg, err)
	}
}
