package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"backend/internal/domain"
	"backend/internal/pkg/httputil"
)

// maxJSONBody caps admin/content request bodies (long blog posts fit comfortably).
const maxJSONBody = 2 << 20

var notFoundErrors = []error{
	domain.ErrProjectNotFound, domain.ErrBlogNotFound, domain.ErrExperienceNotFound,
	domain.ErrSkillNotFound, domain.ErrSocialLinkNotFound, domain.ErrContactMessageNotFound,
	domain.ErrConversationNotFound, domain.ErrUserNotFound,
}

var conflictErrors = []error{domain.ErrProjectSlugExists, domain.ErrBlogSlugExists, domain.ErrEmailAlreadyExists}

// respondError maps domain errors to HTTP statuses. Unknown errors are logged and
// returned as a generic 500 so internal details never reach the client.
func respondError(w http.ResponseWriter, err error) {
	var valErr *domain.ValidationError
	if errors.As(err, &valErr) {
		httputil.RespondWithError(w, http.StatusBadRequest, valErr.Error())
		return
	}
	for _, e := range notFoundErrors {
		if errors.Is(err, e) {
			httputil.RespondWithError(w, http.StatusNotFound, err.Error())
			return
		}
	}
	for _, e := range conflictErrors {
		if errors.Is(err, e) {
			httputil.RespondWithError(w, http.StatusConflict, err.Error())
			return
		}
	}
	log.Printf("[handler] internal error: %v", err)
	httputil.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
}

// decodeJSON reads a size-limited JSON body into dst, answering 400 on failure.
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxJSONBody)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return false
	}
	return true
}

// respondDeleted is the shared body for successful deletes.
func respondDeleted(w http.ResponseWriter) {
	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// respondDeleteResult answers a delete call with either its error or the shared body.
func respondDeleteResult(w http.ResponseWriter, err error) {
	if err != nil {
		respondError(w, err)
		return
	}
	respondDeleted(w)
}

// respondList answers a list call.
func respondList[T any](w http.ResponseWriter, items []T, err error) {
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, items)
}

// respondItem answers a create/update call with the given success status.
func respondItem[T any](w http.ResponseWriter, status int, item *T, err error) {
	if err != nil {
		respondError(w, err)
		return
	}
	httputil.RespondWithJSON(w, status, item)
}
