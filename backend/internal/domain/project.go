package domain

import (
	"context"
	"errors"
	"time"

	"github.com/lib/pq"
)

var (
	ErrProjectNotFound = errors.New("project not found")
)

type Project struct {
	ID          string         `db:"id" json:"id"`
	Title       string         `db:"title" json:"title"`
	Description string         `db:"description" json:"description"`
	Tech        pq.StringArray `db:"tech" json:"tech"`
	Status      string         `db:"status" json:"status"`
	CoverImage  string         `db:"cover_image" json:"cover_image"`
	SortOrder   int            `db:"sort_order" json:"sort_order"`
	CreatedAt   time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time      `db:"updated_at" json:"updated_at"`
}

type ProjectImage struct {
	ID        string    `db:"id" json:"id"`
	ProjectID string    `db:"project_id" json:"project_id"`
	URL       string    `db:"url" json:"url"`
	AltText   string    `db:"alt_text" json:"alt_text"`
	SortOrder int       `db:"sort_order" json:"sort_order"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type CreateProjectRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Tech        []string `json:"tech"`
	Status      string   `json:"status"`
	CoverImage  string   `json:"cover_image"`
	SortOrder   int      `json:"sort_order"`
}

func (r *CreateProjectRequest) Validate() error {
	if r.Title == "" {
		return errors.New("title is required")
	}
	return nil
}

type UpdateProjectRequest struct {
	Title       *string  `json:"title"`
	Description *string  `json:"description"`
	Tech        []string `json:"tech"`
	Status      *string  `json:"status"`
	CoverImage  *string  `json:"cover_image"`
	SortOrder   *int     `json:"sort_order"`
}

type ProjectRepository interface {
	Create(ctx context.Context, project *Project) error
	GetByID(ctx context.Context, id string) (*Project, error)
	List(ctx context.Context) ([]Project, error)
	Update(ctx context.Context, project *Project) error
	Delete(ctx context.Context, id string) error
	AddImage(ctx context.Context, img *ProjectImage) error
	ListImages(ctx context.Context, projectID string) ([]ProjectImage, error)
	DeleteImage(ctx context.Context, imageID string) error
}

type ProjectUseCase interface {
	Create(ctx context.Context, req *CreateProjectRequest) (*Project, error)
	GetByID(ctx context.Context, id string) (*Project, error)
	List(ctx context.Context) ([]Project, error)
	Update(ctx context.Context, id string, req *UpdateProjectRequest) (*Project, error)
	Delete(ctx context.Context, id string) error
	AddImage(ctx context.Context, projectID string, url string, altText string) (*ProjectImage, error)
	ListImages(ctx context.Context, projectID string) ([]ProjectImage, error)
	DeleteImage(ctx context.Context, imageID string) error
}
