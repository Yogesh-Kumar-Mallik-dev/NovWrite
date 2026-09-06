package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// Block Standard: BLOCK_API_SERVER_MAIN_001
func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}

	r := chi.NewRouter()

	// Global Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS configuration for web and desktop
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "tauri://localhost"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","service":"novwrite-api"}`))
	})

	// Dev Seeder Handlers
	devHandler := handlers.NewDevSeederHandler(env)
	r.Route("/api/v1/dev", func(r chi.Router) {
		r.Post("/seed", devHandler.SeedHandler)
		r.Post("/reset", devHandler.ResetHandler)
	})

	// World Bridge Handlers (Demo State Context)
	bridgeHandler := handlers.NewWorldBridgeHandler(nil, nil, nil)
	r.Route("/api/v1/bridge", func(r chi.Router) {
		r.Post("/ground", bridgeHandler.HandleSceneGrounding)
		r.Post("/audit", bridgeHandler.HandleContinuityAudit)
	})

	addr := fmt.Sprintf(":%s", port)
	log.Printf("[NovWrite API] Server starting on %s (Environment: %s)", addr, env)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("[NovWrite API] Server failed: %v", err)
	}
}
