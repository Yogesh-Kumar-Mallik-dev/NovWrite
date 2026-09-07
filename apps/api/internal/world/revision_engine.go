package world

import (
	"encoding/json"
	"fmt"
	"sort"
	"time"
)

// Block Standard: BLOCK_WORLD_REVISION_ENGINE_002

// RevisionType categorizes authorial changes vs plot changes.
type RevisionType string

const (
	RevTypeTypoFix            RevisionType = "TYPO_FIX"
	RevTypeBaselineEdit       RevisionType = "BASELINE_EDIT"
	RevTypeRetroactivePlotFix RevisionType = "RETROACTIVE_PLOT_FIX"
	RevTypeRevert             RevisionType = "REVERT"
)

// ValueChange tracks before and after values for a property.
type ValueChange struct {
	Before interface{} `json:"before"`
	After  interface{} `json:"after"`
}

// FloatChange tracks before and after float values for formulas.
type FloatChange struct {
	Before float64 `json:"before"`
	After  float64 `json:"after"`
}

// StringChange tracks before and after string values.
type StringChange struct {
	Before string `json:"before"`
	After  string `json:"after"`
}

// EntityRevisionPatch represents a granular delta between two revisions.
type EntityRevisionPatch struct {
	Name              *StringChange          `json:"name,omitempty"`
	Description       *StringChange          `json:"description,omitempty"`
	Category          *StringChange          `json:"category,omitempty"`
	PropertiesChanged map[string]ValueChange `json:"propertiesChanged,omitempty"`
	FormulasChanged   map[string]FloatChange `json:"formulasChanged,omitempty"`
}

// EntityRevision represents an immutable snapshot and delta in authorial history.
type EntityRevision struct {
	ID               string              `json:"id"`
	EntityID         string              `json:"entityId"`
	ProjectID        string              `json:"projectId,omitempty"`
	ParentRevisionID *string             `json:"parentRevisionId"`
	RevisionNumber   int                 `json:"revisionNumber"`
	CreatedAt        string              `json:"createdAt"`
	Type             RevisionType        `json:"type"`
	AuthorNote       string              `json:"authorNote,omitempty"`
	Patch            EntityRevisionPatch `json:"patch"`
	Snapshot         EntityItem          `json:"snapshot"`
}

// ActiveMutation represents an event mutation applied during timeline folding.
type ActiveMutation struct {
	EventID        string      `json:"eventId"`
	EventTitle     string      `json:"eventTitle"`
	SequenceNumber int         `json:"sequenceNumber"`
	PropertyKey    string      `json:"propertyKey"`
	Operation      string      `json:"operation"`
	Value          interface{} `json:"value"`
}

// BitemporalEntityState represents an entity resolved at a 2D coordinate: (T_narrative, T_revision).
type BitemporalEntityState struct {
	EntityID                string                 `json:"entityId"`
	EntityName              string                 `json:"entityName"`
	Category                string                 `json:"category"`
	NarrativeSequenceNumber int                    `json:"narrativeSequenceNumber"`
	RevisionID              string                 `json:"revisionId"`
	RevisionNumber          int                    `json:"revisionNumber"`
	RevisionType            RevisionType           `json:"revisionType"`
	Properties              map[string]interface{} `json:"properties"`
	ComputedFormulas        map[string]float64     `json:"computedFormulas,omitempty"`
	AppliedEventsCount      int                    `json:"appliedEventsCount"`
	ActiveMutations         []ActiveMutation       `json:"activeMutations"`
}

// ComputeEntityPatch calculates delta changes between before and after entity snapshots.
func ComputeEntityPatch(before *EntityItem, after EntityItem) EntityRevisionPatch {
	var patch EntityRevisionPatch

	if before == nil {
		patch.Name = &StringChange{Before: "", After: after.Name}
		patch.PropertiesChanged = make(map[string]ValueChange)
		for k, v := range after.Properties {
			patch.PropertiesChanged[k] = ValueChange{Before: nil, After: v}
		}
		return patch
	}

	if before.Name != after.Name {
		patch.Name = &StringChange{Before: before.Name, After: after.Name}
	}
	if before.Description != after.Description {
		patch.Description = &StringChange{Before: before.Description, After: after.Description}
	}
	if before.Category != after.Category {
		patch.Category = &StringChange{Before: before.Category, After: after.Category}
	}

	// Properties changed
	allKeys := make(map[string]bool)
	for k := range before.Properties {
		allKeys[k] = true
	}
	for k := range after.Properties {
		allKeys[k] = true
	}

	propsChanged := make(map[string]ValueChange)
	for k := range allKeys {
		bVal := before.Properties[k]
		aVal := after.Properties[k]

		bJSON, _ := json.Marshal(bVal)
		aJSON, _ := json.Marshal(aVal)
		if string(bJSON) != string(aJSON) {
			propsChanged[k] = ValueChange{Before: bVal, After: aVal}
		}
	}

	if len(propsChanged) > 0 {
		patch.PropertiesChanged = propsChanged
	}

	// Formulas changed
	allFormulaKeys := make(map[string]bool)
	for k := range before.ComputedFormulas {
		allFormulaKeys[k] = true
	}
	for k := range after.ComputedFormulas {
		allFormulaKeys[k] = true
	}

	formulasChanged := make(map[string]FloatChange)
	for k := range allFormulaKeys {
		bVal := before.ComputedFormulas[k]
		aVal := after.ComputedFormulas[k]
		if bVal != aVal {
			formulasChanged[k] = FloatChange{Before: bVal, After: aVal}
		}
	}
	if len(formulasChanged) > 0 {
		patch.FormulasChanged = formulasChanged
	}

	return patch
}

// ResolveBitemporalCoordinate folds state at (T_narrative, T_revision).
func ResolveBitemporalCoordinate(
	baseRev *EntityRevision,
	targetSeq int,
	events []TimelineEvent,
) BitemporalEntityState {
	if baseRev == nil {
		return BitemporalEntityState{
			Properties:      make(map[string]interface{}),
			ActiveMutations: []ActiveMutation{},
		}
	}

	// Clone base properties
	props := make(map[string]interface{})
	for k, v := range baseRev.Snapshot.Properties {
		props[k] = v
	}

	// Sort events by sequence number
	sorted := make([]TimelineEvent, len(events))
	copy(sorted, events)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].NarrativeSequenceNumber < sorted[j].NarrativeSequenceNumber
	})

	var activeMutations []ActiveMutation
	appliedCount := 0

	for _, ev := range sorted {
		if targetSeq >= 0 && ev.NarrativeSequenceNumber > targetSeq {
			break
		}
		for _, eff := range ev.Effects {
			if eff.TargetEntity == baseRev.EntityID {
				updated, err := ApplyEffect(props, eff)
				if err == nil {
					props = updated
					activeMutations = append(activeMutations, ActiveMutation{
						EventID:        ev.ID,
						EventTitle:     ev.Title,
						SequenceNumber: ev.NarrativeSequenceNumber,
						PropertyKey:    eff.PropertyKey,
						Operation:      string(eff.Operation),
						Value:          eff.Value,
					})
					appliedCount++
				}
			}
		}
	}

	if activeMutations == nil {
		activeMutations = []ActiveMutation{}
	}

	return BitemporalEntityState{
		EntityID:                baseRev.EntityID,
		EntityName:              baseRev.Snapshot.Name,
		Category:                baseRev.Snapshot.Category,
		NarrativeSequenceNumber: targetSeq,
		RevisionID:              baseRev.ID,
		RevisionNumber:          baseRev.RevisionNumber,
		RevisionType:            baseRev.Type,
		Properties:              props,
		ComputedFormulas:        baseRev.Snapshot.ComputedFormulas,
		AppliedEventsCount:      appliedCount,
		ActiveMutations:         activeMutations,
	}
}

// CloneEntityItem performs a deep copy of an EntityItem.
func CloneEntityItem(item EntityItem) EntityItem {
	data, _ := json.Marshal(item)
	var clone EntityItem
	_ = json.Unmarshal(data, &clone)
	return clone
}

// GenerateRevisionID generates a unique revision ID.
func GenerateRevisionID() string {
	return fmt.Sprintf("rev-%x-%d", time.Now().UnixNano(), time.Now().Unix()%1000)
}
