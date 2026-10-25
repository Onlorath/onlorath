package handler

import (
	"net/http"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/httputil"

	"github.com/go-chi/chi/v5"
)

type BlogHandler struct {
	blogUseCase domain.BlogUseCase
	cfg         *config.Config
}

func NewBlogHandler(blogUseCase domain.BlogUseCase, cfg *config.Config) *BlogHandler {
	return &BlogHandler{
		blogUseCase: blogUseCase,
		cfg:         cfg,
	}
}

// ListBlogs returns published posts (public).
func (h *BlogHandler) ListBlogs(w http.ResponseWriter, r *http.Request) {
	blogs, err := h.blogUseCase.List(r.Context(), true)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, blogs)
}

// GetBlog returns one published post by slug (public).
func (h *BlogHandler) GetBlog(w http.ResponseWriter, r *http.Request) {
	blog, err := h.blogUseCase.GetPublishedBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, blog)
}

func (h *BlogHandler) AdminListBlogs(w http.ResponseWriter, r *http.Request) {
	blogs, err := h.blogUseCase.List(r.Context(), false)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, blogs)
}

func (h *BlogHandler) AdminGetBlog(w http.ResponseWriter, r *http.Request) {
	blog, err := h.blogUseCase.GetByID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, blog)
}

func (h *BlogHandler) CreateBlog(w http.ResponseWriter, r *http.Request) {
	var req domain.BlogInput
	if !decodeJSON(w, r, &req) {
		return
	}
	authorID, ok := r.Context().Value(domain.ContextKeyUserID).(string)
	if !ok {
		httputil.RespondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	blog, err := h.blogUseCase.Create(r.Context(), authorID, &req)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusCreated, blog)
}

func (h *BlogHandler) UpdateBlog(w http.ResponseWriter, r *http.Request) {
	var req domain.BlogInput
	if !decodeJSON(w, r, &req) {
		return
	}
	blog, err := h.blogUseCase.Update(r.Context(), chi.URLParam(r, "id"), &req)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, blog)
}

func (h *BlogHandler) DeleteBlog(w http.ResponseWriter, r *http.Request) {
	if err := h.blogUseCase.Delete(r.Context(), chi.URLParam(r, "id")); err != nil {
		respondError(w, err)
		return
	}
	respondDeleted(w)
}
