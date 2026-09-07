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

func setupBlueprintRouter(handler *BlueprintHandler) http.Handler {
	r := chi.NewRouter()
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.ResponseTimeMiddleware)
	r.Use(httputil.APIVersionMiddleware("v1"))

	r.Route("/api/v1/projects/{projectId}/blueprints", func(r chi.Router) {
		r.Get("/", handler.List)
		r.Post("/", handler.Create)
		r.Get("/{blueprintId}", handler.Get)
		r.Put("/{blueprintId}", handler.Update)
		r.Delete("/{blueprintId}", handler.Delete)
	})
	return r
}

func TestBlueprintHandler_CRUD_And_Validation(t *testing.T) {
	store := NewInMemoryBlueprintStore()
	projectStore := NewInMemoryProjectStore()
	projectStore.Save(Project{ID: "p-1", Name: "Project One"})

	handler := NewBlueprintHandler(store, projectStore)
	router := setupBlueprintRouter(handler)

	// 1. Test empty list returns [] and 200 OK
	reqListEmpty := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/blueprints", nil)
	recListEmpty := httptest.NewRecorder()
	router.ServeHTTP(recListEmpty, reqListEmpty)

	if recListEmpty.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 on empty list, got %d", recListEmpty.Code)
	}

	var listResp httputil.PaginatedResponse
	if err := json.Unmarshal(recListEmpty.Body.Bytes(), &listResp); err != nil {
		t.Fatalf("failed to parse list response: %v", err)
	}
	if listResp.Pagination.TotalCount != 0 {
		t.Fatalf("expected 0 total count, got %d", listResp.Pagination.TotalCount)
	}

	// 2. Test create blueprint with uppercase keys (should lowercase and create with 201)
	createPayload := world.BlueprintDef{
		Name:           "Character Template",
		BlueprintClass: world.ClassFirstClass,
		Category:       "Character",
		Fields: []world.DynamicFieldDef{
			{
				ID:        "f-1",
				Name:      "Attack_Power", // Uppercase key
				Label:     "Attack Power",
				FieldType: world.TypeNumber,
			},
		},
	}
	body, _ := json.Marshal(createPayload)
	reqCreate := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/blueprints", bytes.NewReader(body))
	recCreate := httptest.NewRecorder()
	router.ServeHTTP(recCreate, reqCreate)

	if recCreate.Code != http.StatusCreated {
		t.Fatalf("expected HTTP 201 Created, got %d. Body: %s", recCreate.Code, recCreate.Body.String())
	}

	locHeader := recCreate.Header().Get("Location")
	if locHeader == "" {
		t.Fatalf("expected Location header in 201 response")
	}

	var createdResp httputil.SingleResponse
	json.Unmarshal(recCreate.Body.Bytes(), &createdResp)
	createdDataMap, _ := createdResp.Data.(map[string]interface{})
	bpID, _ := createdDataMap["id"].(string)

	fields, _ := createdDataMap["fields"].([]interface{})
	f0, _ := fields[0].(map[string]interface{})
	if f0["name"] != "attack_power" {
		t.Fatalf("expected lowercased field name 'attack_power', got '%v'", f0["name"])
	}

	// 3. Test get blueprint by ID
	reqGet := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/blueprints/"+bpID, nil)
	recGet := httptest.NewRecorder()
	router.ServeHTTP(recGet, reqGet)

	if recGet.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", recGet.Code)
	}

	// 4. Test reject duplicate keys (RFC 7807 422 error)
	dupPayload := world.BlueprintDef{
		Name:           "Invalid Blueprint",
		BlueprintClass: world.ClassFirstClass,
		Category:       "Character",
		Fields: []world.DynamicFieldDef{
			{ID: "f-1", Name: "mana", Label: "Mana", FieldType: world.TypeNumber},
			{ID: "f-2", Name: "MANA", Label: "Mana Duplicate", FieldType: world.TypeNumber},
		},
	}
	dupBody, _ := json.Marshal(dupPayload)
	reqDup := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/blueprints", bytes.NewReader(dupBody))
	recDup := httptest.NewRecorder()
	router.ServeHTTP(recDup, reqDup)

	if recDup.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected HTTP 422 Unprocessable Entity on duplicate keys, got %d", recDup.Code)
	}

	var prob httputil.ProblemDetail
	json.Unmarshal(recDup.Body.Bytes(), &prob)
	if prob.Code != "VALIDATION_FAILED" {
		t.Fatalf("expected VALIDATION_FAILED code, got %s", prob.Code)
	}

	// 5. Test delete blueprint (204 No Content)
	reqDelete := httptest.NewRequest(http.MethodDelete, "/api/v1/projects/p-1/blueprints/"+bpID, nil)
	recDelete := httptest.NewRecorder()
	router.ServeHTTP(recDelete, reqDelete)

	if recDelete.Code != http.StatusNoContent {
		t.Fatalf("expected HTTP 204 No Content on delete, got %d", recDelete.Code)
	}

	// 6. Test get after delete (404 Not Found)
	reqGetMissing := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/blueprints/"+bpID, nil)
	recGetMissing := httptest.NewRecorder()
	router.ServeHTTP(recGetMissing, reqGetMissing)

	if recGetMissing.Code != http.StatusNotFound {
		t.Fatalf("expected HTTP 404 Not Found after delete, got %d", recGetMissing.Code)
	}
}

// TestBlueprintHandler_ProjectIsolation_And_Security verifies strict project hierarchy and isolation.
func TestBlueprintHandler_ProjectIsolation_And_Security(t *testing.T) {
	bpStore := NewInMemoryBlueprintStore()
	projectStore := NewInMemoryProjectStore()

	projectStore.Save(Project{ID: "proj-1", OwnerID: "user-1", Name: "Project 1"})
	projectStore.Save(Project{ID: "proj-2", OwnerID: "user-2", Name: "Project 2"})

	bpStore.Save("proj-1", world.BlueprintDef{
		ID:             "bp-spell",
		Name:           "Spell",
		BlueprintClass: world.ClassFirstClass,
		Category:       "Magic",
	})

	handler := NewBlueprintHandler(bpStore, projectStore)
	router := setupBlueprintRouter(handler)

	// Non-existent project returns 404
	reqMissing := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-none/blueprints", nil)
	recMissing := httptest.NewRecorder()
	router.ServeHTTP(recMissing, reqMissing)
	if recMissing.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for non-existent project, got %d", recMissing.Code)
	}

	// Project isolation: proj-2 has 0 blueprints
	reqList2 := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-2/blueprints", nil)
	recList2 := httptest.NewRecorder()
	router.ServeHTTP(recList2, reqList2)
	if recList2.Code != http.StatusOK {
		t.Fatalf("expected 200 for proj-2, got %d", recList2.Code)
	}
	var resp2 httputil.PaginatedResponse
	json.Unmarshal(recList2.Body.Bytes(), &resp2)
	if resp2.Pagination.TotalCount != 0 {
		t.Fatalf("expected 0 blueprints in proj-2, got %d", resp2.Pagination.TotalCount)
	}

	// Forbidden user check
	reqForbidden := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-1/blueprints", nil)
	reqForbidden.Header.Set("X-User-ID", "user-2")
	recForbidden := httptest.NewRecorder()
	router.ServeHTTP(recForbidden, reqForbidden)
	if recForbidden.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden, got %d", recForbidden.Code)
	}
}
