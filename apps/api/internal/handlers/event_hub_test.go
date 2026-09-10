package handlers

import (
	"testing"
	"time"
)

// Block Standard: BLOCK_TEST_EVENT_HUB_001

func TestEventHub_SubscribeAndBroadcast(t *testing.T) {
	hub := NewEventHub()

	if count := hub.ClientCount(); count != 0 {
		t.Fatalf("expected 0 initial clients, got %d", count)
	}

	projectA := "proj-alpha"
	projectB := "proj-beta"

	chA, unsubA := hub.Subscribe(projectA)
	defer unsubA()

	chAll, unsubAll := hub.Subscribe("")
	defer unsubAll()

	if count := hub.ClientCount(); count != 2 {
		t.Fatalf("expected 2 clients, got %d", count)
	}

	// Broadcast event for Project A
	evtA := SSEEvent{
		Event:     "ENTITY_MUTATED",
		ProjectID: projectA,
		Payload: map[string]string{
			"entityId": "ent-1",
			"action":   "formula_recomputed",
		},
	}
	hub.Broadcast(evtA)

	select {
	case received := <-chA:
		if received.Event != "ENTITY_MUTATED" {
			t.Errorf("expected ENTITY_MUTATED, got %s", received.Event)
		}
	case <-time.After(200 * time.Millisecond):
		t.Errorf("timed out waiting for event on channel A")
	}

	select {
	case received := <-chAll:
		if received.Event != "ENTITY_MUTATED" {
			t.Errorf("expected ENTITY_MUTATED on global channel, got %s", received.Event)
		}
	case <-time.After(200 * time.Millisecond):
		t.Errorf("timed out waiting for event on global channel")
	}

	// Broadcast event for Project B (should NOT reach chA)
	evtB := SSEEvent{
		Event:     "CHAPTER_CREATED",
		ProjectID: projectB,
		Payload: map[string]string{
			"chapterId": "chap-b",
		},
	}
	hub.Broadcast(evtB)

	select {
	case received := <-chAll:
		if received.Event != "CHAPTER_CREATED" {
			t.Errorf("expected CHAPTER_CREATED on global channel, got %s", received.Event)
		}
	case <-time.After(200 * time.Millisecond):
		t.Errorf("timed out waiting for event B on global channel")
	}

	select {
	case unexpected := <-chA:
		t.Errorf("received unexpected event on channel A: %v", unexpected)
	case <-time.After(50 * time.Millisecond):
		// Success: event for B did not leak to channel A
	}

	unsubA()
	if count := hub.ClientCount(); count != 1 {
		t.Fatalf("expected 1 client after unsubscribing A, got %d", count)
	}
}
