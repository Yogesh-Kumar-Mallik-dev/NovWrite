package world

import (
	"fmt"
	"strings"
)

// FoldedEntityState represents an entity's computed state at a specific narrative sequence.
type FoldedEntityState struct {
	EntityID             string                 `json:"entityId"`
	EntityName           string                 `json:"entityName"`
	Category             string                 `json:"category"`
	ComputedProperties   map[string]interface{} `json:"computedProperties"`
	LastMutatedSeqNumber int                    `json:"lastMutatedSeqNumber"`
}

// InvariantRule represents a continuity invariant rule definition.
type InvariantRule struct {
	ID          string                 `json:"id"`
	ProjectID   string                 `json:"projectId"`
	Name        string                 `json:"name"`
	Severity    string                 `json:"severity"`
	Predicate   map[string]interface{} `json:"predicate"`
	Description *string                `json:"description,omitempty"`
}

// ContinuityViolation represents an RFC 7807 problem detail for continuity contradictions.
type ContinuityViolation struct {
	Code            string      `json:"code"`
	RuleName        string      `json:"ruleName"`
	EntityID        string      `json:"entityId"`
	EntityName      string      `json:"entityName"`
	Property        string      `json:"property"`
	ExpectedValue   interface{} `json:"expectedValue"`
	CalculatedValue interface{} `json:"calculatedValue"`
	Message         string      `json:"message"`
	RFC7807URI      string      `json:"rfc7807Uri"`
}

// DraftProseEvent represents a proposed state mutation in a drafted scene.
type DraftProseEvent struct {
	EntityID     string                 `json:"entityId"`
	EventType    string                 `json:"eventType"`
	Delta        map[string]interface{} `json:"delta,omitempty"`
	ClaimedState map[string]interface{} `json:"claimedState,omitempty"`
}

// ContinuityAuditRequest represents an audit payload sent from Prose Studio to World Studio.
type ContinuityAuditRequest struct {
	ProjectID      string            `json:"projectId"`
	SceneID        string            `json:"sceneId"`
	SequenceNumber int               `json:"sequenceNumber"`
	DraftEvents    []DraftProseEvent `json:"draftEvents"`
}

// ContinuityAuditResponse represents the audit result.
type ContinuityAuditResponse struct {
	SceneID        string                `json:"sceneId"`
	SequenceNumber int                   `json:"sequenceNumber"`
	Status         string                `json:"status"` // "CLEAN" | "VIOLATION_DETECTED"
	Violations     []ContinuityViolation `json:"violations"`
}

// FoldStateAtSequence reconstructs entity property maps up to maxSeq.
func FoldStateAtSequence(
	events []TimelineEvent,
	maxSeq int,
	baseEntities []FoldedEntityState,
) map[string]FoldedEntityState {
	stateMap := make(map[string]FoldedEntityState)

	// 1. Initialize base entities
	for _, base := range baseEntities {
		propsCopy := make(map[string]interface{})
		for k, v := range base.ComputedProperties {
			propsCopy[k] = v
		}
		stateMap[base.EntityID] = FoldedEntityState{
			EntityID:             base.EntityID,
			EntityName:           base.EntityName,
			Category:             base.Category,
			ComputedProperties:   propsCopy,
			LastMutatedSeqNumber: 0,
		}
	}

	// 2. Sort events by narrative sequence
	sorted := SortEventsByNarrative(events, false)

	// 3. Sequentially replay effects
	for _, ev := range sorted {
		if ev.NarrativeSequenceNumber > maxSeq {
			break
		}
		for _, eff := range ev.Effects {
			entityState, exists := stateMap[eff.TargetEntity]
			if !exists {
				entityState = FoldedEntityState{
					EntityID:             eff.TargetEntity,
					EntityName:           fmt.Sprintf("Entity_%s", eff.TargetEntity),
					Category:             "CHARACTER",
					ComputedProperties:   make(map[string]interface{}),
					LastMutatedSeqNumber: ev.NarrativeSequenceNumber,
				}
			}

			updatedProps, err := ApplyEffect(entityState.ComputedProperties, eff)
			if err == nil {
				entityState.ComputedProperties = updatedProps
				entityState.LastMutatedSeqNumber = ev.NarrativeSequenceNumber
				stateMap[eff.TargetEntity] = entityState
			}
		}
	}

	return stateMap
}

// EvaluateRule checks an invariant rule against a folded entity state and optional draft event.
func EvaluateRule(
	rule InvariantRule,
	state FoldedEntityState,
	draft *DraftProseEvent,
) *ContinuityViolation {
	predType, _ := rule.Predicate["type"].(string)

	switch predType {
	case "NUMERIC_BOUNDS":
		propKey, _ := rule.Predicate["propertyKey"].(string)
		rawVal, exists := state.ComputedProperties[propKey]
		if !exists {
			return nil
		}
		numVal := toFloat64(rawVal)

		if minVal, ok := tryToFloat64(rule.Predicate["min"]); ok {
			if numVal < minVal {
				return &ContinuityViolation{
					Code:            "INVARIANT_NUMERIC_MIN_VIOLATED",
					RuleName:        rule.Name,
					EntityID:        state.EntityID,
					EntityName:      state.EntityName,
					Property:        propKey,
					ExpectedValue:   fmt.Sprintf(">= %v", minVal),
					CalculatedValue: numVal,
					Message:         fmt.Sprintf("Rule '%s' violated: %s.%s is %v, below min bound (%v)", rule.Name, state.EntityName, propKey, numVal, minVal),
					RFC7807URI:      "https://novwrite.io/errors/invariants/invariant-numeric-min-violated",
				}
			}
		}

		if maxVal, ok := tryToFloat64(rule.Predicate["max"]); ok {
			if numVal > maxVal {
				return &ContinuityViolation{
					Code:            "INVARIANT_NUMERIC_MAX_VIOLATED",
					RuleName:        rule.Name,
					EntityID:        state.EntityID,
					EntityName:      state.EntityName,
					Property:        propKey,
					ExpectedValue:   fmt.Sprintf("<= %v", maxVal),
					CalculatedValue: numVal,
					Message:         fmt.Sprintf("Rule '%s' violated: %s.%s is %v, exceeds max bound (%v)", rule.Name, state.EntityName, propKey, numVal, maxVal),
					RFC7807URI:      "https://novwrite.io/errors/invariants/invariant-numeric-max-violated",
				}
			}
		}

	case "STATE_GUARD":
		propKey, _ := rule.Predicate["propertyKey"].(string)
		guardedVal, _ := rule.Predicate["guardedValue"].(string)
		curVal := fmt.Sprintf("%v", state.ComputedProperties[propKey])

		if strings.EqualFold(curVal, guardedVal) && draft != nil {
			forbiddenRaw, ok := rule.Predicate["forbiddenActions"].([]interface{})
			if ok {
				for _, f := range forbiddenRaw {
					if strings.EqualFold(fmt.Sprintf("%v", f), draft.EventType) {
						return &ContinuityViolation{
							Code:            "INVARIANT_STATE_ILLEGAL_ACTION",
							RuleName:        rule.Name,
							EntityID:        state.EntityID,
							EntityName:      state.EntityName,
							Property:        propKey,
							ExpectedValue:   fmt.Sprintf("Action '%s' forbidden when %s is %s", draft.EventType, propKey, guardedVal),
							CalculatedValue: curVal,
							Message:         fmt.Sprintf("Rule '%s' violated: %s is %s and cannot execute '%s'", rule.Name, state.EntityName, curVal, draft.EventType),
							RFC7807URI:      "https://novwrite.io/errors/invariants/invariant-state-illegal-action",
						}
					}
				}
			}
		}
	}

	return nil
}

// AuditContinuity performs continuity verification for a scene.
func AuditContinuity(
	req ContinuityAuditRequest,
	events []TimelineEvent,
	rules []InvariantRule,
	baseEntities []FoldedEntityState,
) ContinuityAuditResponse {
	foldedMap := FoldStateAtSequence(events, req.SequenceNumber, baseEntities)
	violations := []ContinuityViolation{}

	// Check folded states
	for _, entityState := range foldedMap {
		for _, rule := range rules {
			if v := EvaluateRule(rule, entityState, nil); v != nil {
				violations = append(violations, *v)
			}
		}
	}

	// Check draft events
	for _, draft := range req.DraftEvents {
		entityState, exists := foldedMap[draft.EntityID]
		if !exists {
			continue
		}

		// State guard checks
		for _, rule := range rules {
			if v := EvaluateRule(rule, entityState, &draft); v != nil {
				violations = append(violations, *v)
			}
		}

		// Delta simulation checks
		if draft.Delta != nil && len(draft.Delta) > 0 {
			simProps := make(map[string]interface{})
			for k, v := range entityState.ComputedProperties {
				simProps[k] = v
			}
			for k, v := range draft.Delta {
				if deltaNum, ok := tryToFloat64(v); ok {
					curNum := toFloat64(simProps[k])
					simProps[k] = curNum + deltaNum
				} else {
					simProps[k] = v
				}
			}
			simState := FoldedEntityState{
				EntityID:           entityState.EntityID,
				EntityName:         entityState.EntityName,
				Category:           entityState.Category,
				ComputedProperties: simProps,
			}
			for _, rule := range rules {
				if v := EvaluateRule(rule, simState, nil); v != nil {
					violations = append(violations, *v)
				}
			}
		}
	}

	status := "CLEAN"
	if len(violations) > 0 {
		status = "VIOLATION_DETECTED"
	}

	return ContinuityAuditResponse{
		SceneID:        req.SceneID,
		SequenceNumber: req.SequenceNumber,
		Status:         status,
		Violations:     violations,
	}
}
