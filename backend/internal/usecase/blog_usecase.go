package usecase

import (
	"context"
	"strings"
	"time"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/slug"
)

type blogUseCase struct {
	blogRepo domain.BlogRepository
	cfg      *config.Config
}

func NewBlogUseCase(blogRepo domain.BlogRepository, cfg *config.Config) domain.BlogUseCase {
	return &blogUseCase{
		blogRepo: blogRepo,
		cfg:      cfg,
	}
}

// applyBlogInput copies editable fields onto b. published_at is stamped the first
// time a post is published and kept afterwards, so unpublish/republish keeps its date.
func applyBlogInput(b *domain.Blog, req *domain.BlogInput) {
	s := strings.TrimSpace(req.Slug)
	if s == "" {
		s = req.Title.Pick(domain.LocaleTR)
	}
	b.Slug = slug.Make(s)
	b.Title = req.Title
	b.Excerpt = req.Excerpt
	b.Content = req.Content
	b.CoverImage = req.CoverImage
	b.Published = req.Published
	if b.Published && b.PublishedAt == nil {
		now := time.Now()
		b.PublishedAt = &now
	}
}

func (u *blogUseCase) Create(ctx context.Context, authorID string, req *domain.BlogInput) (*domain.Blog, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	blog := &domain.Blog{AuthorID: &authorID}
	applyBlogInput(blog, req)
	if err := u.blogRepo.Create(ctx, blog); err != nil {
		return nil, err
	}
	return blog, nil
}

func (u *blogUseCase) GetByID(ctx context.Context, id string) (*domain.Blog, error) {
	return u.blogRepo.GetByID(ctx, id)
}

// GetPublishedBySlug hides drafts from the public site.
func (u *blogUseCase) GetPublishedBySlug(ctx context.Context, slug string) (*domain.Blog, error) {
	blog, err := u.blogRepo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if !blog.Published {
		return nil, domain.ErrBlogNotFound
	}
	return blog, nil
}

func (u *blogUseCase) List(ctx context.Context, publishedOnly bool) ([]domain.Blog, error) {
	return u.blogRepo.List(ctx, publishedOnly)
}

func (u *blogUseCase) Update(ctx context.Context, id string, req *domain.BlogInput) (*domain.Blog, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	blog, err := u.blogRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	applyBlogInput(blog, req)
	if err := u.blogRepo.Update(ctx, blog); err != nil {
		return nil, err
	}
	return blog, nil
}

func (u *blogUseCase) Delete(ctx context.Context, id string) error {
	return u.blogRepo.Delete(ctx, id)
}
