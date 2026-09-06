package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
)

func TestWorldBridgeHandler_AuditContradiction(t *testing.T) {
	eldrinID := "eldrin-1"
	malakorID := "malakor-1"

	baseEntities := []world.FoldedEntityState{
		{
			EntityID:   eldrinID,
			EntityName: "Eldrin",
			Category:   "CHARACTER",
			ComputedProperties: map[string]interface{}{
				"mana_capacity": float64(500),
				"status":        "ALIVE",
			},
		},
		{
			EntityID:   malakorID,
			EntityName: "Lord Malakor",
			Category:   "CHARACTER",
			ComputedProperties: map[string]interface{}{
				"mana_capacity": float64(1200),
				"status":        "ALIVE",
			},
		},
	}

	events := []world.TimelineEvent{
		{
			ID:                      "ev-150",
			NarrativeSequenceNumber: 150,
			ChronologicalOrder:      200,
			Title:                   "Fall of Malakor",
			Effects: []world.EventEffect{
				{TargetEntity: malakorID, PropertyKey: "status", Operation: world.OpSet, Value: "DEAD"},
			},
		},
	}

	rules := []world.InvariantRule{
		{
			ID:       "rule-dead-no-spells",
			Name:     "Deceased Entity Action Restriction",
			Severity: "BLOCKING_ERROR",
			Predicate: map[string]interface{}{
				"type":             "STATE_GUARD",
				"propertyKey":      "status",
				"guardedValue":     "DEAD",
				"forbiddenActions": []interface{}{"CAST_SPELL"},
			},
		},
	}

	handler := NewWorldBridgeHandler(events, rules, baseEntities)

	reqPayload := world.ContinuityAuditRequest{
		ProjectID:      "proj-1",
		SceneID:        "scene-2",
		SequenceNumber: 160,
		DraftEvents: []world.DraftProseEvent{
			{
				EntityID:  malakorID,
				EventType: "CAST_SPELL",
			},
		},
	}

	body, _ := json.Marshal(reqPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/bridge/audit", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleContinuityAudit(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", rec.Code)
	}

	var resp world.ContinuityAuditResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if resp.Status != "VIOLATION_DETECTED" {
		t.Fatalf("expected VIOLATION_DETECTED, got %s", resp.Status)
	}
	if len(resp.Violations) != 1 {
		t.Fatalf("expected 1 violation, got %d", len(resp.Violations))
	}
	if resp.Violations[0].Code != "INVARIANT_STATE_ILLEGAL_ACTION" {
		t.Fatalf("expected INVARIANT_STATE_ILLEGAL_ACTION, got %s", resp.Violations[0].Code)
	}
}
