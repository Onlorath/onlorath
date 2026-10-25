package usecase

import (
	"context"
	"strings"

	"backend/internal/domain"
)

type siteUseCase struct {
	siteRepo    domain.SiteRepository
	projectRepo domain.ProjectRepository
}

func NewSiteUseCase(siteRepo domain.SiteRepository, projectRepo domain.ProjectRepository) domain.SiteUseCase {
	return &siteUseCase{siteRepo: siteRepo, projectRepo: projectRepo}
}

// GetSite loads everything the public one-page site renders.
func (u *siteUseCase) GetSite(ctx context.Context) (*domain.Site, error) {
	profile, err := u.siteRepo.GetProfile(ctx)
	if err != nil {
		return nil, err
	}
	projects, err := u.projectRepo.List(ctx, true)
	if err != nil {
		return nil, err
	}
	experiences, err := u.siteRepo.ListExperiences(ctx)
	if err != nil {
		return nil, err
	}
	skills, err := u.siteRepo.ListSkills(ctx)
	if err != nil {
		return nil, err
	}
	socials, err := u.siteRepo.ListSocialLinks(ctx)
	if err != nil {
		return nil, err
	}
	return &domain.Site{
		Profile:     profile,
		Projects:    projects,
		Experiences: experiences,
		Skills:      skills,
		Socials:     socials,
	}, nil
}

func (u *siteUseCase) GetProfile(ctx context.Context) (*domain.Profile, error) {
	return u.siteRepo.GetProfile(ctx)
}

func (u *siteUseCase) UpdateProfile(ctx context.Context, p *domain.Profile) (*domain.Profile, error) {
	p.Name = strings.TrimSpace(p.Name)
	p.LogoText = strings.TrimSpace(p.LogoText)
	p.Email = strings.TrimSpace(p.Email)
	if err := p.Validate(); err != nil {
		return nil, err
	}
	if p.AboutParagraphs == nil {
		p.AboutParagraphs = domain.LocalizedList{}
	}
	if err := u.siteRepo.UpsertProfile(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

// --- Experiences ---

func (u *siteUseCase) ListExperiences(ctx context.Context) ([]domain.Experience, error) {
	return u.siteRepo.ListExperiences(ctx)
}

func (u *siteUseCase) CreateExperience(ctx context.Context, req *domain.ExperienceInput) (*domain.Experience, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	e := &domain.Experience{Period: req.Period, Title: req.Title, Subtitle: req.Subtitle, Tag: req.Tag, Color: req.Color}
	if err := u.siteRepo.CreateExperience(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}

func (u *siteUseCase) UpdateExperience(ctx context.Context, id string, req *domain.ExperienceInput) (*domain.Experience, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	e := &domain.Experience{ID: id, Period: req.Period, Title: req.Title, Subtitle: req.Subtitle, Tag: req.Tag, Color: req.Color}
	if err := u.siteRepo.UpdateExperience(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}

func (u *siteUseCase) DeleteExperience(ctx context.Context, id string) error {
	return u.siteRepo.DeleteExperience(ctx, id)
}

func (u *siteUseCase) ReorderExperiences(ctx context.Context, req *domain.ReorderRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	return u.siteRepo.ReorderExperiences(ctx, req.IDs)
}

// --- Skills ---

func (u *siteUseCase) ListSkills(ctx context.Context) ([]domain.Skill, error) {
	return u.siteRepo.ListSkills(ctx)
}

func (u *siteUseCase) CreateSkill(ctx context.Context, req *domain.SkillInput) (*domain.Skill, error) {
	req.Label = strings.TrimSpace(req.Label)
	if err := req.Validate(); err != nil {
		return nil, err
	}
	s := &domain.Skill{Label: req.Label}
	if err := u.siteRepo.CreateSkill(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}

func (u *siteUseCase) UpdateSkill(ctx context.Context, id string, req *domain.SkillInput) (*domain.Skill, error) {
	req.Label = strings.TrimSpace(req.Label)
	if err := req.Validate(); err != nil {
		return nil, err
	}
	s := &domain.Skill{ID: id, Label: req.Label}
	if err := u.siteRepo.UpdateSkill(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}

func (u *siteUseCase) DeleteSkill(ctx context.Context, id string) error {
	return u.siteRepo.DeleteSkill(ctx, id)
}

func (u *siteUseCase) ReorderSkills(ctx context.Context, req *domain.ReorderRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	return u.siteRepo.ReorderSkills(ctx, req.IDs)
}

// --- Social links ---

func (u *siteUseCase) ListSocialLinks(ctx context.Context) ([]domain.SocialLink, error) {
	return u.siteRepo.ListSocialLinks(ctx)
}

func (u *siteUseCase) CreateSocialLink(ctx context.Context, req *domain.SocialLinkInput) (*domain.SocialLink, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	s := &domain.SocialLink{Label: strings.TrimSpace(req.Label), URL: strings.TrimSpace(req.URL)}
	if err := u.siteRepo.CreateSocialLink(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}

func (u *siteUseCase) UpdateSocialLink(ctx context.Context, id string, req *domain.SocialLinkInput) (*domain.SocialLink, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	s := &domain.SocialLink{ID: id, Label: strings.TrimSpace(req.Label), URL: strings.TrimSpace(req.URL)}
	if err := u.siteRepo.UpdateSocialLink(ctx, s); err != nil {
		return nil, err
	}
	return s, nil
}

func (u *siteUseCase) DeleteSocialLink(ctx context.Context, id string) error {
	return u.siteRepo.DeleteSocialLink(ctx, id)
}

func (u *siteUseCase) ReorderSocialLinks(ctx context.Context, req *domain.ReorderRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}
	return u.siteRepo.ReorderSocialLinks(ctx, req.IDs)
}
