package handler

import (
	"context"
	"net/http"
	"strings"

	"backend/internal/domain"
	"backend/internal/pkg/httputil"

	"github.com/go-chi/chi/v5"
)

type SiteHandler struct {
	siteUseCase    domain.SiteUseCase
	projectUseCase domain.ProjectUseCase
	blogUseCase    domain.BlogUseCase
	contactUsecase domain.ContactUsecase
}

func NewSiteHandler(siteUseCase domain.SiteUseCase, projectUseCase domain.ProjectUseCase, blogUseCase domain.BlogUseCase, contactUsecase domain.ContactUsecase) *SiteHandler {
	return &SiteHandler{
		siteUseCase:    siteUseCase,
		projectUseCase: projectUseCase,
		blogUseCase:    blogUseCase,
		contactUsecase: contactUsecase,
	}
}

// GetSite returns all public content of the one-page site.
// GET /api/v1/site
func (h *SiteHandler) GetSite(w http.ResponseWriter, r *http.Request) {
	site, err := h.siteUseCase.GetSite(r.Context())
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, site)
}

// ServeCV redirects to the CV uploaded in the admin panel, falling back to assets/CV.pdf.
// GET /api/v1/cv
func (h *SiteHandler) ServeCV(w http.ResponseWriter, r *http.Request) {
	profile, err := h.siteUseCase.GetProfile(r.Context())
	if err == nil && strings.HasPrefix(profile.CVURL, "/api/v1/uploads/") {
		http.Redirect(w, r, profile.CVURL, http.StatusFound)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename=CV.pdf")
	http.ServeFile(w, r, "assets/CV.pdf")
}

// Stats feeds the admin dashboard.
// GET /api/v1/admin/stats
func (h *SiteHandler) Stats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projects, err := h.projectUseCase.List(ctx, false)
	if err != nil {
		respondError(w, err)
		return
	}
	blogs, err := h.blogUseCase.List(ctx, false)
	if err != nil {
		respondError(w, err)
		return
	}
	unread, err := h.contactUsecase.CountUnread(ctx)
	if err != nil {
		respondError(w, err)
		return
	}

	published := 0
	for _, b := range blogs {
		if b.Published {
			published++
		}
	}
	httputil.RespondWithJSON(w, http.StatusOK, map[string]int{
		"projects":        len(projects),
		"blogs":           len(blogs),
		"blogs_published": published,
		"unread_messages": unread,
	})
}

// --- Profile ---

func (h *SiteHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	profile, err := h.siteUseCase.GetProfile(r.Context())
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, profile)
}

func (h *SiteHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req domain.Profile
	if !decodeJSON(w, r, &req) {
		return
	}
	profile, err := h.siteUseCase.UpdateProfile(r.Context(), &req)
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, profile)
}

// --- Experiences ---

func (h *SiteHandler) ListExperiences(w http.ResponseWriter, r *http.Request) {
	items, err := h.siteUseCase.ListExperiences(r.Context())
	respondList(w, items, err)
}

func (h *SiteHandler) CreateExperience(w http.ResponseWriter, r *http.Request) {
	var req domain.ExperienceInput
	if !decodeJSON(w, r, &req) {
		return
	}
	item, err := h.siteUseCase.CreateExperience(r.Context(), &req)
	respondItem(w, http.StatusCreated, item, err)
}

func (h *SiteHandler) UpdateExperience(w http.ResponseWriter, r *http.Request) {
	var req domain.ExperienceInput
	if !decodeJSON(w, r, &req) {
		return
	}
	item, err := h.siteUseCase.UpdateExperience(r.Context(), chi.URLParam(r, "id"), &req)
	respondItem(w, http.StatusOK, item, err)
}

func (h *SiteHandler) DeleteExperience(w http.ResponseWriter, r *http.Request) {
	respondDeleteResult(w, h.siteUseCase.DeleteExperience(r.Context(), chi.URLParam(r, "id")))
}

func (h *SiteHandler) ReorderExperiences(w http.ResponseWriter, r *http.Request) {
	h.reorder(w, r, h.siteUseCase.ReorderExperiences)
}

// --- Skills ---

func (h *SiteHandler) ListSkills(w http.ResponseWriter, r *http.Request) {
	items, err := h.siteUseCase.ListSkills(r.Context())
	respondList(w, items, err)
}

func (h *SiteHandler) CreateSkill(w http.ResponseWriter, r *http.Request) {
	var req domain.SkillInput
	if !decodeJSON(w, r, &req) {
		return
	}
	item, err := h.siteUseCase.CreateSkill(r.Context(), &req)
	respondItem(w, http.StatusCreated, item, err)
}

func (h *SiteHandler) UpdateSkill(w http.ResponseWriter, r *http.Request) {
	var req domain.SkillInput
	if !decodeJSON(w, r, &req) {
		return
	}
	item, err := h.siteUseCase.UpdateSkill(r.Context(), chi.URLParam(r, "id"), &req)
	respondItem(w, http.StatusOK, item, err)
}

func (h *SiteHandler) DeleteSkill(w http.ResponseWriter, r *http.Request) {
	respondDeleteResult(w, h.siteUseCase.DeleteSkill(r.Context(), chi.URLParam(r, "id")))
}

func (h *SiteHandler) ReorderSkills(w http.ResponseWriter, r *http.Request) {
	h.reorder(w, r, h.siteUseCase.ReorderSkills)
}

// --- Social links ---

func (h *SiteHandler) ListSocialLinks(w http.ResponseWriter, r *http.Request) {
	items, err := h.siteUseCase.ListSocialLinks(r.Context())
	respondList(w, items, err)
}

func (h *SiteHandler) CreateSocialLink(w http.ResponseWriter, r *http.Request) {
	var req domain.SocialLinkInput
	if !decodeJSON(w, r, &req) {
		return
	}
	item, err := h.siteUseCase.CreateSocialLink(r.Context(), &req)
	respondItem(w, http.StatusCreated, item, err)
}

func (h *SiteHandler) UpdateSocialLink(w http.ResponseWriter, r *http.Request) {
	var req domain.SocialLinkInput
	if !decodeJSON(w, r, &req) {
		return
	}
	item, err := h.siteUseCase.UpdateSocialLink(r.Context(), chi.URLParam(r, "id"), &req)
	respondItem(w, http.StatusOK, item, err)
}

func (h *SiteHandler) DeleteSocialLink(w http.ResponseWriter, r *http.Request) {
	respondDeleteResult(w, h.siteUseCase.DeleteSocialLink(r.Context(), chi.URLParam(r, "id")))
}

func (h *SiteHandler) ReorderSocialLinks(w http.ResponseWriter, r *http.Request) {
	h.reorder(w, r, h.siteUseCase.ReorderSocialLinks)
}

// --- shared ---

func (h *SiteHandler) reorder(w http.ResponseWriter, r *http.Request, fn func(context.Context, *domain.ReorderRequest) error) {
	var req domain.ReorderRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	if err := fn(r.Context(), &req); err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "reordered"})
}
