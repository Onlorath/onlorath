package domain

import (
	"context"
	"database/sql/driver"
	"errors"
	"time"

	"github.com/lib/pq"
)

var (
	ErrProjectNotFound   = errors.New("project not found")
	ErrProjectSlugExists = errors.New("project slug already exists")
)

// ProjectMeta is one "Rolüm / Araçlar / Sonuç" row in an expanded project.
type ProjectMeta struct {
	Label LocalizedText `json:"label"`
	Value LocalizedText `json:"value"`
	Mono  bool          `json:"mono"`
}

type ProjectMetaList []ProjectMeta

func (l ProjectMetaList) Value() (driver.Value, error) {
	if l == nil {
		l = ProjectMetaList{}
	}
	return jsonValue(l)
}
func (l *ProjectMetaList) Scan(src any) error { return jsonScan(src, l) }

// ProjectAction is a pill button shown under an expanded project.
type ProjectAction struct {
	Label   LocalizedText `json:"label"`
	URL     string        `json:"url"`
	Variant string        `json:"variant"` // "primary" | "secondary"
}

type ProjectActionList []ProjectAction

func (l ProjectActionList) Value() (driver.Value, error) {
	if l == nil {
		l = ProjectActionList{}
	}
	return jsonValue(l)
}
func (l *ProjectActionList) Scan(src any) error { return jsonScan(src, l) }

// Media types for the preview area of an expanded project.
const (
	MediaBuiltin     = "builtin"     // an in-page mini game, selected by Key
	MediaIframe      = "iframe"      // embedded external demo (Unity WebGL, itch.io...)
	MediaImage       = "image"       // uploaded or external image
	MediaVideo       = "video"       // uploaded or external video
	MediaPlaceholder = "placeholder" // dashed box with an icon and caption
)

// BuiltinMediaKeys lists the mini games the frontend knows how to render.
var BuiltinMediaKeys = map[string]bool{"balloons": true}

// PlaceholderIcons lists the icons the frontend can draw in a placeholder.
var PlaceholderIcons = map[string]bool{"play": true, "monitor": true, "file": true, "board": true, "dollar": true, "code": true, "image": true}

type ProjectMedia struct {
	Type    string        `json:"type"`
	Key     string        `json:"key,omitempty"`
	URL     string        `json:"url,omitempty"`
	Icon    string        `json:"icon,omitempty"`
	Caption LocalizedText `json:"caption"`
	Height  int           `json:"height,omitempty"` // preview height in px; 0 = default
}

func (m ProjectMedia) Value() (driver.Value, error) { return jsonValue(m) }
func (m *ProjectMedia) Scan(src any) error          { return jsonScan(src, m) }

func (m *ProjectMedia) Validate() error {
	switch m.Type {
	case MediaBuiltin:
		if !BuiltinMediaKeys[m.Key] {
			return &ValidationError{Field: "media.key", Message: "unknown built-in mini game"}
		}
	case MediaIframe, MediaImage, MediaVideo:
		if m.URL == "" {
			return &ValidationError{Field: "media.url", Message: "media url is required"}
		}
	case MediaPlaceholder:
		if m.Icon != "" && !PlaceholderIcons[m.Icon] {
			return &ValidationError{Field: "media.icon", Message: "unknown placeholder icon"}
		}
	default:
		return &ValidationError{Field: "media.type", Message: "media type must be builtin, iframe, image, video or placeholder"}
	}
	if m.Height < 0 || m.Height > 900 {
		return &ValidationError{Field: "media.height", Message: "media height must be between 0 and 900"}
	}
	return nil
}

type Project struct {
	ID          string            `db:"id" json:"id"`
	Slug        string            `db:"slug" json:"slug"`
	SortOrder   int               `db:"sort_order" json:"sort_order"`
	Published   bool              `db:"published" json:"published"`
	Category    string            `db:"category" json:"category"` // "game" | "software"
	Color       string            `db:"color" json:"color"`
	Title       LocalizedText     `db:"title" json:"title"`
	Platform    LocalizedText     `db:"platform" json:"platform"`
	StatusLabel LocalizedText     `db:"status_label" json:"status_label"`
	Description LocalizedText     `db:"description" json:"description"`
	Meta        ProjectMetaList   `db:"meta" json:"meta"`
	Actions     ProjectActionList `db:"actions" json:"actions"`
	Media       ProjectMedia      `db:"media" json:"media"`
	Tech        pq.StringArray    `db:"tech" json:"tech"`
	CreatedAt   time.Time         `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time         `db:"updated_at" json:"updated_at"`
}

// ProjectInput is the full editable state of a project (create and replace).
type ProjectInput struct {
	Slug        string            `json:"slug"`
	Published   bool              `json:"published"`
	Category    string            `json:"category"`
	Color       string            `json:"color"`
	Title       LocalizedText     `json:"title"`
	Platform    LocalizedText     `json:"platform"`
	StatusLabel LocalizedText     `json:"status_label"`
	Description LocalizedText     `json:"description"`
	Meta        ProjectMetaList   `json:"meta"`
	Actions     ProjectActionList `json:"actions"`
	Media       ProjectMedia      `json:"media"`
	Tech        []string          `json:"tech"`
}

func (r *ProjectInput) Validate() error {
	if r.Title.IsEmpty() {
		return &ValidationError{Field: "title", Message: "title is required"}
	}
	if r.Category != "game" && r.Category != "software" {
		return &ValidationError{Field: "category", Message: "category must be game or software"}
	}
	if err := validateColor(r.Color); err != nil {
		return err
	}
	for _, a := range r.Actions {
		if a.Label.IsEmpty() || a.URL == "" {
			return &ValidationError{Field: "actions", Message: "every action needs a label and url"}
		}
		if a.Variant != "primary" && a.Variant != "secondary" {
			return &ValidationError{Field: "actions", Message: "action variant must be primary or secondary"}
		}
	}
	return r.Media.Validate()
}

type ProjectRepository interface {
	Create(ctx context.Context, project *Project) error
	GetByID(ctx context.Context, id string) (*Project, error)
	List(ctx context.Context, publishedOnly bool) ([]Project, error)
	Update(ctx context.Context, project *Project) error
	Delete(ctx context.Context, id string) error
	Reorder(ctx context.Context, ids []string) error
}

type ProjectUseCase interface {
	Create(ctx context.Context, req *ProjectInput) (*Project, error)
	GetByID(ctx context.Context, id string) (*Project, error)
	List(ctx context.Context, publishedOnly bool) ([]Project, error)
	Update(ctx context.Context, id string, req *ProjectInput) (*Project, error)
	Delete(ctx context.Context, id string) error
	Reorder(ctx context.Context, req *ReorderRequest) error
}
