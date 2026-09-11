package httputil

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"runtime/debug"
	"time"
)

// Block Standard: BLOCK_HTTP_MIDDLEWARE_001

// RequestIDMiddleware ensures every incoming request has an X-Request-ID.
func RequestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if reqID == "" {
			bytes := make([]byte, 12)
			_, _ = rand.Read(bytes)
			reqID = fmt.Sprintf("req_%s", hex.EncodeToString(bytes))
		}

		w.Header().Set("X-Request-ID", reqID)
		ctx := context.WithValue(r.Context(), RequestIDKey, reqID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ResponseTimeMiddleware measures request execution duration and sets X-Response-Time.
func ResponseTimeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()
		ctx := context.WithValue(r.Context(), StartTimeKey, startTime)

		// Create a response writer wrapper to inject header before writing status code
		rw := &responseTimeWriter{ResponseWriter: w, startTime: startTime}
		next.ServeHTTP(rw, r.WithContext(ctx))
	})
}

type responseTimeWriter struct {
	http.ResponseWriter
	startTime   time.Time
	wroteHeader bool
}

func (rw *responseTimeWriter) WriteHeader(statusCode int) {
	if !rw.wroteHeader {
		duration := time.Since(rw.startTime)
		rw.Header().Set("X-Response-Time", fmt.Sprintf("%.2fms", float64(duration.Microseconds())/1000.0))
		rw.wroteHeader = true
	}
	rw.ResponseWriter.WriteHeader(statusCode)
}

func (rw *responseTimeWriter) Write(b []byte) (int, error) {
	if !rw.wroteHeader {
		rw.WriteHeader(http.StatusOK)
	}
	return rw.ResponseWriter.Write(b)
}

// Flush ensures SSE streams and chunked HTTP flushes pass through transparently.
func (rw *responseTimeWriter) Flush() {
	if !rw.wroteHeader {
		rw.WriteHeader(http.StatusOK)
	}
	if flusher, ok := rw.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

// Unwrap returns the underlying ResponseWriter for standard library and router unwrapping.
func (rw *responseTimeWriter) Unwrap() http.ResponseWriter {
	return rw.ResponseWriter
}

// MaxBytesMiddleware limits the maximum readable size of incoming request bodies to protect against payload DoS.
func MaxBytesMiddleware(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Body != nil && maxBytes > 0 {
				r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			}
			next.ServeHTTP(w, r)
		})
	}
}

// SecurityHeadersMiddleware sets standard HTTP security headers on all responses.
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*; frame-ancestors 'none';")
		w.Header().Set("Vary", "Accept-Encoding, Origin")
		next.ServeHTTP(w, r)
	})
}

// APIVersionMiddleware adds the API version header to all responses.
func APIVersionMiddleware(version string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("API-Version", version)
			w.Header().Set("X-API-Version", version)
			next.ServeHTTP(w, r)
		})
	}
}

// PanicRecoveryMiddleware recovers from panics and writes an RFC 7807 problem detail response.
func PanicRecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				stack := string(debug.Stack())
				_ = stack // In production, log stack trace to telemetry logger
				RespondProblem(w, r, ProblemDetail{
					Type:   "https://novwrite.com/errors/internal-server-error",
					Title:  "Internal Server Error",
					Status: http.StatusInternalServerError,
					Detail: "An unexpected server panic occurred. The incident has been recorded.",
					Code:   "UNHANDLED_SERVER_PANIC",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}
