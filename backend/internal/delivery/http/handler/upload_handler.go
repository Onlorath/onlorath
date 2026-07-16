package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"backend/internal/pkg/httputil"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

const maxUploadSize = 5 << 20 // 5MB
var allowedExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
}

// UploadFile handles multipart file upload
// POST /api/v1/admin/uploads
func (h *UploadHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, "File too large (max 5MB)")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, "File is required")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExtensions[ext] {
		httputil.RespondWithError(w, http.StatusBadRequest, "Only .jpg, .jpeg, .png, .webp files are allowed")
		return
	}

	filename := uuid.New().String() + ext
	uploadDir := "assets/uploads"
	os.MkdirAll(uploadDir, 0755)

	destPath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(destPath)
	if err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	url := fmt.Sprintf("/api/v1/uploads/%s", filename)
	httputil.RespondWithJSON(w, http.StatusCreated, map[string]string{"url": url})
}

// DeleteFile removes an uploaded file
// DELETE /api/v1/admin/uploads/{filename}
func (h *UploadHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	filename := chi.URLParam(r, "filename")
	cleanName := filepath.Base(filename)
	if cleanName == "." || cleanName == "/" || cleanName != filename {
		httputil.RespondWithError(w, http.StatusBadRequest, "Invalid filename")
		return
	}

	path := filepath.Join("assets/uploads", filename)
	if err := os.Remove(path); err != nil {
		if os.IsNotExist(err) {
			httputil.RespondWithError(w, http.StatusNotFound, "File not found")
			return
		}
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to delete file")
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
