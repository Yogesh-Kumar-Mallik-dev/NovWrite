package world

import (
	"testing"
)

func TestRevisionEngine_ComputePatchAndRevisions(t *testing.T) {
	eldrin := EntityItem{
		ID:          "ent-eldrin",
		Name:        "Eldrin",
		BlueprintID: "bp-character",
		Category:    "Character",
		Description: "Swordsman",
		Properties: map[string]interface{}{
			"strength": float64(10),
			"eyes":     "Green",
		},
		ComputedFormulas: map[string]float64{
			"combat_power": 20,
		},
	}

	// 1. Initial patch
	patch0 := ComputeEntityPatch(nil, eldrin)
	if patch0.Name == nil || patch0.Name.After != "Eldrin" {
		t.Fatalf("expected initial patch name Eldrin, got %v", patch0.Name)
	}

	// 2. Updated entity (Typo fix & attribute edit)
	updated := CloneEntityItem(eldrin)
	updated.Description = "Master Swordsman"
	updated.Properties["strength"] = float64(15)
	updated.ComputedFormulas["combat_power"] = 30

	patch1 := ComputeEntityPatch(&eldrin, updated)
	if patch1.Description == nil || patch1.Description.Before != "Swordsman" || patch1.Description.After != "Master Swordsman" {
		t.Fatalf("expected description patch, got %v", patch1.Description)
	}
	if change, ok := patch1.PropertiesChanged["strength"]; !ok || change.Before != float64(10) || change.After != float64(15) {
		t.Fatalf("expected strength property change, got %v", change)
	}
	if fChange, ok := patch1.FormulasChanged["combat_power"]; !ok || fChange.Before != 20 || fChange.After != 30 {
		t.Fatalf("expected combat power formula change, got %v", fChange)
	}
}

func TestRevisionEngine_ResolveBitemporalCoordinate(t *testing.T) {
	eldrin := EntityItem{
		ID:          "ent-eldrin",
		Name:        "Eldrin",
		BlueprintID: "bp-character",
		Category:    "Character",
		Properties: map[string]interface{}{
			"strength": float64(10),
			"status":   "ALIVE",
		},
	}

	rev := &EntityRevision{
		ID:             "rev-1",
		EntityID:       eldrin.ID,
		RevisionNumber: 0,
		Type:           RevTypeBaselineEdit,
		Snapshot:       eldrin,
	}

	events := []TimelineEvent{
		{
			ID:                      "ev-10",
			NarrativeSequenceNumber: 10,
			ChronologicalOrder:      10,
			Title:                   "Chapter 1: Trial",
			Effects: []EventEffect{
				{TargetEntity: eldrin.ID, PropertyKey: "strength", Operation: OpIncrement, Value: float64(5)},
			},
		},
		{
			ID:                      "ev-20",
			NarrativeSequenceNumber: 20,
			ChronologicalOrder:      20,
			Title:                   "Chapter 2: Poisoning",
			Effects: []EventEffect{
				{TargetEntity: eldrin.ID, PropertyKey: "status", Operation: OpSet, Value: "POISONED"},
			},
		},
	}

	// 1. Seq 0
	state0 := ResolveBitemporalCoordinate(rev, 0, events)
	if state0.Properties["strength"] != float64(10) {
		t.Fatalf("expected strength 10 at seq 0, got %v", state0.Properties["strength"])
	}
	if state0.AppliedEventsCount != 0 {
		t.Fatalf("expected 0 applied events, got %d", state0.AppliedEventsCount)
	}

	// 2. Seq 15 (only ev-10 applied)
	state15 := ResolveBitemporalCoordinate(rev, 15, events)
	if state15.Properties["strength"] != float64(15) {
		t.Fatalf("expected strength 15 at seq 15, got %v", state15.Properties["strength"])
	}
	if state15.Properties["status"] != "ALIVE" {
		t.Fatalf("expected status ALIVE at seq 15, got %v", state15.Properties["status"])
	}
	if state15.AppliedEventsCount != 1 {
		t.Fatalf("expected 1 applied event, got %d", state15.AppliedEventsCount)
	}

	// 3. Seq 25 (ev-10 and ev-20 applied)
	state25 := ResolveBitemporalCoordinate(rev, 25, events)
	if state25.Properties["strength"] != float64(15) {
		t.Fatalf("expected strength 15 at seq 25, got %v", state25.Properties["strength"])
	}
	if state25.Properties["status"] != "POISONED" {
		t.Fatalf("expected status POISONED at seq 25, got %v", state25.Properties["status"])
	}
	if state25.AppliedEventsCount != 2 {
		t.Fatalf("expected 2 applied events, got %d", state25.AppliedEventsCount)
	}
}

func TestRevisionEngine_EditTreeBranchingAndCheckout(t *testing.T) {
	// 1. Initialize EditTree at ED0
	initialSnapshot := map[string]interface{}{"title": "Dragon Cave Trial", "effects": 1}
	tree := NewEditTree(initialSnapshot, "Root (ED0)", "Initial draft", RevTypeBaselineEdit)

	if tree.ActiveEditID != tree.RootID {
		t.Fatalf("expected activeEditId to be rootId, got %s vs %s", tree.ActiveEditID, tree.RootID)
	}
	if len(tree.Nodes) != 1 {
		t.Fatalf("expected 1 node, got %d", len(tree.Nodes))
	}
	ed0 := tree.Nodes[tree.RootID]
	if ed0.RevisionNumber != 0 {
		t.Fatalf("expected revision number 0, got %d", ed0.RevisionNumber)
	}

	// 2. Add ED1, ED2, ED3, ED4 sequentially
	snap1 := map[string]interface{}{"title": "Dragon Cave Trial - Rev 1"}
	ed1, err := AddEditNode(&tree, snap1, "ED1", "Fixed typo", RevTypeTypoFix, nil)
	if err != nil {
		t.Fatalf("failed to add ED1: %v", err)
	}

	snap2 := map[string]interface{}{"title": "Dragon Cave Trial - Rev 2"}
	ed2, err := AddEditNode(&tree, snap2, "ED2", "Added loot reward", RevTypeBaselineEdit, nil)
	if err != nil {
		t.Fatalf("failed to add ED2: %v", err)
	}

	snap3 := map[string]interface{}{"title": "Dragon Cave Trial - Rev 3"}
	ed3, err := AddEditNode(&tree, snap3, "ED3", "Adjusted power scaling", RevTypeRetroactivePlotFix, nil)
	if err != nil {
		t.Fatalf("failed to add ED3: %v", err)
	}

	snap4 := map[string]interface{}{"title": "Dragon Cave Trial - Rev 4"}
	ed4, err := AddEditNode(&tree, snap4, "ED4", "Major plot rewrite", RevTypeBaselineEdit, nil)
	if err != nil {
		t.Fatalf("failed to add ED4: %v", err)
	}

	// Active head should now be ED4
	if tree.ActiveEditID != ed4.ID {
		t.Fatalf("expected activeEditId to be ED4 (%s), got %s", ed4.ID, tree.ActiveEditID)
	}
	if len(tree.Nodes) != 5 {
		t.Fatalf("expected 5 nodes in tree, got %d", len(tree.Nodes))
	}

	// Verify linear hierarchy: ED0 -> ED1 -> ED2 -> ED3 -> ED4
	if tree.Nodes[ed0.ID].ChildrenIDs[0] != ed1.ID {
		t.Fatalf("expected ED0 child to be ED1")
	}
	if tree.Nodes[ed1.ID].ChildrenIDs[0] != ed2.ID {
		t.Fatalf("expected ED1 child to be ED2")
	}
	if tree.Nodes[ed2.ID].ChildrenIDs[0] != ed3.ID {
		t.Fatalf("expected ED2 child to be ED3")
	}
	if tree.Nodes[ed3.ID].ChildrenIDs[0] != ed4.ID {
		t.Fatalf("expected ED3 child to be ED4")
	}

	// 3. Revert / Checkout to ED3 non-destructively
	checkedNode, err := CheckoutEditHead(&tree, ed3.ID)
	if err != nil {
		t.Fatalf("failed to checkout ED3: %v", err)
	}
	if checkedNode.ID != ed3.ID || tree.ActiveEditID != ed3.ID {
		t.Fatalf("expected active EDIT head to be ED3, got %s", tree.ActiveEditID)
	}

	// Crucial assertion: ED4 MUST NOT BE DELETED! ED4 remains a child of ED3.
	if len(tree.Nodes) != 5 {
		t.Fatalf("ED4 was deleted! Expected 5 nodes in tree, got %d", len(tree.Nodes))
	}
	if len(tree.Nodes[ed3.ID].ChildrenIDs) != 1 || tree.Nodes[ed3.ID].ChildrenIDs[0] != ed4.ID {
		t.Fatalf("ED4 branch was lost from ED3 children! Got %v", tree.Nodes[ed3.ID].ChildrenIDs)
	}

	// 4. Branch a new edit ED5 from checked-out ED3
	snap5 := map[string]interface{}{"title": "Dragon Cave Trial - Alternate Timeline ED5"}
	ed5, err := AddEditNode(&tree, snap5, "ED5", "Branched alternative route", RevTypeBaselineEdit, nil)
	if err != nil {
		t.Fatalf("failed to branch ED5: %v", err)
	}

	// Now ED3 must have TWO children: [ED4, ED5]
	ed3Node := tree.Nodes[ed3.ID]
	if len(ed3Node.ChildrenIDs) != 2 {
		t.Fatalf("expected ED3 to have 2 children ([ED4, ED5]), got %d: %v", len(ed3Node.ChildrenIDs), ed3Node.ChildrenIDs)
	}
	if ed3Node.ChildrenIDs[0] != ed4.ID || ed3Node.ChildrenIDs[1] != ed5.ID {
		t.Fatalf("expected ED3 children to be [%s, %s], got %v", ed4.ID, ed5.ID, ed3Node.ChildrenIDs)
	}

	// Active head should now be ED5
	if tree.ActiveEditID != ed5.ID {
		t.Fatalf("expected active EDIT head to be ED5, got %s", tree.ActiveEditID)
	}

	// 5. Verify active snapshot
	activeNode, found := GetActiveEditNode(&tree)
	if !found || activeNode.ID != ed5.ID {
		t.Fatalf("expected active node to be ED5")
	}
}

