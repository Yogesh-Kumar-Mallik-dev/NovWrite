package world

import (
	"testing"
)

func TestStateFold_ChroniclesDataset_ContinuityViolations(t *testing.T) {
	eldrinID := "eldrin-1"
	malakorID := "malakor-1"

	baseEntities := []FoldedEntityState{
		{
			EntityID:   eldrinID,
			EntityName: "Eldrin the Spellblade",
			Category:   "CHARACTER",
			ComputedProperties: map[string]interface{}{
				"mana_capacity": float64(0),
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

	events := []TimelineEvent{
		{
			ID:                      "ev-1",
			NarrativeSequenceNumber: 10,
			ChronologicalOrder:      100,
			Title:                   "Awakening",
			Effects: []EventEffect{
				{TargetEntity: eldrinID, PropertyKey: "mana_capacity", Operation: OpSet, Value: float64(500)},
			},
		},
		{
			ID:                      "ev-2",
			NarrativeSequenceNumber: 50,
			ChronologicalOrder:      150,
			Title:                   "Duel",
			Effects: []EventEffect{
				{TargetEntity: eldrinID, PropertyKey: "mana_capacity", Operation: OpDecrement, Value: float64(200)},
			},
		},
		{
			ID:                      "ev-3",
			NarrativeSequenceNumber: 150,
			ChronologicalOrder:      200,
			Title:                   "Fall of Malakor",
			Effects: []EventEffect{
				{TargetEntity: malakorID, PropertyKey: "status", Operation: OpSet, Value: "DEAD"},
			},
		},
	}

	rules := []InvariantRule{
		{
			ID:       "rule-1",
			Name:     "Non-Negative Mana",
			Severity: "BLOCKING_ERROR",
			Predicate: map[string]interface{}{
				"type":        "NUMERIC_BOUNDS",
				"propertyKey": "mana_capacity",
				"min":         float64(0),
			},
		},
		{
			ID:       "rule-2",
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

	// 1. Audit at Seq 50 (clean)
	cleanResp := AuditContinuity(ContinuityAuditRequest{
		ProjectID:      "proj-1",
		SceneID:        "scene-1",
		SequenceNumber: 50,
		DraftEvents: []DraftProseEvent{
			{
				EntityID:  eldrinID,
				EventType: "MEDITATE",
				Delta:     map[string]interface{}{"mana_capacity": float64(50)},
			},
		},
	}, events, rules, baseEntities)

	if cleanResp.Status != "CLEAN" || len(cleanResp.Violations) != 0 {
		t.Fatalf("expected CLEAN status, got %s with %d violations", cleanResp.Status, len(cleanResp.Violations))
	}

	// 2. Audit at Seq 160 (Contradiction: Malakor DEAD casting spell)
	violationResp := AuditContinuity(ContinuityAuditRequest{
		ProjectID:      "proj-1",
		SceneID:        "scene-2",
		SequenceNumber: 160,
		DraftEvents: []DraftProseEvent{
			{
				EntityID:  malakorID,
				EventType: "CAST_SPELL",
			},
		},
	}, events, rules, baseEntities)

	if violationResp.Status != "VIOLATION_DETECTED" {
		t.Fatalf("expected VIOLATION_DETECTED status, got %s", violationResp.Status)
	}
	if len(violationResp.Violations) != 1 {
		t.Fatalf("expected 1 violation, got %d", len(violationResp.Violations))
	}
	if violationResp.Violations[0].Code != "INVARIANT_STATE_ILLEGAL_ACTION" {
		t.Fatalf("expected INVARIANT_STATE_ILLEGAL_ACTION, got %s", violationResp.Violations[0].Code)
	}
}
