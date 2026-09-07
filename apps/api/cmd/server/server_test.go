package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
)

// Block Standard: BLOCK_TEST_API_SERVER_001
// Purpose: Verifies full server routing tree, middleware orchestration, and RFC 7807 fallbacks.

func TestServer_HealthAndProbes(t *testing.T) {
	router := BuildRouter()

	endpoints := []string{"/healthz", "/livez", "/readyz", "/api/v1/healthz", "/api/v1/livez", "/api/v1/readyz"}
	for _, ep := range endpoints {
		req := httptest.NewRequest(http.MethodGet, ep, nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Errorf("BLOCK_TEST_API_SERVER_001: expected HTTP 200 for %s, got %d", ep, rec.Code)
		}

		if rec.Header().Get("X-Request-ID") == "" {
			t.Errorf("BLOCK_TEST_API_SERVER_001: missing X-Request-ID on %s", ep)
		}
		if rec.Header().Get("API-Version") != "1.0" {
			t.Errorf("BLOCK_TEST_API_SERVER_001: expected API-Version 1.0, got %s", rec.Header().Get("API-Version"))
		}
	}
}

func TestServer_NotFoundFallback_RFC7807(t *testing.T) {
	router := BuildRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/non-existent-resource", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("BLOCK_TEST_API_SERVER_001: expected HTTP 404, got %d", rec.Code)
	}

	var prob httputil.ProblemDetail
	if err := json.Unmarshal(rec.Body.Bytes(), &prob); err != nil {
		t.Fatalf("BLOCK_TEST_API_SERVER_001: failed to parse problem detail: %v", err)
	}

	if prob.Status != http.StatusNotFound {
		t.Errorf("BLOCK_TEST_API_SERVER_001: expected status 404, got %d", prob.Status)
	}
	if prob.Code != "RESOURCE_NOT_FOUND" {
		t.Errorf("BLOCK_TEST_API_SERVER_001: expected RESOURCE_NOT_FOUND, got %s", prob.Code)
	}
}

func TestServer_MethodNotAllowedFallback_RFC7807(t *testing.T) {
	router := BuildRouter()

	// /api/v1/formulas/evaluate only accepts POST
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/formulas/evaluate", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("BLOCK_TEST_API_SERVER_001: expected HTTP 405, got %d", rec.Code)
	}

	var prob httputil.ProblemDetail
	if err := json.Unmarshal(rec.Body.Bytes(), &prob); err != nil {
		t.Fatalf("BLOCK_TEST_API_SERVER_001: failed to parse problem detail: %v", err)
	}

	if prob.Status != http.StatusMethodNotAllowed {
		t.Errorf("BLOCK_TEST_API_SERVER_001: expected status 405, got %d", prob.Status)
	}
	if prob.Code != "METHOD_NOT_ALLOWED" {
		t.Errorf("BLOCK_TEST_API_SERVER_001: expected METHOD_NOT_ALLOWED, got %s", prob.Code)
	}
}
