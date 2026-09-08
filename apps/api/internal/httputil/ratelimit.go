package httputil

import (
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Block Standard: BLOCK_HTTP_RATE_LIMIT_001

type clientRateData struct {
	tokens     float64
	lastRefill time.Time
}

// RateLimiter manages thread-safe per-client IP token bucket rate limiting.
type RateLimiter struct {
	mu           sync.Mutex
	clients      map[string]*clientRateData
	ratePerSec   float64
	maxTokens    float64
	cleanupEvery time.Duration
	lastCleanup  time.Time
}

// NewRateLimiter creates a new RateLimiter allowing maxRequestsPerMinute per IP.
func NewRateLimiter(maxRequestsPerMinute int) *RateLimiter {
	if maxRequestsPerMinute <= 0 {
		maxRequestsPerMinute = 120
	}
	capacity := float64(maxRequestsPerMinute)
	rate := capacity / 60.0

	return &RateLimiter{
		clients:      make(map[string]*clientRateData),
		ratePerSec:   rate,
		maxTokens:    capacity,
		cleanupEvery: 5 * time.Minute,
		lastCleanup:  time.Now(),
	}
}

// Allow checks whether a request from the given client IP is allowed.
func (rl *RateLimiter) Allow(clientIP string) (bool, int, int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	// Periodic cleanup of stale clients
	if now.Sub(rl.lastCleanup) > rl.cleanupEvery {
		for ip, data := range rl.clients {
			if now.Sub(data.lastRefill) > 10*time.Minute {
				delete(rl.clients, ip)
			}
		}
		rl.lastCleanup = now
	}

	data, exists := rl.clients[clientIP]
	if !exists {
		data = &clientRateData{
			tokens:     rl.maxTokens,
			lastRefill: now,
		}
		rl.clients[clientIP] = data
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(data.lastRefill).Seconds()
	data.tokens += elapsed * rl.ratePerSec
	if data.tokens > rl.maxTokens {
		data.tokens = rl.maxTokens
	}
	data.lastRefill = now

	limit := int(rl.maxTokens)
	if data.tokens >= 1.0 {
		data.tokens -= 1.0
		remaining := int(data.tokens)
		return true, limit, remaining
	}

	return false, limit, 0
}

// ExtractClientIP extracts the client IP address from request headers or remote address.
func ExtractClientIP(r *http.Request) string {
	// Check X-Forwarded-For header
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			ip := strings.TrimSpace(parts[0])
			if ip != "" {
				return ip
			}
		}
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}

	// Fallback to RemoteAddr
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}

	return r.RemoteAddr
}

// RateLimiterMiddleware returns an HTTP middleware enforcing rate limits per client IP.
func RateLimiterMiddleware(maxRequestsPerMinute int) func(http.Handler) http.Handler {
	limiter := NewRateLimiter(maxRequestsPerMinute)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientIP := ExtractClientIP(r)
			allowed, limit, remaining := limiter.Allow(clientIP)

			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			w.Header().Set("X-RateLimit-Reset", "60")

			if !allowed {
				RespondProblem(w, r, ProblemDetail{
					Type:   "https://novwrite.com/errors/rate-limit-exceeded",
					Title:  "Too Many Requests",
					Status: http.StatusTooManyRequests,
					Detail: fmt.Sprintf("Rate limit of %d requests per minute exceeded. Please retry after a brief pause.", limit),
					Code:   "RATE_LIMIT_EXCEEDED",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
