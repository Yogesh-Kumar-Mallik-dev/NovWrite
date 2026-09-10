package cache

import (
	"context"
	"testing"
	"time"
)

func TestMemoryCacheManager_SceneLeases(t *testing.T) {
	ctx := context.Background()
	cm := NewMemoryCacheManager()

	sceneID := "scene-101"
	authorA := "author-alpha"
	authorB := "author-beta"

	// 1. Author A acquires lease
	ok, err := cm.AcquireSceneLease(ctx, sceneID, authorA, 500*time.Millisecond)
	if err != nil || !ok {
		t.Fatalf("expected author A to acquire lease, got ok=%v, err=%v", ok, err)
	}

	// 2. Author B tries to acquire same lease -> must fail
	ok, err = cm.AcquireSceneLease(ctx, sceneID, authorB, 500*time.Millisecond)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatalf("expected author B to be blocked, but acquired lease")
	}

	// 3. Inspect active lease
	heldBy, ttl, active, err := cm.GetSceneLease(ctx, sceneID)
	if err != nil || !active || heldBy != authorA || ttl <= 0 {
		t.Fatalf("invalid lease inspect: heldBy=%s, ttl=%v, active=%v", heldBy, ttl, active)
	}

	// 4. Author A renews lease
	renewed, err := cm.RenewSceneLease(ctx, sceneID, authorA, 1*time.Second)
	if err != nil || !renewed {
		t.Fatalf("expected author A to renew lease, got renewed=%v, err=%v", renewed, err)
	}

	// 5. Author B cannot renew Author A's lease
	renewed, err = cm.RenewSceneLease(ctx, sceneID, authorB, 1*time.Second)
	if renewed {
		t.Fatalf("author B should not be able to renew author A's lease")
	}

	// 6. Author A releases lease
	err = cm.ReleaseSceneLease(ctx, sceneID, authorA)
	if err != nil {
		t.Fatalf("failed to release lease: %v", err)
	}

	// 7. Author B can now acquire lease
	ok, err = cm.AcquireSceneLease(ctx, sceneID, authorB, 500*time.Millisecond)
	if err != nil || !ok {
		t.Fatalf("expected author B to acquire released lease, got ok=%v, err=%v", ok, err)
	}
}

func TestMemoryCacheManager_ProjectContext(t *testing.T) {
	ctx := context.Background()
	cm := NewMemoryCacheManager()

	projectID := "proj-999"
	payload := []byte(`{"id":"proj-999","name":"Cultivation Chronicles"}`)

	// 1. Initial get should return ErrNotFound
	_, err := cm.GetActiveProjectContext(ctx, projectID)
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}

	// 2. Set active project context
	err = cm.SetActiveProjectContext(ctx, projectID, payload, 500*time.Millisecond)
	if err != nil {
		t.Fatalf("failed to set context: %v", err)
	}

	// 3. Retrieve context
	cached, err := cm.GetActiveProjectContext(ctx, projectID)
	if err != nil || string(cached) != string(payload) {
		t.Fatalf("expected payload %s, got %s (err=%v)", string(payload), string(cached), err)
	}

	// 4. Invalidate context
	err = cm.InvalidateProjectContext(ctx, projectID)
	if err != nil {
		t.Fatalf("failed to invalidate: %v", err)
	}

	// 5. Get after invalidation
	_, err = cm.GetActiveProjectContext(ctx, projectID)
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound after invalidation, got %v", err)
	}
}

func TestNewDefaultCacheManager_Fallback(t *testing.T) {
	// Empty URL should produce valid MemoryCacheManager
	cm := NewDefaultCacheManager("")
	if cm == nil {
		t.Fatalf("expected non-nil default cache manager")
	}

	// Invalid URL should produce fallback MemoryCacheManager
	cmInvalid := NewDefaultCacheManager("invalid://localhost:6379")
	if cmInvalid == nil {
		t.Fatalf("expected non-nil fallback cache manager")
	}
}
