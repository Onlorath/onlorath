package usecase

import (
	"context"
	"regexp"
	"strings"

	"backend/config"
	"backend/internal/domain"
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

func generateSlug(title string) string {
	s := strings.ToLower(title)
	// Replace Turkish characters
	s = strings.ReplaceAll(s, "ç", "c")
	s = strings.ReplaceAll(s, "ğ", "g")
	s = strings.ReplaceAll(s, "ı", "i")
	s = strings.ReplaceAll(s, "ö", "o")
	s = strings.ReplaceAll(s, "ş", "s")
	s = strings.ReplaceAll(s, "ü", "u")

	// Replace non-alphanumeric chars with hyphen
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	s = reg.ReplaceAllString(s, "-")
	
	// Trim leading/trailing hyphens
	s = strings.Trim(s, "-")

	if s == "" {
		s = "untitled"
	}
	return s
}

func (u *blogUseCase) Create(ctx context.Context, authorID string, req *domain.CreateBlogRequest) (*domain.Blog, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	slug := generateSlug(req.Title)

	blog := &domain.Blog{
		Title:      req.Title,
		Slug:       slug,
		Content:    req.Content,
		CoverImage: req.CoverImage,
		AuthorID:   &authorID,
		Published:  req.Published,
	}

	err := u.blogRepo.Create(ctx, blog)
	if err != nil {
		return nil, err
	}
	return blog, nil
}

func (u *blogUseCase) GetByID(ctx context.Context, id string) (*domain.Blog, error) {
	return u.blogRepo.GetByID(ctx, id)
}

func (u *blogUseCase) GetBySlug(ctx context.Context, slug string) (*domain.Blog, error) {
	return u.blogRepo.GetBySlug(ctx, slug)
}

func (u *blogUseCase) List(ctx context.Context, publishedOnly bool) ([]domain.Blog, error) {
	return u.blogRepo.List(ctx, publishedOnly)
}

func (u *blogUseCase) Update(ctx context.Context, id string, req *domain.UpdateBlogRequest) (*domain.Blog, error) {
	blog, err := u.blogRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		blog.Title = *req.Title
		blog.Slug = generateSlug(*req.Title)
	}
	if req.Content != nil {
		blog.Content = *req.Content
	}
	if req.CoverImage != nil {
		blog.CoverImage = *req.CoverImage
	}
	if req.Published != nil {
		blog.Published = *req.Published
	}

	err = u.blogRepo.Update(ctx, blog)
	if err != nil {
		return nil, err
	}
	return blog, nil
}

func (u *blogUseCase) Delete(ctx context.Context, id string) error {
	return u.blogRepo.Delete(ctx, id)
}

func (u *blogUseCase) AddImage(ctx context.Context, blogID string, url string, altText string) (*domain.BlogImage, error) {
	img := &domain.BlogImage{
		BlogID:    blogID,
		URL:       url,
		AltText:   altText,
		SortOrder: 0, // Default sorting
	}
	err := u.blogRepo.AddImage(ctx, img)
	if err != nil {
		return nil, err
	}
	return img, nil
}

func (u *blogUseCase) ListImages(ctx context.Context, blogID string) ([]domain.BlogImage, error) {
	return u.blogRepo.ListImages(ctx, blogID)
}

func (u *blogUseCase) DeleteImage(ctx context.Context, imageID string) error {
	return u.blogRepo.DeleteImage(ctx, imageID)
}
