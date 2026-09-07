package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/world"
)

// Block Standard: BLOCK_API_WORLD_BRIDGE_001

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
	var req world.ContinuityAuditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	resp := world.AuditContinuity(req, h.events, h.rules, h.baseEntities)
	httputil.RespondJSON(w, r, http.StatusOK, resp)
}

// HandleSceneGrounding processes POST /api/v1/bridge/ground
func (h *WorldBridgeHandler) HandleSceneGrounding(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProjectID            string   `json:"projectId"`
		SceneID              string   `json:"sceneId"`
		TargetSequenceNumber int      `json:"targetSequenceNumber"`
		MentionedEntityIDs   []string `json:"mentionedEntityIds"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
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

	if foldedStates == nil {
		foldedStates = []world.FoldedEntityState{}
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"sceneId":        req.SceneID,
		"sequenceNumber": req.TargetSequenceNumber,
		"foldedStates":   foldedStates,
	})
}

// HandleEntityMentions processes POST /api/v1/bridge/mentions for autocomplete search
func (h *WorldBridgeHandler) HandleEntityMentions(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProjectID     string   `json:"projectId"`
		QueryToken    string   `json:"queryToken"`
		CategoryLimit []string `json:"categoryLimit,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondBadRequest(w, r, fmt.Sprintf("Malformed JSON payload: %v", err), "MALFORMED_JSON")
		return
	}

	token := strings.ToLower(strings.TrimSpace(req.QueryToken))
	var matches []map[string]interface{}

	for _, ent := range h.baseEntities {
		if token != "" && !strings.Contains(strings.ToLower(ent.EntityName), token) {
			continue
		}

		if len(req.CategoryLimit) > 0 {
			categoryAllowed := false
			for _, cat := range req.CategoryLimit {
				if strings.EqualFold(ent.Category, cat) {
					categoryAllowed = true
					break
				}
			}
			if !categoryAllowed {
				continue
			}
		}

		status := "Active"
		if s, ok := ent.ComputedProperties["status"].(string); ok && s != "" {
			status = s
		}

		matches = append(matches, map[string]interface{}{
			"entityId":             ent.EntityID,
			"name":                 ent.EntityName,
			"category":             ent.Category,
			"snippet":              fmt.Sprintf("%s (%s)", ent.EntityName, ent.Category),
			"currentRealmOrStatus": status,
		})
	}

	if matches == nil {
		matches = []map[string]interface{}{}
	}

	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"queryToken": req.QueryToken,
		"matches":    matches,
	})
}
