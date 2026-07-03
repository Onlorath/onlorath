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
func NewRouter(cfg *config.Config, userHandler *handler.UserHandler, chatHandler *handler.ChatHandler, authM *authMiddleware.AuthMiddleware) http.Handler {
	r := chi.NewRouter()

	// Standard middlewares
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", cfg.ClientURL)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token, X-Session-ID")
			w.Header().Set("Access-Control-Expose-Headers", "X-Chat-System-Busy, X-Chat-Quota-Exceeded")
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
		r.Get("/cv", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/pdf")
			w.Header().Set("Content-Disposition", "inline; filename=CV.pdf")
			http.ServeFile(w, r, "assets/CV.pdf")
		})

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

		// Public Chat routes (internal optional authentication verification)
		r.Route("/chat", func(r chi.Router) {
			r.Post("/send", chatHandler.SendMessage)
			r.Get("/conversations", chatHandler.ListConversations)
			r.Get("/conversations/{id}", chatHandler.GetMessages)
			r.Delete("/conversations/{id}", chatHandler.DeleteConversation)
		})
	})

	return r
}
