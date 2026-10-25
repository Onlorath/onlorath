package handler

import (
	"net/http"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/httputil"

	"github.com/go-chi/chi/v5"
)

type ProjectHandler struct {
	projectUseCase domain.ProjectUseCase
	cfg            *config.Config
}

func NewProjectHandler(projectUseCase domain.ProjectUseCase, cfg *config.Config) *ProjectHandler {
	return &ProjectHandler{
		projectUseCase: projectUseCase,
		cfg:            cfg,
	}
}

// ListProjects returns published projects (public).
func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.projectUseCase.List(r.Context(), true)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, projects)
}

// AdminListProjects returns all projects including drafts.
func (h *ProjectHandler) AdminListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.projectUseCase.List(r.Context(), false)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, projects)
}

func (h *ProjectHandler) AdminGetProject(w http.ResponseWriter, r *http.Request) {
	project, err := h.projectUseCase.GetByID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	var req domain.ProjectInput
	if !decodeJSON(w, r, &req) {
		return
	}
	project, err := h.projectUseCase.Create(r.Context(), &req)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusCreated, project)
}

func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	var req domain.ProjectInput
	if !decodeJSON(w, r, &req) {
		return
	}
	project, err := h.projectUseCase.Update(r.Context(), chi.URLParam(r, "id"), &req)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	if err := h.projectUseCase.Delete(r.Context(), chi.URLParam(r, "id")); err != nil {
		respondError(w, err)
		return
	}
	respondDeleted(w)
}

func (h *ProjectHandler) ReorderProjects(w http.ResponseWriter, r *http.Request) {
	var req domain.ReorderRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if err := h.projectUseCase.Reorder(r.Context(), &req); err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "reordered"})
}
