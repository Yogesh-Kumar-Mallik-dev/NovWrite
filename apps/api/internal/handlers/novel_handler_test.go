package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_TEST_NOVEL_HANDLER_001

func TestNovelHandler_ChaptersAndScenes(t *testing.T) {
	chapterStore := NewInMemoryChapterStore()
	sceneStore := NewInMemorySceneStore()
	projectStore := NewInMemoryProjectStore()
	eventHub := NewEventHub()

	handler := NewNovelHandler(chapterStore, sceneStore, projectStore, eventHub)

	r := chi.NewRouter()
	r.Route("/api/v1/projects/{projectId}", func(r chi.Router) {
		r.Route("/chapters", func(r chi.Router) {
			r.Get("/", handler.ListChapters)
			r.Post("/", handler.CreateChapter)
			r.Get("/{chapterId}", handler.GetChapter)
			r.Put("/{chapterId}", handler.UpdateChapter)
			r.Delete("/{chapterId}", handler.DeleteChapter)
		})
		r.Route("/scenes", func(r chi.Router) {
			r.Get("/", handler.ListScenes)
			r.Post("/", handler.CreateScene)
			r.Get("/{sceneId}", handler.GetScene)
			r.Put("/{sceneId}", handler.UpdateScene)
			r.Delete("/{sceneId}", handler.DeleteScene)
		})
	})

	projectID := "proj-test-123"

	// 1. Create Chapter
	createChapBody := `{"title":"Chapter 1: The Azure Peak Awakening","orderIndex":1,"synopsis":"Eldrin breaks through"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/chapters", bytes.NewBufferString(createChapBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d. Body: %s", w.Code, w.Body.String())
	}

	var createdChapResp struct {
		Data Chapter `json:"data"`
	}
	if err := json.NewDecoder(w.Body).Decode(&createdChapResp); err != nil {
		t.Fatalf("failed to decode created chapter: %v", err)
	}
	createdChap := createdChapResp.Data
	if createdChap.Title != "Chapter 1: The Azure Peak Awakening" {
		t.Errorf("expected title 'Chapter 1: The Azure Peak Awakening', got '%s'", createdChap.Title)
	}

	// 2. Create Scene inside Chapter
	createSceneBody := `{"chapterId":"` + createdChap.ID + `","title":"Scene 1: Qi Condensation Gathering","orderIndex":1,"proseContent":"The midnight winds howled against the jade cliffs as Eldrin focused his spiritual meridians."}`
	reqScene := httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/scenes", bytes.NewBufferString(createSceneBody))
	reqScene.Header.Set("Content-Type", "application/json")
	wScene := httptest.NewRecorder()
	r.ServeHTTP(wScene, reqScene)

	if wScene.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d. Body: %s", wScene.Code, wScene.Body.String())
	}

	var createdSceneResp struct {
		Data Scene `json:"data"`
	}
	if err := json.NewDecoder(wScene.Body).Decode(&createdSceneResp); err != nil {
		t.Fatalf("failed to decode created scene: %v", err)
	}
	createdScene := createdSceneResp.Data
	if createdScene.WordCount != 14 {
		t.Errorf("expected word count 14, got %d", createdScene.WordCount)
	}

	// 3. List Chapters
	reqListChap := httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+projectID+"/chapters", nil)
	wListChap := httptest.NewRecorder()
	r.ServeHTTP(wListChap, reqListChap)

	if wListChap.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", wListChap.Code)
	}

	// 4. List Scenes
	reqListScenes := httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+projectID+"/scenes?chapterId="+createdChap.ID, nil)
	wListScenes := httptest.NewRecorder()
	r.ServeHTTP(wListScenes, reqListScenes)

	if wListScenes.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", wListScenes.Code)
	}

	// 5. Update Scene Prose Content
	updateSceneBody := `{"proseContent":"The midnight winds howled against the jade cliffs as Eldrin focused his spiritual meridians with unmatched clarity."}`
	reqUpdateScene := httptest.NewRequest(http.MethodPut, "/api/v1/projects/"+projectID+"/scenes/"+createdScene.ID, bytes.NewBufferString(updateSceneBody))
	reqUpdateScene.Header.Set("Content-Type", "application/json")
	wUpdateScene := httptest.NewRecorder()
	r.ServeHTTP(wUpdateScene, reqUpdateScene)

	if wUpdateScene.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", wUpdateScene.Code)
	}

	var updatedSceneResp struct {
		Data Scene `json:"data"`
	}
	if err := json.NewDecoder(wUpdateScene.Body).Decode(&updatedSceneResp); err != nil {
		t.Fatalf("failed to decode updated scene: %v", err)
	}
	updatedScene := updatedSceneResp.Data
	if updatedScene.WordCount != 17 {
		t.Errorf("expected updated word count 17, got %d", updatedScene.WordCount)
	}

	// 6. Delete Chapter (Cascades scenes)
	reqDelChap := httptest.NewRequest(http.MethodDelete, "/api/v1/projects/"+projectID+"/chapters/"+createdChap.ID, nil)
	wDelChap := httptest.NewRecorder()
	r.ServeHTTP(wDelChap, reqDelChap)

	if wDelChap.Code != http.StatusNoContent {
		t.Fatalf("expected status 204 NoContent, got %d", wDelChap.Code)
	}

	// Verify scene also deleted
	_, sceneFound := sceneStore.Get(createdScene.ID)
	if sceneFound {
		t.Errorf("expected scene to be deleted when chapter was deleted")
	}
}

func TestNovelHandler_SceneLeasesAndCollaboration(t *testing.T) {
	chapterStore := NewInMemoryChapterStore()
	sceneStore := NewInMemorySceneStore()
	projectStore := NewInMemoryProjectStore()
	eventHub := NewEventHub()

	handler := NewNovelHandler(chapterStore, sceneStore, projectStore, eventHub)

	r := chi.NewRouter()
	r.Route("/api/v1/projects/{projectId}/scenes", func(r chi.Router) {
		r.Post("/", handler.CreateScene)
		r.Get("/{sceneId}", handler.GetScene)
		r.Put("/{sceneId}", handler.UpdateScene)
		r.Get("/{sceneId}/lease", handler.GetSceneLease)
		r.Post("/{sceneId}/lease/acquire", handler.AcquireSceneLease)
		r.Post("/{sceneId}/lease/renew", handler.RenewSceneLease)
		r.Post("/{sceneId}/lease/release", handler.ReleaseSceneLease)
	})

	projectID := "proj-lease-test"
	scene := sceneStore.Save(Scene{
		ProjectID:    projectID,
		ChapterID:    "chap-1",
		Title:        "The Secret Meridian Chamber",
		ProseContent: "Eldrin enters the sacred chamber.",
	})

	// 1. Initial lease status should be inactive
	req := httptest.NewRequest(http.MethodGet, "/api/v1/projects/"+projectID+"/scenes/"+scene.ID+"/lease", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var leaseStatus struct {
		Active   bool   `json:"active"`
		AuthorID string `json:"authorId"`
	}
	_ = json.NewDecoder(w.Body).Decode(&leaseStatus)
	if leaseStatus.Active {
		t.Errorf("expected initial lease to be inactive")
	}

	// 2. Author 1 acquires lease
	acquireBody := `{"authorId":"author-eldrin"}`
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/scenes/"+scene.ID+"/lease/acquire", bytes.NewBufferString(acquireBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	// 3. Author 2 attempts to acquire lease -> should fail with 409 Conflict
	acquireBody2 := `{"authorId":"author-malakor"}`
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/scenes/"+scene.ID+"/lease/acquire", bytes.NewBufferString(acquireBody2))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409 Conflict when Author 2 acquires lease, got %d", w.Code)
	}

	// 4. Author 2 tries to edit scene while locked by Author 1 -> should fail with 409 Conflict
	editBody := `{"proseContent":"Malakor maliciously alters the text."}`
	req = httptest.NewRequest(http.MethodPut, "/api/v1/projects/"+projectID+"/scenes/"+scene.ID, bytes.NewBufferString(editBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-ID", "author-malakor")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409 Conflict when unauthorized author tries to edit locked scene, got %d", w.Code)
	}

	// 5. Author 1 edits scene -> should succeed
	req = httptest.NewRequest(http.MethodPut, "/api/v1/projects/"+projectID+"/scenes/"+scene.ID, bytes.NewBufferString(editBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-ID", "author-eldrin")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK when leaseholder edits scene, got %d", w.Code)
	}

	// 6. Author 1 renews lease
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/scenes/"+scene.ID+"/lease/renew", bytes.NewBufferString(acquireBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on lease renewal, got %d", w.Code)
	}

	// 7. Author 1 releases lease
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/scenes/"+scene.ID+"/lease/release", bytes.NewBufferString(acquireBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on lease release, got %d", w.Code)
	}

	// 8. Author 2 can now acquire the lease
	req = httptest.NewRequest(http.MethodPost, "/api/v1/projects/"+projectID+"/scenes/"+scene.ID+"/lease/acquire", bytes.NewBufferString(acquireBody2))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK after lease was released, got %d", w.Code)
	}
}
