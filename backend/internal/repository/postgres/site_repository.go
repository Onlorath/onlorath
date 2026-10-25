package postgres

import (
	"context"
	"database/sql"

	"backend/internal/domain"

	"github.com/jmoiron/sqlx"
)

type siteRepository struct {
	db *sqlx.DB
}

func NewSiteRepository(db *sqlx.DB) domain.SiteRepository {
	return &siteRepository{db: db}
}

// --- Profile (singleton row id = 1) ---

func (r *siteRepository) GetProfile(ctx context.Context) (*domain.Profile, error) {
	var p domain.Profile
	err := r.db.GetContext(ctx, &p, `
		SELECT name, logo_text, hero_headline, hero_lead, role_title, location_line,
			about_title, about_paragraphs, contact_lead, email, footer_note, cv_url, updated_at
		FROM site_profile WHERE id = 1`)
	if err == sql.ErrNoRows {
		// Fresh database: an empty profile renders a blank but valid site.
		return &domain.Profile{AboutParagraphs: domain.LocalizedList{}}, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *siteRepository) UpsertProfile(ctx context.Context, p *domain.Profile) error {
	return r.db.QueryRowxContext(ctx, `
		INSERT INTO site_profile (id, name, logo_text, hero_headline, hero_lead, role_title,
			location_line, about_title, about_paragraphs, contact_lead, email, footer_note, cv_url)
		VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name, logo_text = EXCLUDED.logo_text, hero_headline = EXCLUDED.hero_headline,
			hero_lead = EXCLUDED.hero_lead, role_title = EXCLUDED.role_title, location_line = EXCLUDED.location_line,
			about_title = EXCLUDED.about_title, about_paragraphs = EXCLUDED.about_paragraphs,
			contact_lead = EXCLUDED.contact_lead, email = EXCLUDED.email,
			footer_note = EXCLUDED.footer_note, cv_url = EXCLUDED.cv_url
		RETURNING updated_at`,
		p.Name, p.LogoText, p.HeroHeadline, p.HeroLead, p.RoleTitle, p.LocationLine,
		p.AboutTitle, p.AboutParagraphs, p.ContactLead, p.Email, p.FooterNote, p.CVURL).
		Scan(&p.UpdatedAt)
}

// --- Experiences ---

func (r *siteRepository) ListExperiences(ctx context.Context) ([]domain.Experience, error) {
	items := []domain.Experience{}
	err := r.db.SelectContext(ctx, &items, `
		SELECT id, sort_order, period, title, subtitle, tag, color, created_at
		FROM experiences ORDER BY sort_order ASC, created_at ASC`)
	return items, err
}

func (r *siteRepository) CreateExperience(ctx context.Context, e *domain.Experience) error {
	next, err := nextSortOrder(ctx, r.db, "experiences")
	if err != nil {
		return err
	}
	e.SortOrder = next
	return r.db.QueryRowxContext(ctx, `
		INSERT INTO experiences (sort_order, period, title, subtitle, tag, color)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
		e.SortOrder, e.Period, e.Title, e.Subtitle, e.Tag, e.Color).Scan(&e.ID, &e.CreatedAt)
}

func (r *siteRepository) UpdateExperience(ctx context.Context, e *domain.Experience) error {
	err := r.db.QueryRowxContext(ctx, `
		UPDATE experiences SET period = $1, title = $2, subtitle = $3, tag = $4, color = $5
		WHERE id = $6 RETURNING sort_order, created_at`,
		e.Period, e.Title, e.Subtitle, e.Tag, e.Color, e.ID).Scan(&e.SortOrder, &e.CreatedAt)
	return mapNoRows(err, domain.ErrExperienceNotFound)
}

func (r *siteRepository) DeleteExperience(ctx context.Context, id string) error {
	return deleteByID(ctx, r.db, `DELETE FROM experiences WHERE id = $1`, id, domain.ErrExperienceNotFound)
}

func (r *siteRepository) ReorderExperiences(ctx context.Context, ids []string) error {
	return reorder(ctx, r.db, "experiences", ids)
}

// --- Skills ---

func (r *siteRepository) ListSkills(ctx context.Context) ([]domain.Skill, error) {
	items := []domain.Skill{}
	err := r.db.SelectContext(ctx, &items, `
		SELECT id, sort_order, label, created_at FROM skills ORDER BY sort_order ASC, created_at ASC`)
	return items, err
}

func (r *siteRepository) CreateSkill(ctx context.Context, s *domain.Skill) error {
	next, err := nextSortOrder(ctx, r.db, "skills")
	if err != nil {
		return err
	}
	s.SortOrder = next
	return r.db.QueryRowxContext(ctx, `
		INSERT INTO skills (sort_order, label) VALUES ($1, $2) RETURNING id, created_at`,
		s.SortOrder, s.Label).Scan(&s.ID, &s.CreatedAt)
}

func (r *siteRepository) UpdateSkill(ctx context.Context, s *domain.Skill) error {
	err := r.db.QueryRowxContext(ctx, `
		UPDATE skills SET label = $1 WHERE id = $2 RETURNING sort_order, created_at`,
		s.Label, s.ID).Scan(&s.SortOrder, &s.CreatedAt)
	return mapNoRows(err, domain.ErrSkillNotFound)
}

func (r *siteRepository) DeleteSkill(ctx context.Context, id string) error {
	return deleteByID(ctx, r.db, `DELETE FROM skills WHERE id = $1`, id, domain.ErrSkillNotFound)
}

func (r *siteRepository) ReorderSkills(ctx context.Context, ids []string) error {
	return reorder(ctx, r.db, "skills", ids)
}

// --- Social links ---

func (r *siteRepository) ListSocialLinks(ctx context.Context) ([]domain.SocialLink, error) {
	items := []domain.SocialLink{}
	err := r.db.SelectContext(ctx, &items, `
		SELECT id, sort_order, label, url, created_at FROM social_links ORDER BY sort_order ASC, created_at ASC`)
	return items, err
}

func (r *siteRepository) CreateSocialLink(ctx context.Context, s *domain.SocialLink) error {
	next, err := nextSortOrder(ctx, r.db, "social_links")
	if err != nil {
		return err
	}
	s.SortOrder = next
	return r.db.QueryRowxContext(ctx, `
		INSERT INTO social_links (sort_order, label, url) VALUES ($1, $2, $3) RETURNING id, created_at`,
		s.SortOrder, s.Label, s.URL).Scan(&s.ID, &s.CreatedAt)
}

func (r *siteRepository) UpdateSocialLink(ctx context.Context, s *domain.SocialLink) error {
	err := r.db.QueryRowxContext(ctx, `
		UPDATE social_links SET label = $1, url = $2 WHERE id = $3 RETURNING sort_order, created_at`,
		s.Label, s.URL, s.ID).Scan(&s.SortOrder, &s.CreatedAt)
	return mapNoRows(err, domain.ErrSocialLinkNotFound)
}

func (r *siteRepository) DeleteSocialLink(ctx context.Context, id string) error {
	return deleteByID(ctx, r.db, `DELETE FROM social_links WHERE id = $1`, id, domain.ErrSocialLinkNotFound)
}

func (r *siteRepository) ReorderSocialLinks(ctx context.Context, ids []string) error {
	return reorder(ctx, r.db, "social_links", ids)
}
