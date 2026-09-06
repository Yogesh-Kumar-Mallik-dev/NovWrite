package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Block Standard: BLOCK_TEST_API_DEV_SEEDER_001
func TestDevSeederHandler_SeedHandler_Development(t *testing.T) {
	handler := NewDevSeederHandler("development")

	req := httptest.NewRequest(http.MethodPost, "/api/v1/dev/seed", nil)
	w := httptest.NewRecorder()

	handler.SeedHandler(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	var body DevSeedResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !body.Success {
		t.Errorf("expected success to be true")
	}
	if body.ProjectID != "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" {
		t.Errorf("expected project ID 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d, got %s", body.ProjectID)
	}
	if body.SeededScenesCount != 3 {
		t.Errorf("expected 3 seeded scenes, got %d", body.SeededScenesCount)
	}
}

func TestDevSeederHandler_SeedHandler_Production_Forbidden(t *testing.T) {
	handler := NewDevSeederHandler("production")

	req := httptest.NewRequest(http.MethodPost, "/api/v1/dev/seed", nil)
	w := httptest.NewRecorder()

	handler.SeedHandler(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected status 403 Forbidden in production, got %d", resp.StatusCode)
	}

	var errResp RFC7807Error
	if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if errResp.Status != http.StatusForbidden {
		t.Errorf("expected RFC 7807 status 403, got %d", errResp.Status)
	}
}
