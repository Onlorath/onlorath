package usecase

import (
	"context"

	"backend/config"
	"backend/internal/domain"
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

func (u *projectUseCase) Create(ctx context.Context, req *domain.CreateProjectRequest) (*domain.Project, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	project := &domain.Project{
		Title:       req.Title,
		Description: req.Description,
		Tech:        req.Tech,
		Status:      req.Status,
		CoverImage:  req.CoverImage,
		SortOrder:   req.SortOrder,
	}

	err := u.projectRepo.Create(ctx, project)
	if err != nil {
		return nil, err
	}
	return project, nil
}

func (u *projectUseCase) GetByID(ctx context.Context, id string) (*domain.Project, error) {
	return u.projectRepo.GetByID(ctx, id)
}

func (u *projectUseCase) List(ctx context.Context) ([]domain.Project, error) {
	return u.projectRepo.List(ctx)
}

func (u *projectUseCase) Update(ctx context.Context, id string, req *domain.UpdateProjectRequest) (*domain.Project, error) {
	project, err := u.projectRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		project.Title = *req.Title
	}
	if req.Description != nil {
		project.Description = *req.Description
	}
	if req.Tech != nil {
		project.Tech = req.Tech
	}
	if req.Status != nil {
		project.Status = *req.Status
	}
	if req.CoverImage != nil {
		project.CoverImage = *req.CoverImage
	}
	if req.SortOrder != nil {
		project.SortOrder = *req.SortOrder
	}

	err = u.projectRepo.Update(ctx, project)
	if err != nil {
		return nil, err
	}
	return project, nil
}

func (u *projectUseCase) Delete(ctx context.Context, id string) error {
	return u.projectRepo.Delete(ctx, id)
}

func (u *projectUseCase) AddImage(ctx context.Context, projectID string, url string, altText string) (*domain.ProjectImage, error) {
	img := &domain.ProjectImage{
		ProjectID: projectID,
		URL:       url,
		AltText:   altText,
		SortOrder: 0,
	}
	err := u.projectRepo.AddImage(ctx, img)
	if err != nil {
		return nil, err
	}
	return img, nil
}

func (u *projectUseCase) ListImages(ctx context.Context, projectID string) ([]domain.ProjectImage, error) {
	return u.projectRepo.ListImages(ctx, projectID)
}

func (u *projectUseCase) DeleteImage(ctx context.Context, imageID string) error {
	return u.projectRepo.DeleteImage(ctx, imageID)
}
