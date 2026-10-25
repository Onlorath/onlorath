package postgres

import (
	"context"

	"backend/internal/domain"

	"github.com/jmoiron/sqlx"
)

type blogRepository struct {
	db *sqlx.DB
}

func NewBlogRepository(db *sqlx.DB) domain.BlogRepository {
	return &blogRepository{
		db: db,
	}
}

const blogColumns = `id, slug, title, excerpt, content, cover_image, author_id, published, published_at, created_at, updated_at`

func (r *blogRepository) Create(ctx context.Context, b *domain.Blog) error {
	query := `
		INSERT INTO blogs (slug, title, excerpt, content, cover_image, author_id, published, published_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowxContext(ctx, query, b.Slug, b.Title, b.Excerpt, b.Content, b.CoverImage, b.AuthorID,
		b.Published, b.PublishedAt).
		Scan(&b.ID, &b.CreatedAt, &b.UpdatedAt)
	if isUniqueViolation(err) {
		return domain.ErrBlogSlugExists
	}
	return err
}

func (r *blogRepository) GetByID(ctx context.Context, id string) (*domain.Blog, error) {
	var blog domain.Blog
	err := r.db.GetContext(ctx, &blog, `SELECT `+blogColumns+` FROM blogs WHERE id = $1`, id)
	if err != nil {
		return nil, mapNoRows(err, domain.ErrBlogNotFound)
	}
	return &blog, nil
}

func (r *blogRepository) GetBySlug(ctx context.Context, slug string) (*domain.Blog, error) {
	var blog domain.Blog
	err := r.db.GetContext(ctx, &blog, `SELECT `+blogColumns+` FROM blogs WHERE slug = $1`, slug)
	if err != nil {
		return nil, mapNoRows(err, domain.ErrBlogNotFound)
	}
	return &blog, nil
}

func (r *blogRepository) List(ctx context.Context, publishedOnly bool) ([]domain.Blog, error) {
	blogs := []domain.Blog{}
	query := `SELECT ` + blogColumns + ` FROM blogs WHERE ($1 = false OR published)
		ORDER BY COALESCE(published_at, created_at) DESC`
	if err := r.db.SelectContext(ctx, &blogs, query, publishedOnly); err != nil {
		return nil, err
	}
	return blogs, nil
}

func (r *blogRepository) Update(ctx context.Context, b *domain.Blog) error {
	query := `
		UPDATE blogs
		SET slug = $1, title = $2, excerpt = $3, content = $4, cover_image = $5, published = $6, published_at = $7
		WHERE id = $8
		RETURNING author_id, created_at, updated_at
	`
	// Note: updated_at is automatically managed by the DB trigger update_modified_column()
	err := r.db.QueryRowxContext(ctx, query, b.Slug, b.Title, b.Excerpt, b.Content, b.CoverImage, b.Published,
		b.PublishedAt, b.ID).
		Scan(&b.AuthorID, &b.CreatedAt, &b.UpdatedAt)
	if isUniqueViolation(err) {
		return domain.ErrBlogSlugExists
	}
	return mapNoRows(err, domain.ErrBlogNotFound)
}

func (r *blogRepository) Delete(ctx context.Context, id string) error {
	return deleteByID(ctx, r.db, `DELETE FROM blogs WHERE id = $1`, id, domain.ErrBlogNotFound)
}
