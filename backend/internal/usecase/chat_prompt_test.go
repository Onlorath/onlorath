package usecase

import (
	"strings"
	"testing"

	"backend/internal/domain"
)

func TestPlainText(t *testing.T) {
	in := "Ben Yusuf. Go ile [[sky:sunucu]], Unity ile [[coral~:oyun]] **geliştiriyorum**."
	want := "Ben Yusuf. Go ile sunucu, Unity ile oyun geliştiriyorum."
	if got := plainText(in); got != want {
		t.Fatalf("plainText() = %q, want %q", got, want)
	}
}

func TestBuildSystemPromptUsesSiteContentAndLocale(t *testing.T) {
	site := &domain.Site{
		Profile: &domain.Profile{
			Name:      "Yusuf",
			Email:     "yusuf@example.com",
			RoleTitle: domain.LocalizedText{TR: "Full Stack Geliştirici", EN: "Full Stack Developer"},
		},
		Skills:      []domain.Skill{{Label: "Go"}, {Label: "React"}},
		Experiences: []domain.Experience{{Title: "Muzigin", Period: domain.LocalizedText{TR: "2026 — Günümüz", EN: "2026 — Present"}}},
		Projects: []domain.Project{{
			Title:   domain.LocalizedText{TR: "Balon Patlatma", EN: "Balloon Pop"},
			Tech:    []string{"HTML5 Canvas"},
			Actions: domain.ProjectActionList{{Label: domain.LocalizedText{EN: "Play"}, URL: "https://example.com/play"}},
		}},
	}

	en := buildSystemPrompt(site, "en")
	for _, want := range []string{"Full Stack Developer", "Go, React", "2026 — Present", "Balloon Pop", "HTML5 Canvas", "[Play](https://example.com/play)", "/en#projects", "reply in English"} {
		if !strings.Contains(en, want) {
			t.Errorf("EN prompt missing %q", want)
		}
	}

	tr := buildSystemPrompt(site, "tr")
	for _, want := range []string{"Full Stack Geliştirici", "Balon Patlatma", "reply in Turkish", "/tr#projects"} {
		if !strings.Contains(tr, want) {
			t.Errorf("TR prompt missing %q", want)
		}
	}
}

func TestBuildSystemPromptEmptySite(t *testing.T) {
	got := buildSystemPrompt(&domain.Site{Profile: &domain.Profile{}}, "tr")
	if !strings.Contains(got, "No projects are listed yet") {
		t.Fatalf("empty site prompt should say there are no projects:\n%s", got)
	}
}
