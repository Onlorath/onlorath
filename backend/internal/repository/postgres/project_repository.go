package postgres

import (
	"context"
	"database/sql"

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

func (r *projectRepository) Create(ctx context.Context, project *domain.Project) error {
	query := `
		INSERT INTO projects (title, description, tech, status, cover_image, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowxContext(ctx, query, project.Title, project.Description, pq.Array(project.Tech), project.Status, project.CoverImage, project.SortOrder).
		Scan(&project.ID, &project.CreatedAt, &project.UpdatedAt)
	return err
}

func (r *projectRepository) GetByID(ctx context.Context, id string) (*domain.Project, error) {
	var project domain.Project
	query := `SELECT id, title, description, tech, status, cover_image, sort_order, created_at, updated_at FROM projects WHERE id = $1`
	err := r.db.GetContext(ctx, &project, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrProjectNotFound
		}
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) List(ctx context.Context) ([]domain.Project, error) {
	projects := []domain.Project{}
	query := `SELECT id, title, description, tech, status, cover_image, sort_order, created_at, updated_at FROM projects ORDER BY sort_order ASC, created_at DESC`
	err := r.db.SelectContext(ctx, &projects, query)
	if err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *projectRepository) Update(ctx context.Context, project *domain.Project) error {
	query := `
		UPDATE projects 
		SET title = $1, description = $2, tech = $3, status = $4, cover_image = $5, sort_order = $6
		WHERE id = $7
		RETURNING updated_at
	`
	// Note: updated_at is automatically managed by the DB trigger update_modified_column()
	err := r.db.QueryRowxContext(ctx, query, project.Title, project.Description, pq.Array(project.Tech), project.Status, project.CoverImage, project.SortOrder, project.ID).
		Scan(&project.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return domain.ErrProjectNotFound
		}
		return err
	}
	return nil
}

func (r *projectRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM projects WHERE id = $1`
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return domain.ErrProjectNotFound
	}
	return nil
}

func (r *projectRepository) AddImage(ctx context.Context, img *domain.ProjectImage) error {
	query := `
		INSERT INTO project_images (project_id, url, alt_text, sort_order)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	err := r.db.QueryRowxContext(ctx, query, img.ProjectID, img.URL, img.AltText, img.SortOrder).
		Scan(&img.ID, &img.CreatedAt)
	return err
}

func (r *projectRepository) ListImages(ctx context.Context, projectID string) ([]domain.ProjectImage, error) {
	images := []domain.ProjectImage{}
	query := `SELECT id, project_id, url, alt_text, sort_order, created_at FROM project_images WHERE project_id = $1 ORDER BY sort_order ASC`
	err := r.db.SelectContext(ctx, &images, query, projectID)
	if err != nil {
		return nil, err
	}
	return images, nil
}

func (r *projectRepository) DeleteImage(ctx context.Context, imageID string) error {
	query := `DELETE FROM project_images WHERE id = $1`
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
