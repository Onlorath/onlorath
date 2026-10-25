package domain

import (
	"context"
	"errors"
	"time"
)

var (
	ErrExperienceNotFound = errors.New("experience not found")
	ErrSkillNotFound      = errors.New("skill not found")
	ErrSocialLinkNotFound = errors.New("social link not found")
)

// Profile holds the singleton texts of the one-page site.
//
// HeroHeadline supports highlight tokens: [[sky:word]] draws a pastel chip and
// [[coral~:word]] draws a tilted chip. HeroLead and AboutParagraphs support **bold**.
type Profile struct {
	Name            string        `db:"name" json:"name"`
	LogoText        string        `db:"logo_text" json:"logo_text"`
	HeroHeadline    LocalizedText `db:"hero_headline" json:"hero_headline"`
	HeroLead        LocalizedText `db:"hero_lead" json:"hero_lead"`
	RoleTitle       LocalizedText `db:"role_title" json:"role_title"`
	LocationLine    LocalizedText `db:"location_line" json:"location_line"`
	AboutTitle      LocalizedText `db:"about_title" json:"about_title"`
	AboutParagraphs LocalizedList `db:"about_paragraphs" json:"about_paragraphs"`
	ContactLead     LocalizedText `db:"contact_lead" json:"contact_lead"`
	Email           string        `db:"email" json:"email"`
	FooterNote      LocalizedText `db:"footer_note" json:"footer_note"`
	CVURL           string        `db:"cv_url" json:"cv_url"`
	UpdatedAt       time.Time     `db:"updated_at" json:"updated_at"`
}

func (p *Profile) Validate() error {
	if p.Name == "" {
		return &ValidationError{Field: "name", Message: "name is required"}
	}
	if p.LogoText == "" {
		return &ValidationError{Field: "logo_text", Message: "logo text is required"}
	}
	return nil
}

type Experience struct {
	ID        string        `db:"id" json:"id"`
	SortOrder int           `db:"sort_order" json:"sort_order"`
	Period    LocalizedText `db:"period" json:"period"`
	Title     string        `db:"title" json:"title"`
	Subtitle  LocalizedText `db:"subtitle" json:"subtitle"`
	Tag       LocalizedText `db:"tag" json:"tag"`
	Color     string        `db:"color" json:"color"`
	CreatedAt time.Time     `db:"created_at" json:"created_at"`
}

type ExperienceInput struct {
	Period   LocalizedText `json:"period"`
	Title    string        `json:"title"`
	Subtitle LocalizedText `json:"subtitle"`
	Tag      LocalizedText `json:"tag"`
	Color    string        `json:"color"`
}

func (r *ExperienceInput) Validate() error {
	if r.Title == "" {
		return &ValidationError{Field: "title", Message: "title is required"}
	}
	return validateColor(r.Color)
}

type Skill struct {
	ID        string    `db:"id" json:"id"`
	SortOrder int       `db:"sort_order" json:"sort_order"`
	Label     string    `db:"label" json:"label"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type SkillInput struct {
	Label string `json:"label"`
}

func (r *SkillInput) Validate() error {
	if r.Label == "" {
		return &ValidationError{Field: "label", Message: "label is required"}
	}
	return nil
}

type SocialLink struct {
	ID        string    `db:"id" json:"id"`
	SortOrder int       `db:"sort_order" json:"sort_order"`
	Label     string    `db:"label" json:"label"`
	URL       string    `db:"url" json:"url"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type SocialLinkInput struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

func (r *SocialLinkInput) Validate() error {
	if r.Label == "" || r.URL == "" {
		return &ValidationError{Field: "url", Message: "label and url are required"}
	}
	return nil
}

// Site is everything the public one-page site renders, in one response.
type Site struct {
	Profile     *Profile     `json:"profile"`
	Projects    []Project    `json:"projects"`
	Experiences []Experience `json:"experiences"`
	Skills      []Skill      `json:"skills"`
	Socials     []SocialLink `json:"socials"`
}

type SiteRepository interface {
	GetProfile(ctx context.Context) (*Profile, error)
	UpsertProfile(ctx context.Context, p *Profile) error

	ListExperiences(ctx context.Context) ([]Experience, error)
	CreateExperience(ctx context.Context, e *Experience) error
	UpdateExperience(ctx context.Context, e *Experience) error
	DeleteExperience(ctx context.Context, id string) error
	ReorderExperiences(ctx context.Context, ids []string) error

	ListSkills(ctx context.Context) ([]Skill, error)
	CreateSkill(ctx context.Context, s *Skill) error
	UpdateSkill(ctx context.Context, s *Skill) error
	DeleteSkill(ctx context.Context, id string) error
	ReorderSkills(ctx context.Context, ids []string) error

	ListSocialLinks(ctx context.Context) ([]SocialLink, error)
	CreateSocialLink(ctx context.Context, s *SocialLink) error
	UpdateSocialLink(ctx context.Context, s *SocialLink) error
	DeleteSocialLink(ctx context.Context, id string) error
	ReorderSocialLinks(ctx context.Context, ids []string) error
}

type SiteUseCase interface {
	GetSite(ctx context.Context) (*Site, error)
	GetProfile(ctx context.Context) (*Profile, error)
	UpdateProfile(ctx context.Context, p *Profile) (*Profile, error)

	ListExperiences(ctx context.Context) ([]Experience, error)
	CreateExperience(ctx context.Context, req *ExperienceInput) (*Experience, error)
	UpdateExperience(ctx context.Context, id string, req *ExperienceInput) (*Experience, error)
	DeleteExperience(ctx context.Context, id string) error
	ReorderExperiences(ctx context.Context, req *ReorderRequest) error

	ListSkills(ctx context.Context) ([]Skill, error)
	CreateSkill(ctx context.Context, req *SkillInput) (*Skill, error)
	UpdateSkill(ctx context.Context, id string, req *SkillInput) (*Skill, error)
	DeleteSkill(ctx context.Context, id string) error
	ReorderSkills(ctx context.Context, req *ReorderRequest) error

	ListSocialLinks(ctx context.Context) ([]SocialLink, error)
	CreateSocialLink(ctx context.Context, req *SocialLinkInput) (*SocialLink, error)
	UpdateSocialLink(ctx context.Context, id string, req *SocialLinkInput) (*SocialLink, error)
	DeleteSocialLink(ctx context.Context, id string) error
	ReorderSocialLinks(ctx context.Context, req *ReorderRequest) error
}
