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

// Block Standard: BLOCK_TEST_PROJECT_HANDLER_001

func setupProjectRouter(handler *ProjectHandler) http.Handler {
	r := chi.NewRouter()
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.ResponseTimeMiddleware)
	r.Use(httputil.APIVersionMiddleware("v1"))

	r.Route("/api/v1/projects", func(r chi.Router) {
		r.Get("/", handler.List)
		r.Post("/", handler.Create)
		r.Get("/{projectId}", handler.Get)
		r.Put("/{projectId}", handler.Update)
		r.Delete("/{projectId}", handler.Delete)
	})

	return r
}

func TestProjectHandler_Lifecycle(t *testing.T) {
	store := NewInMemoryProjectStore()
	handler := NewProjectHandler(store)
	router := setupProjectRouter(handler)

	// 1. Initial List should be empty
	req := httptest.NewRequest("GET", "/api/v1/projects", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var listResp httputil.PaginatedResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &listResp); err != nil {
		t.Fatalf("failed to unmarshal list response: %v", err)
	}
	if listResp.Pagination.TotalCount != 0 {
		t.Fatalf("expected totalCount 0, got %d", listResp.Pagination.TotalCount)
	}

	// 2. Create a new project
	createBody := map[string]string{
		"name":        "The Celestial Path",
		"description": "A high-stakes Xianxia epic about daoist cultivators and shattered heavens.",
		"genre":       "Xianxia",
	}
	bodyBytes, _ := json.Marshal(createBody)

	req = httptest.NewRequest("POST", "/api/v1/projects", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var singleResp struct {
		Data Project `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &singleResp); err != nil {
		t.Fatalf("failed to decode created project response: %v", err)
	}

	created := singleResp.Data
	if created.ID == "" {
		t.Errorf("expected generated ID, got empty")
	}
	if created.Name != "The Celestial Path" {
		t.Errorf("expected name 'The Celestial Path', got '%s'", created.Name)
	}
	if created.Genre != "Xianxia" {
		t.Errorf("expected genre 'Xianxia', got '%s'", created.Genre)
	}

	// 3. Get Project by ID
	req = httptest.NewRequest("GET", "/api/v1/projects/"+created.ID, nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", rec.Code)
	}

	var fetchedResp struct {
		Data Project `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &fetchedResp); err != nil {
		t.Fatalf("failed to decode fetched project: %v", err)
	}
	if fetchedResp.Data.ID != created.ID {
		t.Errorf("expected ID %s, got %s", created.ID, fetchedResp.Data.ID)
	}

	// 4. Update Project
	updateBody := map[string]string{
		"name":        "The Celestial Path: Ascendance",
		"description": "Updated epic narrative description.",
	}
	bodyBytes, _ = json.Marshal(updateBody)

	req = httptest.NewRequest("PUT", "/api/v1/projects/"+created.ID, bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", rec.Code)
	}

	var updatedResp struct {
		Data Project `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &updatedResp); err != nil {
		t.Fatalf("failed to decode updated project: %v", err)
	}
	if updatedResp.Data.Name != "The Celestial Path: Ascendance" {
		t.Errorf("expected updated name, got '%s'", updatedResp.Data.Name)
	}

	// 5. Validation Rejections
	emptyBody := map[string]string{"name": "   "}
	bodyBytes, _ = json.Marshal(emptyBody)
	req = httptest.NewRequest("POST", "/api/v1/projects", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected status 422 for empty name, got %d", rec.Code)
	}

	// 6. Delete Project
	req = httptest.NewRequest("DELETE", "/api/v1/projects/"+created.ID, nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status 204 No Content, got %d", rec.Code)
	}

	// 7. Verify 404 after deletion
	req = httptest.NewRequest("GET", "/api/v1/projects/"+created.ID, nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404 Not Found after deletion, got %d", rec.Code)
	}
}
