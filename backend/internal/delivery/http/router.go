package http

import (
	"net/http"

	"backend/config"
	"backend/internal/delivery/http/handler"
	authMiddleware "backend/internal/delivery/http/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// Handlers groups every HTTP handler the router wires up.
type Handlers struct {
	User    *handler.UserHandler
	Chat    *handler.ChatHandler
	Blog    *handler.BlogHandler
	Project *handler.ProjectHandler
	Site    *handler.SiteHandler
	Upload  *handler.UploadHandler
	Contact *handler.ContactHandler
}

// NewRouter initializes the router and registers routes.
func NewRouter(cfg *config.Config, h Handlers, authM *authMiddleware.AuthMiddleware) http.Handler {
	r := chi.NewRouter()

	// Standard middlewares
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Middleware. The Next.js app proxies /api/v1 on its own origin, so this only
	// matters when the API is called directly (e.g. NEXT_PUBLIC_API_URL pointing here).
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", cfg.ClientURL)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
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
		r.Get("/site", h.Site.GetSite)
		r.Get("/cv", h.Site.ServeCV)
		r.Get("/uploads/{filename}", h.Upload.ServeFile)
		r.Post("/contact", h.Contact.SubmitContact)

		r.Route("/users", func(r chi.Router) {
			// Public routes
			r.Post("/register", h.User.Register)
			r.Post("/login", h.User.Login)
			r.Post("/refresh", h.User.Refresh)
			r.Post("/logout", h.User.Logout)

			// Protected routes
			r.Group(func(r chi.Router) {
				r.Use(authM.Handler)
				r.Get("/me", h.User.Me)
			})
		})

		// Public Chat routes (internal optional authentication verification)
		r.Route("/chat", func(r chi.Router) {
			r.Use(authM.OptionalHandler)
			r.Post("/send", h.Chat.SendMessage)
			r.Get("/conversations", h.Chat.ListConversations)
			r.Get("/conversations/{id}", h.Chat.GetMessages)
			r.Delete("/conversations/{id}", h.Chat.DeleteConversation)
		})

		// Public Blog routes
		r.Route("/blogs", func(r chi.Router) {
			r.Get("/", h.Blog.ListBlogs)
			r.Get("/{slug}", h.Blog.GetBlog)
		})

		// Public Project routes
		r.Get("/projects", h.Project.ListProjects)

		// Admin routes (auth + admin-only middleware)
		r.Route("/admin", func(r chi.Router) {
			r.Use(authM.Handler)
			r.Use(authM.AdminOnly)

			r.Get("/stats", h.Site.Stats)

			r.Get("/profile", h.Site.GetProfile)
			r.Put("/profile", h.Site.UpdateProfile)

			r.Route("/projects", func(r chi.Router) {
				r.Get("/", h.Project.AdminListProjects)
				r.Post("/", h.Project.CreateProject)
				r.Put("/reorder", h.Project.ReorderProjects)
				r.Get("/{id}", h.Project.AdminGetProject)
				r.Put("/{id}", h.Project.UpdateProject)
				r.Delete("/{id}", h.Project.DeleteProject)
			})

			r.Route("/experiences", func(r chi.Router) {
				r.Get("/", h.Site.ListExperiences)
				r.Post("/", h.Site.CreateExperience)
				r.Put("/reorder", h.Site.ReorderExperiences)
				r.Put("/{id}", h.Site.UpdateExperience)
				r.Delete("/{id}", h.Site.DeleteExperience)
			})

			r.Route("/skills", func(r chi.Router) {
				r.Get("/", h.Site.ListSkills)
				r.Post("/", h.Site.CreateSkill)
				r.Put("/reorder", h.Site.ReorderSkills)
				r.Put("/{id}", h.Site.UpdateSkill)
				r.Delete("/{id}", h.Site.DeleteSkill)
			})

			r.Route("/socials", func(r chi.Router) {
				r.Get("/", h.Site.ListSocialLinks)
				r.Post("/", h.Site.CreateSocialLink)
				r.Put("/reorder", h.Site.ReorderSocialLinks)
				r.Put("/{id}", h.Site.UpdateSocialLink)
				r.Delete("/{id}", h.Site.DeleteSocialLink)
			})

			r.Route("/blogs", func(r chi.Router) {
				r.Get("/", h.Blog.AdminListBlogs)
				r.Post("/", h.Blog.CreateBlog)
				r.Get("/{id}", h.Blog.AdminGetBlog)
				r.Put("/{id}", h.Blog.UpdateBlog)
				r.Delete("/{id}", h.Blog.DeleteBlog)
			})

			r.Route("/messages", func(r chi.Router) {
				r.Get("/", h.Contact.AdminListMessages)
				r.Patch("/{id}", h.Contact.AdminUpdateMessage)
				r.Delete("/{id}", h.Contact.AdminDeleteMessage)
			})

			// File uploads
			r.Post("/uploads", h.Upload.UploadFile)
			r.Delete("/uploads/{filename}", h.Upload.DeleteFile)
		})
	})

	return r
}
