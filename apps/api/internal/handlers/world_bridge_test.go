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

	var resp struct {
		Data world.ContinuityAuditResponse `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if resp.Data.Status != "VIOLATION_DETECTED" {
		t.Fatalf("expected VIOLATION_DETECTED, got %s", resp.Data.Status)
	}
	if len(resp.Data.Violations) != 1 {
		t.Fatalf("expected 1 violation, got %d", len(resp.Data.Violations))
	}
	if resp.Data.Violations[0].Code != "INVARIANT_STATE_ILLEGAL_ACTION" {
		t.Fatalf("expected INVARIANT_STATE_ILLEGAL_ACTION, got %s", resp.Data.Violations[0].Code)
	}
}

// Block Standard: BLOCK_TEST_WORLD_BRIDGE_GROUNDING_001
// Purpose: Verifies HandleSceneGrounding and HandleEntityMentions RPC endpoints for Prose Studio integration.
func TestWorldBridgeHandler_GroundingAndMentions(t *testing.T) {
	eldrinID := "eldrin-1"
	baseEntities := []world.FoldedEntityState{
		{
			EntityID:   eldrinID,
			EntityName: "Eldrin the Spellblade",
			Category:   "CHARACTER",
			ComputedProperties: map[string]interface{}{
				"mana_capacity": float64(500),
			},
		},
	}
	rules := []world.InvariantRule{
		{
			ID:       "rule-mana-non-negative",
			Name:     "Mana Non-Negative Guard",
			Severity: "BLOCKING_ERROR",
		},
	}

	handler := NewWorldBridgeHandler(nil, rules, baseEntities)

	// 1. Scene Grounding
	groundReq := map[string]interface{}{
		"projectId":            "proj-1",
		"sceneId":              "scene-1",
		"targetSequenceNumber": 50,
		"mentionedEntityIds":   []string{eldrinID},
	}
	gBody, _ := json.Marshal(groundReq)
	reqGround := httptest.NewRequest(http.MethodPost, "/api/v1/bridge/ground", bytes.NewReader(gBody))
	recGround := httptest.NewRecorder()
	handler.HandleSceneGrounding(recGround, reqGround)

	if recGround.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_WORLD_BRIDGE_GROUNDING_001: expected HTTP 200, got %d", recGround.Code)
	}

	var gResp struct {
		Data struct {
			SceneID        string                    `json:"sceneId"`
			SequenceNumber int                       `json:"sequenceNumber"`
			FoldedStates   []world.FoldedEntityState `json:"foldedStates"`
		} `json:"data"`
	}
	json.Unmarshal(recGround.Body.Bytes(), &gResp)
	if len(gResp.Data.FoldedStates) != 1 || gResp.Data.FoldedStates[0].EntityName != "Eldrin the Spellblade" {
		t.Fatalf("BLOCK_TEST_WORLD_BRIDGE_GROUNDING_001: unexpected folded state: %v", gResp.Data.FoldedStates)
	}

	// 2. Entity Mentions
	mentionReq := map[string]interface{}{
		"projectId":  "proj-1",
		"queryToken": "eldrin",
	}
	mBody, _ := json.Marshal(mentionReq)
	reqMention := httptest.NewRequest(http.MethodPost, "/api/v1/bridge/mentions", bytes.NewReader(mBody))
	recMention := httptest.NewRecorder()
	handler.HandleEntityMentions(recMention, reqMention)

	if recMention.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_WORLD_BRIDGE_GROUNDING_001: expected HTTP 200 on mentions, got %d", recMention.Code)
	}

	var mResp struct {
		Data struct {
			QueryToken string                   `json:"queryToken"`
			Matches    []map[string]interface{} `json:"matches"`
		} `json:"data"`
	}
	json.Unmarshal(recMention.Body.Bytes(), &mResp)
	if len(mResp.Data.Matches) != 1 || mResp.Data.Matches[0]["name"] != "Eldrin the Spellblade" {
		t.Fatalf("BLOCK_TEST_WORLD_BRIDGE_GROUNDING_001: expected 1 match Eldrin, got %v", mResp.Data.Matches)
	}
}
