package httputil

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// Block Standard: BLOCK_HTTP_AUTH_001

const (
	UserContextKey contextKey = "user_claims"
)

// UserClaims captures the authenticated user's identity and permissions.
type UserClaims struct {
	UserID     string   `json:"sub,omitempty"`
	Email      string   `json:"email,omitempty"`
	Role       string   `json:"role,omitempty"`
	ProjectIDs []string `json:"projectIds,omitempty"`
	ExpiresAt  int64    `json:"exp,omitempty"`
	IssuedAt   int64    `json:"iat,omitempty"`
}

// GetUserFromContext retrieves UserClaims from the request context if present.
func GetUserFromContext(ctx context.Context) (*UserClaims, bool) {
	if ctx == nil {
		return nil, false
	}
	claims, ok := ctx.Value(UserContextKey).(*UserClaims)
	if !ok || claims == nil {
		return nil, false
	}
	return claims, true
}

// SetUserInContext attaches UserClaims to the context.
func SetUserInContext(ctx context.Context, claims *UserClaims) context.Context {
	return context.WithValue(ctx, UserContextKey, claims)
}

// SignJWT creates a signed HS256 JWT token with the provided claims and secret.
func SignJWT(claims UserClaims, secret string) (string, error) {
	if secret == "" {
		return "", errors.New("jwt secret cannot be empty")
	}

	headerJSON := `{"alg":"HS256","typ":"JWT"}`
	headerB64 := base64.RawURLEncoding.EncodeToString([]byte(headerJSON))

	payloadBytes, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("failed to marshal claims: %w", err)
	}
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadBytes)

	signingInput := headerB64 + "." + payloadB64
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signingInput))
	signature := mac.Sum(nil)
	sigB64 := base64.RawURLEncoding.EncodeToString(signature)

	return signingInput + "." + sigB64, nil
}

// ParseAndVerifyJWT parses and validates an HS256 JWT token against the given secret.
func ParseAndVerifyJWT(tokenStr string, secret string) (*UserClaims, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed jwt: must have 3 segments")
	}

	headerB64, payloadB64, sigB64 := parts[0], parts[1], parts[2]

	// Verify signature if secret provided
	if secret != "" {
		signingInput := headerB64 + "." + payloadB64
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write([]byte(signingInput))
		expectedSig := mac.Sum(nil)

		actualSig, err := base64.RawURLEncoding.DecodeString(sigB64)
		if err != nil {
			return nil, fmt.Errorf("invalid signature encoding: %w", err)
		}

		if !hmac.Equal(expectedSig, actualSig) {
			return nil, errors.New("invalid jwt signature")
		}
	}

	// Decode payload
	payloadBytes, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		return nil, fmt.Errorf("invalid payload encoding: %w", err)
	}

	var claims UserClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, fmt.Errorf("failed to decode claims json: %w", err)
	}

	// Verify expiration if exp claim is set
	if claims.ExpiresAt > 0 {
		if time.Now().Unix() > claims.ExpiresAt {
			return nil, errors.New("jwt token has expired")
		}
	}

	return &claims, nil
}

// JWTAuthMiddleware provides token authentication and context population.
// If requireAuth is false, unauthenticated requests pass through without error,
// but valid tokens or development X-User-ID headers still populate user context.
func JWTAuthMiddleware(jwtSecret string, requireAuth bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var claims *UserClaims

			// 1. Check Authorization: Bearer <token>
			authHeader := r.Header.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenStr := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
				if parsed, err := ParseAndVerifyJWT(tokenStr, jwtSecret); err == nil {
					claims = parsed
				} else if requireAuth {
					RespondProblem(w, r, ProblemDetail{
						Type:   "https://novwrite.com/errors/unauthorized",
						Title:  "Unauthorized",
						Status: http.StatusUnauthorized,
						Detail: fmt.Sprintf("Invalid or expired authentication token: %v", err),
						Code:   "INVALID_AUTH_TOKEN",
					})
					return
				}
			}

			// 2. Fallback: Development/Local X-User-ID header if no bearer claims
			if claims == nil {
				if devUserID := r.Header.Get("X-User-ID"); devUserID != "" {
					claims = &UserClaims{
						UserID: strings.TrimSpace(devUserID),
						Role:   "author",
					}
				}
			}

			// 3. Enforce authentication requirement if configured
			if requireAuth && claims == nil {
				RespondProblem(w, r, ProblemDetail{
					Type:   "https://novwrite.com/errors/unauthorized",
					Title:  "Authentication Required",
					Status: http.StatusUnauthorized,
					Detail: "A valid Bearer token is required to access this resource.",
					Code:   "UNAUTHORIZED",
				})
				return
			}

			// 4. Attach claims to context if resolved
			ctx := r.Context()
			if claims != nil {
				ctx = SetUserInContext(ctx, claims)
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
