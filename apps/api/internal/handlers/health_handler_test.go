package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
)

// Block Standard: BLOCK_TEST_API_HEALTH_001
// Purpose: Verifies health check, liveness, and readiness probes for container orchestration.

func TestHealthHandler_Healthz(t *testing.T) {
	handler := NewHealthHandler()
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	handler.Healthz(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: expected HTTP 200, got %d", rec.Code)
	}

	var resp httputil.SingleResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: failed to parse JSON: %v", err)
	}

	dataMap, ok := resp.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: expected data map, got %T", resp.Data)
	}

	if dataMap["status"] != "healthy" {
		t.Errorf("BLOCK_TEST_API_HEALTH_001: expected status healthy, got %v", dataMap["status"])
	}
	if dataMap["service"] != "novwrite-api" {
		t.Errorf("BLOCK_TEST_API_HEALTH_001: expected service novwrite-api, got %v", dataMap["service"])
	}
}

func TestHealthHandler_Livez(t *testing.T) {
	handler := NewHealthHandler()
	req := httptest.NewRequest(http.MethodGet, "/livez", nil)
	rec := httptest.NewRecorder()

	handler.Livez(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: expected HTTP 200, got %d", rec.Code)
	}

	var resp httputil.SingleResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: failed to parse JSON: %v", err)
	}

	dataMap, ok := resp.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: expected data map, got %T", resp.Data)
	}

	if dataMap["status"] != "alive" {
		t.Errorf("BLOCK_TEST_API_HEALTH_001: expected status alive, got %v", dataMap["status"])
	}
}

func TestHealthHandler_Readyz(t *testing.T) {
	handler := NewHealthHandler()
	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	handler.Readyz(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: expected HTTP 200, got %d", rec.Code)
	}

	var resp httputil.SingleResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: failed to parse JSON: %v", err)
	}

	dataMap, ok := resp.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("BLOCK_TEST_API_HEALTH_001: expected data map, got %T", resp.Data)
	}

	if dataMap["status"] != "ready" {
		t.Errorf("BLOCK_TEST_API_HEALTH_001: expected status ready, got %v", dataMap["status"])
	}

	checks, ok := dataMap["checks"].(map[string]interface{})
	if !ok || checks["memory"] != "ok" || checks["universe"] != "ok" {
		t.Errorf("BLOCK_TEST_API_HEALTH_001: expected valid readiness checks, got %v", dataMap["checks"])
	}
}
