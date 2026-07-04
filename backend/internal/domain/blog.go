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

type Blog struct {
	ID         string    `db:"id" json:"id"`
	Title      string    `db:"title" json:"title"`
	Slug       string    `db:"slug" json:"slug"`
	Content    string    `db:"content" json:"content"`
	CoverImage string    `db:"cover_image" json:"cover_image"`
	AuthorID   *string   `db:"author_id" json:"author_id"`
	Published  bool      `db:"published" json:"published"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
}

type BlogImage struct {
	ID        string    `db:"id" json:"id"`
	BlogID    string    `db:"blog_id" json:"blog_id"`
	URL       string    `db:"url" json:"url"`
	AltText   string    `db:"alt_text" json:"alt_text"`
	SortOrder int       `db:"sort_order" json:"sort_order"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type CreateBlogRequest struct {
	Title      string `json:"title"`
	Content    string `json:"content"`
	CoverImage string `json:"cover_image"`
	Published  bool   `json:"published"`
}

func (r *CreateBlogRequest) Validate() error {
	if r.Title == "" {
		return errors.New("title is required")
	}
	return nil
}

type UpdateBlogRequest struct {
	Title      *string `json:"title"`
	Content    *string `json:"content"`
	CoverImage *string `json:"cover_image"`
	Published  *bool   `json:"published"`
}

type BlogRepository interface {
	Create(ctx context.Context, blog *Blog) error
	GetByID(ctx context.Context, id string) (*Blog, error)
	GetBySlug(ctx context.Context, slug string) (*Blog, error)
	List(ctx context.Context, publishedOnly bool) ([]Blog, error)
	Update(ctx context.Context, blog *Blog) error
	Delete(ctx context.Context, id string) error
	AddImage(ctx context.Context, img *BlogImage) error
	ListImages(ctx context.Context, blogID string) ([]BlogImage, error)
	DeleteImage(ctx context.Context, imageID string) error
}

type BlogUseCase interface {
	Create(ctx context.Context, authorID string, req *CreateBlogRequest) (*Blog, error)
	GetByID(ctx context.Context, id string) (*Blog, error)
	GetBySlug(ctx context.Context, slug string) (*Blog, error)
	List(ctx context.Context, publishedOnly bool) ([]Blog, error)
	Update(ctx context.Context, id string, req *UpdateBlogRequest) (*Blog, error)
	Delete(ctx context.Context, id string) error
	AddImage(ctx context.Context, blogID string, url string, altText string) (*BlogImage, error)
	ListImages(ctx context.Context, blogID string) ([]BlogImage, error)
	DeleteImage(ctx context.Context, imageID string) error
}
