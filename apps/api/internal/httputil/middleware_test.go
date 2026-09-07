package httputil

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// Block Standard: BLOCK_TEST_HTTP_MIDDLEWARE_001
// Purpose: Verifies observability, tracing, security, versioning, and panic recovery middleware behaviors.

func TestMiddleware_RequestID_GeneratesAndPreserves(t *testing.T) {
	// 1. Should generate new request ID if missing
	var capturedIDFromCtx string
	handler := RequestIDMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, _ := r.Context().Value(RequestIDKey).(string)
		capturedIDFromCtx = id
		w.WriteHeader(http.StatusOK)
	}))

	req1 := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec1 := httptest.NewRecorder()
	handler.ServeHTTP(rec1, req1)

	headerID := rec1.Header().Get("X-Request-ID")
	if headerID == "" {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected X-Request-ID header to be set")
	}
	if capturedIDFromCtx != headerID {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: context ID (%s) does not match header ID (%s)", capturedIDFromCtx, headerID)
	}

	// 2. Should preserve custom X-Request-ID
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req2.Header.Set("X-Request-ID", "custom-req-12345")
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)

	if rec2.Header().Get("X-Request-ID") != "custom-req-12345" {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected custom-req-12345, got %s", rec2.Header().Get("X-Request-ID"))
	}
}

func TestMiddleware_ResponseTime_HeaderSet(t *testing.T) {
	handler := ResponseTimeMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(2 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	respTime := rec.Header().Get("X-Response-Time")
	if respTime == "" {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected X-Response-Time header to be present")
	}
}

func TestMiddleware_SecurityHeaders(t *testing.T) {
	handler := SecurityHeadersMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected nosniff, got %s", rec.Header().Get("X-Content-Type-Options"))
	}
	if rec.Header().Get("X-Frame-Options") != "DENY" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected DENY, got %s", rec.Header().Get("X-Frame-Options"))
	}
	if rec.Header().Get("X-XSS-Protection") != "1; mode=block" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 1; mode=block, got %s", rec.Header().Get("X-XSS-Protection"))
	}
}

func TestMiddleware_APIVersion(t *testing.T) {
	middleware := APIVersionMiddleware("v1.0")
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("API-Version") != "v1.0" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected API-Version v1.0, got %s", rec.Header().Get("API-Version"))
	}
	if rec.Header().Get("X-API-Version") != "v1.0" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected X-API-Version v1.0, got %s", rec.Header().Get("X-API-Version"))
	}
}

func TestMiddleware_PanicRecovery_RFC7807(t *testing.T) {
	handler := PanicRecoveryMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("intentional simulated server panic")
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected HTTP 500, got %d", rec.Code)
	}

	var prob ProblemDetail
	if err := json.Unmarshal(rec.Body.Bytes(), &prob); err != nil {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: failed to parse problem detail: %v", err)
	}

	if prob.Status != http.StatusInternalServerError {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected status 500, got %d", prob.Status)
	}
	if prob.Code != "UNHANDLED_SERVER_PANIC" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected code UNHANDLED_SERVER_PANIC, got %s", prob.Code)
	}
}
