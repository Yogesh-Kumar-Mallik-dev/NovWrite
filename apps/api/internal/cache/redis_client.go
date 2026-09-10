package cache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Block Standard: BLOCK_CACHE_REDIS_CONTEXT_001

var (
	ErrLeaseHeldByOther = errors.New("scene lease held by another author")
	ErrNotFound         = errors.New("key not found in cache")
)

// CacheManager provides standardized operations for hot operational context,
// collaborative distributed scene leases, and real-time pub/sub invalidation channels.
type CacheManager interface {
	AcquireSceneLease(ctx context.Context, sceneID, authorID string, ttl time.Duration) (bool, error)
	RenewSceneLease(ctx context.Context, sceneID, authorID string, ttl time.Duration) (bool, error)
	ReleaseSceneLease(ctx context.Context, sceneID, authorID string) error
	GetSceneLease(ctx context.Context, sceneID string) (authorID string, remainingTTL time.Duration, active bool, err error)

	GetActiveProjectContext(ctx context.Context, projectID string) ([]byte, error)
	SetActiveProjectContext(ctx context.Context, projectID string, data []byte, ttl time.Duration) error
	InvalidateProjectContext(ctx context.Context, projectID string) error

	PublishProjectEvent(ctx context.Context, projectID, eventType string, payload any) error
	Close() error
}

// ============================================================================
// Redis Implementation
// ============================================================================

type RedisCacheManager struct {
	client *redis.Client
}

func NewRedisCacheManager(client *redis.Client) *RedisCacheManager {
	return &RedisCacheManager{client: client}
}

func (r *RedisCacheManager) leaseKey(sceneID string) string {
	return fmt.Sprintf("novwrite:lease:scene:%s", sceneID)
}

func (r *RedisCacheManager) projectKey(projectID string) string {
	return fmt.Sprintf("novwrite:context:project:%s", projectID)
}

func (r *RedisCacheManager) pubsubChannel(projectID string) string {
	return fmt.Sprintf("novwrite:events:project:%s", projectID)
}

func (r *RedisCacheManager) AcquireSceneLease(ctx context.Context, sceneID, authorID string, ttl time.Duration) (bool, error) {
	key := r.leaseKey(sceneID)
	// SET key authorID NX EX ttl
	ok, err := r.client.SetNX(ctx, key, authorID, ttl).Result()
	if err != nil {
		return false, err
	}
	return ok, nil
}

func (r *RedisCacheManager) RenewSceneLease(ctx context.Context, sceneID, authorID string, ttl time.Duration) (bool, error) {
	key := r.leaseKey(sceneID)
	// Lua script to renew only if the current author still holds the lease
	luaScript := `
		if redis.call("get", KEYS[1]) == ARGV[1] then
			return redis.call("expire", KEYS[1], ARGV[2])
		else
			return 0
		end
	`
	res, err := r.client.Eval(ctx, luaScript, []string{key}, authorID, int(ttl.Seconds())).Result()
	if err != nil {
		return false, err
	}
	renewed, ok := res.(int64)
	return ok && renewed == 1, nil
}

func (r *RedisCacheManager) ReleaseSceneLease(ctx context.Context, sceneID, authorID string) error {
	key := r.leaseKey(sceneID)
	luaScript := `
		if redis.call("get", KEYS[1]) == ARGV[1] then
			return redis.call("del", KEYS[1])
		else
			return 0
		end
	`
	_, err := r.client.Eval(ctx, luaScript, []string{key}, authorID).Result()
	return err
}

func (r *RedisCacheManager) GetSceneLease(ctx context.Context, sceneID string) (string, time.Duration, bool, error) {
	key := r.leaseKey(sceneID)
	val, err := r.client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return "", 0, false, nil
	}
	if err != nil {
		return "", 0, false, err
	}

	ttl, err := r.client.TTL(ctx, key).Result()
	if err != nil {
		return val, 0, true, nil
	}
	return val, ttl, true, nil
}

func (r *RedisCacheManager) GetActiveProjectContext(ctx context.Context, projectID string) ([]byte, error) {
	key := r.projectKey(projectID)
	val, err := r.client.Get(ctx, key).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, ErrNotFound
	}
	return val, err
}

func (r *RedisCacheManager) SetActiveProjectContext(ctx context.Context, projectID string, data []byte, ttl time.Duration) error {
	key := r.projectKey(projectID)
	return r.client.Set(ctx, key, data, ttl).Err()
}

func (r *RedisCacheManager) InvalidateProjectContext(ctx context.Context, projectID string) error {
	key := r.projectKey(projectID)
	return r.client.Del(ctx, key).Err()
}

func (r *RedisCacheManager) PublishProjectEvent(ctx context.Context, projectID, eventType string, payload any) error {
	channel := r.pubsubChannel(projectID)
	envelope := map[string]any{
		"projectId": projectID,
		"type":      eventType,
		"payload":   payload,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
	raw, err := json.Marshal(envelope)
	if err != nil {
		return err
	}
	return r.client.Publish(ctx, channel, raw).Err()
}

func (r *RedisCacheManager) Close() error {
	return r.client.Close()
}

// ============================================================================
// In-Memory Fallback Implementation (for unit tests / zero-dependency mode)
// ============================================================================

type leaseItem struct {
	authorID  string
	expiresAt time.Time
}

type MemoryCacheManager struct {
	mu           sync.RWMutex
	leases       map[string]leaseItem
	contexts     map[string][]byte
	contextExpir map[string]time.Time
}

func NewMemoryCacheManager() *MemoryCacheManager {
	return &MemoryCacheManager{
		leases:       make(map[string]leaseItem),
		contexts:     make(map[string][]byte),
		contextExpir: make(map[string]time.Time),
	}
}

func (m *MemoryCacheManager) AcquireSceneLease(_ context.Context, sceneID, authorID string, ttl time.Duration) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	if item, exists := m.leases[sceneID]; exists && item.expiresAt.After(now) {
		if item.authorID == authorID {
			m.leases[sceneID] = leaseItem{authorID: authorID, expiresAt: now.Add(ttl)}
			return true, nil
		}
		return false, nil
	}

	m.leases[sceneID] = leaseItem{authorID: authorID, expiresAt: now.Add(ttl)}
	return true, nil
}

func (m *MemoryCacheManager) RenewSceneLease(_ context.Context, sceneID, authorID string, ttl time.Duration) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	if item, exists := m.leases[sceneID]; exists && item.expiresAt.After(now) {
		if item.authorID == authorID {
			m.leases[sceneID] = leaseItem{authorID: authorID, expiresAt: now.Add(ttl)}
			return true, nil
		}
	}
	return false, nil
}

func (m *MemoryCacheManager) ReleaseSceneLease(_ context.Context, sceneID, authorID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if item, exists := m.leases[sceneID]; exists {
		if item.authorID == authorID {
			delete(m.leases, sceneID)
		}
	}
	return nil
}

func (m *MemoryCacheManager) GetSceneLease(_ context.Context, sceneID string) (string, time.Duration, bool, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	now := time.Now()
	if item, exists := m.leases[sceneID]; exists && item.expiresAt.After(now) {
		return item.authorID, item.expiresAt.Sub(now), true, nil
	}
	return "", 0, false, nil
}

func (m *MemoryCacheManager) GetActiveProjectContext(_ context.Context, projectID string) ([]byte, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	now := time.Now()
	if exp, exists := m.contextExpir[projectID]; exists && exp.Before(now) {
		return nil, ErrNotFound
	}

	if data, exists := m.contexts[projectID]; exists {
		return data, nil
	}
	return nil, ErrNotFound
}

func (m *MemoryCacheManager) SetActiveProjectContext(_ context.Context, projectID string, data []byte, ttl time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.contexts[projectID] = data
	if ttl > 0 {
		m.contextExpir[projectID] = time.Now().Add(ttl)
	} else {
		delete(m.contextExpir, projectID)
	}
	return nil
}

func (m *MemoryCacheManager) InvalidateProjectContext(_ context.Context, projectID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.contexts, projectID)
	delete(m.contextExpir, projectID)
	return nil
}

func (m *MemoryCacheManager) PublishProjectEvent(_ context.Context, _, _ string, _ any) error {
	return nil
}

func (m *MemoryCacheManager) Close() error {
	return nil
}

// NewDefaultCacheManager attempts connection to Redis with fallback to MemoryCacheManager.
func NewDefaultCacheManager(redisURL string) CacheManager {
	if redisURL == "" {
		return NewMemoryCacheManager()
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		// Fallback to in-memory on invalid URL format
		return NewMemoryCacheManager()
	}

	client := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		// Fallback to in-memory if Redis ping fails
		return NewMemoryCacheManager()
	}

	return NewRedisCacheManager(client)
}
