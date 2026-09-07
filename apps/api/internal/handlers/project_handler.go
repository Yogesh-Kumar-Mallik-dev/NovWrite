package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_API_PROJECT_HANDLER_001

// Project represents a creative novel universe project in NovWrite.
type Project struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Genre       string    `json:"genre,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ProjectStore defines the repository interface for project persistence.
type ProjectStore interface {
	List() []Project
	Get(id string) (*Project, bool)
	Save(p Project) Project
	Delete(id string) bool
}

// InMemoryProjectStore provides a thread-safe in-memory store for projects.
type InMemoryProjectStore struct {
	mu       sync.RWMutex
	projects map[string]Project
}

// NewInMemoryProjectStore creates a new in-memory project store.
func NewInMemoryProjectStore() *InMemoryProjectStore {
	return &InMemoryProjectStore{
		projects: make(map[string]Project),
	}
}

func (s *InMemoryProjectStore) List() []Project {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]Project, 0, len(s.projects))
	for _, p := range s.projects {
		result = append(result, p)
	}

	// Sort by CreatedAt descending
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})

	return result
}

func (s *InMemoryProjectStore) Get(id string) (*Project, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, found := s.projects[id]
	if !found {
		return nil, false
	}
	return &p, true
}

func (s *InMemoryProjectStore) Save(p Project) Project {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p.ID == "" {
		p.ID = fmt.Sprintf("proj-%x-%x", time.Now().Unix(), time.Now().Nanosecond()%0xffff)
	}
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now().UTC()
	}
	p.UpdatedAt = time.Now().UTC()

	s.projects[p.ID] = p
	return p
}

func (s *InMemoryProjectStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, found := s.projects[id]; !found {
		return false
	}
	delete(s.projects, id)
	return true
}

// ProjectHandler handles REST operations for Project collections and items.
type ProjectHandler struct {
	store ProjectStore
}

// NewProjectHandler constructs a new ProjectHandler.
func NewProjectHandler(store ProjectStore) *ProjectHandler {
	return &ProjectHandler{store: store}
}

// List handles GET /api/v1/projects with standard 10-item pagination & search filtering.
func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
	params := httputil.ParsePaginationParams(r)
	search := strings.ToLower(params.Search)

	allProjects := h.store.List()

	// Apply search filter
	filtered := make([]Project, 0, len(allProjects))
	for _, p := range allProjects {
		if search == "" || strings.Contains(strings.ToLower(p.Name), search) || strings.Contains(strings.ToLower(p.Description), search) || strings.Contains(strings.ToLower(p.Genre), search) {
			filtered = append(filtered, p)
		}
	}

	totalCount := len(filtered)
	start := (params.Page - 1) * params.PageSize
	if start > totalCount {
		start = totalCount
	}
	end := start + params.PageSize
	if end > totalCount {
		end = totalCount
	}

	paginated := filtered[start:end]
	httputil.RespondPaginatedJSON(w, r, paginated, totalCount, params)
}

// Create handles POST /api/v1/projects.
func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Genre       string `json:"genre"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed request body: %v", err), "INVALID_JSON")
		return
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		httputil.RespondValidationProblem(w, r, "Project creation failed validation.", []httputil.InvalidParam{
			{
				Name:   "name",
				Reason: "Project name is required and cannot be empty.",
			},
		})
		return
	}

	if len(name) > 255 {
		httputil.RespondValidationProblem(w, r, "Project creation failed validation.", []httputil.InvalidParam{
			{
				Name:   "name",
				Reason: "Project name cannot exceed 255 characters.",
			},
		})
		return
	}

	proj := Project{
		Name:        name,
		Description: strings.TrimSpace(input.Description),
		Genre:       strings.TrimSpace(input.Genre),
	}

	created := h.store.Save(proj)
	httputil.RespondCreated(w, r, fmt.Sprintf("/api/v1/projects/%s", created.ID), created)
}

// Get handles GET /api/v1/projects/{projectId}.
func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		httputil.RespondNotFound(w, r, "Project", projectID)
		return
	}

	proj, found := h.store.Get(projectID)
	if !found {
		httputil.RespondNotFound(w, r, "Project", projectID)
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, proj)
}

// Update handles PUT /api/v1/projects/{projectId}.
func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	existing, found := h.store.Get(projectID)
	if !found {
		httputil.RespondNotFound(w, r, "Project", projectID)
		return
	}

	var input struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
		Genre       *string `json:"genre"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed request body: %v", err), "INVALID_JSON")
		return
	}

	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			httputil.RespondValidationProblem(w, r, "Project update failed validation.", []httputil.InvalidParam{
				{
					Name:   "name",
					Reason: "Project name cannot be empty.",
				},
			})
			return
		}
		existing.Name = name
	}

	if input.Description != nil {
		existing.Description = strings.TrimSpace(*input.Description)
	}

	if input.Genre != nil {
		existing.Genre = strings.TrimSpace(*input.Genre)
	}

	updated := h.store.Save(*existing)
	httputil.RespondJSON(w, r, http.StatusOK, updated)
}

// Delete handles DELETE /api/v1/projects/{projectId}.
func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if !h.store.Delete(projectID) {
		httputil.RespondNotFound(w, r, "Project", projectID)
		return
	}

	httputil.RespondNoContent(w)
}
