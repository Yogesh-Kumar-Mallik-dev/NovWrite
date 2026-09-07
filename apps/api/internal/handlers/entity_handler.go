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

	// Bitemporal Entity Revisions
	GetRevisions(projectID, entityID string) []world.EntityRevision
	RecordRevision(projectID string, revision world.EntityRevision) world.EntityRevision
	GetRevision(projectID, entityID, revisionID string) (*world.EntityRevision, bool)

	// Hanging Edit Tree
	GetEntityTree(projectID, entityID string) (*world.EditTree, bool)
	SaveEntityTree(projectID, entityID string, tree world.EditTree) world.EditTree
}

// InMemoryEntityStore provides an in-memory thread-safe store for development & testing.
type InMemoryEntityStore struct {
	mu          sync.RWMutex
	entities    map[string]map[string]world.EntityItem        // projectID -> entityID -> EntityItem
	revisions   map[string]map[string][]world.EntityRevision // projectID -> entityID -> []EntityRevision
	entityTrees map[string]map[string]world.EditTree      // projectID -> entityID -> EditTree
}

// NewInMemoryEntityStore creates a new in-memory entity store.
func NewInMemoryEntityStore() *InMemoryEntityStore {
	return &InMemoryEntityStore{
		entities:    make(map[string]map[string]world.EntityItem),
		revisions:   make(map[string]map[string][]world.EntityRevision),
		entityTrees: make(map[string]map[string]world.EditTree),
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

func (s *InMemoryEntityStore) GetRevisions(projectID, entityID string) []world.EntityRevision {
	s.mu.RLock()
	defer s.mu.RUnlock()

	pMap, ok := s.revisions[projectID]
	if !ok {
		return []world.EntityRevision{}
	}
	revs, ok := pMap[entityID]
	if !ok {
		return []world.EntityRevision{}
	}
	res := make([]world.EntityRevision, len(revs))
	copy(res, revs)
	return res
}

func (s *InMemoryEntityStore) RecordRevision(projectID string, revision world.EntityRevision) world.EntityRevision {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.revisions[projectID]; !ok {
		s.revisions[projectID] = make(map[string][]world.EntityRevision)
	}
	s.revisions[projectID][revision.EntityID] = append(s.revisions[projectID][revision.EntityID], revision)
	return revision
}

func (s *InMemoryEntityStore) GetRevision(projectID, entityID, revisionID string) (*world.EntityRevision, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	pMap, ok := s.revisions[projectID]
	if !ok {
		return nil, false
	}
	revs, ok := pMap[entityID]
	if !ok {
		return nil, false
	}
	for _, r := range revs {
		if r.ID == revisionID {
			return &r, true
		}
	}
	return nil, false
}

func (s *InMemoryEntityStore) GetEntityTree(projectID, entityID string) (*world.EditTree, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	pMap, ok := s.entityTrees[projectID]
	if !ok {
		return nil, false
	}
	tree, found := pMap[entityID]
	if !found {
		return nil, false
	}
	return &tree, true
}

func (s *InMemoryEntityStore) SaveEntityTree(projectID, entityID string, tree world.EditTree) world.EditTree {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.entityTrees[projectID]; !ok {
		s.entityTrees[projectID] = make(map[string]world.EditTree)
	}
	s.entityTrees[projectID][entityID] = tree
	return tree
}

// EntityHandler handles REST operations for Entities and their bitemporal revisions.
type EntityHandler struct {
	store          EntityStore
	blueprintStore BlueprintStore
	timelineStore  TimelineStore
}

// NewEntityHandler creates a new EntityHandler.
func NewEntityHandler(store EntityStore, bpStore BlueprintStore, tlStore ...TimelineStore) *EntityHandler {
	if store == nil {
		store = NewInMemoryEntityStore()
	}
	if bpStore == nil {
		bpStore = NewInMemoryBlueprintStore()
	}
	var tl TimelineStore
	if len(tlStore) > 0 && tlStore[0] != nil {
		tl = tlStore[0]
	} else {
		tl = NewInMemoryTimelineStore()
	}
	return &EntityHandler{
		store:          store,
		blueprintStore: bpStore,
		timelineStore:  tl,
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

	// Record initial creation revision
	patch := world.ComputeEntityPatch(nil, saved)
	rev := world.EntityRevision{
		ID:               world.GenerateRevisionID(),
		EntityID:         saved.ID,
		ProjectID:        projectID,
		ParentRevisionID: nil,
		RevisionNumber:   0,
		CreatedAt:        time.Now().UTC().Format(time.RFC3339Nano),
		Type:             world.RevTypeBaselineEdit,
		AuthorNote:       "Initial entity instantiation",
		Patch:            patch,
		Snapshot:         saved,
	}
	h.store.RecordRevision(projectID, rev)

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

	// Record update revision
	history := h.store.GetRevisions(projectID, entityID)
	var parentID *string
	if len(history) > 0 {
		pID := history[len(history)-1].ID
		parentID = &pID
	}

	patch := world.ComputeEntityPatch(existing, saved)
	rev := world.EntityRevision{
		ID:               world.GenerateRevisionID(),
		EntityID:         saved.ID,
		ProjectID:        projectID,
		ParentRevisionID: parentID,
		RevisionNumber:   len(history),
		CreatedAt:        time.Now().UTC().Format(time.RFC3339Nano),
		Type:             world.RevTypeBaselineEdit,
		AuthorNote:       "Direct entity property update",
		Patch:            patch,
		Snapshot:         saved,
	}
	h.store.RecordRevision(projectID, rev)

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

// ListRevisions handles GET /api/v1/projects/{projectId}/entities/{entityId}/revisions
func (h *EntityHandler) ListRevisions(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	entityID := chi.URLParam(r, "entityId")

	_, found := h.store.Get(projectID, entityID)
	if !found {
		httputil.RespondNotFound(w, r, "Entity", entityID)
		return
	}

	params := httputil.ParsePaginationParams(r)
	revs := h.store.GetRevisions(projectID, entityID)

	// Sort in reverse chronological order (newest first)
	sort.Slice(revs, func(i, j int) bool {
		return revs[i].RevisionNumber > revs[j].RevisionNumber
	})

	totalCount := len(revs)
	start := (params.Page - 1) * params.PageSize
	end := start + params.PageSize

	var paginated []world.EntityRevision
	if start >= totalCount {
		paginated = []world.EntityRevision{}
	} else {
		if end > totalCount {
			end = totalCount
		}
		paginated = revs[start:end]
	}

	httputil.RespondPaginatedJSON(w, r, paginated, totalCount, params)
}

// CreateRevision handles POST /api/v1/projects/{projectId}/entities/{entityId}/revisions
func (h *EntityHandler) CreateRevision(w http.ResponseWriter, r *http.Request) {
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

	var req struct {
		Type       world.RevisionType `json:"type"`
		AuthorNote string             `json:"authorNote"`
		Entity     world.EntityItem   `json:"entity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	if req.Type == "" {
		req.Type = world.RevTypeTypoFix
	}

	req.Entity.ID = entityID
	req.Entity.ProjectID = projectID
	if req.Entity.BlueprintID == "" {
		req.Entity.BlueprintID = existing.BlueprintID
	}

	bp, found := h.blueprintStore.Get(projectID, req.Entity.BlueprintID)
	if !found {
		httputil.RespondNotFound(w, r, "Blueprint", req.Entity.BlueprintID)
		return
	}

	sanitized, errs := world.ValidateAndSanitizeEntityItem(*bp, req.Entity)
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

	history := h.store.GetRevisions(projectID, entityID)
	var parentID *string
	if len(history) > 0 {
		pID := history[len(history)-1].ID
		parentID = &pID
	}

	patch := world.ComputeEntityPatch(existing, saved)
	rev := world.EntityRevision{
		ID:               world.GenerateRevisionID(),
		EntityID:         saved.ID,
		ProjectID:        projectID,
		ParentRevisionID: parentID,
		RevisionNumber:   len(history),
		CreatedAt:        time.Now().UTC().Format(time.RFC3339Nano),
		Type:             req.Type,
		AuthorNote:       req.AuthorNote,
		Patch:            patch,
		Snapshot:         saved,
	}

	savedRev := h.store.RecordRevision(projectID, rev)
	httputil.RespondJSON(w, r, http.StatusCreated, savedRev)
}

// RevertRevision handles POST /api/v1/projects/{projectId}/entities/{entityId}/revisions/{revisionId}/revert
func (h *EntityHandler) RevertRevision(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	entityID := chi.URLParam(r, "entityId")
	revisionID := chi.URLParam(r, "revisionId")

	existing, found := h.store.Get(projectID, entityID)
	if !found {
		httputil.RespondNotFound(w, r, "Entity", entityID)
		return
	}

	targetRev, foundRev := h.store.GetRevision(projectID, entityID, revisionID)
	if !foundRev {
		httputil.RespondNotFound(w, r, "Revision", revisionID)
		return
	}

	restoredSnapshot := world.CloneEntityItem(targetRev.Snapshot)
	restoredSnapshot.ID = entityID
	restoredSnapshot.ProjectID = projectID

	saved := h.store.Save(projectID, restoredSnapshot)

	history := h.store.GetRevisions(projectID, entityID)
	var parentID *string
	if len(history) > 0 {
		pID := history[len(history)-1].ID
		parentID = &pID
	}

	patch := world.ComputeEntityPatch(existing, saved)
	revertRev := world.EntityRevision{
		ID:               world.GenerateRevisionID(),
		EntityID:         saved.ID,
		ProjectID:        projectID,
		ParentRevisionID: parentID,
		RevisionNumber:   len(history),
		CreatedAt:        time.Now().UTC().Format(time.RFC3339Nano),
		Type:             world.RevTypeRevert,
		AuthorNote:       fmt.Sprintf("Reverted to revision #%d (%s)", targetRev.RevisionNumber, targetRev.ID),
		Patch:            patch,
		Snapshot:         saved,
	}

	recorded := h.store.RecordRevision(projectID, revertRev)

	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"restoredEntity": saved,
		"revision":       recorded,
	})
}

// ResolveCoordinate handles GET /api/v1/projects/{projectId}/entities/{entityId}/coordinate?sequenceNumber={seq}&revisionId={rev}
func (h *EntityHandler) ResolveCoordinate(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	entityID := chi.URLParam(r, "entityId")

	_, found := h.store.Get(projectID, entityID)
	if !found {
		httputil.RespondNotFound(w, r, "Entity", entityID)
		return
	}

	revisionID := r.URL.Query().Get("revisionId")
	seqStr := r.URL.Query().Get("sequenceNumber")
	targetSeq := 0
	if seqStr != "" {
		fmt.Sscanf(seqStr, "%d", &targetSeq)
	}

	var baseRev *world.EntityRevision
	if revisionID != "" {
		rItem, ok := h.store.GetRevision(projectID, entityID, revisionID)
		if !ok {
			httputil.RespondNotFound(w, r, "Revision", revisionID)
			return
		}
		baseRev = rItem
	} else {
		history := h.store.GetRevisions(projectID, entityID)
		if len(history) > 0 {
			baseRev = &history[len(history)-1]
		}
	}

	var events []world.TimelineEvent
	if h.timelineStore != nil {
		events = h.timelineStore.ListEvents(projectID)
	}

	resolved := world.ResolveBitemporalCoordinate(baseRev, targetSeq, events)
	httputil.RespondJSON(w, r, http.StatusOK, resolved)
}

// GetTree handles GET /api/v1/projects/{projectId}/entities/{entityId}/tree
func (h *EntityHandler) GetTree(w http.ResponseWriter, r *http.Request) {
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

	tree, treeFound := h.store.GetEntityTree(projectID, entityID)
	if !treeFound {
		t := world.NewEditTree(*ent, "Root Entity (ED0)", "Initial entity creation", world.RevTypeBaselineEdit)
		tree = &t
		h.store.SaveEntityTree(projectID, entityID, t)
	}

	httputil.RespondJSON(w, r, http.StatusOK, tree)
}

// AddEdit handles POST /api/v1/projects/{projectId}/entities/{entityId}/edits
func (h *EntityHandler) AddEdit(w http.ResponseWriter, r *http.Request) {
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

	var req struct {
		Label          string             `json:"label"`
		AuthorNote     string             `json:"authorNote"`
		Type           world.RevisionType `json:"type"`
		TargetParentID *string            `json:"targetParentId"`
		Entity         world.EntityItem   `json:"entity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	if req.Type == "" {
		req.Type = world.RevTypeBaselineEdit
	}
	req.Entity.ID = entityID
	req.Entity.ProjectID = projectID
	if req.Entity.BlueprintID == "" {
		req.Entity.BlueprintID = ent.BlueprintID
	}

	bp, bpFound := h.blueprintStore.Get(projectID, req.Entity.BlueprintID)
	if !bpFound {
		httputil.RespondNotFound(w, r, "Blueprint", req.Entity.BlueprintID)
		return
	}

	sanitized, errs := world.ValidateAndSanitizeEntityItem(*bp, req.Entity)
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

	tree, treeFound := h.store.GetEntityTree(projectID, entityID)
	if !treeFound {
		t := world.NewEditTree(*ent, "Root Entity (ED0)", "Initial entity creation", world.RevTypeBaselineEdit)
		tree = &t
	}

	newNode, err := world.AddEditNode(tree, saved, req.Label, req.AuthorNote, req.Type, req.TargetParentID)
	if err != nil {
		httputil.RespondBadRequest(w, r, err.Error(), "INVALID_EDIT_NODE")
		return
	}

	h.store.SaveEntityTree(projectID, entityID, *tree)

	httputil.RespondJSON(w, r, http.StatusCreated, map[string]interface{}{
		"node":     newNode,
		"editTree": tree,
		"entity":   saved,
	})
}

// CheckoutEdit handles POST /api/v1/projects/{projectId}/entities/{entityId}/edits/{editId}/checkout
func (h *EntityHandler) CheckoutEdit(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}
	entityID := chi.URLParam(r, "entityId")
	editID := chi.URLParam(r, "editId")

	ent, found := h.store.Get(projectID, entityID)
	if !found {
		httputil.RespondNotFound(w, r, "Entity", entityID)
		return
	}

	tree, treeFound := h.store.GetEntityTree(projectID, entityID)
	if !treeFound {
		t := world.NewEditTree(*ent, "Root Entity (ED0)", "Initial entity creation", world.RevTypeBaselineEdit)
		tree = &t
	}

	node, err := world.CheckoutEditHead(tree, editID)
	if err != nil {
		httputil.RespondNotFound(w, r, "EditNode", editID)
		return
	}

	h.store.SaveEntityTree(projectID, entityID, *tree)

	// Restore snapshot to active entity state
	if snapBytes, errJSON := json.Marshal(node.Snapshot); errJSON == nil {
		var restoredEntity world.EntityItem
		if errUnmarshal := json.Unmarshal(snapBytes, &restoredEntity); errUnmarshal == nil && restoredEntity.ID != "" {
			restoredEntity.ID = entityID
			restoredEntity.ProjectID = projectID
			h.store.Save(projectID, restoredEntity)
		}
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"activeEditId": tree.ActiveEditID,
		"node":         node,
		"editTree":     tree,
	})
}


