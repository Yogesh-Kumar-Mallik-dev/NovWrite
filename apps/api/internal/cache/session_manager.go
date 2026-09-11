package cache

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Block Standard: BLOCK_SESSION_MANAGER_001

var (
	ErrTokenNotFound = errors.New("refresh token not found")
	ErrTokenExpired  = errors.New("refresh token expired")
	ErrTokenReused   = errors.New("refresh token reuse detected; session family revoked")
	ErrTokenRevoked  = errors.New("token has been revoked")
)

// RefreshTokenData represents the persisted state of a refresh token.
type RefreshTokenData struct {
	TokenID   string    `json:"tokenId"`
	UserID    string    `json:"userId"`
	FamilyID  string    `json:"familyId"`
	IsUsed    bool      `json:"isUsed"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}

// SessionManager abstracts token family rotation, blacklist checking, and logout revocation.
type SessionManager interface {
	StoreRefreshToken(ctx context.Context, tokenID, userID, familyID string, ttl time.Duration) error
	RotateRefreshToken(ctx context.Context, tokenID string, ttl time.Duration) (userID, newFamilyID, newRefreshTokenID string, err error)
	RevokeToken(ctx context.Context, tokenID string, ttl time.Duration) error
	IsTokenRevoked(ctx context.Context, tokenID string) bool
	RevokeFamily(ctx context.Context, familyID string) error
	Close() error
}

// GenerateSecureToken generates a cryptographically random 256-bit token string.
func GenerateSecureToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to read random bytes: %w", err)
	}
	return hex.EncodeToString(b), nil
}

// ============================================================================
// Redis Session Manager
// ============================================================================

type RedisSessionManager struct {
	client *redis.Client
}

func NewRedisSessionManager(client *redis.Client) *RedisSessionManager {
	return &RedisSessionManager{client: client}
}

func (r *RedisSessionManager) tokenKey(tokenID string) string {
	return fmt.Sprintf("novwrite:auth:refresh:%s", tokenID)
}

func (r *RedisSessionManager) familyKey(familyID string) string {
	return fmt.Sprintf("novwrite:auth:family:%s", familyID)
}

func (r *RedisSessionManager) revokedKey(tokenID string) string {
	return fmt.Sprintf("novwrite:auth:revoked:%s", tokenID)
}

func (r *RedisSessionManager) StoreRefreshToken(ctx context.Context, tokenID, userID, familyID string, ttl time.Duration) error {
	data := RefreshTokenData{
		TokenID:   tokenID,
		UserID:    userID,
		FamilyID:  familyID,
		IsUsed:    false,
		ExpiresAt: time.Now().UTC().Add(ttl),
		CreatedAt: time.Now().UTC(),
	}

	raw, err := json.Marshal(data)
	if err != nil {
		return err
	}

	pipe := r.client.TxPipeline()
	pipe.Set(ctx, r.tokenKey(tokenID), raw, ttl)
	pipe.SAdd(ctx, r.familyKey(familyID), tokenID)
	pipe.Expire(ctx, r.familyKey(familyID), ttl*2)
	_, err = pipe.Exec(ctx)
	return err
}

func (r *RedisSessionManager) RotateRefreshToken(ctx context.Context, tokenID string, ttl time.Duration) (string, string, string, error) {
	key := r.tokenKey(tokenID)
	val, err := r.client.Get(ctx, key).Bytes()
	if errors.Is(err, redis.Nil) {
		return "", "", "", ErrTokenNotFound
	}
	if err != nil {
		return "", "", "", err
	}

	var data RefreshTokenData
	if err := json.Unmarshal(val, &data); err != nil {
		return "", "", "", err
	}

	if data.IsUsed {
		// Reuse detected! Potential breach: invalidate entire family
		_ = r.RevokeFamily(ctx, data.FamilyID)
		return "", "", "", ErrTokenReused
	}

	if time.Now().UTC().After(data.ExpiresAt) {
		return "", "", "", ErrTokenExpired
	}

	// Mark current token as used
	data.IsUsed = true
	raw, _ := json.Marshal(data)
	r.client.Set(ctx, key, raw, 1*time.Minute) // Grace period

	// Generate new token ID in same family
	newTokenID, err := GenerateSecureToken()
	if err != nil {
		return "", "", "", err
	}

	if err := r.StoreRefreshToken(ctx, newTokenID, data.UserID, data.FamilyID, ttl); err != nil {
		return "", "", "", err
	}

	return data.UserID, data.FamilyID, newTokenID, nil
}

func (r *RedisSessionManager) RevokeToken(ctx context.Context, tokenID string, ttl time.Duration) error {
	if ttl <= 0 {
		ttl = 24 * time.Hour
	}
	return r.client.Set(ctx, r.revokedKey(tokenID), "revoked", ttl).Err()
}

func (r *RedisSessionManager) IsTokenRevoked(ctx context.Context, tokenID string) bool {
	exists, err := r.client.Exists(ctx, r.revokedKey(tokenID)).Result()
	if err != nil {
		return false
	}
	return exists > 0
}

func (r *RedisSessionManager) RevokeFamily(ctx context.Context, familyID string) error {
	fKey := r.familyKey(familyID)
	members, err := r.client.SMembers(ctx, fKey).Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return err
	}

	pipe := r.client.TxPipeline()
	for _, tok := range members {
		pipe.Del(ctx, r.tokenKey(tok))
		pipe.Set(ctx, r.revokedKey(tok), "revoked", 7*24*time.Hour)
	}
	pipe.Del(ctx, fKey)
	_, err = pipe.Exec(ctx)
	return err
}

func (r *RedisSessionManager) Close() error {
	return r.client.Close()
}

// ============================================================================
// Memory Session Manager (Fallback & Local Unit Test Engine)
// ============================================================================

type MemorySessionManager struct {
	mu           sync.RWMutex
	tokens       map[string]RefreshTokenData
	families     map[string]map[string]bool
	revokedToken map[string]time.Time
}

func NewMemorySessionManager() *MemorySessionManager {
	return &MemorySessionManager{
		tokens:       make(map[string]RefreshTokenData),
		families:     make(map[string]map[string]bool),
		revokedToken: make(map[string]time.Time),
	}
}

func (m *MemorySessionManager) StoreRefreshToken(_ context.Context, tokenID, userID, familyID string, ttl time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	data := RefreshTokenData{
		TokenID:   tokenID,
		UserID:    userID,
		FamilyID:  familyID,
		IsUsed:    false,
		ExpiresAt: time.Now().UTC().Add(ttl),
		CreatedAt: time.Now().UTC(),
	}
	m.tokens[tokenID] = data

	if _, exists := m.families[familyID]; !exists {
		m.families[familyID] = make(map[string]bool)
	}
	m.families[familyID][tokenID] = true
	return nil
}

func (m *MemorySessionManager) RotateRefreshToken(_ context.Context, tokenID string, ttl time.Duration) (string, string, string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	data, exists := m.tokens[tokenID]
	if !exists {
		return "", "", "", ErrTokenNotFound
	}

	if data.IsUsed {
		// Breach detected: revoke family
		if members, ok := m.families[data.FamilyID]; ok {
			for tok := range members {
				delete(m.tokens, tok)
				m.revokedToken[tok] = time.Now().UTC().Add(7 * 24 * time.Hour)
			}
			delete(m.families, data.FamilyID)
		}
		return "", "", "", ErrTokenReused
	}

	if time.Now().UTC().After(data.ExpiresAt) {
		return "", "", "", ErrTokenExpired
	}

	// Mark as used
	data.IsUsed = true
	m.tokens[tokenID] = data

	// Generate new token
	newTokenID, err := GenerateSecureToken()
	if err != nil {
		return "", "", "", err
	}

	newData := RefreshTokenData{
		TokenID:   newTokenID,
		UserID:    data.UserID,
		FamilyID:  data.FamilyID,
		IsUsed:    false,
		ExpiresAt: time.Now().UTC().Add(ttl),
		CreatedAt: time.Now().UTC(),
	}
	m.tokens[newTokenID] = newData
	if _, ok := m.families[data.FamilyID]; !ok {
		m.families[data.FamilyID] = make(map[string]bool)
	}
	m.families[data.FamilyID][newTokenID] = true

	return data.UserID, data.FamilyID, newTokenID, nil
}

func (m *MemorySessionManager) RevokeToken(_ context.Context, tokenID string, ttl time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if ttl <= 0 {
		ttl = 24 * time.Hour
	}
	m.revokedToken[tokenID] = time.Now().UTC().Add(ttl)
	delete(m.tokens, tokenID)
	return nil
}

func (m *MemorySessionManager) IsTokenRevoked(_ context.Context, tokenID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	exp, exists := m.revokedToken[tokenID]
	if !exists {
		return false
	}
	return time.Now().UTC().Before(exp)
}

func (m *MemorySessionManager) RevokeFamily(_ context.Context, familyID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if members, ok := m.families[familyID]; ok {
		for tok := range members {
			delete(m.tokens, tok)
			m.revokedToken[tok] = time.Now().UTC().Add(7 * 24 * time.Hour)
		}
		delete(m.families, familyID)
	}
	return nil
}

func (m *MemorySessionManager) Close() error {
	return nil
}

// NewDefaultSessionManager initializes RedisSessionManager if connected, else MemorySessionManager.
func NewDefaultSessionManager(redisURL string) SessionManager {
	if redisURL == "" {
		return NewMemorySessionManager()
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return NewMemorySessionManager()
	}

	client := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return NewMemorySessionManager()
	}

	return NewRedisSessionManager(client)
}
