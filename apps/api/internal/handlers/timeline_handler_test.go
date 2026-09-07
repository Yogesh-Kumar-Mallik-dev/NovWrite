package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
	"github.com/go-chi/chi/v5"
)

func TestTimelineHandler_EventsAndStateFold(t *testing.T) {
	tStore := NewInMemoryTimelineStore()
	eStore := NewInMemoryEntityStore()

	// Seed entity
	eStore.Save("p-1", world.EntityItem{
		ID:       "ent-eldrin",
		Name:     "Eldrin",
		Category: "Character",
		Properties: map[string]interface{}{
			"mana":   float64(100),
			"status": "ALIVE",
		},
	})

	handler := NewTimelineHandler(tStore, eStore)
	r := chi.NewRouter()
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.APIVersionMiddleware("v1"))

	r.Route("/api/v1/projects/{projectId}/timeline", func(r chi.Router) {
		r.Get("/events", handler.ListEvents)
		r.Post("/events", handler.CreateEvent)
		r.Get("/state", handler.GetState)
	})

	// 1. Create event with effects
	evPayload := world.TimelineEvent{
		NarrativeSequenceNumber: 50,
		ChronologicalOrder:      100,
		Title:                   "Mana Surge",
		Effects: []world.EventEffect{
			{TargetEntity: "ent-eldrin", PropertyKey: "mana", Operation: world.OpIncrement, Value: float64(400)},
		},
	}
	body, _ := json.Marshal(evPayload)
	reqCreate := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/timeline/events", bytes.NewReader(body))
	recCreate := httptest.NewRecorder()
	r.ServeHTTP(recCreate, reqCreate)

	if recCreate.Code != http.StatusCreated {
		t.Fatalf("expected HTTP 201 Created, got %d", recCreate.Code)
	}

	// 2. Fold state at sequence 60
	reqState := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/timeline/state?seq=60", nil)
	recState := httptest.NewRecorder()
	r.ServeHTTP(recState, reqState)

	if recState.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", recState.Code)
	}

	var stateResp httputil.SingleResponse
	json.Unmarshal(recState.Body.Bytes(), &stateResp)
	stateData, _ := stateResp.Data.(map[string]interface{})
	entitiesList, _ := stateData["entities"].([]interface{})
	if len(entitiesList) != 1 {
		t.Fatalf("expected 1 folded entity, got %d", len(entitiesList))
	}
	ent0, _ := entitiesList[0].(map[string]interface{})
	props, _ := ent0["computedProperties"].(map[string]interface{})
	if props["mana"] != float64(500) {
		t.Fatalf("expected folded mana 500, got %v", props["mana"])
	}
}
