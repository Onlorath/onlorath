package storage

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSupabaseSaveAndDelete(t *testing.T) {
	var gotPath, gotAuth, gotType, gotBody string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotAuth, gotType = r.Method+" "+r.URL.Path, r.Header.Get("Authorization"), r.Header.Get("Content-Type")
		b, _ := io.ReadAll(r.Body)
		gotBody = string(b)
		if r.URL.Path == "/storage/v1/object/uploads/missing.png" {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	s := NewSupabase(srv.URL, "secret", "uploads")
	url, err := s.Save(context.Background(), "a.png", "image/png", strings.NewReader("data"))
	if err != nil {
		t.Fatal(err)
	}
	if url != srv.URL+"/storage/v1/object/public/uploads/a.png" {
		t.Errorf("public url = %s", url)
	}
	if gotPath != "POST /storage/v1/object/uploads/a.png" || gotAuth != "Bearer secret" || gotType != "image/png" || gotBody != "data" {
		t.Errorf("upload request = %q auth=%q type=%q body=%q", gotPath, gotAuth, gotType, gotBody)
	}

	if err := s.Delete(context.Background(), "a.png"); err != nil {
		t.Fatal(err)
	}
	if gotPath != "DELETE /storage/v1/object/uploads/a.png" {
		t.Errorf("delete request = %q", gotPath)
	}
	if err := s.Delete(context.Background(), "missing.png"); err != ErrNotFound {
		t.Errorf("missing delete err = %v, want ErrNotFound", err)
	}
}

func TestLocalSaveAndDelete(t *testing.T) {
	s := Local{Dir: t.TempDir()}
	url, err := s.Save(context.Background(), "b.txt", "text/plain", strings.NewReader("x"))
	if err != nil || url != "/api/v1/uploads/b.txt" {
		t.Fatalf("Save = %q, %v", url, err)
	}
	if err := s.Delete(context.Background(), "b.txt"); err != nil {
		t.Fatal(err)
	}
	if err := s.Delete(context.Background(), "b.txt"); err != ErrNotFound {
		t.Fatalf("second delete err = %v", err)
	}
}
