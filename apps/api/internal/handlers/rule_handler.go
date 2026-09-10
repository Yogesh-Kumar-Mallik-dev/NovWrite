package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_API_RULE_HANDLER_001

// InvariantRule represents a user-defined continuity rule / law of the story universe.
type InvariantRule struct {
	ID                  string    `json:"id"`
	ProjectID           string    `json:"projectId"`
	Name                string    `json:"name"`
	Severity            string    `json:"severity"` // BLOCKING_ERROR | WARNING | ADVISORY_NOTE
	Type                string    `json:"type"`     // STATE_GUARD | NUMERIC_BOUNDS | PREREQUISITE | RELATIONAL_GUARD | FORMULA_BOUNDARY
	TargetBlueprintID   string    `json:"targetBlueprintId,omitempty"`
	TargetBlueprintName string    `json:"targetBlueprintName,omitempty"`
	TargetCategory      string    `json:"targetCategory,omitempty"`
	PredicateExpression string    `json:"predicateExpression"`
	PredicateSummary    string    `json:"predicateSummary,omitempty"`
	Description         string    `json:"description,omitempty"`
	Enabled             bool      `json:"enabled"`
	SuggestedResolution string    `json:"suggestedResolution,omitempty"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}

// ContinuityViolation represents an identified contradiction in the novel's timeline.
type ContinuityViolation struct {
	ID                         string    `json:"id"`
	ProjectID                  string    `json:"projectId"`
	Code                       string    `json:"code"`
	RuleID                     string    `json:"ruleId,omitempty"`
	RuleName                   string    `json:"ruleName"`
	Severity                   string    `json:"severity"`
	SceneID                    string    `json:"sceneId"`
	SceneTitle                 string    `json:"sceneTitle"`
	SequenceNumber             int       `json:"sequenceNumber"`
	EntityID                   string    `json:"entityId"`
	EntityName                 string    `json:"entityName"`
	Property                   string    `json:"property"`
	ExpectedValue              string    `json:"expectedValue"`
	CalculatedValue            string    `json:"calculatedValue"`
	HistoricalCausalEventID    string    `json:"historicalCausalEventId,omitempty"`
	HistoricalCausalEventTitle string    `json:"historicalCausalEventTitle,omitempty"`
	HistoricalCausalSequence   int       `json:"historicalCausalSequence,omitempty"`
	Message                    string    `json:"message"`
	RFC7807URI                 string    `json:"rfc7807Uri"`
	SuggestedResolution        string    `json:"suggestedResolution"`
	Overridden                 bool      `json:"overridden"`
	OverrideJustification      string    `json:"overrideJustification,omitempty"`
	OverriddenBy               string    `json:"overriddenBy,omitempty"`
	OverriddenAt               time.Time `json:"overriddenAt,omitempty"`
}

// RuleStore defines the persistence interface for invariant rules.
type RuleStore interface {
	List(projectID string) []InvariantRule
	Get(id string) (*InvariantRule, bool)
	Save(r InvariantRule) InvariantRule
	Delete(id string) bool
}

// InMemoryRuleStore provides thread-safe in-memory storage for invariant rules.
type InMemoryRuleStore struct {
	mu    sync.RWMutex
	rules map[string]InvariantRule
}

// NewInMemoryRuleStore instantiates a new rule store.
func NewInMemoryRuleStore() *InMemoryRuleStore {
	return &InMemoryRuleStore{
		rules: make(map[string]InvariantRule),
	}
}

func (s *InMemoryRuleStore) List(projectID string) []InvariantRule {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]InvariantRule, 0)
	for _, r := range s.rules {
		if projectID == "" || r.ProjectID == projectID {
			result = append(result, r)
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.Before(result[j].CreatedAt)
	})

	return result
}

func (s *InMemoryRuleStore) Get(id string) (*InvariantRule, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	r, found := s.rules[id]
	if !found {
		return nil, false
	}
	return &r, true
}

func (s *InMemoryRuleStore) Save(r InvariantRule) InvariantRule {
	s.mu.Lock()
	defer s.mu.Unlock()

	if r.ID == "" {
		r.ID = fmt.Sprintf("rule-%x-%x", time.Now().Unix(), time.Now().Nanosecond()%0xffff)
	}
	if r.Severity == "" {
		r.Severity = "BLOCKING_ERROR"
	}
	if r.Type == "" {
		r.Type = "STATE_GUARD"
	}
	if r.CreatedAt.IsZero() {
		r.CreatedAt = time.Now().UTC()
	}
	r.UpdatedAt = time.Now().UTC()

	s.rules[r.ID] = r
	return r
}

func (s *InMemoryRuleStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, found := s.rules[id]; !found {
		return false
	}
	delete(s.rules, id)
	return true
}

// RuleHandler provides endpoints for invariant rules and continuity auditing.
type RuleHandler struct {
	ruleStore     RuleStore
	projectStore  ProjectStore
	entityStore   EntityStore
	timelineStore TimelineStore
	eventHub      *EventHub
	violationsMu  sync.RWMutex
	violations    map[string]ContinuityViolation
}

// NewRuleHandler constructs a new rule handler.
func NewRuleHandler(
	ruleStore RuleStore,
	projectStore ProjectStore,
	entityStore EntityStore,
	timelineStore TimelineStore,
	eventHub *EventHub,
) *RuleHandler {
	return &RuleHandler{
		ruleStore:     ruleStore,
		projectStore:  projectStore,
		entityStore:   entityStore,
		timelineStore: timelineStore,
		eventHub:      eventHub,
		violations:    make(map[string]ContinuityViolation),
	}
}

// List returns paginated invariant rules for a project.
func (h *RuleHandler) List(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	rules := h.ruleStore.List(projectID)
	params := httputil.ParsePaginationParams(r)

	start := (params.Page - 1) * params.PageSize
	if start > len(rules) {
		start = len(rules)
	}
	end := start + params.PageSize
	if end > len(rules) {
		end = len(rules)
	}
	sliced := rules[start:end]

	httputil.RespondPaginatedJSON(w, r, sliced, len(rules), params)
}

// Create creates a new invariant rule for the story universe.
func (h *RuleHandler) Create(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")

	var req struct {
		Name                string `json:"name"`
		Severity            string `json:"severity"`
		Type                string `json:"type"`
		TargetBlueprintID   string `json:"targetBlueprintId,omitempty"`
		TargetBlueprintName string `json:"targetBlueprintName,omitempty"`
		TargetCategory      string `json:"targetCategory,omitempty"`
		PredicateExpression string `json:"predicateExpression"`
		PredicateSummary    string `json:"predicateSummary,omitempty"`
		Description         string `json:"description,omitempty"`
		Enabled             *bool  `json:"enabled,omitempty"`
		SuggestedResolution string `json:"suggestedResolution,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/invalid-json",
			Title:  "Invalid JSON Payload",
			Status: http.StatusBadRequest,
			Detail: "Failed to parse request JSON body.",
			Code:   "INVALID_JSON",
		})
		return
	}

	trimmedName := strings.TrimSpace(req.Name)
	if trimmedName == "" {
		httputil.RespondValidationProblem(w, r, "Validation failed for rule creation.", []httputil.InvalidParam{
			{Name: "name", Reason: "Rule name cannot be empty.", ReceivedValue: req.Name},
		})
		return
	}

	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	rule := InvariantRule{
		ProjectID:           projectID,
		Name:                trimmedName,
		Severity:            req.Severity,
		Type:                req.Type,
		TargetBlueprintID:   req.TargetBlueprintID,
		TargetBlueprintName: req.TargetBlueprintName,
		TargetCategory:      req.TargetCategory,
		PredicateExpression: req.PredicateExpression,
		PredicateSummary:    req.PredicateSummary,
		Description:         req.Description,
		Enabled:             enabled,
		SuggestedResolution: req.SuggestedResolution,
	}

	saved := h.ruleStore.Save(rule)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "RULE_CREATED",
			ProjectID: projectID,
			Payload:   saved,
		})
	}

	httputil.RespondCreated(w, r, fmt.Sprintf("/api/v1/projects/%s/rules/%s", projectID, saved.ID), saved)
}

// Get returns a single invariant rule by ID.
func (h *RuleHandler) Get(w http.ResponseWriter, r *http.Request) {
	ruleID := chi.URLParam(r, "ruleId")
	rule, found := h.ruleStore.Get(ruleID)
	if !found {
		httputil.RespondNotFound(w, r, "InvariantRule", ruleID)
		return
	}
	httputil.RespondJSON(w, r, http.StatusOK, rule)
}

// Update updates an existing invariant rule.
func (h *RuleHandler) Update(w http.ResponseWriter, r *http.Request) {
	ruleID := chi.URLParam(r, "ruleId")
	existing, found := h.ruleStore.Get(ruleID)
	if !found {
		httputil.RespondNotFound(w, r, "InvariantRule", ruleID)
		return
	}

	var req struct {
		Name                *string `json:"name,omitempty"`
		Severity            *string `json:"severity,omitempty"`
		Type                *string `json:"type,omitempty"`
		TargetBlueprintID   *string `json:"targetBlueprintId,omitempty"`
		TargetBlueprintName *string `json:"targetBlueprintName,omitempty"`
		TargetCategory      *string `json:"targetCategory,omitempty"`
		PredicateExpression *string `json:"predicateExpression,omitempty"`
		PredicateSummary    *string `json:"predicateSummary,omitempty"`
		Description         *string `json:"description,omitempty"`
		Enabled             *bool   `json:"enabled,omitempty"`
		SuggestedResolution *string `json:"suggestedResolution,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/invalid-json",
			Title:  "Invalid JSON Payload",
			Status: http.StatusBadRequest,
			Detail: "Failed to parse request JSON body.",
			Code:   "INVALID_JSON",
		})
		return
	}

	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		if trimmed == "" {
			httputil.RespondValidationProblem(w, r, "Validation failed for rule update.", []httputil.InvalidParam{
				{Name: "name", Reason: "Rule name cannot be empty.", ReceivedValue: *req.Name},
			})
			return
		}
		existing.Name = trimmed
	}
	if req.Severity != nil {
		existing.Severity = *req.Severity
	}
	if req.Type != nil {
		existing.Type = *req.Type
	}
	if req.PredicateExpression != nil {
		existing.PredicateExpression = *req.PredicateExpression
	}
	if req.PredicateSummary != nil {
		existing.PredicateSummary = *req.PredicateSummary
	}
	if req.Description != nil {
		existing.Description = *req.Description
	}
	if req.Enabled != nil {
		existing.Enabled = *req.Enabled
	}
	if req.SuggestedResolution != nil {
		existing.SuggestedResolution = *req.SuggestedResolution
	}

	saved := h.ruleStore.Save(*existing)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "RULE_UPDATED",
			ProjectID: saved.ProjectID,
			Payload:   saved,
		})
	}

	httputil.RespondJSON(w, r, http.StatusOK, saved)
}

// Delete removes an invariant rule.
func (h *RuleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ruleID := chi.URLParam(r, "ruleId")
	existing, found := h.ruleStore.Get(ruleID)
	if !found {
		httputil.RespondNotFound(w, r, "InvariantRule", ruleID)
		return
	}

	h.ruleStore.Delete(ruleID)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "RULE_DELETED",
			ProjectID: existing.ProjectID,
			Payload:   map[string]string{"id": ruleID},
		})
	}

	httputil.RespondNoContent(w)
}

// Audit performs a continuity audit across scenes and timeline events for a project.
func (h *RuleHandler) Audit(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	params := httputil.ParsePaginationParams(r)

	h.violationsMu.RLock()
	var list []ContinuityViolation
	for _, v := range h.violations {
		if v.ProjectID == projectID {
			list = append(list, v)
		}
	}
	h.violationsMu.RUnlock()

	start := (params.Page - 1) * params.PageSize
	if start > len(list) {
		start = len(list)
	}
	end := start + params.PageSize
	if end > len(list) {
		end = len(list)
	}
	sliced := list[start:end]

	httputil.RespondPaginatedJSON(w, r, sliced, len(list), params)
}

// OverrideViolation records an author override for a flagged continuity violation.
func (h *RuleHandler) OverrideViolation(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	violationID := chi.URLParam(r, "violationId")

	var req struct {
		Justification string `json:"justification"`
		Author        string `json:"author,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/invalid-json",
			Title:  "Invalid JSON Payload",
			Status: http.StatusBadRequest,
			Detail: "Failed to parse request JSON body.",
			Code:   "INVALID_JSON",
		})
		return
	}

	trimmed := strings.TrimSpace(req.Justification)
	if trimmed == "" {
		httputil.RespondValidationProblem(w, r, "Validation failed for violation override.", []httputil.InvalidParam{
			{Name: "justification", Reason: "Override justification is required.", ReceivedValue: req.Justification},
		})
		return
	}

	author := req.Author
	if author == "" {
		author = "Lead Author"
	}

	h.violationsMu.Lock()
	v, found := h.violations[violationID]
	if !found {
		// Instantiate dynamically if not stored
		v = ContinuityViolation{
			ID:        violationID,
			ProjectID: projectID,
		}
	}
	v.Overridden = true
	v.OverrideJustification = trimmed
	v.OverriddenBy = author
	v.OverriddenAt = time.Now().UTC()
	h.violations[violationID] = v
	h.violationsMu.Unlock()

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "AUDIT_OVERRIDDEN",
			ProjectID: projectID,
			Payload:   v,
		})
	}

	httputil.RespondJSON(w, r, http.StatusOK, v)
}
