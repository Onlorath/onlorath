package postgres

import (
	"context"

	"backend/internal/domain"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type projectRepository struct {
	db *sqlx.DB
}

func NewProjectRepository(db *sqlx.DB) domain.ProjectRepository {
	return &projectRepository{
		db: db,
	}
}

const projectColumns = `id, slug, sort_order, published, category, color, title, platform, status_label,
	description, meta, actions, media, tech, created_at, updated_at`

func (r *projectRepository) Create(ctx context.Context, p *domain.Project) error {
	sortOrder, err := nextSortOrder(ctx, r.db, "projects")
	if err != nil {
		return err
	}
	p.SortOrder = sortOrder

	query := `
		INSERT INTO projects (slug, sort_order, published, category, color, title, platform, status_label,
			description, meta, actions, media, tech)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`
	err = r.db.QueryRowxContext(ctx, query, p.Slug, p.SortOrder, p.Published, p.Category, p.Color, p.Title,
		p.Platform, p.StatusLabel, p.Description, p.Meta, p.Actions, p.Media, pq.Array(p.Tech)).
		Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
	if isUniqueViolation(err) {
		return domain.ErrProjectSlugExists
	}
	return err
}

func (r *projectRepository) GetByID(ctx context.Context, id string) (*domain.Project, error) {
	var project domain.Project
	err := r.db.GetContext(ctx, &project, `SELECT `+projectColumns+` FROM projects WHERE id = $1`, id)
	if err != nil {
		return nil, mapNoRows(err, domain.ErrProjectNotFound)
	}
	return &project, nil
}

func (r *projectRepository) List(ctx context.Context, publishedOnly bool) ([]domain.Project, error) {
	projects := []domain.Project{}
	query := `SELECT ` + projectColumns + ` FROM projects WHERE ($1 = false OR published) ORDER BY sort_order ASC, created_at ASC`
	if err := r.db.SelectContext(ctx, &projects, query, publishedOnly); err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *projectRepository) Update(ctx context.Context, p *domain.Project) error {
	query := `
		UPDATE projects
		SET slug = $1, published = $2, category = $3, color = $4, title = $5, platform = $6, status_label = $7,
			description = $8, meta = $9, actions = $10, media = $11, tech = $12
		WHERE id = $13
		RETURNING sort_order, created_at, updated_at
	`
	// Note: updated_at is automatically managed by the DB trigger update_modified_column()
	err := r.db.QueryRowxContext(ctx, query, p.Slug, p.Published, p.Category, p.Color, p.Title, p.Platform,
		p.StatusLabel, p.Description, p.Meta, p.Actions, p.Media, pq.Array(p.Tech), p.ID).
		Scan(&p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
	if isUniqueViolation(err) {
		return domain.ErrProjectSlugExists
	}
	return mapNoRows(err, domain.ErrProjectNotFound)
}

func (r *projectRepository) Delete(ctx context.Context, id string) error {
	return deleteByID(ctx, r.db, `DELETE FROM projects WHERE id = $1`, id, domain.ErrProjectNotFound)
}

func (r *projectRepository) Reorder(ctx context.Context, ids []string) error {
	return reorder(ctx, r.db, "projects", ids)
}
