package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
)

// Block Standard: BLOCK_API_EVENT_HUB_001

// SSEEvent represents a single Server-Sent Event broadcast over the realtime sync stream.
type SSEEvent struct {
	ID        string      `json:"id,omitempty"`
	Event     string      `json:"event"`
	ProjectID string      `json:"projectId,omitempty"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}

// EventHub manages realtime SSE client subscriptions and project-scoped event broadcasts.
type EventHub struct {
	mu      sync.RWMutex
	clients map[chan SSEEvent]string // channel -> projectID filter ("" matches all)
}

// NewEventHub creates a new thread-safe event hub.
func NewEventHub() *EventHub {
	return &EventHub{
		clients: make(map[chan SSEEvent]string),
	}
}

// Subscribe registers a client listener channel with an optional projectID filter.
// Returns the event channel and an unsubscribe cleanup function.
func (h *EventHub) Subscribe(projectID string) (chan SSEEvent, func()) {
	ch := make(chan SSEEvent, 64)

	h.mu.Lock()
	h.clients[ch] = projectID
	h.mu.Unlock()

	var once sync.Once
	unsubscribe := func() {
		once.Do(func() {
			h.mu.Lock()
			delete(h.clients, ch)
			h.mu.Unlock()
			close(ch)
		})
	}

	return ch, unsubscribe
}

// Broadcast dispatches an event to all interested subscribed clients.
func (h *EventHub) Broadcast(evt SSEEvent) {
	if evt.Timestamp.IsZero() {
		evt.Timestamp = time.Now().UTC()
	}
	if evt.ID == "" {
		evt.ID = fmt.Sprintf("evt-%x", time.Now().UnixNano())
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for ch, projectFilter := range h.clients {
		if projectFilter == "" || evt.ProjectID == "" || projectFilter == evt.ProjectID {
			select {
			case ch <- evt:
			default:
				// Buffer full; skip to avoid blocking the hub
			}
		}
	}
}

// ClientCount returns the number of active SSE listeners.
func (h *EventHub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// SSEHandler provides HTTP endpoints for real-time Server-Sent Events streams.
type SSEHandler struct {
	hub *EventHub
}

// NewSSEHandler constructs an SSE handler with the provided event hub.
func NewSSEHandler(hub *EventHub) *SSEHandler {
	return &SSEHandler{hub: hub}
}

// StreamEvents handles SSE connection handshakes and multiplexes live events.
func (h *SSEHandler) StreamEvents(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported by client connection", http.StatusInternalServerError)
		return
	}

	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		projectID = r.URL.Query().Get("projectId")
	}

	// Set required SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	ch, unsubscribe := h.hub.Subscribe(projectID)
	defer unsubscribe()

	// Send initial connected handshake event
	initEvt := SSEEvent{
		Event:     "CONNECTED",
		ProjectID: projectID,
		Payload: map[string]string{
			"status":    "READY",
			"projectID": projectID,
		},
		Timestamp: time.Now().UTC(),
	}
	initJSON, _ := json.Marshal(initEvt.Payload)
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", initEvt.Event, string(initJSON))
	flusher.Flush()

	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-heartbeat.C:
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		case evt, ok := <-ch:
			if !ok {
				return
			}
			payloadJSON, err := json.Marshal(evt.Payload)
			if err != nil {
				continue
			}
			if evt.ID != "" {
				fmt.Fprintf(w, "id: %s\n", evt.ID)
			}
			fmt.Fprintf(w, "event: %s\ndata: %s\n\n", evt.Event, string(payloadJSON))
			flusher.Flush()
		}
	}
}
