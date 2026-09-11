package world

import (
	"testing"
)

func TestTimelineEngine_ApplyEffect_SetIncrementDecrement(t *testing.T) {
	state := map[string]interface{}{
		"mana":   500,
		"status": "ALIVE",
	}

	// SET
	res, err := ApplyEffect(state, EventEffect{
		TargetEntity: "eldrin-1",
		PropertyKey:  "status",
		Operation:    OpSet,
		Value:        "MEDITATING",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res["status"] != "MEDITATING" {
		t.Fatalf("expected MEDITATING, got %v", res["status"])
	}

	// INCREMENT
	res, err = ApplyEffect(res, EventEffect{
		TargetEntity: "eldrin-1",
		PropertyKey:  "mana",
		Operation:    OpIncrement,
		Value:        250,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res["mana"] != float64(750) {
		t.Fatalf("expected 750, got %v", res["mana"])
	}

	// DECREMENT
	res, err = ApplyEffect(res, EventEffect{
		TargetEntity: "eldrin-1",
		PropertyKey:  "mana",
		Operation:    OpDecrement,
		Value:        300,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res["mana"] != float64(450) {
		t.Fatalf("expected 450, got %v", res["mana"])
	}
}

func TestTimelineEngine_DualIndexOrdering(t *testing.T) {
	events := []TimelineEvent{
		{
			ID:                      "ev-1",
			NarrativeSequenceNumber: 10,
			ChronologicalOrder:      100,
			Title:                   "Awakening",
		},
		{
			ID:                      "ev-2",
			NarrativeSequenceNumber: 50,
			ChronologicalOrder:      150,
			Title:                   "Duel",
		},
		{
			ID:                      "ev-3",
			NarrativeSequenceNumber: 80,
			ChronologicalOrder:      50,
			Title:                   "Flashback",
		},
	}

	// Narrative Order
	narrativeSorted := SortEventsByNarrative(events, false)
	if narrativeSorted[0].Title != "Awakening" || narrativeSorted[1].Title != "Duel" || narrativeSorted[2].Title != "Flashback" {
		t.Fatalf("expected [Awakening, Duel, Flashback], got %v, %v, %v",
			narrativeSorted[0].Title, narrativeSorted[1].Title, narrativeSorted[2].Title)
	}

	// Chronological Order (Flashback has chrono=50 so comes first)
	chronoSorted := SortEventsByChronological(events, false)
	if chronoSorted[0].Title != "Flashback" || chronoSorted[1].Title != "Awakening" || chronoSorted[2].Title != "Duel" {
		t.Fatalf("expected [Flashback, Awakening, Duel], got %v, %v, %v",
			chronoSorted[0].Title, chronoSorted[1].Title, chronoSorted[2].Title)
	}
}

func TestTimelineEngine_Filtering(t *testing.T) {
	events := []TimelineEvent{
		{
			ID:                      "ev-1",
			NarrativeSequenceNumber: 10,
			Effects: []EventEffect{
				{TargetEntity: "eldrin"},
			},
		},
		{
			ID:                      "ev-2",
			NarrativeSequenceNumber: 50,
			Effects: []EventEffect{
				{TargetEntity: "lyra"},
			},
		},
		{
			ID:                      "ev-3",
			NarrativeSequenceNumber: 100,
			Effects: []EventEffect{
				{TargetEntity: "eldrin"},
			},
		},
	}

	filtered := FilterEventsUpToNarrativeSeq(events, 50)
	if len(filtered) != 2 {
		t.Fatalf("expected 2 events up to seq 50, got %d", len(filtered))
	}

	eldrinEvents := FilterEventsForEntity(events, "eldrin")
	if len(eldrinEvents) != 2 {
		t.Fatalf("expected 2 events for eldrin, got %d", len(eldrinEvents))
	}
}

func TestTimelineEngine_ValidateTimelineEvent(t *testing.T) {
	// 1. Valid event
	validEv := TimelineEvent{
		ProjectID:               "proj-1",
		Title:                   "Battle of Eldoria",
		NarrativeSequenceNumber: 5,
		Effects: []EventEffect{
			{TargetEntity: "eldrin", PropertyKey: "status", Operation: OpSet, Value: "ACTIVE"},
		},
	}
	if err := ValidateTimelineEvent(validEv); err != nil {
		t.Fatalf("unexpected error on valid event: %v", err)
	}

	// 2. Missing ProjectID
	invalidProj := validEv
	invalidProj.ProjectID = ""
	if err := ValidateTimelineEvent(invalidProj); err == nil {
		t.Errorf("expected error on empty project ID, got nil")
	}

	// 3. Missing Title
	invalidTitle := validEv
	invalidTitle.Title = "   "
	if err := ValidateTimelineEvent(invalidTitle); err == nil {
		t.Errorf("expected error on empty title, got nil")
	}

	// 4. Negative Narrative Sequence Number
	invalidSeq := validEv
	invalidSeq.NarrativeSequenceNumber = -1
	if err := ValidateTimelineEvent(invalidSeq); err == nil {
		t.Errorf("expected error on negative sequence number, got nil")
	}

	// 5. Invalid Effect Target Entity
	invalidTarget := validEv
	invalidTarget.Effects = []EventEffect{
		{TargetEntity: "", PropertyKey: "status", Operation: OpSet},
	}
	if err := ValidateTimelineEvent(invalidTarget); err == nil {
		t.Errorf("expected error on empty target entity, got nil")
	}

	// 6. Invalid Effect Property Key
	invalidProp := validEv
	invalidProp.Effects = []EventEffect{
		{TargetEntity: "eldrin", PropertyKey: "", Operation: OpSet},
	}
	if err := ValidateTimelineEvent(invalidProp); err == nil {
		t.Errorf("expected error on empty property key, got nil")
	}

	// 7. Invalid Effect Operation
	invalidOp := validEv
	invalidOp.Effects = []EventEffect{
		{TargetEntity: "eldrin", PropertyKey: "status", Operation: "INVALID_OP"},
	}
	if err := ValidateTimelineEvent(invalidOp); err == nil {
		t.Errorf("expected error on invalid operation, got nil")
	}
}

func TestTimelineEngine_ApplyEffect_AppendRemoveTransfer_And_Errors(t *testing.T) {
	state := map[string]interface{}{
		"inventory": []interface{}{"Sword", "Shield"},
		"mana":      100.0,
	}

	// 1. APPEND single item
	res1, err := ApplyEffect(state, EventEffect{
		PropertyKey: "inventory",
		Operation:   OpAppend,
		Value:       "Potion",
	})
	if err != nil {
		t.Fatalf("unexpected error on APPEND: %v", err)
	}
	inv1 := res1["inventory"].([]interface{})
	if len(inv1) != 3 || inv1[2] != "Potion" {
		t.Fatalf("expected [Sword, Shield, Potion], got %v", inv1)
	}

	// 2. APPEND array of items
	res2, err := ApplyEffect(state, EventEffect{
		PropertyKey: "inventory",
		Operation:   OpAppend,
		Value:       []interface{}{"Ring", "Amulet"},
	})
	if err != nil {
		t.Fatalf("unexpected error on APPEND list: %v", err)
	}
	inv2 := res2["inventory"].([]interface{})
	if len(inv2) != 4 {
		t.Fatalf("expected 4 items after array APPEND, got %d", len(inv2))
	}

	// 3. REMOVE item
	res3, err := ApplyEffect(state, EventEffect{
		PropertyKey: "inventory",
		Operation:   OpRemove,
		Value:       "Sword",
	})
	if err != nil {
		t.Fatalf("unexpected error on REMOVE: %v", err)
	}
	inv3 := res3["inventory"].([]interface{})
	if len(inv3) != 1 || inv3[0] != "Shield" {
		t.Fatalf("expected [Shield] after REMOVE, got %v", inv3)
	}

	// 4. TRANSFER
	res4, err := ApplyEffect(state, EventEffect{
		PropertyKey: "owner",
		Operation:   OpTransfer,
		Value:       "lyra-2",
	})
	if err != nil {
		t.Fatalf("unexpected error on TRANSFER: %v", err)
	}
	if res4["owner"] != "lyra-2" {
		t.Fatalf("expected owner lyra-2, got %v", res4["owner"])
	}

	// 5. INCREMENT with non-numeric value error
	_, errInc := ApplyEffect(state, EventEffect{
		PropertyKey: "mana",
		Operation:   OpIncrement,
		Value:       "not-a-number",
	})
	if errInc == nil {
		t.Errorf("expected error when incrementing by non-number, got nil")
	}

	// 6. DECREMENT with non-numeric value error
	_, errDec := ApplyEffect(state, EventEffect{
		PropertyKey: "mana",
		Operation:   OpDecrement,
		Value:       map[string]string{"foo": "bar"},
	})
	if errDec == nil {
		t.Errorf("expected error when decrementing by non-number, got nil")
	}
}

func TestTimelineEngine_SortingDescending_And_TypeConversions(t *testing.T) {
	events := []TimelineEvent{
		{ID: "e1", NarrativeSequenceNumber: 10, ChronologicalOrder: 100},
		{ID: "e2", NarrativeSequenceNumber: 50, ChronologicalOrder: 50},
	}

	// Descending narrative
	descNarrative := SortEventsByNarrative(events, true)
	if descNarrative[0].ID != "e2" || descNarrative[1].ID != "e1" {
		t.Errorf("expected descending narrative [e2, e1], got %v", descNarrative)
	}

	// Descending chrono
	descChrono := SortEventsByChronological(events, true)
	if descChrono[0].ID != "e1" || descChrono[1].ID != "e2" {
		t.Errorf("expected descending chrono [e1, e2], got %v", descChrono)
	}

	// tryToFloat64 with different numeric representations
	vals := []interface{}{
		float32(12.5),
		float64(42.0),
		int(10),
		int32(20),
		int64(30),
		uint(40),
		"123.45",
	}
	for _, v := range vals {
		num, ok := tryToFloat64(v)
		if !ok || num == 0 {
			t.Errorf("expected valid float64 conversion for %T (%v), got num=%v, ok=%v", v, v, num, ok)
		}
	}

	// Non-convertible
	_, ok := tryToFloat64(struct{}{})
	if ok {
		t.Errorf("expected false for struct{} conversion, got true")
	}
}
