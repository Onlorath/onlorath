package domain

import (
	"context"
	"errors"
	"time"
)

var (
	ErrBlogNotFound   = errors.New("blog not found")
	ErrBlogSlugExists = errors.New("blog slug already exists")
)

// Blog is a bilingual post; Content is Markdown in each language.
type Blog struct {
	ID          string        `db:"id" json:"id"`
	Slug        string        `db:"slug" json:"slug"`
	Title       LocalizedText `db:"title" json:"title"`
	Excerpt     LocalizedText `db:"excerpt" json:"excerpt"`
	Content     LocalizedText `db:"content" json:"content"`
	CoverImage  string        `db:"cover_image" json:"cover_image"`
	AuthorID    *string       `db:"author_id" json:"author_id"`
	Published   bool          `db:"published" json:"published"`
	PublishedAt *time.Time    `db:"published_at" json:"published_at"`
	CreatedAt   time.Time     `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time     `db:"updated_at" json:"updated_at"`
}

// BlogInput is the full editable state of a post (create and replace).
// An empty Slug is generated from the Turkish title.
type BlogInput struct {
	Slug       string        `json:"slug"`
	Title      LocalizedText `json:"title"`
	Excerpt    LocalizedText `json:"excerpt"`
	Content    LocalizedText `json:"content"`
	CoverImage string        `json:"cover_image"`
	Published  bool          `json:"published"`
}

func (r *BlogInput) Validate() error {
	if r.Title.IsEmpty() {
		return &ValidationError{Field: "title", Message: "title is required"}
	}
	return nil
}

type BlogRepository interface {
	Create(ctx context.Context, blog *Blog) error
	GetByID(ctx context.Context, id string) (*Blog, error)
	GetBySlug(ctx context.Context, slug string) (*Blog, error)
	List(ctx context.Context, publishedOnly bool) ([]Blog, error)
	Update(ctx context.Context, blog *Blog) error
	Delete(ctx context.Context, id string) error
}

type BlogUseCase interface {
	Create(ctx context.Context, authorID string, req *BlogInput) (*Blog, error)
	GetByID(ctx context.Context, id string) (*Blog, error)
	GetPublishedBySlug(ctx context.Context, slug string) (*Blog, error)
	List(ctx context.Context, publishedOnly bool) ([]Blog, error)
	Update(ctx context.Context, id string, req *BlogInput) (*Blog, error)
	Delete(ctx context.Context, id string) error
}
