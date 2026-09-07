package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
)

// Block Standard: BLOCK_API_FORMULA_HANDLER_001

type FormulaHandler struct{}

func NewFormulaHandler() *FormulaHandler {
	return &FormulaHandler{}
}

type EvaluateFormulaRequest struct {
	Expression string                 `json:"expression"`
	Variables  map[string]interface{} `json:"variables"`
}

type EvaluateFormulaResponse struct {
	Expression string  `json:"expression"`
	Result     float64 `json:"result"`
	Success    bool    `json:"success"`
}

type ValidateFormulaRequest struct {
	Expression string `json:"expression"`
}

type ValidateFormulaResponse struct {
	Expression         string   `json:"expression"`
	Valid              bool     `json:"valid"`
	Error              string   `json:"error,omitempty"`
	ExtractedVariables []string `json:"extractedVariables"`
}

// Evaluate handles POST /api/v1/formulas/evaluate
func (h *FormulaHandler) Evaluate(w http.ResponseWriter, r *http.Request) {
	var req EvaluateFormulaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	if req.Expression == "" {
		httputil.RespondBadRequest(w, r, "Formula expression cannot be empty.", "EMPTY_EXPRESSION")
		return
	}

	valRes := world.ValidateFormulaSyntax(req.Expression)
	if !valRes.Valid {
		httputil.RespondValidationProblem(w, r, "Formula syntax validation error", []httputil.InvalidParam{
			{Name: "expression", Reason: valRes.Error, ReceivedValue: req.Expression},
		})
		return
	}

	val, err := world.EvaluateFormula(req.Expression, req.Variables)
	if err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Formula evaluation failed: %v", err), "EVALUATION_ERROR")
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, EvaluateFormulaResponse{
		Expression: req.Expression,
		Result:     val,
		Success:    true,
	})
}

// Validate handles POST /api/v1/formulas/validate
func (h *FormulaHandler) Validate(w http.ResponseWriter, r *http.Request) {
	var req ValidateFormulaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	valRes := world.ValidateFormulaSyntax(req.Expression)

	httputil.RespondJSON(w, r, http.StatusOK, ValidateFormulaResponse{
		Expression:         req.Expression,
		Valid:              valRes.Valid,
		Error:              valRes.Error,
		ExtractedVariables: valRes.ExtractedVariables,
	})
}
