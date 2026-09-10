package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_API_TIMELINE_HANDLER_001

type TimelineStore interface {
	ListEvents(projectID string) []world.TimelineEvent
	GetEvent(projectID, eventID string) (*world.TimelineEvent, bool)
	AddEvent(projectID string, event world.TimelineEvent) world.TimelineEvent
	UpdateEvent(projectID string, event world.TimelineEvent) (*world.TimelineEvent, bool)
	DeleteEvent(projectID, eventID string) bool

	// Hanging Edit Tree Methods
	GetEventTree(projectID, eventID string) (*world.EditTree, bool)
	SaveEventTree(projectID, eventID string, tree world.EditTree) world.EditTree
}

type InMemoryTimelineStore struct {
	mu         sync.RWMutex
	events     map[string]map[string]world.TimelineEvent // projectID -> eventID -> TimelineEvent
	eventTrees map[string]map[string]world.EditTree      // projectID -> eventID -> EditTree
}

func NewInMemoryTimelineStore() *InMemoryTimelineStore {
	return &InMemoryTimelineStore{
		events:     make(map[string]map[string]world.TimelineEvent),
		eventTrees: make(map[string]map[string]world.EditTree),
	}
}

func (s *InMemoryTimelineStore) ListEvents(projectID string) []world.TimelineEvent {
	s.mu.RLock()
	defer s.mu.RUnlock()

	pMap, ok := s.events[projectID]
	if !ok {
		return []world.TimelineEvent{}
	}
	result := make([]world.TimelineEvent, 0, len(pMap))
	for _, ev := range pMap {
		result = append(result, ev)
	}
	return result
}

func (s *InMemoryTimelineStore) GetEvent(projectID, eventID string) (*world.TimelineEvent, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	pMap, ok := s.events[projectID]
	if !ok {
		return nil, false
	}
	ev, found := pMap[eventID]
	if !found {
		return nil, false
	}
	return &ev, true
}

var timelineSeq uint64

func (s *InMemoryTimelineStore) AddEvent(projectID string, event world.TimelineEvent) world.TimelineEvent {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.events[projectID]; !ok {
		s.events[projectID] = make(map[string]world.TimelineEvent)
	}
	if _, ok := s.eventTrees[projectID]; !ok {
		s.eventTrees[projectID] = make(map[string]world.EditTree)
	}

	if event.ID == "" {
		event.ID = fmt.Sprintf("ev_%d_%d", time.Now().UnixNano(), atomic.AddUint64(&timelineSeq, 1))
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}

	s.events[projectID][event.ID] = event

	// Automatically initialize hanging edit tree with root node ED0
	if _, exists := s.eventTrees[projectID][event.ID]; !exists {
		tree := world.NewEditTree(event, "Root Event (ED0)", "Initial event instantiation", world.RevTypeBaselineEdit)
		s.eventTrees[projectID][event.ID] = tree
	}

	return event
}

func (s *InMemoryTimelineStore) UpdateEvent(projectID string, event world.TimelineEvent) (*world.TimelineEvent, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pMap, ok := s.events[projectID]
	if !ok {
		return nil, false
	}
	if _, exists := pMap[event.ID]; !exists {
		return nil, false
	}
	s.events[projectID][event.ID] = event
	return &event, true
}

func (s *InMemoryTimelineStore) DeleteEvent(projectID, eventID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pMap, ok := s.events[projectID]
	if !ok {
		return false
	}
	if _, exists := pMap[eventID]; !exists {
		return false
	}
	delete(pMap, eventID)
	if tMap, okTree := s.eventTrees[projectID]; okTree {
		delete(tMap, eventID)
	}
	return true
}

func (s *InMemoryTimelineStore) GetEventTree(projectID, eventID string) (*world.EditTree, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tMap, ok := s.eventTrees[projectID]
	if !ok {
		return nil, false
	}
	tree, found := tMap[eventID]
	if !found {
		return nil, false
	}
	return &tree, true
}

func (s *InMemoryTimelineStore) SaveEventTree(projectID, eventID string, tree world.EditTree) world.EditTree {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.eventTrees[projectID]; !ok {
		s.eventTrees[projectID] = make(map[string]world.EditTree)
	}
	s.eventTrees[projectID][eventID] = tree
	return tree
}

type TimelineHandler struct {
	timelineStore TimelineStore
	entityStore   EntityStore
	projectStore  ProjectStore
}

func NewTimelineHandler(tStore TimelineStore, eStore EntityStore, projectStore ...ProjectStore) *TimelineHandler {
	if tStore == nil {
		tStore = NewInMemoryTimelineStore()
	}
	if eStore == nil {
		eStore = NewInMemoryEntityStore()
	}
	var pStore ProjectStore
	if len(projectStore) > 0 {
		pStore = projectStore[0]
	}
	return &TimelineHandler{
		timelineStore: tStore,
		entityStore:   eStore,
		projectStore:  pStore,
	}
}

// ListEvents handles GET /api/v1/projects/{projectId}/timeline/events
func (h *TimelineHandler) ListEvents(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = r.URL.Query().Get("projectId")
	}
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}

	params := httputil.ParsePaginationParams(r)
	allEvents := h.timelineStore.ListEvents(projectID)

	// Filter
	var filtered []world.TimelineEvent
	for _, ev := range allEvents {
		if params.Search != "" {
			term := strings.ToLower(params.Search)
			descStr := ""
			if ev.Description != nil {
				descStr = strings.ToLower(*ev.Description)
			}
			if !strings.Contains(strings.ToLower(ev.Title), term) && !strings.Contains(descStr, term) {
				continue
			}
		}
		filtered = append(filtered, ev)
	}

	if filtered == nil {
		filtered = []world.TimelineEvent{}
	}

	// Sort by NarrativeSequenceNumber ascending by default
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].NarrativeSequenceNumber < filtered[j].NarrativeSequenceNumber
	})

	totalCount := len(filtered)
	start := (params.Page - 1) * params.PageSize
	end := start + params.PageSize

	var paginated []world.TimelineEvent
	if start >= totalCount {
		paginated = []world.TimelineEvent{}
	} else {
		if end > totalCount {
			end = totalCount
		}
		paginated = filtered[start:end]
	}

	httputil.RespondPaginatedJSON(w, r, paginated, totalCount, params)
}

// GetEvent handles GET /api/v1/projects/{projectId}/timeline/events/{eventId}
func (h *TimelineHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}
	eventID := chi.URLParam(r, "eventId")

	ev, found := h.timelineStore.GetEvent(projectID, eventID)
	if !found {
		httputil.RespondNotFound(w, r, "TimelineEvent", eventID)
		return
	}

	httputil.RespondJSON(w, r, http.StatusOK, ev)
}

// CreateEvent handles POST /api/v1/projects/{projectId}/timeline/events
func (h *TimelineHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}

	var rawEvent world.TimelineEvent
	if err := json.NewDecoder(r.Body).Decode(&rawEvent); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	rawEvent.ProjectID = projectID
	if rawEvent.Title == "" {
		httputil.RespondValidationProblem(w, r, "Event title is required.", []httputil.InvalidParam{
			{Name: "title", Reason: "Title cannot be empty.", ReceivedValue: ""},
		})
		return
	}

	saved := h.timelineStore.AddEvent(projectID, rawEvent)
	locationURI := fmt.Sprintf("/api/v1/projects/%s/timeline/events/%s", projectID, saved.ID)
	httputil.RespondCreated(w, r, locationURI, saved)
}

// UpdateEvent handles PUT /api/v1/projects/{projectId}/timeline/events/{eventId}
func (h *TimelineHandler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}
	eventID := chi.URLParam(r, "eventId")

	existing, found := h.timelineStore.GetEvent(projectID, eventID)
	if !found {
		httputil.RespondNotFound(w, r, "TimelineEvent", eventID)
		return
	}

	var rawEvent world.TimelineEvent
	if err := json.NewDecoder(r.Body).Decode(&rawEvent); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	rawEvent.ID = eventID
	rawEvent.ProjectID = projectID
	if rawEvent.Title == "" {
		rawEvent.Title = existing.Title
	}

	updated, _ := h.timelineStore.UpdateEvent(projectID, rawEvent)

	// Add an edit node to the hanging tree
	tree, ok := h.timelineStore.GetEventTree(projectID, eventID)
	if ok {
		_, _ = world.AddEditNode(tree, rawEvent, "", "Direct event update", world.RevTypeBaselineEdit, nil)
		h.timelineStore.SaveEventTree(projectID, eventID, *tree)
	}

	httputil.RespondJSON(w, r, http.StatusOK, updated)
}

// DeleteEvent handles DELETE /api/v1/projects/{projectId}/timeline/events/{eventId}
func (h *TimelineHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}
	eventID := chi.URLParam(r, "eventId")

	deleted := h.timelineStore.DeleteEvent(projectID, eventID)
	if !deleted {
		httputil.RespondNotFound(w, r, "TimelineEvent", eventID)
		return
	}

	httputil.RespondNoContent(w)
}

// GetPipe handles GET /api/v1/projects/{projectId}/timeline/pipe
// Returns the full UPDATE horizontal pipe with all events, their hanging Edit Trees, and active EDIT heads.
func (h *TimelineHandler) GetPipe(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}

	events := h.timelineStore.ListEvents(projectID)

	// Sort sequentially along the UPDATE pipe
	sort.Slice(events, func(i, j int) bool {
		return events[i].NarrativeSequenceNumber < events[j].NarrativeSequenceNumber
	})

	var pipeItems []world.TimelineEventWithTree
	for _, ev := range events {
		tree, found := h.timelineStore.GetEventTree(projectID, ev.ID)
		if !found {
			t := world.NewEditTree(ev, "Root Event (ED0)", "Initial instantiation", world.RevTypeBaselineEdit)
			tree = &t
			h.timelineStore.SaveEventTree(projectID, ev.ID, t)
		}
		pipeItems = append(pipeItems, world.TimelineEventWithTree{
			Event:    ev,
			EditTree: *tree,
		})
	}

	if pipeItems == nil {
		pipeItems = []world.TimelineEventWithTree{}
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"projectId":   projectID,
		"eventsCount": len(pipeItems),
		"pipe":        pipeItems,
	})
}

// GetEventTree handles GET /api/v1/projects/{projectId}/timeline/events/{eventId}/tree
func (h *TimelineHandler) GetEventTree(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}
	eventID := chi.URLParam(r, "eventId")

	ev, found := h.timelineStore.GetEvent(projectID, eventID)
	if !found {
		httputil.RespondNotFound(w, r, "TimelineEvent", eventID)
		return
	}

	tree, treeFound := h.timelineStore.GetEventTree(projectID, eventID)
	if !treeFound {
		t := world.NewEditTree(*ev, "Root Event (ED0)", "Initial instantiation", world.RevTypeBaselineEdit)
		tree = &t
		h.timelineStore.SaveEventTree(projectID, eventID, t)
	}

	httputil.RespondJSON(w, r, http.StatusOK, tree)
}

// AddEventEdit handles POST /api/v1/projects/{projectId}/timeline/events/{eventId}/edits
// Appends a new edit node branching from targetParentId (or active EDIT head) and updates the active head.
func (h *TimelineHandler) AddEventEdit(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}
	eventID := chi.URLParam(r, "eventId")

	ev, found := h.timelineStore.GetEvent(projectID, eventID)
	if !found {
		httputil.RespondNotFound(w, r, "TimelineEvent", eventID)
		return
	}

	var req struct {
		Label          string             `json:"label"`
		AuthorNote     string             `json:"authorNote"`
		Type           world.RevisionType `json:"type"`
		TargetParentID *string            `json:"targetParentId"`
		Snapshot       world.TimelineEvent `json:"snapshot"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	if req.Snapshot.ID == "" {
		req.Snapshot.ID = eventID
	}
	req.Snapshot.ProjectID = projectID

	tree, treeFound := h.timelineStore.GetEventTree(projectID, eventID)
	if !treeFound {
		t := world.NewEditTree(*ev, "Root Event (ED0)", "Initial instantiation", world.RevTypeBaselineEdit)
		tree = &t
	}

	newNode, err := world.AddEditNode(tree, req.Snapshot, req.Label, req.AuthorNote, req.Type, req.TargetParentID)
	if err != nil {
		httputil.RespondBadRequest(w, r, err.Error(), "INVALID_EDIT_NODE")
		return
	}

	// Update tree and base event with the new active head snapshot
	h.timelineStore.SaveEventTree(projectID, eventID, *tree)
	h.timelineStore.UpdateEvent(projectID, req.Snapshot)

	httputil.RespondJSON(w, r, http.StatusCreated, map[string]interface{}{
		"node":     newNode,
		"editTree": tree,
	})
}

// CheckoutEventEdit handles POST /api/v1/projects/{projectId}/timeline/events/{eventId}/edits/{editId}/checkout
// Checks out an edit node non-destructively as the active EDIT head without deleting any child branches.
func (h *TimelineHandler) CheckoutEventEdit(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}
	eventID := chi.URLParam(r, "eventId")
	editID := chi.URLParam(r, "editId")

	ev, found := h.timelineStore.GetEvent(projectID, eventID)
	if !found {
		httputil.RespondNotFound(w, r, "TimelineEvent", eventID)
		return
	}

	tree, treeFound := h.timelineStore.GetEventTree(projectID, eventID)
	if !treeFound {
		t := world.NewEditTree(*ev, "Root Event (ED0)", "Initial instantiation", world.RevTypeBaselineEdit)
		tree = &t
	}

	node, err := world.CheckoutEditHead(tree, editID)
	if err != nil {
		httputil.RespondNotFound(w, r, "EditNode", editID)
		return
	}

	h.timelineStore.SaveEventTree(projectID, eventID, *tree)

	// If snapshot is a TimelineEvent or map, restore it into active event
	if snapBytes, errJSON := json.Marshal(node.Snapshot); errJSON == nil {
		var restoredEvent world.TimelineEvent
		if errUnmarshal := json.Unmarshal(snapBytes, &restoredEvent); errUnmarshal == nil && restoredEvent.Title != "" {
			restoredEvent.ID = eventID
			restoredEvent.ProjectID = projectID
			h.timelineStore.UpdateEvent(projectID, restoredEvent)
		}
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"activeEditId": tree.ActiveEditID,
		"node":         node,
		"editTree":     tree,
	})
}

// GetState handles GET /api/v1/projects/{projectId}/timeline/state?seq=100
func (h *TimelineHandler) GetState(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if _, ok := ValidateProjectAccess(w, r, h.projectStore, projectID); !ok {
		return
	}

	seqStr := r.URL.Query().Get("seq")
	targetSeq := 999999
	if seqStr != "" {
		if s, err := strconv.Atoi(seqStr); err == nil {
			targetSeq = s
		}
	}

	events := h.timelineStore.ListEvents(projectID)
	baseEntitiesRaw := h.entityStore.List(projectID)

	var baseFolded []world.FoldedEntityState
	for _, ent := range baseEntitiesRaw {
		baseFolded = append(baseFolded, world.FoldedEntityState{
			EntityID:           ent.ID,
			EntityName:         ent.Name,
			Category:           ent.Category,
			ComputedProperties: ent.Properties,
		})
	}

	foldedMap := world.FoldStateAtSequence(events, targetSeq, baseFolded)
	var foldedList []world.FoldedEntityState
	for _, s := range foldedMap {
		foldedList = append(foldedList, s)
	}

	if foldedList == nil {
		foldedList = []world.FoldedEntityState{}
	}

	// Stable sort by name
	sort.Slice(foldedList, func(i, j int) bool {
		return foldedList[i].EntityName < foldedList[j].EntityName
	})

	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"projectId":      projectID,
		"sequenceNumber": targetSeq,
		"entities":       foldedList,
	})
}
