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
