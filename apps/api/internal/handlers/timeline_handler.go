package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_API_TIMELINE_HANDLER_001

type TimelineStore interface {
	ListEvents(projectID string) []world.TimelineEvent
	AddEvent(projectID string, event world.TimelineEvent) world.TimelineEvent
}

type InMemoryTimelineStore struct {
	mu     sync.RWMutex
	events map[string][]world.TimelineEvent // projectID -> events
}

func NewInMemoryTimelineStore() *InMemoryTimelineStore {
	return &InMemoryTimelineStore{
		events: make(map[string][]world.TimelineEvent),
	}
}

func (s *InMemoryTimelineStore) ListEvents(projectID string) []world.TimelineEvent {
	s.mu.RLock()
	defer s.mu.RUnlock()

	evList, ok := s.events[projectID]
	if !ok {
		return []world.TimelineEvent{}
	}
	result := make([]world.TimelineEvent, len(evList))
	copy(result, evList)
	return result
}

func (s *InMemoryTimelineStore) AddEvent(projectID string, event world.TimelineEvent) world.TimelineEvent {
	s.mu.Lock()
	defer s.mu.Unlock()

	if event.ID == "" {
		event.ID = fmt.Sprintf("ev_%d", time.Now().UnixNano())
	}
	s.events[projectID] = append(s.events[projectID], event)
	return event
}

type TimelineHandler struct {
	timelineStore TimelineStore
	entityStore   EntityStore
}

func NewTimelineHandler(tStore TimelineStore, eStore EntityStore) *TimelineHandler {
	if tStore == nil {
		tStore = NewInMemoryTimelineStore()
	}
	if eStore == nil {
		eStore = NewInMemoryEntityStore()
	}
	return &TimelineHandler{
		timelineStore: tStore,
		entityStore:   eStore,
	}
}

// ListEvents handles GET /api/v1/projects/{projectId}/timeline/events
func (h *TimelineHandler) ListEvents(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
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

// CreateEvent handles POST /api/v1/projects/{projectId}/timeline/events
func (h *TimelineHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
	}

	var rawEvent world.TimelineEvent
	if err := json.NewDecoder(r.Body).Decode(&rawEvent); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

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

// GetState handles GET /api/v1/projects/{projectId}/timeline/state?seq=100
func (h *TimelineHandler) GetState(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = "default"
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
