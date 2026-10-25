// Package storage saves uploaded files on local disk or in Supabase Storage.
package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

var ErrNotFound = errors.New("file not found")

// Store persists uploads under a flat, server-generated file name.
type Store interface {
	// Save writes r under name and returns the URL clients should use.
	Save(ctx context.Context, name, contentType string, r io.Reader) (string, error)
	Delete(ctx context.Context, name string) error
}

// Local stores files in Dir; they are served by the API at /api/v1/uploads/{name}.
type Local struct {
	Dir string
}

func (s Local) Save(_ context.Context, name, _ string, r io.Reader) (string, error) {
	if err := os.MkdirAll(s.Dir, 0755); err != nil {
		return "", err
	}
	dst, err := os.Create(filepath.Join(s.Dir, name))
	if err != nil {
		return "", err
	}
	defer dst.Close()
	if _, err := io.Copy(dst, r); err != nil {
		return "", err
	}
	return "/api/v1/uploads/" + name, nil
}

func (s Local) Delete(_ context.Context, name string) error {
	err := os.Remove(filepath.Join(s.Dir, name))
	if os.IsNotExist(err) {
		return ErrNotFound
	}
	return err
}

// Supabase stores files in a public Supabase Storage bucket through its REST API.
type Supabase struct {
	URL        string // project URL, e.g. https://xyz.supabase.co
	ServiceKey string // service_role key; never exposed to browsers
	Bucket     string
	Client     *http.Client
}

func NewSupabase(url, serviceKey, bucket string) Supabase {
	return Supabase{URL: url, ServiceKey: serviceKey, Bucket: bucket, Client: &http.Client{Timeout: 2 * time.Minute}}
}

func (s Supabase) objectURL(name string) string {
	return fmt.Sprintf("%s/storage/v1/object/%s/%s", s.URL, s.Bucket, name)
}

func (s Supabase) do(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+s.ServiceKey)
	req.Header.Set("apikey", s.ServiceKey)
	return s.Client.Do(req)
}

func (s Supabase) Save(ctx context.Context, name, contentType string, r io.Reader) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.objectURL(name), r)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Cache-Control", "max-age=31536000")
	resp, err := s.do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return "", fmt.Errorf("supabase storage upload: HTTP %d: %s", resp.StatusCode, body)
	}
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.URL, s.Bucket, name), nil
}

func (s Supabase) Delete(ctx context.Context, name string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, s.objectURL(name), nil)
	if err != nil {
		return err
	}
	resp, err := s.do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	switch {
	case resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest:
		// Supabase answers 400 "Object not found" for missing objects
		return ErrNotFound
	case resp.StatusCode >= 300:
		return fmt.Errorf("supabase storage delete: HTTP %d", resp.StatusCode)
	}
	return nil
}
