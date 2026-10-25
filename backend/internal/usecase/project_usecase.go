package usecase

import (
	"context"
	"strings"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/slug"
)

type projectUseCase struct {
	projectRepo domain.ProjectRepository
	cfg         *config.Config
}

func NewProjectUseCase(projectRepo domain.ProjectRepository, cfg *config.Config) domain.ProjectUseCase {
	return &projectUseCase{
		projectRepo: projectRepo,
		cfg:         cfg,
	}
}

// applyProjectInput copies the editable fields onto p, generating a slug from the
// title when none is given.
func applyProjectInput(p *domain.Project, req *domain.ProjectInput) {
	s := strings.TrimSpace(req.Slug)
	if s == "" {
		s = req.Title.Pick(domain.LocaleTR)
	}
	p.Slug = slug.Make(s)
	p.Published = req.Published
	p.Category = req.Category
	p.Color = req.Color
	p.Title = req.Title
	p.Platform = req.Platform
	p.StatusLabel = req.StatusLabel
	p.Description = req.Description
	p.Meta = req.Meta
	p.Actions = req.Actions
	p.Media = req.Media

	tech := make([]string, 0, len(req.Tech))
	for _, t := range req.Tech {
		if t = strings.TrimSpace(t); t != "" {
			tech = append(tech, t)
		}
	}
	p.Tech = tech
}

func (u *projectUseCase) Create(ctx context.Context, req *domain.ProjectInput) (*domain.Project, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	project := &domain.Project{}
	applyProjectInput(project, req)
	if err := u.projectRepo.Create(ctx, project); err != nil {
		return nil, err
	}
	return project, nil
}

func (u *projectUseCase) GetByID(ctx context.Context, id string) (*domain.Project, error) {
	return u.projectRepo.GetByID(ctx, id)
}

func (u *projectUseCase) List(ctx context.Context, publishedOnly bool) ([]domain.Project, error) {
	return u.projectRepo.List(ctx, publishedOnly)
}

func (u *projectUseCase) Update(ctx context.Context, id string, req *domain.ProjectInput) (*domain.Project, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	project := &domain.Project{ID: id}
	applyProjectInput(project, req)
	if err := u.projectRepo.Update(ctx, project); err != nil {
		return nil, err
	}
	return project, nil
}

func (u *projectUseCase) Delete(ctx context.Context, id string) error {
	return u.projectRepo.Delete(ctx, id)
}

func (u *projectUseCase) Reorder(ctx context.Context, req *domain.ReorderRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	return u.projectRepo.Reorder(ctx, req.IDs)
}
