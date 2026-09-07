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

// Block Standard: BLOCK_API_ENTITY_HANDLER_001

// EntityStore defines the repository interface for entity persistence.
type EntityStore interface {
	List(projectID string) []world.EntityItem
	Get(projectID, id string) (*world.EntityItem, bool)
	Save(projectID string, entity world.EntityItem) world.EntityItem
	Delete(projectID, id string) bool
}

// InMemoryEntityStore provides an in-memory thread-safe store for development & testing.
type InMemoryEntityStore struct {
	mu       sync.RWMutex
	entities map[string]map[string]world.EntityItem // projectID -> entityID -> EntityItem
}

// NewInMemoryEntityStore creates a new in-memory entity store.
func NewInMemoryEntityStore() *InMemoryEntityStore {
	return &InMemoryEntityStore{
		entities: make(map[string]map[string]world.EntityItem),
	}
}

func (s *InMemoryEntityStore) List(projectID string) []world.EntityItem {
	s.mu.RLock()
	defer s.mu.RUnlock()

	projMap, ok := s.entities[projectID]
	if !ok {
		return []world.EntityItem{}
	}

	result := make([]world.EntityItem, 0, len(projMap))
	for _, ent := range projMap {
		result = append(result, ent)
	}
	return result
}

func (s *InMemoryEntityStore) Get(projectID, id string) (*world.EntityItem, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	projMap, ok := s.entities[projectID]
	if !ok {
		return nil, false
	}
	ent, found := projMap[id]
	if !found {
		return nil, false
	}
	return &ent, true
}

func (s *InMemoryEntityStore) Save(projectID string, entity world.EntityItem) world.EntityItem {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.entities[projectID]; !ok {
		s.entities[projectID] = make(map[string]world.EntityItem)
	}
	if entity.ID == "" {
		entity.ID = fmt.Sprintf("ent_%d", time.Now().UnixNano())
	}
	s.entities[projectID][entity.ID] = entity
	return entity
}

func (s *InMemoryEntityStore) Delete(projectID, id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	projMap, ok := s.entities[projectID]
	if !ok {
		return false
	}
	if _, found := projMap[id]; !found {
		return false
	}
	delete(projMap, id)
	return true
}

// EntityHandler handles REST operations for Entities.
type EntityHandler struct {
	store          EntityStore
	blueprintStore BlueprintStore
}

// NewEntityHandler creates a new EntityHandler.
func NewEntityHandler(store EntityStore, bpStore BlueprintStore) *EntityHandler {
	if store == nil {
		store = NewInMemoryEntityStore()
	}
	if bpStore == nil {
		bpStore = NewInMemoryBlueprintStore()
	}
	return &EntityHandler{
		store:          store,
		blueprintStore: bpStore,
	}
}

// List handles GET /api/v1/projects/{projectId}/entities
// Supports pagination, search, category filter, blueprintId filter, sorting, and returns [] on empty query.
func (h *EntityHandler) List(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = r.URL.Query().Get("projectId")
	}
	if projectID == "" {
		projectID = "default"
	}

	params := httputil.ParsePaginationParams(r)
	blueprintIDFilter := strings.TrimSpace(r.URL.Query().Get("blueprintId"))

	allEntities := h.store.List(projectID)

	// Filter
	var filtered []world.EntityItem
	for _, ent := range allEntities {
		if blueprintIDFilter != "" && ent.BlueprintID != blueprintIDFilter {
			continue
		}
		if params.Category != "" && !strings.EqualFold(ent.Category, params.Category) {
			continue
		}
		if params.Search != "" {
			term := strings.ToLower(params.Search)
			nameMatch := strings.Contains(strings.ToLower(ent.Name), term)
			descMatch := strings.Contains(strings.ToLower(ent.Description), term)
			catMatch := strings.Contains(strings.ToLower(ent.Category), term)
			if !nameMatch && !descMatch && !catMatch {
				continue
			}
		}
		filtered = append(filtered, ent)
	}

	// Always guarantee non-nil slice
	if filtered == nil {
		filtered = []world.EntityItem{}
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

	var paginated []world.EntityItem
	if start >= totalCount {
		paginated = []world.EntityItem{}
	} else {
		if end > totalCount {
			end = totalCount
		}
		paginated = filtered[start:end]
	}

	httputil.RespondPaginatedJSON(w, r, paginated, totalCount, params)
}

// Get handles GET /api/v1/projects/{projectId}/entities/{entityId}
func (h *EntityHandler) Get(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	entityID := chi.URLParam(r, "entityId")

	ent, found := h.store.Get(projectID, entityID)
	if !found {
		httputil.RespondNotFound(w, r, "Entity", entityID)
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, ent)
}

// Create handles POST /api/v1/projects/{projectId}/entities
// Validates against blueprint, normalizes properties, computes formulas deterministically on backend, returns 201 Created.
func (h *EntityHandler) Create(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}

	var rawEnt world.EntityItem
	if err := json.NewDecoder(r.Body).Decode(&rawEnt); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	rawEnt.ProjectID = projectID

	if rawEnt.BlueprintID == "" {
		httputil.RespondBadRequest(w, r, "Entity 'blueprintId' is required.", "MISSING_BLUEPRINT_ID")
		return
	}

	bp, found := h.blueprintStore.Get(projectID, rawEnt.BlueprintID)
	if !found {
		httputil.RespondNotFound(w, r, "Blueprint", rawEnt.BlueprintID)
		return
	}

	// Zero-trust entity validation and deterministic formula computation
	sanitized, errs := world.ValidateAndSanitizeEntityItem(*bp, rawEnt)
	if len(errs) > 0 {
		var invalidParams []httputil.InvalidParam
		for _, e := range errs {
			invalidParams = append(invalidParams, httputil.InvalidParam{
				Name:          e.PropertyKey,
				Reason:        e.Message,
				ReceivedValue: e.ReceivedValue,
			})
		}
		httputil.RespondValidationProblem(w, r, "Entity properties validation failed.", invalidParams)
		return
	}

	saved := h.store.Save(projectID, *sanitized)
	locationURI := fmt.Sprintf("/api/v1/projects/%s/entities/%s", projectID, saved.ID)
	httputil.RespondCreated(w, r, locationURI, saved)
}

// Update handles PUT /api/v1/projects/{projectId}/entities/{entityId}
func (h *EntityHandler) Update(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	entityID := chi.URLParam(r, "entityId")

	existing, found := h.store.Get(projectID, entityID)
	if !found {
		httputil.RespondNotFound(w, r, "Entity", entityID)
		return
	}

	var rawEnt world.EntityItem
	if err := json.NewDecoder(r.Body).Decode(&rawEnt); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	rawEnt.ID = entityID
	rawEnt.ProjectID = projectID
	if rawEnt.BlueprintID == "" {
		rawEnt.BlueprintID = existing.BlueprintID
	}

	bp, found := h.blueprintStore.Get(projectID, rawEnt.BlueprintID)
	if !found {
		httputil.RespondNotFound(w, r, "Blueprint", rawEnt.BlueprintID)
		return
	}

	sanitized, errs := world.ValidateAndSanitizeEntityItem(*bp, rawEnt)
	if len(errs) > 0 {
		var invalidParams []httputil.InvalidParam
		for _, e := range errs {
			invalidParams = append(invalidParams, httputil.InvalidParam{
				Name:          e.PropertyKey,
				Reason:        e.Message,
				ReceivedValue: e.ReceivedValue,
			})
		}
		httputil.RespondValidationProblem(w, r, "Entity properties validation failed.", invalidParams)
		return
	}

	saved := h.store.Save(projectID, *sanitized)
	httputil.RespondJSON(w, r, http.StatusOK, saved)
}

// Delete handles DELETE /api/v1/projects/{projectId}/entities/{entityId}
func (h *EntityHandler) Delete(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	entityID := chi.URLParam(r, "entityId")

	deleted := h.store.Delete(projectID, entityID)
	if !deleted {
		httputil.RespondNotFound(w, r, "Entity", entityID)
		return
	}

	httputil.RespondNoContent(w)
}
