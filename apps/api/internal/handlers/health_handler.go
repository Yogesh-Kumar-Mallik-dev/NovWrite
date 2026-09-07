package handlers

import (
	"net/http"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
)

// Block Standard: BLOCK_API_HEALTH_HANDLER_001

type HealthHandler struct {
	startTime time.Time
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{startTime: time.Now()}
}

// Healthz handles GET /healthz
func (h *HealthHandler) Healthz(w http.ResponseWriter, r *http.Request) {
	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"service":   "novwrite-api",
		"uptimeSec": int(time.Since(h.startTime).Seconds()),
	})
}

// Livez handles GET /livez (Kubernetes / Container liveness probe)
func (h *HealthHandler) Livez(w http.ResponseWriter, r *http.Request) {
	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"status": "alive",
	})
}

// Readyz handles GET /readyz (Kubernetes / Container readiness probe)
func (h *HealthHandler) Readyz(w http.ResponseWriter, r *http.Request) {
	httputil.RespondJSON(w, r, http.StatusOK, map[string]interface{}{
		"status": "ready",
		"checks": map[string]string{
			"memory":   "ok",
			"universe": "ok",
		},
	})
}
