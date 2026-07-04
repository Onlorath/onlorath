package handler

import (
	"encoding/json"
	"net/http"

	"backend/config"
	"backend/internal/domain"

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

func (h *BlogHandler) CreateBlog(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateBlogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	authorID, ok := r.Context().Value(domain.ContextKeyUserID).(string)
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	blog, err := h.blogUseCase.Create(r.Context(), authorID, &req)
	if err != nil {
		if err == domain.ErrBlogSlugExists {
			h.respondWithError(w, http.StatusConflict, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusCreated, blog)
}

func (h *BlogHandler) UpdateBlog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		h.respondWithError(w, http.StatusBadRequest, "Blog ID is required")
		return
	}

	var req domain.UpdateBlogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	blog, err := h.blogUseCase.Update(r.Context(), id, &req)
	if err != nil {
		if err == domain.ErrBlogNotFound {
			h.respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		if err == domain.ErrBlogSlugExists {
			h.respondWithError(w, http.StatusConflict, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusOK, blog)
}

func (h *BlogHandler) DeleteBlog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		h.respondWithError(w, http.StatusBadRequest, "Blog ID is required")
		return
	}

	err := h.blogUseCase.Delete(r.Context(), id)
	if err != nil {
		if err == domain.ErrBlogNotFound {
			h.respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *BlogHandler) GetBlog(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		h.respondWithError(w, http.StatusBadRequest, "Blog slug is required")
		return
	}

	blog, err := h.blogUseCase.GetBySlug(r.Context(), slug)
	if err != nil {
		if err == domain.ErrBlogNotFound {
			h.respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusOK, blog)
}

func (h *BlogHandler) ListBlogs(w http.ResponseWriter, r *http.Request) {
	blogs, err := h.blogUseCase.List(r.Context(), true) // only published for public
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.respondWithJSON(w, http.StatusOK, blogs)
}

func (h *BlogHandler) AdminListBlogs(w http.ResponseWriter, r *http.Request) {
	blogs, err := h.blogUseCase.List(r.Context(), false) // all for admin
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.respondWithJSON(w, http.StatusOK, blogs)
}

func (h *BlogHandler) AdminGetBlog(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		h.respondWithError(w, http.StatusBadRequest, "Blog ID is required")
		return
	}

	blog, err := h.blogUseCase.GetByID(r.Context(), id)
	if err != nil {
		if err == domain.ErrBlogNotFound {
			h.respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusOK, blog)
}

func (h *BlogHandler) AddBlogImage(w http.ResponseWriter, r *http.Request) {
	blogID := chi.URLParam(r, "id")
	if blogID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Blog ID is required")
		return
	}

	var req struct {
		URL     string `json:"url"`
		AltText string `json:"alt_text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	img, err := h.blogUseCase.AddImage(r.Context(), blogID, req.URL, req.AltText)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusCreated, img)
}

func (h *BlogHandler) ListBlogImages(w http.ResponseWriter, r *http.Request) {
	blogID := chi.URLParam(r, "id")
	if blogID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Blog ID is required")
		return
	}

	images, err := h.blogUseCase.ListImages(r.Context(), blogID)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusOK, images)
}

func (h *BlogHandler) DeleteBlogImage(w http.ResponseWriter, r *http.Request) {
	imageID := chi.URLParam(r, "imageId")
	if imageID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Image ID is required")
		return
	}

	err := h.blogUseCase.DeleteImage(r.Context(), imageID)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// Helpers for JSON responses
func (h *BlogHandler) respondWithError(w http.ResponseWriter, code int, message string) {
	h.respondWithJSON(w, code, map[string]string{"error": message})
}

func (h *BlogHandler) respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error":"Failed to marshal response"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write(response)
}
