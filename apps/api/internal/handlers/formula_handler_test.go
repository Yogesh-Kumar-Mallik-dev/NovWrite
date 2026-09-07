package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
)

func TestFormulaHandler_EvaluateAndValidate(t *testing.T) {
	handler := NewFormulaHandler()
	r := chi.NewRouter()
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.APIVersionMiddleware("v1"))

	r.Post("/api/v1/formulas/evaluate", handler.Evaluate)
	r.Post("/api/v1/formulas/validate", handler.Validate)

	// 1. Evaluate valid formula
	evalReq := EvaluateFormulaRequest{
		Expression: "CLAMP(level * 20, 50, 150)",
		Variables: map[string]interface{}{
			"level": float64(10),
		},
	}
	body1, _ := json.Marshal(evalReq)
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/formulas/evaluate", bytes.NewReader(body1))
	rec1 := httptest.NewRecorder()
	r.ServeHTTP(rec1, req1)

	if rec1.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d. Body: %s", rec1.Code, rec1.Body.String())
	}

	var evalResp httputil.SingleResponse
	json.Unmarshal(rec1.Body.Bytes(), &evalResp)
	dataMap, _ := evalResp.Data.(map[string]interface{})
	if dataMap["result"] != float64(150) {
		t.Fatalf("expected clamped result 150, got %v", dataMap["result"])
	}

	// 2. Validate formula syntax and variables
	valReq := ValidateFormulaRequest{
		Expression: "IF(is_enraged == 1, base_atk * 2, base_atk)",
	}
	body2, _ := json.Marshal(valReq)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/formulas/validate", bytes.NewReader(body2))
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", rec2.Code)
	}

	var valResp httputil.SingleResponse
	json.Unmarshal(rec2.Body.Bytes(), &valResp)
	valData, _ := valResp.Data.(map[string]interface{})
	if valData["valid"] != true {
		t.Fatalf("expected valid formula, got %v", valData["valid"])
	}
	vars, _ := valData["extractedVariables"].([]interface{})
	if len(vars) != 2 {
		t.Fatalf("expected 2 extracted variables, got %d", len(vars))
	}
}
