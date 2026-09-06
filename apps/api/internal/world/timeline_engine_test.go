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
