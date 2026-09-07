package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
	"github.com/go-chi/chi/v5"
)

func setupEntityRouter(eHandler *EntityHandler) http.Handler {
	r := chi.NewRouter()
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.ResponseTimeMiddleware)
	r.Use(httputil.APIVersionMiddleware("v1"))

	r.Route("/api/v1/projects/{projectId}/entities", func(r chi.Router) {
		r.Get("/", eHandler.List)
		r.Post("/", eHandler.Create)
		r.Get("/{entityId}", eHandler.Get)
		r.Put("/{entityId}", eHandler.Update)
		r.Delete("/{entityId}", eHandler.Delete)
	})
	return r
}

func TestEntityHandler_CRUD_And_Formulas(t *testing.T) {
	bpStore := NewInMemoryBlueprintStore()
	entStore := NewInMemoryEntityStore()

	// Seed blueprint with formula
	bp := bpStore.Save("p-1", world.BlueprintDef{
		ID:             "bp-warrior",
		Name:           "Warrior",
		BlueprintClass: world.ClassFirstClass,
		Category:       "Character",
		Fields: []world.DynamicFieldDef{
			{ID: "f-1", Name: "base_attack", Label: "Base Attack", FieldType: world.TypeNumber},
			{ID: "f-2", Name: "multiplier", Label: "Multiplier", FieldType: world.TypeNumber},
			{ID: "f-3", Name: "total_dps", Label: "Total DPS", FieldType: world.TypeFormula, FormulaExpression: "base_attack * multiplier + 10"},
		},
	})

	handler := NewEntityHandler(entStore, bpStore)
	router := setupEntityRouter(handler)

	// 1. Create entity with uppercase properties (should normalize to lowercase and compute formula)
	createReq := world.EntityItem{
		Name:        "Sir Arthur",
		BlueprintID: bp.ID,
		Properties: map[string]interface{}{
			"Base_Attack": float64(100),
			"MULTIPLIER":  float64(3),
		},
	}
	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/entities", bytes.NewReader(body))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected HTTP 201 Created, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var resp httputil.SingleResponse
	json.Unmarshal(rec.Body.Bytes(), &resp)
	dataMap, _ := resp.Data.(map[string]interface{})
	entID, _ := dataMap["id"].(string)

	props, _ := dataMap["properties"].(map[string]interface{})
	if props["base_attack"] != float64(100) {
		t.Fatalf("expected normalized property base_attack 100, got %v", props["base_attack"])
	}

	formulas, _ := dataMap["computedFormulas"].(map[string]interface{})
	if formulas["total_dps"] != float64(310) {
		t.Fatalf("expected backend computed formula total_dps = 310, got %v", formulas["total_dps"])
	}

	// 2. List with search and filtering
	reqList := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/entities?search=arthur&blueprintId=bp-warrior", nil)
	recList := httptest.NewRecorder()
	router.ServeHTTP(recList, reqList)

	if recList.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", recList.Code)
	}

	var listResp httputil.PaginatedResponse
	json.Unmarshal(recList.Body.Bytes(), &listResp)
	if listResp.Pagination.TotalCount != 1 {
		t.Fatalf("expected 1 entity match, got %d", listResp.Pagination.TotalCount)
	}

	// 3. Delete entity
	reqDel := httptest.NewRequest(http.MethodDelete, "/api/v1/projects/p-1/entities/"+entID, nil)
	recDel := httptest.NewRecorder()
	router.ServeHTTP(recDel, reqDel)

	if recDel.Code != http.StatusNoContent {
		t.Fatalf("expected HTTP 204 No Content, got %d", recDel.Code)
	}
}
