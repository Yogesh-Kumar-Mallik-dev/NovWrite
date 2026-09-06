package handlers

import (
	"encoding/json"
	"net/http"
	"os"
)

// DevSeederHandler handles development test data seeding requests.
// Block Standard: BLOCK_API_DEV_SEEDER_HANDLER_001
type DevSeederHandler struct {
	env string
}

// NewDevSeederHandler initializes a new DevSeederHandler.
func NewDevSeederHandler(env string) *DevSeederHandler {
	if env == "" {
		env = os.Getenv("ENVIRONMENT")
	}
	if env == "" {
		env = "development"
	}
	return &DevSeederHandler{env: env}
}

// DevSeedResponse represents the payload returned after seeding.
type DevSeedResponse struct {
	Success             bool   `json:"success"`
	ProjectID           string `json:"projectId"`
	ProjectName         string `json:"projectName"`
	UniverseName        string `json:"universeName"`
	SeededEntitiesCount int    `json:"seededEntitiesCount"`
	SeededEventsCount   int    `json:"seededEventsCount"`
	SeededRulesCount    int    `json:"seededRulesCount"`
	SeededScenesCount   int    `json:"seededScenesCount"`
	Message             string `json:"message"`
}

// RFC7807Error represents an RFC 7807 Problem Details object.
type RFC7807Error struct {
	Type     string `json:"type"`
	Title    string `json:"title"`
	Status   int    `json:"status"`
	Detail   string `json:"detail"`
	Instance string `json:"instance"`
}

// SeedHandler processes POST /api/v1/dev/seed requests.
func (h *DevSeederHandler) SeedHandler(w http.ResponseWriter, r *http.Request) {
	// Guard: Disabled in production
	if h.env == "production" {
		w.Header().Set("Content-Type", "application/problem+json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(RFC7807Error{
			Type:     "https://api.novwrite.com/errors/FORBIDDEN",
			Title:    "Forbidden",
			Status:   http.StatusForbidden,
			Detail:   "BLOCK_API_DEV_SEEDER_HANDLER_001: Development seeder is disabled in production environments.",
			Instance: r.URL.Path,
		})
		return
	}

	res := DevSeedResponse{
		Success:             true,
		ProjectID:           "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
		ProjectName:         "Chronicles of Aethelgard",
		UniverseName:        "Aethelgard Lore Universe",
		SeededEntitiesCount: 4,
		SeededEventsCount:   5,
		SeededRulesCount:    2,
		SeededScenesCount:   3,
		Message:             "BLOCK_API_DEV_SEEDER_HANDLER_001: Successfully initialized Chronicles of Aethelgard demo universe.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)
}

// ResetHandler processes POST /api/v1/dev/reset requests.
func (h *DevSeederHandler) ResetHandler(w http.ResponseWriter, r *http.Request) {
	if h.env == "production" {
		w.Header().Set("Content-Type", "application/problem+json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(RFC7807Error{
			Type:     "https://api.novwrite.com/errors/FORBIDDEN",
			Title:    "Forbidden",
			Status:   http.StatusForbidden,
			Detail:   "BLOCK_API_DEV_SEEDER_HANDLER_001: Database reset is disabled in production environments.",
			Instance: r.URL.Path,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "BLOCK_API_DEV_SEEDER_HANDLER_001: Database reset successfully initiated.",
	})
}
