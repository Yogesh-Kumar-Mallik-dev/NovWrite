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
