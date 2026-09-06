package world

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"
)

// EffectOperation represents atomic state mutations.
type EffectOperation string

const (
	OpSet       EffectOperation = "SET"
	OpIncrement EffectOperation = "INCREMENT"
	OpDecrement EffectOperation = "DECREMENT"
	OpAppend    EffectOperation = "APPEND"
	OpRemove    EffectOperation = "REMOVE"
	OpTransfer  EffectOperation = "TRANSFER"
)

// EventEffect represents a single property mutation on a target entity.
type EventEffect struct {
	ID           string          `json:"id,omitempty"`
	EventID      string          `json:"eventId,omitempty"`
	TargetEntity string          `json:"targetEntity"`
	PropertyKey  string          `json:"propertyKey"`
	Operation    EffectOperation `json:"operation"`
	Value        interface{}     `json:"value"`
	CreatedAt    time.Time       `json:"createdAt,omitempty"`
}

// TimelineEvent represents an atomic event node in the causal timeline.
type TimelineEvent struct {
	ID                      string        `json:"id"`
	ProjectID               string        `json:"projectId"`
	NarrativeSequenceNumber int           `json:"narrativeSequenceNumber"`
	ChronologicalOrder      int           `json:"chronologicalOrder"`
	Title                   string        `json:"title"`
	Description             *string       `json:"description,omitempty"`
	AnchorSceneID           *string       `json:"anchorSceneId,omitempty"`
	CreatedAt               time.Time     `json:"createdAt"`
	Effects                 []EventEffect `json:"effects"`
}

// ValidateTimelineEvent ensures event invariants are upheld.
func ValidateTimelineEvent(event TimelineEvent) error {
	if strings.TrimSpace(event.ProjectID) == "" {
		return errors.New("BLOCK_WORLD_TIMELINE_ENGINE_001: Project ID is required")
	}
	if strings.TrimSpace(event.Title) == "" {
		return errors.New("BLOCK_WORLD_TIMELINE_ENGINE_001: Event title cannot be empty")
	}
	if event.NarrativeSequenceNumber < 0 {
		return errors.New("BLOCK_WORLD_TIMELINE_ENGINE_001: narrativeSequenceNumber must be a non-negative integer")
	}

	for _, eff := range event.Effects {
		if strings.TrimSpace(eff.TargetEntity) == "" {
			return errors.New("BLOCK_WORLD_TIMELINE_ENGINE_001: Effect targetEntity UUID is required")
		}
		if strings.TrimSpace(eff.PropertyKey) == "" {
			return errors.New("BLOCK_WORLD_TIMELINE_ENGINE_001: Effect propertyKey is required")
		}
		switch eff.Operation {
		case OpSet, OpIncrement, OpDecrement, OpAppend, OpRemove, OpTransfer:
			// valid
		default:
			return fmt.Errorf("BLOCK_WORLD_TIMELINE_ENGINE_001: invalid effect operation '%s'", eff.Operation)
		}
	}
	return nil
}

// ApplyEffect mutates an entity's property state according to the given effect.
func ApplyEffect(state map[string]interface{}, effect EventEffect) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	for k, v := range state {
		result[k] = v
	}

	switch effect.Operation {
	case OpSet:
		result[effect.PropertyKey] = effect.Value

	case OpIncrement:
		curNum := toFloat64(result[effect.PropertyKey])
		incNum, ok := tryToFloat64(effect.Value)
		if !ok {
			return nil, fmt.Errorf("BLOCK_WORLD_TIMELINE_ENGINE_001: INCREMENT requires numeric value, got %v", effect.Value)
		}
		result[effect.PropertyKey] = curNum + incNum

	case OpDecrement:
		curNum := toFloat64(result[effect.PropertyKey])
		decNum, ok := tryToFloat64(effect.Value)
		if !ok {
			return nil, fmt.Errorf("BLOCK_WORLD_TIMELINE_ENGINE_001: DECREMENT requires numeric value, got %v", effect.Value)
		}
		result[effect.PropertyKey] = curNum - decNum

	case OpAppend:
		existing, ok := result[effect.PropertyKey].([]interface{})
		if !ok {
			if result[effect.PropertyKey] != nil {
				existing = []interface{}{result[effect.PropertyKey]}
			} else {
				existing = []interface{}{}
			}
		}
		if valList, okList := effect.Value.([]interface{}); okList {
			result[effect.PropertyKey] = append(existing, valList...)
		} else {
			result[effect.PropertyKey] = append(existing, effect.Value)
		}

	case OpRemove:
		existing, ok := result[effect.PropertyKey].([]interface{})
		if !ok {
			break
		}
		toRemove := []interface{}{}
		if valList, okList := effect.Value.([]interface{}); okList {
			toRemove = valList
		} else {
			toRemove = []interface{}{effect.Value}
		}

		filtered := make([]interface{}, 0, len(existing))
		for _, item := range existing {
			matched := false
			for _, rem := range toRemove {
				if fmt.Sprintf("%v", item) == fmt.Sprintf("%v", rem) {
					matched = true
					break
				}
			}
			if !matched {
				filtered = append(filtered, item)
			}
		}
		result[effect.PropertyKey] = filtered

	case OpTransfer:
		curNum := toFloat64(result[effect.PropertyKey])
		transferMap, ok := effect.Value.(map[string]interface{})
		if ok {
			if amt, okAmt := tryToFloat64(transferMap["amount"]); okAmt {
				result[effect.PropertyKey] = curNum - amt
			}
		} else if num, okNum := tryToFloat64(effect.Value); okNum {
			result[effect.PropertyKey] = curNum - num
		}

	default:
		return nil, fmt.Errorf("BLOCK_WORLD_TIMELINE_ENGINE_001: unsupported operation '%s'", effect.Operation)
	}

	return result, nil
}

// SortEventsByNarrative sorts timeline events by their manuscript reading sequence.
func SortEventsByNarrative(events []TimelineEvent, desc bool) []TimelineEvent {
	sorted := make([]TimelineEvent, len(events))
	copy(sorted, events)
	sort.Slice(sorted, func(i, j int) bool {
		if desc {
			return sorted[i].NarrativeSequenceNumber > sorted[j].NarrativeSequenceNumber
		}
		return sorted[i].NarrativeSequenceNumber < sorted[j].NarrativeSequenceNumber
	})
	return sorted
}

// SortEventsByChronological sorts timeline events by world-universe chronological order.
func SortEventsByChronological(events []TimelineEvent, desc bool) []TimelineEvent {
	sorted := make([]TimelineEvent, len(events))
	copy(sorted, events)
	sort.Slice(sorted, func(i, j int) bool {
		if desc {
			return sorted[i].ChronologicalOrder > sorted[j].ChronologicalOrder
		}
		return sorted[i].ChronologicalOrder < sorted[j].ChronologicalOrder
	})
	return sorted
}

// FilterEventsUpToNarrativeSeq filters events up to the given narrative sequence number.
func FilterEventsUpToNarrativeSeq(events []TimelineEvent, maxSeq int) []TimelineEvent {
	filtered := []TimelineEvent{}
	for _, e := range events {
		if e.NarrativeSequenceNumber <= maxSeq {
			filtered = append(filtered, e)
		}
	}
	return filtered
}

// FilterEventsForEntity filters events that contain effects mutating the given entity.
func FilterEventsForEntity(events []TimelineEvent, entityID string) []TimelineEvent {
	filtered := []TimelineEvent{}
	for _, e := range events {
		hasTarget := false
		for _, eff := range e.Effects {
			if eff.TargetEntity == entityID {
				hasTarget = true
				break
			}
		}
		if hasTarget {
			filtered = append(filtered, e)
		}
	}
	return filtered
}

func tryToFloat64(v interface{}) (float64, bool) {
	if v == nil {
		return 0, false
	}
	switch n := v.(type) {
	case int:
		return float64(n), true
	case int32:
		return float64(n), true
	case int64:
		return float64(n), true
	case float32:
		return float64(n), true
	case float64:
		return n, true
	default:
		return 0, false
	}
}

func toFloat64(v interface{}) float64 {
	val, ok := tryToFloat64(v)
	if !ok {
		return 0
	}
	return val
}
