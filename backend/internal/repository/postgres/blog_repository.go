package postgres

import (
	"context"
	"database/sql"

	"backend/internal/domain"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type blogRepository struct {
	db *sqlx.DB
}

func NewBlogRepository(db *sqlx.DB) domain.BlogRepository {
	return &blogRepository{
		db: db,
	}
}

func (r *blogRepository) Create(ctx context.Context, blog *domain.Blog) error {
	query := `
		INSERT INTO blogs (title, slug, content, cover_image, author_id, published)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowxContext(ctx, query, blog.Title, blog.Slug, blog.Content, blog.CoverImage, blog.AuthorID, blog.Published).
		Scan(&blog.ID, &blog.CreatedAt, &blog.UpdatedAt)

	if err != nil {
		if pgErr, ok := err.(*pq.Error); ok {
			if pgErr.Code == "23505" {
				return domain.ErrBlogSlugExists
			}
		}
		return err
	}
	return nil
}

func (r *blogRepository) GetByID(ctx context.Context, id string) (*domain.Blog, error) {
	var blog domain.Blog
	query := `SELECT id, title, slug, content, cover_image, author_id, published, created_at, updated_at FROM blogs WHERE id = $1`
	err := r.db.GetContext(ctx, &blog, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrBlogNotFound
		}
		return nil, err
	}
	return &blog, nil
}

func (r *blogRepository) GetBySlug(ctx context.Context, slug string) (*domain.Blog, error) {
	var blog domain.Blog
	query := `SELECT id, title, slug, content, cover_image, author_id, published, created_at, updated_at FROM blogs WHERE slug = $1`
	err := r.db.GetContext(ctx, &blog, query, slug)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrBlogNotFound
		}
		return nil, err
	}
	return &blog, nil
}

func (r *blogRepository) List(ctx context.Context, publishedOnly bool) ([]domain.Blog, error) {
	blogs := []domain.Blog{}
	var query string
	var err error

	if publishedOnly {
		query = `SELECT id, title, slug, content, cover_image, author_id, published, created_at, updated_at FROM blogs WHERE published = true ORDER BY created_at DESC`
		err = r.db.SelectContext(ctx, &blogs, query)
	} else {
		query = `SELECT id, title, slug, content, cover_image, author_id, published, created_at, updated_at FROM blogs ORDER BY created_at DESC`
		err = r.db.SelectContext(ctx, &blogs, query)
	}

	if err != nil {
		return nil, err
	}
	return blogs, nil
}

func (r *blogRepository) Update(ctx context.Context, blog *domain.Blog) error {
	query := `
		UPDATE blogs 
		SET title = $1, slug = $2, content = $3, cover_image = $4, published = $5
		WHERE id = $6
		RETURNING updated_at
	`
	// Note: updated_at is automatically managed by the DB trigger update_modified_column()
	err := r.db.QueryRowxContext(ctx, query, blog.Title, blog.Slug, blog.Content, blog.CoverImage, blog.Published, blog.ID).
		Scan(&blog.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return domain.ErrBlogNotFound
		}
		if pgErr, ok := err.(*pq.Error); ok {
			if pgErr.Code == "23505" {
				return domain.ErrBlogSlugExists
			}
		}
		return err
	}
	return nil
}

func (r *blogRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM blogs WHERE id = $1`
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return domain.ErrBlogNotFound
	}
	return nil
}

func (r *blogRepository) AddImage(ctx context.Context, img *domain.BlogImage) error {
	query := `
		INSERT INTO blog_images (blog_id, url, alt_text, sort_order)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	err := r.db.QueryRowxContext(ctx, query, img.BlogID, img.URL, img.AltText, img.SortOrder).
		Scan(&img.ID, &img.CreatedAt)
	return err
}

func (r *blogRepository) ListImages(ctx context.Context, blogID string) ([]domain.BlogImage, error) {
	images := []domain.BlogImage{}
	query := `SELECT id, blog_id, url, alt_text, sort_order, created_at FROM blog_images WHERE blog_id = $1 ORDER BY sort_order ASC`
	err := r.db.SelectContext(ctx, &images, query, blogID)
	if err != nil {
		return nil, err
	}
	return images, nil
}

func (r *blogRepository) DeleteImage(ctx context.Context, imageID string) error {
	query := `DELETE FROM blog_images WHERE id = $1`
	res, err := r.db.ExecContext(ctx, query, imageID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}
