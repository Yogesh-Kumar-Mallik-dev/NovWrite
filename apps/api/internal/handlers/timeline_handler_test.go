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
	projectStore := NewInMemoryProjectStore()
	projectStore.Save(Project{ID: "p-1", Name: "Project One"})

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

	handler := NewTimelineHandler(tStore, eStore, projectStore)
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

func TestTimelineHandler_PipeAndEditTreeEndpoints(t *testing.T) {
	tStore := NewInMemoryTimelineStore()
	eStore := NewInMemoryEntityStore()
	projectStore := NewInMemoryProjectStore()
	projectStore.Save(Project{ID: "p-1", Name: "Project One"})
	handler := NewTimelineHandler(tStore, eStore, projectStore)

	r := chi.NewRouter()
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.APIVersionMiddleware("v1"))

	r.Route("/api/v1/projects/{projectId}/timeline", func(r chi.Router) {
		r.Get("/pipe", handler.GetPipe)
		r.Get("/events", handler.ListEvents)
		r.Post("/events", handler.CreateEvent)
		r.Get("/events/{eventId}", handler.GetEvent)
		r.Get("/events/{eventId}/tree", handler.GetEventTree)
		r.Post("/events/{eventId}/edits", handler.AddEventEdit)
		r.Post("/events/{eventId}/edits/{editId}/checkout", handler.CheckoutEventEdit)
	})

	// 1. Create event
	evPayload := world.TimelineEvent{
		ID:                      "ev-100",
		NarrativeSequenceNumber: 100,
		ChronologicalOrder:      100,
		Title:                   "Original Event Draft",
		Effects: []world.EventEffect{
			{TargetEntity: "ent-1", PropertyKey: "attack", Operation: world.OpIncrement, Value: float64(10)},
		},
	}
	body, _ := json.Marshal(evPayload)
	reqCreate := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/timeline/events", bytes.NewReader(body))
	recCreate := httptest.NewRecorder()
	r.ServeHTTP(recCreate, reqCreate)
	if recCreate.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", recCreate.Code, recCreate.Body.String())
	}

	// 2. Query UPDATE Pipe
	reqPipe := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/timeline/pipe", nil)
	recPipe := httptest.NewRecorder()
	r.ServeHTTP(recPipe, reqPipe)
	if recPipe.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for pipe, got %d", recPipe.Code)
	}

	var pipeResp httputil.SingleResponse
	json.Unmarshal(recPipe.Body.Bytes(), &pipeResp)
	pipeData := pipeResp.Data.(map[string]interface{})
	if pipeData["eventsCount"].(float64) != 1 {
		t.Fatalf("expected 1 event in pipe, got %v", pipeData["eventsCount"])
	}

	// 3. Add an Edit to the Event (ED1)
	editReq := map[string]interface{}{
		"label":      "Edit #1 (ED1)",
		"authorNote": "Corrected event narrative typo",
		"type":       "TYPO_FIX",
		"snapshot": world.TimelineEvent{
			ID:                      "ev-100",
			NarrativeSequenceNumber: 100,
			ChronologicalOrder:      100,
			Title:                   "Corrected Event Title (ED1)",
			Effects:                 evPayload.Effects,
		},
	}
	editBody, _ := json.Marshal(editReq)
	reqEdit := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/timeline/events/ev-100/edits", bytes.NewReader(editBody))
	recEdit := httptest.NewRecorder()
	r.ServeHTTP(recEdit, reqEdit)
	if recEdit.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created for edit, got %d: %s", recEdit.Code, recEdit.Body.String())
	}

	var editResp httputil.SingleResponse
	json.Unmarshal(recEdit.Body.Bytes(), &editResp)
	editData := editResp.Data.(map[string]interface{})
	nodeData := editData["node"].(map[string]interface{})
	ed1ID := nodeData["id"].(string)

	// Tree should have 2 nodes (ED0, ED1) with activeEditId = ED1
	treeData := editData["editTree"].(map[string]interface{})
	if treeData["activeEditId"] != ed1ID {
		t.Fatalf("expected activeEditId to be %s, got %v", ed1ID, treeData["activeEditId"])
	}

	// 4. Get Event Tree
	reqTree := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/timeline/events/ev-100/tree", nil)
	recTree := httptest.NewRecorder()
	r.ServeHTTP(recTree, reqTree)
	if recTree.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for tree, got %d", recTree.Code)
	}

	// 5. Checkout ED0 non-destructively
	rootID := treeData["rootId"].(string)
	reqCheckout := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/timeline/events/ev-100/edits/"+rootID+"/checkout", nil)
	recCheckout := httptest.NewRecorder()
	r.ServeHTTP(recCheckout, reqCheckout)
	if recCheckout.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for checkout, got %d: %s", recCheckout.Code, recCheckout.Body.String())
	}

	var checkoutResp httputil.SingleResponse
	json.Unmarshal(recCheckout.Body.Bytes(), &checkoutResp)
	checkoutData := checkoutResp.Data.(map[string]interface{})
	if checkoutData["activeEditId"] != rootID {
		t.Fatalf("expected checked out head to be %s, got %v", rootID, checkoutData["activeEditId"])
	}

	// Verify ED1 was NOT deleted
	afterTree := checkoutData["editTree"].(map[string]interface{})
	nodesMap := afterTree["nodes"].(map[string]interface{})
	if len(nodesMap) != 2 {
		t.Fatalf("ED1 was deleted! Expected 2 nodes, got %d", len(nodesMap))
	}
}

// TestTimelineHandler_ProjectIsolation_And_Security verifies timeline project isolation & authorization.
func TestTimelineHandler_ProjectIsolation_And_Security(t *testing.T) {
	tStore := NewInMemoryTimelineStore()
	eStore := NewInMemoryEntityStore()
	projectStore := NewInMemoryProjectStore()

	projectStore.Save(Project{ID: "proj-1", OwnerID: "user-1", Name: "Project 1"})
	projectStore.Save(Project{ID: "proj-2", OwnerID: "user-2", Name: "Project 2"})

	tStore.AddEvent("proj-1", world.TimelineEvent{
		ID:                      "ev-battle",
		ProjectID:               "proj-1",
		NarrativeSequenceNumber: 1,
		Title:                   "Battle of Winter",
	})

	handler := NewTimelineHandler(tStore, eStore, projectStore)
	r := chi.NewRouter()
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.APIVersionMiddleware("v1"))

	r.Route("/api/v1/projects/{projectId}/timeline", func(r chi.Router) {
		r.Get("/events", handler.ListEvents)
		r.Get("/events/{eventId}", handler.GetEvent)
	})

	// Non-existent project returns 404
	reqMissing := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-none/timeline/events", nil)
	recMissing := httptest.NewRecorder()
	r.ServeHTTP(recMissing, reqMissing)
	if recMissing.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for non-existent project, got %d", recMissing.Code)
	}

	// Project isolation: proj-2 has 0 events
	reqList2 := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-2/timeline/events", nil)
	recList2 := httptest.NewRecorder()
	r.ServeHTTP(recList2, reqList2)
	if recList2.Code != http.StatusOK {
		t.Fatalf("expected 200 for proj-2, got %d", recList2.Code)
	}
	var resp2 httputil.PaginatedResponse
	json.Unmarshal(recList2.Body.Bytes(), &resp2)
	if resp2.Pagination.TotalCount != 0 {
		t.Fatalf("expected 0 events in proj-2, got %d", resp2.Pagination.TotalCount)
	}

	// Forbidden user check
	reqForbidden := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-1/timeline/events", nil)
	reqForbidden.Header.Set("X-User-ID", "user-2")
	recForbidden := httptest.NewRecorder()
	r.ServeHTTP(recForbidden, reqForbidden)
	if recForbidden.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden, got %d", recForbidden.Code)
	}
}

