package http

import (
	"net/http"

	"backend/config"
	"backend/internal/delivery/http/handler"
	authMiddleware "backend/internal/delivery/http/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// NewRouter initializes the router and registers routes.
func NewRouter(cfg *config.Config, userHandler *handler.UserHandler, authM *authMiddleware.AuthMiddleware) http.Handler {
	r := chi.NewRouter()

	// Standard middlewares
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", cfg.ClientURL)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// API Version 1 Group
	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/users", func(r chi.Router) {
			// Public routes
			r.Post("/register", userHandler.Register)
			r.Post("/login", userHandler.Login)
			r.Post("/refresh", userHandler.Refresh)

			// Protected routes
			r.Group(func(r chi.Router) {
				r.Use(authM.Handler)
				r.Get("/me", userHandler.Me)
			})
		})
	})

	return r
}
