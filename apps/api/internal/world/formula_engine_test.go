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
