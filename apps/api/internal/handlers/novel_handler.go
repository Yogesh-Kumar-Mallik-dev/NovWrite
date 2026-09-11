package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/cache"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_API_NOVEL_HANDLER_001

// Chapter represents an individual chapter within a novel project.
type Chapter struct {
	ID         string    `json:"id"`
	ProjectID  string    `json:"projectId"`
	Title      string    `json:"title"`
	OrderIndex int       `json:"orderIndex"`
	Synopsis   string    `json:"synopsis,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// SceneStatus represents the publication / editing lifecycle stage of a scene.
type SceneStatus string

const (
	SceneStatusDraft      SceneStatus = "DRAFT"
	SceneStatusInProgress SceneStatus = "IN_PROGRESS"
	SceneStatusRevised    SceneStatus = "REVISED"
	SceneStatusCompleted  SceneStatus = "COMPLETED"
)

// Scene represents a single prose scene within a chapter.
type Scene struct {
	ID                     string      `json:"id"`
	ChapterID              string      `json:"chapterId"`
	ProjectID              string      `json:"projectId"`
	Title                  string      `json:"title"`
	OrderIndex             int         `json:"orderIndex"`
	SequenceNumber         int         `json:"sequenceNumber"`
	ProseContent           string      `json:"proseContent"`
	WordCount              int         `json:"wordCount"`
	Status                 SceneStatus `json:"status"`
	PovCharacterID         string      `json:"povCharacterId,omitempty"`
	TimelineSequenceNumber int         `json:"timelineSequenceNumber,omitempty"`
	TargetWordCount        int         `json:"targetWordCount,omitempty"`
	Synopsis               string      `json:"synopsis,omitempty"`
	CreatedAt              time.Time   `json:"createdAt"`
	UpdatedAt              time.Time   `json:"updatedAt"`
}

// ChapterStore defines persistence operations for novel chapters.
type ChapterStore interface {
	List(projectID string) []Chapter
	Get(id string) (*Chapter, bool)
	Save(c Chapter) Chapter
	Delete(id string) bool
}

// SceneStore defines persistence operations for novel scenes.
type SceneStore interface {
	List(projectID string, chapterID string) []Scene
	Get(id string) (*Scene, bool)
	Save(s Scene) Scene
	Delete(id string) bool
	DeleteByChapter(chapterID string) int
}

// InMemoryChapterStore provides thread-safe in-memory chapter storage.
type InMemoryChapterStore struct {
	mu       sync.RWMutex
	chapters map[string]Chapter
}

// NewInMemoryChapterStore instantiates a new chapter store.
func NewInMemoryChapterStore() *InMemoryChapterStore {
	return &InMemoryChapterStore{
		chapters: make(map[string]Chapter),
	}
}

func (s *InMemoryChapterStore) List(projectID string) []Chapter {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Chapter, 0)
	for _, c := range s.chapters {
		if projectID == "" || c.ProjectID == projectID {
			result = append(result, c)
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].OrderIndex < result[j].OrderIndex
	})

	return result
}

func (s *InMemoryChapterStore) Get(id string) (*Chapter, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	c, found := s.chapters[id]
	if !found {
		return nil, false
	}
	return &c, true
}

func (s *InMemoryChapterStore) Save(c Chapter) Chapter {
	s.mu.Lock()
	defer s.mu.Unlock()

	if c.ID == "" {
		c.ID = fmt.Sprintf("chap-%x-%x", time.Now().Unix(), time.Now().Nanosecond()%0xffff)
	}
	if c.CreatedAt.IsZero() {
		c.CreatedAt = time.Now().UTC()
	}
	c.UpdatedAt = time.Now().UTC()

	s.chapters[c.ID] = c
	return c
}

func (s *InMemoryChapterStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, found := s.chapters[id]; !found {
		return false
	}
	delete(s.chapters, id)
	return true
}

// InMemorySceneStore provides thread-safe in-memory scene storage.
type InMemorySceneStore struct {
	mu     sync.RWMutex
	scenes map[string]Scene
}

// NewInMemorySceneStore instantiates a new scene store.
func NewInMemorySceneStore() *InMemorySceneStore {
	return &InMemorySceneStore{
		scenes: make(map[string]Scene),
	}
}

func (s *InMemorySceneStore) List(projectID string, chapterID string) []Scene {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Scene, 0)
	for _, sc := range s.scenes {
		if projectID != "" && sc.ProjectID != projectID {
			continue
		}
		if chapterID != "" && sc.ChapterID != chapterID {
			continue
		}
		result = append(result, sc)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].OrderIndex < result[j].OrderIndex
	})

	return result
}

func (s *InMemorySceneStore) Get(id string) (*Scene, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sc, found := s.scenes[id]
	if !found {
		return nil, false
	}
	return &sc, true
}

func (s *InMemorySceneStore) Save(sc Scene) Scene {
	s.mu.Lock()
	defer s.mu.Unlock()

	if sc.ID == "" {
		sc.ID = fmt.Sprintf("sc-%x-%x", time.Now().Unix(), time.Now().Nanosecond()%0xffff)
	}
	if sc.Status == "" {
		sc.Status = SceneStatusDraft
	}
	if sc.CreatedAt.IsZero() {
		sc.CreatedAt = time.Now().UTC()
	}
	sc.UpdatedAt = time.Now().UTC()

	// Calculate word count automatically
	sc.WordCount = countWords(sc.ProseContent)

	s.scenes[sc.ID] = sc
	return sc
}

func (s *InMemorySceneStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, found := s.scenes[id]; !found {
		return false
	}
	delete(s.scenes, id)
	return true
}

func (s *InMemorySceneStore) DeleteByChapter(chapterID string) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	count := 0
	for id, sc := range s.scenes {
		if sc.ChapterID == chapterID {
			delete(s.scenes, id)
			count++
		}
	}
	return count
}

func countWords(text string) int {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return 0
	}
	words := strings.Fields(trimmed)
	return len(words)
}

// NovelHandler handles HTTP operations for novel chapters and scenes.
type NovelHandler struct {
	chapterStore ChapterStore
	sceneStore   SceneStore
	projectStore ProjectStore
	eventHub     *EventHub
	cache        cache.CacheManager
}

// NewNovelHandler constructs a novel handler instance.
func NewNovelHandler(chapterStore ChapterStore, sceneStore SceneStore, projectStore ProjectStore, eventHub *EventHub, cacheManagers ...cache.CacheManager) *NovelHandler {
	var c cache.CacheManager
	if len(cacheManagers) > 0 && cacheManagers[0] != nil {
		c = cacheManagers[0]
	} else {
		c = cache.NewMemoryCacheManager()
	}
	return &NovelHandler{
		chapterStore: chapterStore,
		sceneStore:   sceneStore,
		projectStore: projectStore,
		eventHub:     eventHub,
		cache:        c,
	}
}

// ListChapters returns paginated chapters for a project.
func (h *NovelHandler) ListChapters(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectQueryAccess(w, r, h.projectStore, projectID); !ok {
		return
	}

	params := httputil.ParsePaginationParams(r)
	chapters := h.chapterStore.List(projectID)

	// Slice for pagination
	start := (params.Page - 1) * params.PageSize
	if start > len(chapters) {
		start = len(chapters)
	}
	end := start + params.PageSize
	if end > len(chapters) {
		end = len(chapters)
	}
	sliced := chapters[start:end]

	httputil.RespondPaginatedJSON(w, r, sliced, len(chapters), params)
}

// CreateChapter creates a new chapter in the project.
func (h *NovelHandler) CreateChapter(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/missing-parameter",
			Title:  "Missing Project ID",
			Status: http.StatusBadRequest,
			Detail: "Project ID is required in route URL.",
			Code:   "MISSING_PROJECT_ID",
		})
		return
	}

	var req struct {
		Title      string `json:"title"`
		OrderIndex int    `json:"orderIndex"`
		Synopsis   string `json:"synopsis,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/invalid-json",
			Title:  "Invalid JSON Payload",
			Status: http.StatusBadRequest,
			Detail: "Failed to parse request JSON body.",
			Code:   "INVALID_JSON",
		})
		return
	}

	trimmedTitle := strings.TrimSpace(req.Title)
	if trimmedTitle == "" {
		httputil.RespondValidationProblem(w, r, "Validation failed for chapter creation.", []httputil.InvalidParam{
			{Name: "title", Reason: "Chapter title cannot be empty.", ReceivedValue: req.Title},
		})
		return
	}

	existing := h.chapterStore.List(projectID)
	orderIdx := req.OrderIndex
	if orderIdx <= 0 {
		orderIdx = len(existing) + 1
	}

	chapter := Chapter{
		ProjectID:  projectID,
		Title:      trimmedTitle,
		OrderIndex: orderIdx,
		Synopsis:   strings.TrimSpace(req.Synopsis),
	}

	saved := h.chapterStore.Save(chapter)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "CHAPTER_CREATED",
			ProjectID: projectID,
			Payload:   saved,
		})
	}

	httputil.RespondCreated(w, r, fmt.Sprintf("/api/v1/projects/%s/chapters/%s", projectID, saved.ID), saved)
}

// GetChapter returns a single chapter by ID.
func (h *NovelHandler) GetChapter(w http.ResponseWriter, r *http.Request) {
	chapterID := chi.URLParam(r, "chapterId")
	chapter, found := h.chapterStore.Get(chapterID)
	if !found {
		httputil.RespondNotFound(w, r, "Chapter", chapterID)
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, chapter)
}

// UpdateChapter updates an existing chapter.
func (h *NovelHandler) UpdateChapter(w http.ResponseWriter, r *http.Request) {
	chapterID := chi.URLParam(r, "chapterId")
	existing, found := h.chapterStore.Get(chapterID)
	if !found {
		httputil.RespondNotFound(w, r, "Chapter", chapterID)
		return
	}

	var req struct {
		Title      *string `json:"title,omitempty"`
		OrderIndex *int    `json:"orderIndex,omitempty"`
		Synopsis   *string `json:"synopsis,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/invalid-json",
			Title:  "Invalid JSON Payload",
			Status: http.StatusBadRequest,
			Detail: "Failed to parse request JSON body.",
			Code:   "INVALID_JSON",
		})
		return
	}

	if req.Title != nil {
		trimmed := strings.TrimSpace(*req.Title)
		if trimmed == "" {
			httputil.RespondValidationProblem(w, r, "Validation failed for chapter update.", []httputil.InvalidParam{
				{Name: "title", Reason: "Chapter title cannot be empty.", ReceivedValue: *req.Title},
			})
			return
		}
		existing.Title = trimmed
	}
	if req.OrderIndex != nil {
		existing.OrderIndex = *req.OrderIndex
	}
	if req.Synopsis != nil {
		existing.Synopsis = strings.TrimSpace(*req.Synopsis)
	}

	saved := h.chapterStore.Save(*existing)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "CHAPTER_UPDATED",
			ProjectID: saved.ProjectID,
			Payload:   saved,
		})
	}

	httputil.RespondJSON(w, r, http.StatusOK, saved)
}

// DeleteChapter deletes a chapter and all associated scenes.
func (h *NovelHandler) DeleteChapter(w http.ResponseWriter, r *http.Request) {
	chapterID := chi.URLParam(r, "chapterId")
	existing, found := h.chapterStore.Get(chapterID)
	if !found {
		httputil.RespondNotFound(w, r, "Chapter", chapterID)
		return
	}

	h.sceneStore.DeleteByChapter(chapterID)
	h.chapterStore.Delete(chapterID)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "CHAPTER_DELETED",
			ProjectID: existing.ProjectID,
			Payload:   map[string]string{"id": chapterID},
		})
	}

	httputil.RespondNoContent(w)
}

// ListScenes returns paginated scenes for a project or specific chapter.
func (h *NovelHandler) ListScenes(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectQueryAccess(w, r, h.projectStore, projectID); !ok {
		return
	}
	chapterID := r.URL.Query().Get("chapterId")

	params := httputil.ParsePaginationParams(r)
	scenes := h.sceneStore.List(projectID, chapterID)

	start := (params.Page - 1) * params.PageSize
	if start > len(scenes) {
		start = len(scenes)
	}
	end := start + params.PageSize
	if end > len(scenes) {
		end = len(scenes)
	}
	sliced := scenes[start:end]

	httputil.RespondPaginatedJSON(w, r, sliced, len(scenes), params)
}

// CreateScene creates a new prose scene in a chapter.
func (h *NovelHandler) CreateScene(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/missing-parameter",
			Title:  "Missing Project ID",
			Status: http.StatusBadRequest,
			Detail: "Project ID is required in route URL.",
			Code:   "MISSING_PROJECT_ID",
		})
		return
	}

	var req struct {
		ChapterID              string      `json:"chapterId"`
		Title                  string      `json:"title"`
		OrderIndex             int         `json:"orderIndex"`
		SequenceNumber         int         `json:"sequenceNumber"`
		ProseContent           string      `json:"proseContent"`
		Status                 SceneStatus `json:"status,omitempty"`
		PovCharacterID         string      `json:"povCharacterId,omitempty"`
		TimelineSequenceNumber int         `json:"timelineSequenceNumber,omitempty"`
		TargetWordCount        int         `json:"targetWordCount,omitempty"`
		Synopsis               string      `json:"synopsis,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/invalid-json",
			Title:  "Invalid JSON Payload",
			Status: http.StatusBadRequest,
			Detail: "Failed to parse request JSON body.",
			Code:   "INVALID_JSON",
		})
		return
	}

	if req.ChapterID == "" {
		httputil.RespondValidationProblem(w, r, "Validation failed for scene creation.", []httputil.InvalidParam{
			{Name: "chapterId", Reason: "Chapter ID is required for a scene.", ReceivedValue: req.ChapterID},
		})
		return
	}

	trimmedTitle := strings.TrimSpace(req.Title)
	if trimmedTitle == "" {
		httputil.RespondValidationProblem(w, r, "Validation failed for scene creation.", []httputil.InvalidParam{
			{Name: "title", Reason: "Scene title cannot be empty.", ReceivedValue: req.Title},
		})
		return
	}

	existing := h.sceneStore.List(projectID, req.ChapterID)
	orderIdx := req.OrderIndex
	if orderIdx <= 0 {
		orderIdx = len(existing) + 1
	}

	seqNumber := req.SequenceNumber
	if seqNumber <= 0 {
		allScenes := h.sceneStore.List(projectID, "")
		seqNumber = len(allScenes) + 1
	}

	scene := Scene{
		ChapterID:              req.ChapterID,
		ProjectID:              projectID,
		Title:                  trimmedTitle,
		OrderIndex:             orderIdx,
		SequenceNumber:         seqNumber,
		ProseContent:           req.ProseContent,
		Status:                 req.Status,
		PovCharacterID:         req.PovCharacterID,
		TimelineSequenceNumber: req.TimelineSequenceNumber,
		TargetWordCount:        req.TargetWordCount,
		Synopsis:               strings.TrimSpace(req.Synopsis),
	}

	saved := h.sceneStore.Save(scene)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "SCENE_CREATED",
			ProjectID: projectID,
			Payload:   saved,
		})
	}

	httputil.RespondCreated(w, r, fmt.Sprintf("/api/v1/projects/%s/scenes/%s", projectID, saved.ID), saved)
}

// GetScene returns a single scene by ID.
func (h *NovelHandler) GetScene(w http.ResponseWriter, r *http.Request) {
	sceneID := chi.URLParam(r, "sceneId")
	scene, found := h.sceneStore.Get(sceneID)
	if !found {
		httputil.RespondNotFound(w, r, "Scene", sceneID)
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, scene)
}

// UpdateScene updates an existing scene (including prose manuscript text).
func (h *NovelHandler) UpdateScene(w http.ResponseWriter, r *http.Request) {
	sceneID := chi.URLParam(r, "sceneId")
	existing, found := h.sceneStore.Get(sceneID)
	if !found {
		httputil.RespondNotFound(w, r, "Scene", sceneID)
		return
	}

	callerAuthor := strings.TrimSpace(r.Header.Get("X-User-ID"))
	if h.cache != nil {
		leaseHolder, remaining, active, _ := h.cache.GetSceneLease(r.Context(), sceneID)
		if active && leaseHolder != "" && callerAuthor != "" && leaseHolder != callerAuthor {
			httputil.RespondProblem(w, r, httputil.ProblemDetail{
				Type:   "https://novwrite.com/errors/scene-lease-conflict",
				Title:  "Scene Lease Conflict",
				Status: http.StatusConflict,
				Detail: fmt.Sprintf("Cannot update scene '%s': lease is actively held by author '%s' with %d seconds remaining.", sceneID, leaseHolder, int(remaining.Seconds())),
				Code:   "SCENE_LEASE_CONFLICT",
			})
			return
		}
	}

	var req struct {
		Title                  *string      `json:"title,omitempty"`
		OrderIndex             *int         `json:"orderIndex,omitempty"`
		SequenceNumber         *int         `json:"sequenceNumber,omitempty"`
		ProseContent           *string      `json:"proseContent,omitempty"`
		Status                 *SceneStatus `json:"status,omitempty"`
		PovCharacterID         *string      `json:"povCharacterId,omitempty"`
		TimelineSequenceNumber *int         `json:"timelineSequenceNumber,omitempty"`
		TargetWordCount        *int         `json:"targetWordCount,omitempty"`
		Synopsis               *string      `json:"synopsis,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/invalid-json",
			Title:  "Invalid JSON Payload",
			Status: http.StatusBadRequest,
			Detail: "Failed to parse request JSON body.",
			Code:   "INVALID_JSON",
		})
		return
	}

	if req.Title != nil {
		trimmed := strings.TrimSpace(*req.Title)
		if trimmed == "" {
			httputil.RespondValidationProblem(w, r, "Validation failed for scene update.", []httputil.InvalidParam{
				{Name: "title", Reason: "Scene title cannot be empty.", ReceivedValue: *req.Title},
			})
			return
		}
		existing.Title = trimmed
	}
	if req.OrderIndex != nil {
		existing.OrderIndex = *req.OrderIndex
	}
	if req.SequenceNumber != nil {
		existing.SequenceNumber = *req.SequenceNumber
	}
	if req.ProseContent != nil {
		existing.ProseContent = *req.ProseContent
	}
	if req.Status != nil {
		existing.Status = *req.Status
	}
	if req.PovCharacterID != nil {
		existing.PovCharacterID = *req.PovCharacterID
	}
	if req.TimelineSequenceNumber != nil {
		existing.TimelineSequenceNumber = *req.TimelineSequenceNumber
	}
	if req.TargetWordCount != nil {
		existing.TargetWordCount = *req.TargetWordCount
	}
	if req.Synopsis != nil {
		existing.Synopsis = strings.TrimSpace(*req.Synopsis)
	}

	saved := h.sceneStore.Save(*existing)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "SCENE_UPDATED",
			ProjectID: saved.ProjectID,
			Payload:   saved,
		})
	}

	httputil.RespondJSON(w, r, http.StatusOK, saved)
}

// DeleteScene removes a single scene.
func (h *NovelHandler) DeleteScene(w http.ResponseWriter, r *http.Request) {
	sceneID := chi.URLParam(r, "sceneId")
	existing, found := h.sceneStore.Get(sceneID)
	if !found {
		httputil.RespondNotFound(w, r, "Scene", sceneID)
		return
	}

	h.sceneStore.Delete(sceneID)

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "SCENE_DELETED",
			ProjectID: existing.ProjectID,
			Payload:   map[string]string{"id": sceneID},
		})
	}

	httputil.RespondNoContent(w)
}

// GetSceneLease returns the current distributed lease status for a scene.
func (h *NovelHandler) GetSceneLease(w http.ResponseWriter, r *http.Request) {
	sceneID := chi.URLParam(r, "sceneId")
	if sceneID == "" {
		httputil.RespondBadRequest(w, r, "Scene ID is required.", "MISSING_SCENE_ID")
		return
	}

	if h.cache == nil {
		httputil.RespondJSON(w, r, http.StatusOK, map[string]any{
			"sceneId":          sceneID,
			"active":           false,
			"authorId":         "",
			"remainingSeconds": 0,
		})
		return
	}

	authorID, ttl, active, err := h.cache.GetSceneLease(r.Context(), sceneID)
	if err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/cache-error",
			Title:  "Cache Error",
			Status: http.StatusInternalServerError,
			Detail: err.Error(),
			Code:   "CACHE_ERROR",
		})
		return
	}

	remSec := int(ttl.Seconds())
	if remSec < 0 {
		remSec = 0
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]any{
		"sceneId":          sceneID,
		"active":           active,
		"authorId":         authorID,
		"remainingSeconds": remSec,
	})
}

// AcquireSceneLease acquires a 60-second distributed lease on a scene.
func (h *NovelHandler) AcquireSceneLease(w http.ResponseWriter, r *http.Request) {
	sceneID := chi.URLParam(r, "sceneId")
	projectID := chi.URLParam(r, "projectId")

	var req struct {
		AuthorID string `json:"authorId"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	authorID := strings.TrimSpace(req.AuthorID)
	if authorID == "" {
		authorID = strings.TrimSpace(r.Header.Get("X-User-ID"))
	}
	if authorID == "" {
		httputil.RespondValidationProblem(w, r, "Validation failed for lease acquisition.", []httputil.InvalidParam{
			{Name: "authorId", Reason: "Author ID is required to acquire scene lease.", ReceivedValue: req.AuthorID},
		})
		return
	}

	if _, found := h.sceneStore.Get(sceneID); !found {
		httputil.RespondNotFound(w, r, "Scene", sceneID)
		return
	}

	ttl := 60 * time.Second
	acquired, err := h.cache.AcquireSceneLease(r.Context(), sceneID, authorID, ttl)
	if err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/cache-error",
			Title:  "Cache Error",
			Status: http.StatusInternalServerError,
			Detail: err.Error(),
			Code:   "CACHE_ERROR",
		})
		return
	}

	if !acquired {
		currentAuthor, remaining, _, _ := h.cache.GetSceneLease(r.Context(), sceneID)
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/scene-lease-conflict",
			Title:  "Scene Lease Conflict",
			Status: http.StatusConflict,
			Detail: fmt.Sprintf("Scene '%s' is currently locked by author '%s' with %d seconds remaining.", sceneID, currentAuthor, int(remaining.Seconds())),
			Code:   "SCENE_LEASE_CONFLICT",
		})
		return
	}

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "SCENE_LEASE_ACQUIRED",
			ProjectID: projectID,
			Payload: map[string]any{
				"sceneId":          sceneID,
				"authorId":         authorID,
				"expiresInSeconds": 60,
			},
		})
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]any{
		"sceneId":          sceneID,
		"authorId":         authorID,
		"expiresInSeconds": 60,
		"acquired":         true,
	})
}

// RenewSceneLease renews an existing lease for 60 seconds if held by the caller.
func (h *NovelHandler) RenewSceneLease(w http.ResponseWriter, r *http.Request) {
	sceneID := chi.URLParam(r, "sceneId")

	var req struct {
		AuthorID string `json:"authorId"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	authorID := strings.TrimSpace(req.AuthorID)
	if authorID == "" {
		authorID = strings.TrimSpace(r.Header.Get("X-User-ID"))
	}
	if authorID == "" {
		httputil.RespondValidationProblem(w, r, "Validation failed for lease renewal.", []httputil.InvalidParam{
			{Name: "authorId", Reason: "Author ID is required to renew scene lease.", ReceivedValue: req.AuthorID},
		})
		return
	}

	ttl := 60 * time.Second
	renewed, err := h.cache.RenewSceneLease(r.Context(), sceneID, authorID, ttl)
	if err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/cache-error",
			Title:  "Cache Error",
			Status: http.StatusInternalServerError,
			Detail: err.Error(),
			Code:   "CACHE_ERROR",
		})
		return
	}

	if !renewed {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/scene-lease-expired",
			Title:  "Scene Lease Not Held or Expired",
			Status: http.StatusConflict,
			Detail: fmt.Sprintf("Cannot renew lease on scene '%s': lease is not held by '%s' or has expired.", sceneID, authorID),
			Code:   "SCENE_LEASE_EXPIRED",
		})
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]any{
		"sceneId":          sceneID,
		"authorId":         authorID,
		"expiresInSeconds": 60,
		"renewed":          true,
	})
}

// ReleaseSceneLease unlocks a scene lease held by the caller.
func (h *NovelHandler) ReleaseSceneLease(w http.ResponseWriter, r *http.Request) {
	sceneID := chi.URLParam(r, "sceneId")
	projectID := chi.URLParam(r, "projectId")

	var req struct {
		AuthorID string `json:"authorId"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	authorID := strings.TrimSpace(req.AuthorID)
	if authorID == "" {
		authorID = strings.TrimSpace(r.Header.Get("X-User-ID"))
	}

	if err := h.cache.ReleaseSceneLease(r.Context(), sceneID, authorID); err != nil {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/cache-error",
			Title:  "Cache Error",
			Status: http.StatusInternalServerError,
			Detail: err.Error(),
			Code:   "CACHE_ERROR",
		})
		return
	}

	if h.eventHub != nil {
		h.eventHub.Broadcast(SSEEvent{
			Event:     "SCENE_LEASE_RELEASED",
			ProjectID: projectID,
			Payload: map[string]any{
				"sceneId":  sceneID,
				"authorId": authorID,
			},
		})
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]any{
		"sceneId":  sceneID,
		"released": true,
	})
}
