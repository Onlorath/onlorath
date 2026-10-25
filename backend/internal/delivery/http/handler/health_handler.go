package handler

import (
	"context"
	"net/http"
	"time"

	"backend/internal/pkg/httputil"

	"github.com/jmoiron/sqlx"
)

type HealthHandler struct {
	db *sqlx.DB
}

func NewHealthHandler(db *sqlx.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

// Health runs a real query so uptime pings also keep a free Supabase project from pausing.
// GET /healthz
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var one int
	if err := h.db.GetContext(ctx, &one, `SELECT 1`); err != nil {
		httputil.RespondWithJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "db_unavailable"})
		return
	}
	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
