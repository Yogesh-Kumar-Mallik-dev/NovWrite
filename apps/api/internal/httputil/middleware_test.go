package httputil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// Block Standard: BLOCK_TEST_HTTP_MIDDLEWARE_001
// Purpose: Verifies observability, tracing, security, versioning, rate limiting, request size limits, JWT auth, and panic recovery middleware behaviors.

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
	if rec.Header().Get("Referrer-Policy") != "strict-origin-when-cross-origin" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected strict-origin-when-cross-origin, got %s", rec.Header().Get("Referrer-Policy"))
	}
	if !strings.Contains(rec.Header().Get("Content-Security-Policy"), "default-src 'self'") {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected default-src 'self' in CSP, got %s", rec.Header().Get("Content-Security-Policy"))
	}
}

func TestMiddleware_MaxBytes_EnforcesPayloadLimit(t *testing.T) {
	limit := int64(64)
	middleware := MaxBytesMiddleware(limit)

	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "payload too large", http.StatusRequestEntityTooLarge)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))

	// Payload within limit
	smallBody := bytes.NewReader([]byte("small payload"))
	reqSmall := httptest.NewRequest(http.MethodPost, "/test", smallBody)
	recSmall := httptest.NewRecorder()
	handler.ServeHTTP(recSmall, reqSmall)
	if recSmall.Code != http.StatusOK {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 200 for small body, got %d", recSmall.Code)
	}

	// Payload exceeding limit
	largeBody := bytes.NewReader(bytes.Repeat([]byte("A"), 128))
	reqLarge := httptest.NewRequest(http.MethodPost, "/test", largeBody)
	recLarge := httptest.NewRecorder()
	handler.ServeHTTP(recLarge, reqLarge)
	if recLarge.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 413 for oversized body, got %d", recLarge.Code)
	}
}

func TestMiddleware_RateLimiter_EnforcesLimit(t *testing.T) {
	// Rate limit: 2 requests per minute
	middleware := RateLimiterMiddleware(2)
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Request 1: Allowed
	req1 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req1.RemoteAddr = "192.168.1.50:1234"
	rec1 := httptest.NewRecorder()
	handler.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: req 1 expected 200, got %d", rec1.Code)
	}
	if rec1.Header().Get("X-RateLimit-Limit") != "2" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected limit 2, got %s", rec1.Header().Get("X-RateLimit-Limit"))
	}

	// Request 2: Allowed
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req2.RemoteAddr = "192.168.1.50:1234"
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: req 2 expected 200, got %d", rec2.Code)
	}

	// Request 3: Exceeded -> HTTP 429
	req3 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req3.RemoteAddr = "192.168.1.50:1234"
	rec3 := httptest.NewRecorder()
	handler.ServeHTTP(rec3, req3)
	if rec3.Code != http.StatusTooManyRequests {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: req 3 expected 429 Too Many Requests, got %d", rec3.Code)
	}

	var prob ProblemDetail
	if err := json.Unmarshal(rec3.Body.Bytes(), &prob); err != nil {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: failed to unmarshal 429 problem detail: %v", err)
	}
	if prob.Code != "RATE_LIMIT_EXCEEDED" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected code RATE_LIMIT_EXCEEDED, got %s", prob.Code)
	}
}

func TestMiddleware_ExtractClientIP(t *testing.T) {
	// 1. X-Forwarded-For
	req1 := httptest.NewRequest(http.MethodGet, "/", nil)
	req1.Header.Set("X-Forwarded-For", "203.0.113.195, 70.41.3.18")
	if ip := ExtractClientIP(req1); ip != "203.0.113.195" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 203.0.113.195, got %s", ip)
	}

	// 2. X-Real-IP
	req2 := httptest.NewRequest(http.MethodGet, "/", nil)
	req2.Header.Set("X-Real-IP", "198.51.100.1")
	if ip := ExtractClientIP(req2); ip != "198.51.100.1" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 198.51.100.1, got %s", ip)
	}

	// 3. RemoteAddr host:port
	req3 := httptest.NewRequest(http.MethodGet, "/", nil)
	req3.RemoteAddr = "192.0.2.1:54321"
	if ip := ExtractClientIP(req3); ip != "192.0.2.1" {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 192.0.2.1, got %s", ip)
	}
}

func TestMiddleware_JWTAuth(t *testing.T) {
	secret := "super-secure-test-secret-key-32b"

	// 1. Valid token populates claims in context
	claims := UserClaims{
		UserID:    "user_test_999",
		Email:     "author@novwrite.com",
		Role:      "lead-author",
		ExpiresAt: time.Now().Add(1 * time.Hour).Unix(),
	}
	token, err := SignJWT(claims, secret)
	if err != nil {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: failed to sign token: %v", err)
	}

	var capturedUser *UserClaims
	handler := JWTAuthMiddleware(secret, true)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if u, ok := GetUserFromContext(r.Context()); ok {
			capturedUser = u
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 200, got %d", rec.Code)
	}
	if capturedUser == nil || capturedUser.UserID != "user_test_999" {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected user_test_999 in context, got %+v", capturedUser)
	}

	// 2. Expired token rejected when requireAuth is true
	expiredClaims := UserClaims{
		UserID:    "user_expired",
		ExpiresAt: time.Now().Add(-1 * time.Hour).Unix(),
	}
	expiredToken, _ := SignJWT(expiredClaims, secret)

	reqExpired := httptest.NewRequest(http.MethodGet, "/test", nil)
	reqExpired.Header.Set("Authorization", "Bearer "+expiredToken)
	recExpired := httptest.NewRecorder()
	handler.ServeHTTP(recExpired, reqExpired)

	if recExpired.Code != http.StatusUnauthorized {
		t.Errorf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 401 for expired token, got %d", recExpired.Code)
	}

	// 3. Dev header fallback
	devHandler := JWTAuthMiddleware(secret, false)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if u, ok := GetUserFromContext(r.Context()); ok {
			capturedUser = u
		}
		w.WriteHeader(http.StatusOK)
	}))

	capturedUser = nil
	reqDev := httptest.NewRequest(http.MethodGet, "/test", nil)
	reqDev.Header.Set("X-User-ID", "dev_user_42")
	recDev := httptest.NewRecorder()
	devHandler.ServeHTTP(recDev, reqDev)

	if recDev.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected 200, got %d", recDev.Code)
	}
	if capturedUser == nil || capturedUser.UserID != "dev_user_42" {
		t.Fatalf("BLOCK_TEST_HTTP_MIDDLEWARE_001: expected dev_user_42 in context, got %+v", capturedUser)
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
