package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/handlers"
	"github.com/Yogesh-Kumar-Mallik-dev/NovWrite/apps/api/internal/httputil"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// Block Standard: BLOCK_API_SERVER_MAIN_001

func getAllowedOrigins() []string {
	originsEnv := os.Getenv("CORS_ALLOWED_ORIGINS")
	if originsEnv == "" {
		return []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3000",
			"tauri://localhost",
		}
	}
	var origins []string
	for _, o := range strings.Split(originsEnv, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			origins = append(origins, o)
		}
	}
	if len(origins) == 0 {
		return []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "tauri://localhost"}
	}
	return origins
}

func BuildRouter() *chi.Mux {
	r := chi.NewRouter()

	// Global Middlewares (Observability, Security, Tracing, Recovery, Rate Limiting, Auth Context)
	r.Use(httputil.RequestIDMiddleware)
	r.Use(httputil.ResponseTimeMiddleware)
	r.Use(httputil.MaxBytesMiddleware(10 << 20)) // 10MB request body limit
	r.Use(httputil.RateLimiterMiddleware(300))  // 300 req/min token bucket rate limiter
	r.Use(httputil.SecurityHeadersMiddleware)
	r.Use(httputil.APIVersionMiddleware("1.0"))
	r.Use(httputil.JWTAuthMiddleware(os.Getenv("JWT_SECRET"), false))
	r.Use(httputil.PanicRecoveryMiddleware)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)

	// CORS configuration for web, desktop, and mobile
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   getAllowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID", "Idempotency-Key", "X-User-ID"},
		ExposedHeaders:   []string{"Link", "Location", "X-Request-ID", "X-Response-Time", "API-Version", "X-API-Version", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Initial Stores & Handlers
	projectStore := handlers.NewInMemoryProjectStore()
	blueprintStore := handlers.NewInMemoryBlueprintStore()
	entityStore := handlers.NewInMemoryEntityStore()
	timelineStore := handlers.NewInMemoryTimelineStore()
	userStore := handlers.NewInMemoryUserStore()

	healthHandler := handlers.NewHealthHandler()
	userHandler := handlers.NewUserHandler(userStore, os.Getenv("JWT_SECRET"))
	projectHandler := handlers.NewProjectHandler(projectStore)
	blueprintHandler := handlers.NewBlueprintHandler(blueprintStore, projectStore)
	entityHandler := handlers.NewEntityHandler(entityStore, blueprintStore, projectStore, timelineStore)
	timelineHandler := handlers.NewTimelineHandler(timelineStore, entityStore, projectStore)
	formulaHandler := handlers.NewFormulaHandler()
	bridgeHandler := handlers.NewWorldBridgeHandler(nil, nil, nil)

	// Health and probe endpoints (Root & Versioned)
	r.Get("/healthz", healthHandler.Healthz)
	r.Get("/livez", healthHandler.Livez)
	r.Get("/readyz", healthHandler.Readyz)

	// API v1 Routing Tree
	r.Route("/api/v1", func(r chi.Router) {
		// Health
		r.Get("/healthz", healthHandler.Healthz)
		r.Get("/livez", healthHandler.Livez)
		r.Get("/readyz", healthHandler.Readyz)

		// Authentication & Identity
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", userHandler.Register)
			r.Post("/login", userHandler.Login)
			r.Get("/me", userHandler.Me)
		})

		// Platform Administration (Admin / Super Admin)
		r.Route("/admin", func(r chi.Router) {
			r.Use(httputil.RequireAdmin())
			r.Route("/users", func(r chi.Router) {
				r.Get("/", userHandler.ListUsers)
				r.Put("/{userId}/role", userHandler.UpdateUserRole)
				r.With(httputil.RequireSuperAdmin()).Delete("/{userId}", userHandler.DeleteUser)
			})
		})

		// Dedicated Singleton Super Admin Dashboard (Username/Password Protected & Root CLI accessible)
		r.Route("/superadmin", func(r chi.Router) {
			r.Post("/login", userHandler.SuperAdminLogin)
			r.Group(func(r chi.Router) {
				r.Use(httputil.RequireSuperAdmin())
				r.Get("/dashboard", userHandler.SuperAdminDashboard)
			})
		})

		// Mathematical & Logical Formula Engine
		r.Route("/formulas", func(r chi.Router) {
			r.Post("/evaluate", formulaHandler.Evaluate)
			r.Post("/validate", formulaHandler.Validate)
		})

		// World Bridge Handlers (Cross-Domain RPC for Prose Studio)
		r.Route("/bridge", func(r chi.Router) {
			r.Post("/ground", bridgeHandler.HandleSceneGrounding)
			r.Post("/audit", bridgeHandler.HandleContinuityAudit)
			r.Post("/mentions", bridgeHandler.HandleEntityMentions)
		})

		// Creative Novel Projects Management
		r.Route("/projects", func(r chi.Router) {
			r.Get("/", projectHandler.List)
			r.Post("/", projectHandler.Create)
			r.Get("/{projectId}", projectHandler.Get)
			r.Put("/{projectId}", projectHandler.Update)
			r.Delete("/{projectId}", projectHandler.Delete)
		})

		// Project-Scoped World Domain Resources
		r.Route("/projects/{projectId}", func(r chi.Router) {
			// Blueprints
			r.Route("/blueprints", func(r chi.Router) {
				r.Get("/", blueprintHandler.List)
				r.Post("/", blueprintHandler.Create)
				r.Get("/{blueprintId}", blueprintHandler.Get)
				r.Put("/{blueprintId}", blueprintHandler.Update)
				r.Delete("/{blueprintId}", blueprintHandler.Delete)
			})

			// Entities & Bitemporal Revisions
			r.Route("/entities", func(r chi.Router) {
				r.Get("/", entityHandler.List)
				r.Post("/", entityHandler.Create)
				r.Get("/{entityId}", entityHandler.Get)
				r.Put("/{entityId}", entityHandler.Update)
				r.Delete("/{entityId}", entityHandler.Delete)

				// Bitemporal Revisions & Coordinate Resolution
				r.Get("/{entityId}/revisions", entityHandler.ListRevisions)
				r.Post("/{entityId}/revisions", entityHandler.CreateRevision)
				r.Post("/{entityId}/revisions/{revisionId}/revert", entityHandler.RevertRevision)
				r.Get("/{entityId}/coordinate", entityHandler.ResolveCoordinate)

				// Hanging Edit Tree
				r.Get("/{entityId}/tree", entityHandler.GetTree)
				r.Post("/{entityId}/edits", entityHandler.AddEdit)
				r.Post("/{entityId}/edits/{editId}/checkout", entityHandler.CheckoutEdit)
			})

			// Timeline & UPDATE Pipe
			r.Route("/timeline", func(r chi.Router) {
				r.Get("/pipe", timelineHandler.GetPipe)
				r.Get("/events", timelineHandler.ListEvents)
				r.Post("/events", timelineHandler.CreateEvent)
				r.Get("/events/{eventId}", timelineHandler.GetEvent)
				r.Put("/events/{eventId}", timelineHandler.UpdateEvent)
				r.Delete("/events/{eventId}", timelineHandler.DeleteEvent)
				r.Get("/events/{eventId}/tree", timelineHandler.GetEventTree)
				r.Post("/events/{eventId}/edits", timelineHandler.AddEventEdit)
				r.Post("/events/{eventId}/edits/{editId}/checkout", timelineHandler.CheckoutEventEdit)
				r.Get("/state", timelineHandler.GetState)
			})
		})
	})

	// Fallback 404 handler returning RFC 7807 problem detail
	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		httputil.RespondNotFound(w, r, "Endpoint", r.URL.Path)
	})

	// Fallback 405 Method Not Allowed handler returning RFC 7807 problem detail
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		httputil.RespondProblem(w, r, httputil.ProblemDetail{
			Type:   "https://novwrite.com/errors/method-not-allowed",
			Title:  "Method Not Allowed",
			Status: http.StatusMethodNotAllowed,
			Detail: fmt.Sprintf("HTTP method '%s' is not supported on endpoint '%s'.", r.Method, r.URL.Path),
			Code:   "METHOD_NOT_ALLOWED",
		})
	})

	return r
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}

	r := BuildRouter()

	addr := fmt.Sprintf(":%s", port)
	server := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	serverErrors := make(chan error, 1)

	go func() {
		log.Printf("[NovWrite API] Server starting on %s (Environment: %s)", addr, env)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("[NovWrite API] Server error: %v", err)
	case sig := <-shutdown:
		log.Printf("[NovWrite API] Signal received (%v). Initiating graceful shutdown...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("[NovWrite API] Graceful shutdown failed, forcing close: %v", err)
			_ = server.Close()
		}
		log.Println("[NovWrite API] Server stopped gracefully.")
	}
}
