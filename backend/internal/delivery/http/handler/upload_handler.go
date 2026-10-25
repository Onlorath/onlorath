package handler

import (
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"backend/config"
	"backend/internal/pkg/httputil"
	"backend/internal/pkg/storage"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type UploadHandler struct {
	cfg   *config.Config
	store storage.Store
}

func NewUploadHandler(cfg *config.Config, store storage.Store) *UploadHandler {
	return &UploadHandler{cfg: cfg, store: store}
}

// allowedUploads maps each accepted extension to the MIME prefix that
// http.DetectContentType must report for the file's first bytes.
var allowedUploads = map[string]string{
	".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
	".pdf": "application/pdf",
	".mp4": "video/mp4", ".webm": "video/webm",
}

// UploadFile handles multipart file upload
// POST /api/v1/admin/uploads
func (h *UploadHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	maxSize := h.cfg.UploadMaxBytes
	r.Body = http.MaxBytesReader(w, r.Body, maxSize+(1<<20)) // headroom for multipart framing
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("File too large (max %d MB)", maxSize>>20))
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, "File is required")
		return
	}
	defer file.Close()

	if header.Size > maxSize {
		httputil.RespondWithError(w, http.StatusBadRequest, fmt.Sprintf("File too large (max %d MB)", maxSize>>20))
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	wantMime, ok := allowedUploads[ext]
	if !ok {
		httputil.RespondWithError(w, http.StatusBadRequest, "Allowed types: jpg, png, webp, gif, pdf, mp4, webm")
		return
	}

	// Verify the content matches the extension.
	head := make([]byte, 512)
	n, _ := io.ReadFull(file, head)
	if !strings.HasPrefix(http.DetectContentType(head[:n]), wantMime) {
		httputil.RespondWithError(w, http.StatusBadRequest, "File content does not match its extension")
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	url, err := h.store.Save(r.Context(), uuid.New().String()+ext, wantMime, file)
	if err != nil {
		log.Printf("[upload] save: %v", err)
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	httputil.RespondWithJSON(w, http.StatusCreated, map[string]string{"url": url})
}

// ServeFile serves an uploaded file.
// GET /api/v1/uploads/{filename}
func (h *UploadHandler) ServeFile(w http.ResponseWriter, r *http.Request) {
	name, ok := cleanUploadName(chi.URLParam(r, "filename"))
	if !ok {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable") // names are random UUIDs
	http.ServeFile(w, r, filepath.Join(h.cfg.UploadDir, name))
}

// DeleteFile removes an uploaded file
// DELETE /api/v1/admin/uploads/{filename}
func (h *UploadHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	name, ok := cleanUploadName(chi.URLParam(r, "filename"))
	if !ok {
		httputil.RespondWithError(w, http.StatusBadRequest, "Invalid filename")
		return
	}

	if err := h.store.Delete(r.Context(), name); err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			httputil.RespondWithError(w, http.StatusNotFound, "File not found")
			return
		}
		log.Printf("[upload] delete: %v", err)
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to delete file")
		return
	}

	respondDeleted(w)
}

// cleanUploadName rejects anything that is not a bare file name (path traversal).
func cleanUploadName(name string) (string, bool) {
	clean := filepath.Base(name)
	if name == "" || clean != name || clean == "." || strings.ContainsAny(name, `/\`) {
		return "", false
	}
	return clean, true
}
