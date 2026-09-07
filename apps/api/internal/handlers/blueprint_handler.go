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
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_API_BLUEPRINT_HANDLER_001

// BlueprintStore defines the repository interface for blueprint persistence.
type BlueprintStore interface {
	List(projectID string) []world.BlueprintDef
	Get(projectID, id string) (*world.BlueprintDef, bool)
	Save(projectID string, bp world.BlueprintDef) world.BlueprintDef
	Delete(projectID, id string) bool
}

// InMemoryBlueprintStore provides an in-memory thread-safe store for development & testing.
type InMemoryBlueprintStore struct {
	mu         sync.RWMutex
	blueprints map[string]map[string]world.BlueprintDef // projectID -> blueprintID -> BlueprintDef
}

// NewInMemoryBlueprintStore creates a new in-memory blueprint store.
func NewInMemoryBlueprintStore() *InMemoryBlueprintStore {
	return &InMemoryBlueprintStore{
		blueprints: make(map[string]map[string]world.BlueprintDef),
	}
}

func (s *InMemoryBlueprintStore) List(projectID string) []world.BlueprintDef {
	s.mu.RLock()
	defer s.mu.RUnlock()

	projMap, ok := s.blueprints[projectID]
	if !ok {
		return []world.BlueprintDef{}
	}

	result := make([]world.BlueprintDef, 0, len(projMap))
	for _, bp := range projMap {
		result = append(result, bp)
	}
	return result
}

func (s *InMemoryBlueprintStore) Get(projectID, id string) (*world.BlueprintDef, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	projMap, ok := s.blueprints[projectID]
	if !ok {
		return nil, false
	}
	bp, found := projMap[id]
	if !found {
		return nil, false
	}
	return &bp, true
}

func (s *InMemoryBlueprintStore) Save(projectID string, bp world.BlueprintDef) world.BlueprintDef {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.blueprints[projectID]; !ok {
		s.blueprints[projectID] = make(map[string]world.BlueprintDef)
	}
	if bp.ID == "" {
		bp.ID = fmt.Sprintf("bp_%d", time.Now().UnixNano())
	}
	s.blueprints[projectID][bp.ID] = bp
	return bp
}

func (s *InMemoryBlueprintStore) Delete(projectID, id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	projMap, ok := s.blueprints[projectID]
	if !ok {
		return false
	}
	if _, found := projMap[id]; !found {
		return false
	}
	delete(projMap, id)
	return true
}

// BlueprintHandler handles REST operations for Blueprints.
type BlueprintHandler struct {
	store BlueprintStore
}

// NewBlueprintHandler creates a new BlueprintHandler.
func NewBlueprintHandler(store BlueprintStore) *BlueprintHandler {
	if store == nil {
		store = NewInMemoryBlueprintStore()
	}
	return &BlueprintHandler{store: store}
}

// List handles GET /api/v1/projects/{projectId}/blueprints
// Supports pagination, search, category filter, sorting, and returns [] on empty query.
func (h *BlueprintHandler) List(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = r.URL.Query().Get("projectId")
	}
	if projectID == "" {
		projectID = "default"
	}

	params := httputil.ParsePaginationParams(r)
	allBlueprints := h.store.List(projectID)

	// Filter
	var filtered []world.BlueprintDef
	for _, bp := range allBlueprints {
		if params.Category != "" && !strings.EqualFold(bp.Category, params.Category) {
			continue
		}
		if params.Search != "" {
			term := strings.ToLower(params.Search)
			nameMatch := strings.Contains(strings.ToLower(bp.Name), term)
			descMatch := strings.Contains(strings.ToLower(bp.Description), term)
			catMatch := strings.Contains(strings.ToLower(bp.Category), term)
			if !nameMatch && !descMatch && !catMatch {
				continue
			}
		}
		filtered = append(filtered, bp)
	}

	// Always guarantee non-nil slice
	if filtered == nil {
		filtered = []world.BlueprintDef{}
	}

	// Sort
	switch params.Sort {
	case "name:asc":
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].Name < filtered[j].Name })
	case "name:desc":
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].Name > filtered[j].Name })
	case "category:asc":
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].Category < filtered[j].Category })
	default:
		// Default stable sort by ID
		sort.Slice(filtered, func(i, j int) bool { return filtered[i].ID < filtered[j].ID })
	}

	// Paginate
	totalCount := len(filtered)
	start := (params.Page - 1) * params.PageSize
	end := start + params.PageSize

	var paginated []world.BlueprintDef
	if start >= totalCount {
		paginated = []world.BlueprintDef{}
	} else {
		if end > totalCount {
			end = totalCount
		}
		paginated = filtered[start:end]
	}

	httputil.RespondPaginatedJSON(w, r, paginated, totalCount, params)
}

// Get handles GET /api/v1/projects/{projectId}/blueprints/{blueprintId}
func (h *BlueprintHandler) Get(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	blueprintID := chi.URLParam(r, "blueprintId")

	bp, found := h.store.Get(projectID, blueprintID)
	if !found {
		httputil.RespondNotFound(w, r, "Blueprint", blueprintID)
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, bp)
}

// Create handles POST /api/v1/projects/{projectId}/blueprints
// Enforces zero-trust validation parity, lowercase machine keys, duplicate key rejection, and returns 201 Created.
func (h *BlueprintHandler) Create(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}

	var rawBp world.BlueprintDef
	if err := json.NewDecoder(r.Body).Decode(&rawBp); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	rawBp.ProjectID = projectID

	// Execute zero-trust backend validation and sanitization
	sanitized, errs := world.ValidateAndSanitizeBlueprint(rawBp)
	if len(errs) > 0 {
		var invalidParams []httputil.InvalidParam
		for _, e := range errs {
			invalidParams = append(invalidParams, httputil.InvalidParam{
				Name:          e.PropertyKey,
				Reason:        e.Message,
				ReceivedValue: e.ReceivedValue,
			})
		}
		httputil.RespondValidationProblem(w, r, "Blueprint schema validation failed.", invalidParams)
		return
	}

	saved := h.store.Save(projectID, *sanitized)
	locationURI := fmt.Sprintf("/api/v1/projects/%s/blueprints/%s", projectID, saved.ID)
	httputil.RespondCreated(w, r, locationURI, saved)
}

// Update handles PUT /api/v1/projects/{projectId}/blueprints/{blueprintId}
func (h *BlueprintHandler) Update(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	blueprintID := chi.URLParam(r, "blueprintId")

	if _, found := h.store.Get(projectID, blueprintID); !found {
		httputil.RespondNotFound(w, r, "Blueprint", blueprintID)
		return
	}

	var rawBp world.BlueprintDef
	if err := json.NewDecoder(r.Body).Decode(&rawBp); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	rawBp.ID = blueprintID
	rawBp.ProjectID = projectID

	sanitized, errs := world.ValidateAndSanitizeBlueprint(rawBp)
	if len(errs) > 0 {
		var invalidParams []httputil.InvalidParam
		for _, e := range errs {
			invalidParams = append(invalidParams, httputil.InvalidParam{
				Name:          e.PropertyKey,
				Reason:        e.Message,
				ReceivedValue: e.ReceivedValue,
			})
		}
		httputil.RespondValidationProblem(w, r, "Blueprint schema validation failed.", invalidParams)
		return
	}

	saved := h.store.Save(projectID, *sanitized)
	httputil.RespondJSON(w, r, http.StatusOK, saved)
}

// Delete handles DELETE /api/v1/projects/{projectId}/blueprints/{blueprintId}
func (h *BlueprintHandler) Delete(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	blueprintID := chi.URLParam(r, "blueprintId")

	deleted := h.store.Delete(projectID, blueprintID)
	if !deleted {
		httputil.RespondNotFound(w, r, "Blueprint", blueprintID)
		return
	}

	httputil.RespondNoContent(w)
}
