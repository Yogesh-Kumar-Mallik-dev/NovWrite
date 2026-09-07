package httputil

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestParsePaginationParams_DefaultsAndClamping(t *testing.T) {
	// Test default parameters
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/entities", nil)
	p1 := ParsePaginationParams(req1)
	if p1.Page != 1 {
		t.Fatalf("expected page 1, got %d", p1.Page)
	}
	if p1.PageSize != 20 {
		t.Fatalf("expected pageSize 20, got %d", p1.PageSize)
	}

	// Test custom parameters and clamping
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/entities?page=3&pageSize=250&search=eldrin&category=Character&sort=name:asc", nil)
	p2 := ParsePaginationParams(req2)
	if p2.Page != 3 {
		t.Fatalf("expected page 3, got %d", p2.Page)
	}
	if p2.PageSize != 100 { // Max clamp is 100
		t.Fatalf("expected clamped pageSize 100, got %d", p2.PageSize)
	}
	if p2.Search != "eldrin" {
		t.Fatalf("expected search 'eldrin', got '%s'", p2.Search)
	}
	if p2.Category != "Character" {
		t.Fatalf("expected category 'Character', got '%s'", p2.Category)
	}
	if p2.Sort != "name:asc" {
		t.Fatalf("expected sort 'name:asc', got '%s'", p2.Sort)
	}
}

func TestRespondPaginatedJSON_EmptyListGuaranteed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/entities?search=nonexistent", nil)
	rec := httptest.NewRecorder()

	emptyData := []string{}
	params := ParsePaginationParams(req)
	RespondPaginatedJSON(rec, req, emptyData, 0, params)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 on empty query, got %d", rec.Code)
	}

	var resp PaginatedResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Pagination.TotalCount != 0 {
		t.Fatalf("expected totalCount 0, got %d", resp.Pagination.TotalCount)
	}
	if resp.Pagination.HasNextPage != false {
		t.Fatalf("expected hasNextPage false, got true")
	}
	if resp.Pagination.HasPreviousPage != false {
		t.Fatalf("expected hasPreviousPage false, got true")
	}

	dataList, ok := resp.Data.([]interface{})
	if !ok || len(dataList) != 0 {
		t.Fatalf("expected empty data array [], got %v", resp.Data)
	}
}

func TestRespondProblem_RFC7807Format(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/blueprints", nil)
	rec := httptest.NewRecorder()

	RespondValidationProblem(rec, req, "Invalid schema", []InvalidParam{
		{Name: "fields[0].name", Reason: "Duplicate field key", ReceivedValue: "Attack_Power"},
	})

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected HTTP 422, got %d", rec.Code)
	}

	contentType := rec.Header().Get("Content-Type")
	if contentType != "application/problem+json; charset=utf-8" {
		t.Fatalf("expected application/problem+json content type, got '%s'", contentType)
	}

	var prob ProblemDetail
	if err := json.Unmarshal(rec.Body.Bytes(), &prob); err != nil {
		t.Fatalf("failed to decode problem detail: %v", err)
	}

	if prob.Status != 422 {
		t.Fatalf("expected status 422, got %d", prob.Status)
	}
	if prob.Code != "VALIDATION_FAILED" {
		t.Fatalf("expected code VALIDATION_FAILED, got %s", prob.Code)
	}
	if len(prob.InvalidParams) != 1 {
		t.Fatalf("expected 1 invalid param, got %d", len(prob.InvalidParams))
	}
}
