package handler

import (
	"encoding/json"
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

func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	project, err := h.projectUseCase.Create(r.Context(), &req)
	if err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.RespondWithJSON(w, http.StatusCreated, project)
}

func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	var req domain.UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	project, err := h.projectUseCase.Update(r.Context(), id, &req)
	if err != nil {
		if err == domain.ErrProjectNotFound {
			httputil.RespondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	err := h.projectUseCase.Delete(r.Context(), id)
	if err != nil {
		if err == domain.ErrProjectNotFound {
			httputil.RespondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	project, err := h.projectUseCase.GetByID(r.Context(), id)
	if err != nil {
		if err == domain.ErrProjectNotFound {
			httputil.RespondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.projectUseCase.List(r.Context())
	if err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, projects)
}

func (h *ProjectHandler) AdminListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.projectUseCase.List(r.Context())
	if err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, projects)
}

func (h *ProjectHandler) AdminGetProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	project, err := h.projectUseCase.GetByID(r.Context(), id)
	if err != nil {
		if err == domain.ErrProjectNotFound {
			httputil.RespondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) AddProjectImage(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	if projectID == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	var req struct {
		URL     string `json:"url"`
		AltText string `json:"alt_text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	img, err := h.projectUseCase.AddImage(r.Context(), projectID, req.URL, req.AltText)
	if err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.RespondWithJSON(w, http.StatusCreated, img)
}

func (h *ProjectHandler) ListProjectImages(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	if projectID == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Project ID is required")
		return
	}

	images, err := h.projectUseCase.ListImages(r.Context(), projectID)
	if err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, images)
}

func (h *ProjectHandler) DeleteProjectImage(w http.ResponseWriter, r *http.Request) {
	imageID := chi.URLParam(r, "imageId")
	if imageID == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Image ID is required")
		return
	}

	err := h.projectUseCase.DeleteImage(r.Context(), imageID)
	if err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
