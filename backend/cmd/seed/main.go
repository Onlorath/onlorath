// Command seed fills an empty database with starter content (TR and EN).
//
//	go run ./cmd/seed            only writes into empty tables
//	go run ./cmd/seed -refresh   rewrites the profile, timeline, skills and socials, and the
//	                             texts of existing projects whose slug matches; deleted
//	                             projects stay deleted and project order is kept
package main

import (
	"context"
	"flag"
	"log"
	"time"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/migrate"
	"backend/internal/pkg/slug"
	"backend/internal/repository/postgres"
	"backend/internal/usecase"
	"backend/migrations"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func L(tr, en string) domain.LocalizedText { return domain.LocalizedText{TR: tr, EN: en} }

func main() {
	refresh := flag.Bool("refresh", false, "overwrite seeded content (see package doc)")
	flag.Parse()

	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Seeding %s", cfg.DBTarget())
	db, err := sqlx.Connect("postgres", cfg.DSN())
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	if err := migrate.Run(ctx, db, migrations.FS); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	siteRepo := postgres.NewSiteRepository(db)
	projectRepo := postgres.NewProjectRepository(db)
	site := usecase.NewSiteUseCase(siteRepo, projectRepo)
	projects := usecase.NewProjectUseCase(projectRepo, cfg)

	var profileCount int
	if err := db.GetContext(ctx, &profileCount, `SELECT COUNT(*) FROM site_profile`); err != nil {
		log.Fatal(err)
	}
	if profileCount == 0 || *refresh {
		must(site.UpdateProfile(ctx, seedProfile()))
		log.Println("Seeded profile")
	}

	existing, err := projects.List(ctx, false)
	if err != nil {
		log.Fatal(err)
	}
	switch {
	case len(existing) == 0:
		for _, p := range seedProjects() {
			must(projects.Create(ctx, &p))
		}
		log.Println("Seeded projects")
	case *refresh:
		for _, cur := range existing {
			for _, p := range seedProjects() {
				if slug.Make(p.Title.TR) != cur.Slug {
					continue
				}
				p.Published = cur.Published
				must(projects.Update(ctx, cur.ID, &p))
				log.Printf("Refreshed project %s", cur.Slug)
			}
		}
	}

	experiences, err := site.ListExperiences(ctx)
	if err != nil {
		log.Fatal(err)
	}
	if len(experiences) == 0 || *refresh {
		for _, e := range experiences {
			if err := site.DeleteExperience(ctx, e.ID); err != nil {
				log.Fatal(err)
			}
		}
		for _, e := range seedExperiences() {
			must(site.CreateExperience(ctx, &e))
		}
		log.Println("Seeded experiences")
	}

	skills, err := site.ListSkills(ctx)
	if err != nil {
		log.Fatal(err)
	}
	if len(skills) == 0 || *refresh {
		for _, s := range skills {
			if err := site.DeleteSkill(ctx, s.ID); err != nil {
				log.Fatal(err)
			}
		}
		for _, label := range []string{"Go", "TypeScript", "NestJS", "React / Next.js", "PostgreSQL", "Redis", "Docker / k3s", "Unity · C#"} {
			must(site.CreateSkill(ctx, &domain.SkillInput{Label: label}))
		}
		log.Println("Seeded skills")
	}

	socials, err := site.ListSocialLinks(ctx)
	if err != nil {
		log.Fatal(err)
	}
	if len(socials) == 0 || *refresh {
		for _, s := range socials {
			if err := site.DeleteSocialLink(ctx, s.ID); err != nil {
				log.Fatal(err)
			}
		}
		for _, s := range []domain.SocialLinkInput{
			{Label: "GitHub", URL: "https://github.com/onlorath"},
			{Label: "LinkedIn", URL: "https://linkedin.com/in/yusuf-albayrak"},
		} {
			must(site.CreateSocialLink(ctx, &s))
		}
		log.Println("Seeded social links")
	}

	log.Println("Seed complete.")
}

func must[T any](_ T, err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func seedProfile() *domain.Profile {
	return &domain.Profile{
		Name:     "Yusuf Albayrak",
		LogoText: "onlorath",
		HeroHeadline: L(
			"Ben Yusuf. Go ile [[sky:sunucu]], React ile [[lavender:arayüz]], Unity ile [[coral~:oyun]] geliştiriyorum.",
			"I'm Yusuf. I build [[sky:servers]] with Go, [[lavender:interfaces]] with React and [[coral~:games]] with Unity.",
		),
		HeroLead: L(
			"Bazı projeler bu sayfada **doğrudan denenebiliyor**. Detay için satıra tıkla.",
			"Some projects can be **tried right on this page**. Click a row for details.",
		),
		RoleTitle:    L("Full Stack Geliştirici", "Full Stack Developer"),
		LocationLine: L("İstanbul", "Istanbul"),
		AboutTitle:   L("Hakkımda", "About"),
		AboutParagraphs: domain.LocalizedList{
			L(
				"İstanbul'da yaşayan bir yazılım geliştiricisiyim. Sunucu tarafında **Go** ve **NestJS**, web arayüzlerinde **React** ve **Next.js** kullanıyorum.",
				"I'm a software developer based in Istanbul. I use **Go** and **NestJS** on the server and **React** and **Next.js** on the web.",
			),
			L(
				"Boş zamanlarımda Unity ile oyun prototipleri yapıyorum.",
				"In my spare time I prototype games in Unity.",
			),
		},
		ContactLead: L("Bana e-postayla ulaşabilirsin:", "You can reach me by email:"),
		Email:       "ysfalbayrak02@gmail.com",
	}
}

func tools(v string) domain.ProjectMeta {
	return domain.ProjectMeta{Label: L("Araçlar", "Tools"), Value: L(v, v), Mono: true}
}

func placeholder(icon string) domain.ProjectMedia {
	return domain.ProjectMedia{Type: domain.MediaPlaceholder, Icon: icon}
}

func seedProjects() []domain.ProjectInput {
	return []domain.ProjectInput{
		{
			Published: true, Category: "game", Color: "coral",
			Title:       L("Balon Patlatma", "Balloon Pop"),
			Platform:    L("Oyun · Web", "Game · Web"),
			StatusLabel: L("Oynanabilir", "Playable"),
			Description: L(
				"Tarayıcıda çalışan küçük bir balon patlatma oyunu. Soldaki demo bu sayfada oynanabiliyor.",
				"A small balloon-popping game that runs in the browser. The demo on the left is playable on this page.",
			),
			Meta:  domain.ProjectMetaList{tools("HTML5 Canvas · Web Audio API")},
			Media: domain.ProjectMedia{Type: domain.MediaBuiltin, Key: "balloons", Caption: L("Balonlara dokun", "Tap the balloons"), Height: 350},
			Tech:  []string{"HTML5 Canvas", "Web Audio API"},
		},
		{
			Published: true, Category: "software", Color: "sky",
			Title:       L("Muzigin", "Muzigin"),
			Platform:    L("Yazılım · Web", "Software · Web"),
			StatusLabel: L("Yayında", "Live"),
			Description: L(
				"Yapay zekâ ile müzik ve ses üreten bir SaaS platformu.",
				"A SaaS platform that generates music and audio with AI.",
			),
			Meta:  domain.ProjectMetaList{tools("NestJS · TypeScript · PostgreSQL · Redis · k3s")},
			Media: placeholder("monitor"),
			Tech:  []string{"NestJS", "TypeScript", "PostgreSQL", "Redis", "k3s"},
		},
		{
			Published: true, Category: "software", Color: "butter",
			Title:    L("CV Maker AI", "CV Maker AI"),
			Platform: L("Yazılım · Masaüstü", "Software · Desktop"),
			Description: L(
				"Gemini API ile CV maddelerini düzenlemeye yardım eden bir masaüstü uygulaması.",
				"A desktop app that uses the Gemini API to help write CV bullet points.",
			),
			Meta:  domain.ProjectMetaList{tools("Go · Wails · React · Gemini")},
			Media: placeholder("file"),
			Tech:  []string{"Go", "Wails", "React", "Gemini"},
		},
		{
			Published: true, Category: "software", Color: "sage",
			Title:    L("Minimalist Kanban", "Minimalist Kanban"),
			Platform: L("Yazılım · Masaüstü", "Software · Desktop"),
			Description: L(
				"Klavyeyle kullanılan, yerel çalışan sade bir görev panosu.",
				"A simple, keyboard-driven task board that runs locally.",
			),
			Meta:  domain.ProjectMetaList{tools("Go · Fiber · React · SQLite")},
			Media: placeholder("board"),
			Tech:  []string{"Go", "Fiber", "React", "SQLite"},
		},
		{
			Published: true, Category: "software", Color: "coral",
			Title:       L("Taksit & Bütçe", "Installments & Budget"),
			Platform:    L("Yazılım · PWA", "Software · PWA"),
			StatusLabel: L("Yapımda", "In progress"),
			Description: L(
				"Kart ekstrelerini ve taksitli harcamaları takip etmek için çevrimdışı da çalışan bir PWA.",
				"A PWA, usable offline, for tracking card statements and installment payments.",
			),
			Meta:  domain.ProjectMetaList{tools("Next.js · Tailwind CSS · IndexedDB")},
			Media: placeholder("dollar"),
			Tech:  []string{"Next.js", "Tailwind CSS", "IndexedDB"},
		},
	}
}

func seedExperiences() []domain.ExperienceInput {
	return []domain.ExperienceInput{
		{Period: L("2023 — 2025", "2023 — 2025"), Title: "Kartelam", Subtitle: L("Full Stack Geliştirici", "Full Stack Developer"), Tag: L("İş", "Work"), Color: "coral"},
		{Period: L("2022 — 2025", "2022 — 2025"), Title: "İstanbul Aydın Üniversitesi", Subtitle: L("Bilgisayar Programcılığı (ön lisans)", "Computer Programming (associate degree)"), Tag: L("Eğitim", "Education"), Color: "sage"},
	}
}
