package handler

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"backend/config"
	"backend/internal/pkg/httputil"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type UploadHandler struct {
	cfg *config.Config
}

func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{cfg: cfg}
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

	filename := uuid.New().String() + ext
	if err := os.MkdirAll(h.cfg.UploadDir, 0755); err != nil {
		log.Printf("[upload] mkdir: %v", err)
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	dst, err := os.Create(filepath.Join(h.cfg.UploadDir, filename))
	if err != nil {
		log.Printf("[upload] create: %v", err)
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		log.Printf("[upload] copy: %v", err)
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	url := fmt.Sprintf("/api/v1/uploads/%s", filename)
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

	if err := os.Remove(filepath.Join(h.cfg.UploadDir, name)); err != nil {
		if os.IsNotExist(err) {
			httputil.RespondWithError(w, http.StatusNotFound, "File not found")
			return
		}
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
