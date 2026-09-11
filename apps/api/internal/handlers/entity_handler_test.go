package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
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

		// Hanging Edit Tree
		r.Get("/{entityId}/tree", eHandler.GetTree)
		r.Post("/{entityId}/edits", eHandler.AddEdit)
		r.Post("/{entityId}/edits/{editId}/checkout", eHandler.CheckoutEdit)
	})
	return r
}

func TestEntityHandler_CRUD_And_Formulas(t *testing.T) {
	bpStore := NewInMemoryBlueprintStore()
	entStore := NewInMemoryEntityStore()
	tlStore := NewInMemoryTimelineStore()
	projectStore := NewInMemoryProjectStore()
	projectStore.Save(Project{ID: "p-1", Name: "Project One"})

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

	handler := NewEntityHandler(entStore, bpStore, projectStore, tlStore)
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

// Block Standard: BLOCK_TEST_ENTITY_HANDLER_REGRESSION_001
// Purpose: Regression tests for RevertRevision, Hanging Edit Tree endpoints, and error handling branches.
func TestEntityHandler_RevertAndEditTree_Regressions(t *testing.T) {
	bpStore := NewInMemoryBlueprintStore()
	entStore := NewInMemoryEntityStore()
	tlStore := NewInMemoryTimelineStore()
	projectStore := NewInMemoryProjectStore()
	projectStore.Save(Project{ID: "p-1", Name: "Project One"})

	handler := NewEntityHandler(entStore, bpStore, projectStore, tlStore)
	router := setupEntityRouter(handler)

	// Seed blueprint
	bpStore.Save("p-1", world.BlueprintDef{
		ID:             "bp-knight",
		Name:           "Knight",
		BlueprintClass: world.ClassFirstClass,
		Category:       "Knight",
		Fields: []world.DynamicFieldDef{
			{ID: "f-honor", Name: "honor", Label: "Honor", FieldType: world.TypeNumber},
		},
	})

	// Seed entity
	ent := entStore.Save("p-1", world.EntityItem{
		ID:          "ent-lancelot",
		Name:        "Lancelot",
		BlueprintID: "bp-knight",
		Category:    "Knight",
		Description: "First Knight",
		Properties: map[string]interface{}{
			"honor": float64(100),
		},
	})
	rev0 := entStore.RecordRevision("p-1", world.EntityRevision{
		ID:             "rev-0",
		EntityID:       ent.ID,
		RevisionNumber: 0,
		Type:           world.RevTypeBaselineEdit,
		AuthorNote:     "Initial Knight",
		Snapshot:       ent,
	})

	// 1. Mutate and record rev1
	entModified := ent
	entModified.Properties["honor"] = float64(20)
	entStore.Save("p-1", entModified)
	entStore.RecordRevision("p-1", world.EntityRevision{
		ID:             "rev-1",
		EntityID:       ent.ID,
		RevisionNumber: 1,
		Type:           world.RevTypeBaselineEdit,
		AuthorNote:     "Fallen Honor",
		Snapshot:       entModified,
	})

	// 2. Revert back to rev0
	revertReq := struct {
		AuthorNote string `json:"authorNote"`
	}{
		AuthorNote: "Restoring honorable state",
	}
	revertBody, _ := json.Marshal(revertReq)
	reqRevert := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/entities/"+ent.ID+"/revisions/"+rev0.ID+"/revert", bytes.NewReader(revertBody))
	recRevert := httptest.NewRecorder()
	router.ServeHTTP(recRevert, reqRevert)

	if recRevert.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_ENTITY_HANDLER_REGRESSION_001: expected HTTP 200 on revert, got %d. Body: %s", recRevert.Code, recRevert.Body.String())
	}

	// 3. Edit tree endpoints: GetTree, AddEdit, CheckoutEdit
	reqTree := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/entities/"+ent.ID+"/tree", nil)
	recTree := httptest.NewRecorder()
	router.ServeHTTP(recTree, reqTree)
	if recTree.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_ENTITY_HANDLER_REGRESSION_001: expected HTTP 200 on get tree, got %d", recTree.Code)
	}

	// Add Edit
	addEditReq := struct {
		Entity     world.EntityItem   `json:"entity"`
		Type       world.RevisionType `json:"type"`
		AuthorNote string             `json:"authorNote"`
	}{
		Entity:     ent,
		Type:       world.RevTypeTypoFix,
		AuthorNote: "Fine-tune branch",
	}
	addEditBody, _ := json.Marshal(addEditReq)
	reqAddEdit := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/entities/"+ent.ID+"/edits", bytes.NewReader(addEditBody))
	recAddEdit := httptest.NewRecorder()
	router.ServeHTTP(recAddEdit, reqAddEdit)
	if recAddEdit.Code != http.StatusCreated {
		t.Fatalf("BLOCK_TEST_ENTITY_HANDLER_REGRESSION_001: expected HTTP 201 on add edit, got %d", recAddEdit.Code)
	}

	var editResp httputil.SingleResponse
	json.Unmarshal(recAddEdit.Body.Bytes(), &editResp)
	editDataMap, _ := editResp.Data.(map[string]interface{})
	nodeMap, _ := editDataMap["node"].(map[string]interface{})
	newEditID, _ := nodeMap["id"].(string)

	// Checkout Edit
	reqCheckout := httptest.NewRequest(http.MethodPost, "/api/v1/projects/p-1/entities/"+ent.ID+"/edits/"+newEditID+"/checkout", nil)
	recCheckout := httptest.NewRecorder()
	router.ServeHTTP(recCheckout, reqCheckout)
	if recCheckout.Code != http.StatusOK {
		t.Fatalf("BLOCK_TEST_ENTITY_HANDLER_REGRESSION_001: expected HTTP 200 on checkout, got %d", recCheckout.Code)
	}

	// 4. Regression: 404 for non-existent entity
	req404 := httptest.NewRequest(http.MethodGet, "/api/v1/projects/p-1/entities/non-existent-ent", nil)
	rec404 := httptest.NewRecorder()
	router.ServeHTTP(rec404, req404)
	if rec404.Code != http.StatusNotFound {
		t.Fatalf("BLOCK_TEST_ENTITY_HANDLER_REGRESSION_001: expected HTTP 404, got %d", rec404.Code)
	}
}

// TestEntityHandler_ProjectIsolation_And_Security tests that:
// 1. Requests to non-existent projects return 404 PROJECT_NOT_FOUND.
// 2. Entities in Project A are completely invisible to Project B.
// 3. User authorization (X-User-ID) forbids access when user does not own the project.
func TestEntityHandler_ProjectIsolation_And_Security(t *testing.T) {
	bpStore := NewInMemoryBlueprintStore()
	entStore := NewInMemoryEntityStore()
	projectStore := NewInMemoryProjectStore()
	tlStore := NewInMemoryTimelineStore()

	// Seed Project A (owned by user-alpha) and Project B (owned by user-beta)
	projectStore.Save(Project{ID: "proj-a", OwnerID: "user-alpha", Name: "Project A"})
	projectStore.Save(Project{ID: "proj-b", OwnerID: "user-beta", Name: "Project B"})

	// Seed Blueprint in Project A
	bpA := bpStore.Save("proj-a", world.BlueprintDef{
		ID:             "bp-mage",
		Name:           "Mage",
		BlueprintClass: world.ClassFirstClass,
		Category:       "Magic",
	})

	// Seed Entity in Project A
	entStore.Save("proj-a", world.EntityItem{
		ID:          "ent-gandalf",
		ProjectID:   "proj-a",
		BlueprintID: bpA.ID,
		Name:        "Gandalf",
		Category:    "Magic",
	})

	handler := NewEntityHandler(entStore, bpStore, projectStore, tlStore)
	router := setupEntityRouter(handler)

	// CASE 1: Non-existent/clean Project query returns 200 OK with empty data
	reqMissingProj := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-nonexistent/entities", nil)
	recMissingProj := httptest.NewRecorder()
	router.ServeHTTP(recMissingProj, reqMissingProj)
	if recMissingProj.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 for clean project query, got %d", recMissingProj.Code)
	}
	var respMissing httputil.PaginatedResponse
	json.Unmarshal(recMissingProj.Body.Bytes(), &respMissing)
	if respMissing.Pagination.TotalCount != 0 {
		t.Fatalf("expected 0 entities for nonexistent project, got %d", respMissing.Pagination.TotalCount)
	}

	// Non-existent project POST returns 404 PROJECT_NOT_FOUND
	reqCreateMissing := httptest.NewRequest(http.MethodPost, "/api/v1/projects/proj-nonexistent/entities", strings.NewReader(`{"name":"Test","blueprintId":"`+bpA.ID+`"}`))
	recCreateMissing := httptest.NewRecorder()
	router.ServeHTTP(recCreateMissing, reqCreateMissing)
	if recCreateMissing.Code != http.StatusNotFound {
		t.Fatalf("expected HTTP 404 for entity creation in non-existent project, got %d", recCreateMissing.Code)
	}

	// CASE 2: Project A entity does NOT appear in Project B
	reqListB := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-b/entities", nil)
	recListB := httptest.NewRecorder()
	router.ServeHTTP(recListB, reqListB)
	if recListB.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 on project B list, got %d", recListB.Code)
	}
	var respB httputil.PaginatedResponse
	json.Unmarshal(recListB.Body.Bytes(), &respB)
	if respB.Pagination.TotalCount != 0 {
		t.Fatalf("expected Project B to have 0 entities, got %d (Project Isolation violation)", respB.Pagination.TotalCount)
	}

	// CASE 3: Fetching Project A entity using Project B path returns 404
	reqGetCross := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-b/entities/ent-gandalf", nil)
	recGetCross := httptest.NewRecorder()
	router.ServeHTTP(recGetCross, reqGetCross)
	if recGetCross.Code != http.StatusNotFound {
		t.Fatalf("expected 404 when accessing Project A entity via Project B, got %d", recGetCross.Code)
	}

	// CASE 4: User Authorization check - user-gamma accessing proj-a returns 403 FORBIDDEN_PROJECT_ACCESS
	reqForbidden := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-a/entities", nil)
	reqForbidden.Header.Set("X-User-ID", "user-gamma")
	recForbidden := httptest.NewRecorder()
	router.ServeHTTP(recForbidden, reqForbidden)
	if recForbidden.Code != http.StatusForbidden {
		t.Fatalf("expected HTTP 403 Forbidden for unauthorized user, got %d", recForbidden.Code)
	}
	var probForbidden httputil.ProblemDetail
	json.Unmarshal(recForbidden.Body.Bytes(), &probForbidden)
	if probForbidden.Code != "FORBIDDEN_PROJECT_ACCESS" {
		t.Fatalf("expected FORBIDDEN_PROJECT_ACCESS, got %s", probForbidden.Code)
	}

	// CASE 5: Authorized user-alpha accessing proj-a succeeds (200 OK)
	reqAuthOK := httptest.NewRequest(http.MethodGet, "/api/v1/projects/proj-a/entities", nil)
	reqAuthOK.Header.Set("X-User-ID", "user-alpha")
	recAuthOK := httptest.NewRecorder()
	router.ServeHTTP(recAuthOK, reqAuthOK)
	if recAuthOK.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 for authorized owner, got %d", recAuthOK.Code)
	}
}
