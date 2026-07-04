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
func NewRouter(
	cfg *config.Config,
	userHandler *handler.UserHandler,
	chatHandler *handler.ChatHandler,
	blogHandler *handler.BlogHandler,
	projectHandler *handler.ProjectHandler,
	uploadHandler *handler.UploadHandler,
	authM *authMiddleware.AuthMiddleware,
) http.Handler {
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
				r.Post("/logout", userHandler.Logout)
			})
		})

		// Public Chat routes (internal optional authentication verification)
		r.Route("/chat", func(r chi.Router) {
			r.Post("/send", chatHandler.SendMessage)
			r.Get("/conversations", chatHandler.ListConversations)
			r.Get("/conversations/{id}", chatHandler.GetMessages)
			r.Delete("/conversations/{id}", chatHandler.DeleteConversation)
		})

		// Public Blog routes
		r.Route("/blogs", func(r chi.Router) {
			r.Get("/", blogHandler.ListBlogs)
			r.Get("/{slug}", blogHandler.GetBlog)
		})

		// Public Project routes
		r.Route("/projects", func(r chi.Router) {
			r.Get("/", projectHandler.ListProjects)
			r.Get("/{id}", projectHandler.GetProject)
		})

		// Static file serving for uploads
		r.Get("/uploads/{filename}", func(w http.ResponseWriter, r *http.Request) {
			filename := chi.URLParam(r, "filename")
			http.ServeFile(w, r, "assets/uploads/"+filename)
		})

		// Admin routes (auth + admin-only middleware)
		r.Route("/admin", func(r chi.Router) {
			r.Use(authM.Handler)
			r.Use(authM.AdminOnly)

			// Blog management
			r.Route("/blogs", func(r chi.Router) {
				r.Get("/", blogHandler.AdminListBlogs)
				r.Get("/{id}", blogHandler.AdminGetBlog)
				r.Post("/", blogHandler.CreateBlog)
				r.Put("/{id}", blogHandler.UpdateBlog)
				r.Delete("/{id}", blogHandler.DeleteBlog)
				r.Post("/{id}/images", blogHandler.AddBlogImage)
				r.Get("/{id}/images", blogHandler.ListBlogImages)
				r.Delete("/images/{imageId}", blogHandler.DeleteBlogImage)
			})

			// Project management
			r.Route("/projects", func(r chi.Router) {
				r.Get("/", projectHandler.AdminListProjects)
				r.Get("/{id}", projectHandler.AdminGetProject)
				r.Post("/", projectHandler.CreateProject)
				r.Put("/{id}", projectHandler.UpdateProject)
				r.Delete("/{id}", projectHandler.DeleteProject)
				r.Post("/{id}/images", projectHandler.AddProjectImage)
				r.Get("/{id}/images", projectHandler.ListProjectImages)
				r.Delete("/images/{imageId}", projectHandler.DeleteProjectImage)
			})

			// File uploads
			r.Post("/uploads", uploadHandler.UploadFile)
			r.Delete("/uploads/{filename}", uploadHandler.DeleteFile)
		})
	})

	return r
}
