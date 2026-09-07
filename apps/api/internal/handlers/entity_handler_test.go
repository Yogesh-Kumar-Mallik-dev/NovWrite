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

func setupEntityRouter(eHandler *EntityHandler) http.Handler {
	r := chi.NewRouter()
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.ResponseTimeMiddleware)
	r.Use(httputil.APIVersionMiddleware("v1"))

	r.Route("/api/v1/projects/{projectId}/entities", func(r chi.Router) {
		r.Get("/", eHandler.List)
		r.Post("/", eHandler.Create)
		r.Get("/{entityId}", eHandler.Get)
		r.Put("/{entityId}", eHandler.Update)
		r.Delete("/{entityId}", eHandler.Delete)

		// Bitemporal Revisions
		r.Get("/{entityId}/revisions", eHandler.ListRevisions)
		r.Post("/{entityId}/revisions", eHandler.CreateRevision)
		r.Post("/{entityId}/revisions/{revisionId}/revert", eHandler.RevertRevision)
		r.Get("/{entityId}/coordinate", eHandler.ResolveCoordinate)
	})
	return r
}

func TestEntityHandler_CRUD_And_Formulas(t *testing.T) {
	bpStore := NewInMemoryBlueprintStore()
	entStore := NewInMemoryEntityStore()
	tlStore := NewInMemoryTimelineStore()

	// Seed blueprint with formula
	bp := bpStore.Save("p-1", world.BlueprintDef{
		ID:             "bp-warrior",
		Name:           "Warrior",
		BlueprintClass: world.ClassFirstClass,
		Category:       "Character",
		Fields: []world.DynamicFieldDef{
			{ID: "f-1", Name: "base_attack", Label: "Base Attack", FieldType: world.TypeNumber},
			{ID: "f-2", Name: "multiplier", Label: "Multiplier", FieldType: world.TypeNumber},
			{ID: "f-3", Name: "total_dps", Label: "Total DPS", FieldType: world.TypeFormula, FormulaExpression: "base_attack * multiplier + 10"},
		},
	})

	handler := NewEntityHandler(entStore, bpStore, tlStore)
	router := setupEntityRouter(handler)

	// 1. Create entity with uppercase properties (should normalize to lowercase and compute formula)
	createReq := world.EntityItem{
		Name:        "Sir Arthur",
		BlueprintID: bp.ID,
		Properties: map[string]interface{}{
			"Base_Attack": float64(100),
			"MULTIPLIER":  float64(3),
		},
	}
	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/entities", bytes.NewReader(body))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected HTTP 201 Created, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var resp httputil.SingleResponse
	json.Unmarshal(rec.Body.Bytes(), &resp)
	dataMap, _ := resp.Data.(map[string]interface{})
	entID, _ := dataMap["id"].(string)

	props, _ := dataMap["properties"].(map[string]interface{})
	if props["base_attack"] != float64(100) {
		t.Fatalf("expected normalized property base_attack 100, got %v", props["base_attack"])
	}

	formulas, _ := dataMap["computedFormulas"].(map[string]interface{})
	if formulas["total_dps"] != float64(310) {
		t.Fatalf("expected backend computed formula total_dps = 310, got %v", formulas["total_dps"])
	}

	// 2. Verify automatic initial revision recording
	reqRevs := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/entities/"+entID+"/revisions", nil)
	recRevs := httptest.NewRecorder()
	router.ServeHTTP(recRevs, reqRevs)

	if recRevs.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 for revisions, got %d", recRevs.Code)
	}

	var revsResp httputil.PaginatedResponse
	json.Unmarshal(recRevs.Body.Bytes(), &revsResp)
	if revsResp.Pagination.TotalCount != 1 {
		t.Fatalf("expected 1 revision recorded on create, got %d", revsResp.Pagination.TotalCount)
	}

	// 3. Create a TYPO_FIX revision
	typoFixReq := struct {
		Type       world.RevisionType `json:"type"`
		AuthorNote string             `json:"authorNote"`
		Entity     world.EntityItem   `json:"entity"`
	}{
		Type:       world.RevTypeTypoFix,
		AuthorNote: "Fixed title casing in Arthur's name",
		Entity: world.EntityItem{
			Name:        "King Arthur of Camelot",
			BlueprintID: bp.ID,
			Properties: map[string]interface{}{
				"base_attack": float64(120),
				"multiplier":  float64(3),
			},
		},
	}
	typoBody, _ := json.Marshal(typoFixReq)
	reqTypo := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/entities/"+entID+"/revisions", bytes.NewReader(typoBody))
	recTypo := httptest.NewRecorder()
	router.ServeHTTP(recTypo, reqTypo)

	if recTypo.Code != http.StatusCreated {
		t.Fatalf("expected HTTP 201 for revision creation, got %d. Body: %s", recTypo.Code, recTypo.Body.String())
	}

	// 4. Seed timeline events and test bitemporal coordinate resolution
	tlStore.AddEvent("p-1", world.TimelineEvent{
		ID:                      "ev-100",
		NarrativeSequenceNumber: 100,
		ChronologicalOrder:      100,
		Title:                   "Chapter 10: Excalibur Awakening",
		Effects: []world.EventEffect{
			{TargetEntity: entID, PropertyKey: "base_attack", Operation: world.OpIncrement, Value: float64(50)},
		},
	})

	// Coordinate at Seq 50 (before event: attack is 120)
	reqCoord50 := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/entities/"+entID+"/coordinate?sequenceNumber=50", nil)
	recCoord50 := httptest.NewRecorder()
	router.ServeHTTP(recCoord50, reqCoord50)

	var coord50Resp httputil.SingleResponse
	json.Unmarshal(recCoord50.Body.Bytes(), &coord50Resp)
	coord50Data, _ := coord50Resp.Data.(map[string]interface{})
	coord50Props, _ := coord50Data["properties"].(map[string]interface{})
	if coord50Props["base_attack"] != float64(120) {
		t.Fatalf("expected base_attack 120 at seq 50, got %v", coord50Props["base_attack"])
	}

	// Coordinate at Seq 150 (after event: attack 120 + 50 = 170)
	reqCoord150 := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/entities/"+entID+"/coordinate?sequenceNumber=150", nil)
	recCoord150 := httptest.NewRecorder()
	router.ServeHTTP(recCoord150, reqCoord150)

	var coord150Resp httputil.SingleResponse
	json.Unmarshal(recCoord150.Body.Bytes(), &coord150Resp)
	coord150Data, _ := coord150Resp.Data.(map[string]interface{})
	coord150Props, _ := coord150Data["properties"].(map[string]interface{})
	if coord150Props["base_attack"] != float64(170) {
		t.Fatalf("expected base_attack 170 at seq 150, got %v", coord150Props["base_attack"])
	}

	// 5. Delete entity
	reqDel := httptest.NewRequest(http.MethodDelete, "/api/v1/projects/p-1/entities/"+entID, nil)
	recDel := httptest.NewRecorder()
	router.ServeHTTP(recDel, reqDel)

	if recDel.Code != http.StatusNoContent {
		t.Fatalf("expected HTTP 204 No Content, got %d", recDel.Code)
	}
}
