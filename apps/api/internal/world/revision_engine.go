package world

import (
	"encoding/json"
	"fmt"
	"sort"
	"sync/atomic"
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

// EditNode represents an immutable node in a branching edit tree.
type EditNode struct {
	ID             string       `json:"id"`
	ParentID       *string      `json:"parentId"`
	ChildrenIDs    []string     `json:"childrenIds"`
	RevisionNumber int          `json:"revisionNumber"`
	Label          string       `json:"label,omitempty"`
	AuthorNote     string       `json:"authorNote,omitempty"`
	Type           RevisionType `json:"type"`
	CreatedAt      string       `json:"createdAt"`
	Patch          interface{}  `json:"patch,omitempty"`
	Snapshot       interface{}  `json:"snapshot"`
}

// EditTree represents a non-destructive DAG of edits hanging from a pipeline node.
type EditTree struct {
	RootID       string              `json:"rootId"`
	ActiveEditID string              `json:"activeEditId"` // Current EDIT Head
	Nodes        map[string]EditNode `json:"nodes"`
}

// TimelineEventWithTree pairs a pipeline event with its hanging edit tree.
type TimelineEventWithTree struct {
	Event    TimelineEvent `json:"event"`
	EditTree EditTree      `json:"editTree"`
}

var (
	editNodeSeq uint64
	revSeq      uint64
)

// GenerateRevisionID generates a unique revision ID guaranteed monotonic across any OS timer resolution.
func GenerateRevisionID() string {
	seq := atomic.AddUint64(&revSeq, 1)
	return fmt.Sprintf("rev-%x-%d", time.Now().UnixNano(), seq)
}

// GenerateEditID generates a unique edit node ID guaranteed monotonic across any OS timer resolution.
func GenerateEditID() string {
	seq := atomic.AddUint64(&editNodeSeq, 1)
	return fmt.Sprintf("ed-%x-%d", time.Now().UnixNano(), seq)
}

// NewEditTree creates an edit tree initialized with a root edit node (ED0).
func NewEditTree(initialSnapshot interface{}, label, note string, revType RevisionType) EditTree {
	rootID := GenerateEditID()
	if revType == "" {
		revType = RevTypeBaselineEdit
	}
	if label == "" {
		label = "Root Edit (ED0)"
	}
	if note == "" {
		note = "Initial root edit"
	}

	rootNode := EditNode{
		ID:             rootID,
		ParentID:       nil,
		ChildrenIDs:    []string{},
		RevisionNumber: 0,
		Label:          label,
		AuthorNote:     note,
		Type:           revType,
		CreatedAt:      time.Now().UTC().Format(time.RFC3339Nano),
		Snapshot:       initialSnapshot,
	}

	nodes := make(map[string]EditNode)
	nodes[rootID] = rootNode

	return EditTree{
		RootID:       rootID,
		ActiveEditID: rootID,
		Nodes:        nodes,
	}
}

// AddEditNode adds a new edit node branching from targetParentID (or active EDIT head if nil).
// Advances the active EDIT head to this new node.
func AddEditNode(tree *EditTree, snapshot interface{}, label, note string, revType RevisionType, targetParentID *string) (EditNode, error) {
	if tree.Nodes == nil {
		tree.Nodes = make(map[string]EditNode)
	}

	parentID := tree.ActiveEditID
	if targetParentID != nil && *targetParentID != "" {
		parentID = *targetParentID
	}

	parentNode, exists := tree.Nodes[parentID]
	if !exists {
		return EditNode{}, fmt.Errorf("parent edit node '%s' not found in tree", parentID)
	}

	newID := GenerateEditID()
	revNum := len(tree.Nodes)
	if label == "" {
		label = fmt.Sprintf("Edit #%d (ED%d)", revNum, revNum)
	}
	if revType == "" {
		revType = RevTypeBaselineEdit
	}

	newNode := EditNode{
		ID:             newID,
		ParentID:       &parentID,
		ChildrenIDs:    []string{},
		RevisionNumber: revNum,
		Label:          label,
		AuthorNote:     note,
		Type:           revType,
		CreatedAt:      time.Now().UTC().Format(time.RFC3339Nano),
		Snapshot:       snapshot,
	}

	// Append child to parent node
	parentNode.ChildrenIDs = append(parentNode.ChildrenIDs, newID)
	tree.Nodes[parentID] = parentNode

	// Insert new node and advance EDIT head
	tree.Nodes[newID] = newNode
	tree.ActiveEditID = newID

	return newNode, nil
}

// CheckoutEditHead switches the active EDIT head to targetEditID without deleting any children branches.
func CheckoutEditHead(tree *EditTree, targetEditID string) (*EditNode, error) {
	if tree.Nodes == nil {
		return nil, fmt.Errorf("edit tree has no nodes")
	}
	node, exists := tree.Nodes[targetEditID]
	if !exists {
		return nil, fmt.Errorf("edit node '%s' not found in tree", targetEditID)
	}

	tree.ActiveEditID = targetEditID
	return &node, nil
}

// GetActiveEditNode returns the active EDIT head node and its snapshot.
func GetActiveEditNode(tree *EditTree) (*EditNode, bool) {
	if tree.Nodes == nil {
		return nil, false
	}
	node, exists := tree.Nodes[tree.ActiveEditID]
	if !exists {
		return nil, false
	}
	return &node, true
}

// CompactMicroRevisions compacts linear chains of consecutive TYPO_FIX edits to avoid tree state explosion.
// Block Standard: BLOCK_WORLD_REVISION_COMPACT_001
func CompactMicroRevisions(tree *EditTree) int {
	if tree == nil || len(tree.Nodes) <= 2 {
		return 0
	}

	compactedCount := 0
	// Find linear paths where parent has exactly 1 child, child is TYPO_FIX, and child is not the active head
	for id, node := range tree.Nodes {
		if len(node.ChildrenIDs) == 1 && node.ParentID != nil && node.Type == RevTypeTypoFix && id != tree.ActiveEditID && id != tree.RootID {
			parentID := *node.ParentID
			childID := node.ChildrenIDs[0]
			parentNode, pExists := tree.Nodes[parentID]
			childNode, cExists := tree.Nodes[childID]

			if pExists && cExists {
				// Re-link parent to child directly
				var newParentChildren []string
				for _, cid := range parentNode.ChildrenIDs {
					if cid == id {
						newParentChildren = append(newParentChildren, childID)
					} else {
						newParentChildren = append(newParentChildren, cid)
					}
				}
				parentNode.ChildrenIDs = newParentChildren
				childNode.ParentID = &parentID

				tree.Nodes[parentID] = parentNode
				tree.Nodes[childID] = childNode
				delete(tree.Nodes, id)
				compactedCount++
			}
		}
	}

	return compactedCount
}

