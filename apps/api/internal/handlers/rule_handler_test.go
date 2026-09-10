package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_TEST_RULE_HANDLER_001

func TestRuleHandler_RulesAndAuditOverrides(t *testing.T) {
	ruleStore := NewInMemoryRuleStore()
	projectStore := NewInMemoryProjectStore()
	entityStore := NewInMemoryEntityStore()
	timelineStore := NewInMemoryTimelineStore()
	eventHub := NewEventHub()

	handler := NewRuleHandler(ruleStore, projectStore, entityStore, timelineStore, eventHub)

	r := chi.NewRouter()
	r.Route("/api/v1/projects/{projectId}", func(r chi.Router) {
		r.Route("/rules", func(r chi.Router) {
			r.Get("/", handler.List)
			r.Post("/", handler.Create)
			r.Get("/{ruleId}", handler.Get)
			r.Put("/{ruleId}", handler.Update)
			r.Delete("/{ruleId}", handler.Delete)
		})
		r.Route("/audit", func(r chi.Router) {
			r.Get("/", handler.Audit)
			r.Post("/{violationId}/override", handler.OverrideViolation)
		})
	})

	projectID := "proj-audit-test"

	// 1. Create Invariant Rule
	createRuleBody := `{
		"name": "Deceased Entity Action Invariant",
		"severity": "BLOCKING_ERROR",
		"type": "STATE_GUARD",
		"predicateExpression": "status != 'deceased' || action_type == 'posthumous_reminiscence'",
		"predicateSummary": "Deceased entities cannot participate in active scenes",
		"description": "Prevents dead characters from casting spells or taking direct actions",
		"suggestedResolution": "Mark character as resurrected or adjust scene anchor"
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/rules", bytes.NewBufferString(createRuleBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d. Body: %s", w.Code, w.Body.String())
	}

	var createdRuleResp struct {
		Data InvariantRule `json:"data"`
	}
	if err := json.NewDecoder(w.Body).Decode(&createdRuleResp); err != nil {
		t.Fatalf("failed to decode created rule: %v", err)
	}
	createdRule := createdRuleResp.Data
	if createdRule.Name != "Deceased Entity Action Invariant" {
		t.Errorf("expected rule name 'Deceased Entity Action Invariant', got '%s'", createdRule.Name)
	}

	// 2. List Rules
	reqList := httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+projectID+"/rules", nil)
	wList := httptest.NewRecorder()
	r.ServeHTTP(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", wList.Code)
	}

	// 3. Override Continuity Violation
	violationID := "violation-dead-malakor-cast"
	overrideBody := `{"justification":"Malakor casts spell via delayed necrotic contingency trigger left before death","author":"Lead Author"}`
	reqOverride := httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/audit/"+violationID+"/override", bytes.NewBufferString(overrideBody))
	reqOverride.Header.Set("Content-Type", "application/json")
	wOverride := httptest.NewRecorder()
	r.ServeHTTP(wOverride, reqOverride)

	if wOverride.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", wOverride.Code)
	}

	var overriddenResp struct {
		Data ContinuityViolation `json:"data"`
	}
	if err := json.NewDecoder(wOverride.Body).Decode(&overriddenResp); err != nil {
		t.Fatalf("failed to decode overridden violation: %v", err)
	}
	overridden := overriddenResp.Data
	if !overridden.Overridden {
		t.Errorf("expected violation to be marked overridden")
	}
	if overridden.OverrideJustification != "Malakor casts spell via delayed necrotic contingency trigger left before death" {
		t.Errorf("unexpected justification: %s", overridden.OverrideJustification)
	}
}
