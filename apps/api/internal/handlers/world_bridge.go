package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
)

// WorldBridgeHandler handles cross-domain RPC requests from Prose Studio.
type WorldBridgeHandler struct {
	events       []world.TimelineEvent
	rules        []world.InvariantRule
	baseEntities []world.FoldedEntityState
}

// NewWorldBridgeHandler constructs a handler with universe state context.
func NewWorldBridgeHandler(
	events []world.TimelineEvent,
	rules []world.InvariantRule,
	baseEntities []world.FoldedEntityState,
) *WorldBridgeHandler {
	return &WorldBridgeHandler{
		events:       events,
		rules:        rules,
		baseEntities: baseEntities,
	}
}

// HandleContinuityAudit processes POST /api/v1/bridge/audit
func (h *WorldBridgeHandler) HandleContinuityAudit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req world.ContinuityAuditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	resp := world.AuditContinuity(req, h.events, h.rules, h.baseEntities)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// HandleSceneGrounding processes POST /api/v1/bridge/ground
func (h *WorldBridgeHandler) HandleSceneGrounding(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ProjectID            string   `json:"projectId"`
		SceneID              string   `json:"sceneId"`
		TargetSequenceNumber int      `json:"targetSequenceNumber"`
		MentionedEntityIDs   []string `json:"mentionedEntityIds"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	foldedMap := world.FoldStateAtSequence(h.events, req.TargetSequenceNumber, h.baseEntities)

	var foldedStates []world.FoldedEntityState
	if len(req.MentionedEntityIDs) > 0 {
		for _, id := range req.MentionedEntityIDs {
			if s, ok := foldedMap[id]; ok {
				foldedStates = append(foldedStates, s)
			}
		}
	} else {
		for _, s := range foldedMap {
			foldedStates = append(foldedStates, s)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"sceneId":        req.SceneID,
		"sequenceNumber": req.TargetSequenceNumber,
		"foldedStates":   foldedStates,
	})
}
