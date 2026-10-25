# Onlorath — System Architecture & Agent Instructions

A **bilingual (TR/EN) one-page portfolio with blog, AI chat and an admin CMS**:

- **Backend:** Go (chi, sqlx, Clean Architecture).
- **Frontend:** Next.js 15 App Router in the "Pastel Bento" design (cream canvas, pastel cards, Bricolage Grotesque + Instrument Sans).
- **Database:** PostgreSQL 16.

Every visible text, project, timeline item, skill and link lives in Postgres and is edited in `/admin`.

---

## 🗺️ Project Structure Map

```
.
├── dev.ps1                               # One command: Postgres → (seed) → Go API :8080 → Next.js :3000
├── backend/                              # Go API
│   ├── .env / .env.example               # DB, JWT, admin bootstrap, Gemini, uploads, webhooks
│   ├── cmd/api/main.go                   # Entry: migrations → DI → admin bootstrap → router → graceful shutdown
│   ├── cmd/seed/main.go                  # Fills EMPTY tables with the design's demo content (TR+EN); never overwrites
│   ├── config/config.go                  # Env loader
│   ├── migrations/                       # 0001_init.sql, 0002_redesign.sql (+ embed.go); applied at startup
│   └── internal/
│       ├── domain/                       # Entities, inputs + Validate(), repo/usecase interfaces
│       │   ├── i18n.go                   # LocalizedText {tr,en} (JSONB Scanner/Valuer, Pick), LocalizedList, ReorderRequest
│       │   ├── site.go                   # Profile (singleton), Experience, Skill, SocialLink, Site aggregate
│       │   ├── project.go                # Project + ProjectMeta/Action/Media (media types: builtin|iframe|image|video|placeholder)
│       │   ├── blog.go                   # Bilingual Markdown posts
│       │   ├── contact.go                # Contact form + stored ContactMessage
│       │   ├── chat.go / user.go
│       ├── repository/postgres/          # sqlx repos; helpers.go = reorder(), nextSortOrder(), deleteByID(), mapNoRows()
│       ├── usecase/                      # site, project, blog, contact, user (EnsureAdmin), chat (+ chat_prompt.go)
│       ├── delivery/http/
│       │   ├── router.go                 # All routes (Handlers struct), CORS
│       │   ├── handler/respond.go        # respondError (domain err → status), decodeJSON, generic respondList/Item
│       │   └── handler/*.go, middleware/auth_middleware.go
│       └── pkg/ migrate/ slug/ jwt/ bcrypt/ httputil/
├── frontend/web/                         # Next.js 15 (React 19, CSS Modules, no Tailwind)
│   ├── next.config.mjs                   # rewrites /api/v1/* → API_INTERNAL_URL (default http://localhost:8080)
│   └── src/
│       ├── middleware.ts                 # / and unprefixed paths → /tr or /en (Accept-Language)
│       ├── app/globals.css               # Design tokens (pastel soft/strong/ink), btn-pill, filter-btn, tag-chip, field, prose
│       ├── app/(site)/[locale]/          # Root layout per locale: page (home), blog/, blog/[slug], error, not-found
│       ├── app/(admin)/admin/            # Separate root layout: login, dashboard, profile, projects(/new,/[id]),
│       │                                 #   experiences, skills, socials, blog(/new,/[id]), messages
│       ├── components/site/              # SiteHeader, LanguageSwitch, Hero, ProjectList, ProjectMedia, BalloonGame,
│       │                                 #   About, ContactFooter, ContactForm, ChatWidget
│       ├── components/admin/             # AuthProvider, AdminShell, fields (LocalizedField, UploadField…),
│       │                                 #   CollectionEditor, ProjectEditor, BlogEditor, admin.module.css
│       ├── i18n/dictionaries.ts          # Fixed UI strings (TR/EN); editable content comes from the API
│       └── lib/                          # api/{types,client,server}.ts, i18n.ts (pick), richText.tsx, fonts.ts, format.ts
└── onlorath/infra/docker-compose.yml     # Optional Postgres container (schema comes from the API's migrations)
```

---

## 🗄️ Database (PostgreSQL 16)

- **Schema:** numbered files in `backend/migrations/`, applied once each by `internal/pkg/migrate` and tracked in `schema_migrations`.
  - The runner takes an advisory lock, then applies each file in its own transaction.
  - To change the schema, **add a new file** (`0003_….sql`); never edit an applied one.
- **Credentials:** in `backend/.env`. Never commit them.
- **Localized columns:** JSONB `{"tr": "...", "en": "..."}`.

| Table | Purpose |
|-------|---------|
| `site_profile` | Single row (`id = 1`). Name, logo text, hero headline/lead/badge, role, location, about title/paragraphs, contact lead, email, footer note, CV URL |
| `projects` | `slug`, `sort_order`, `published`, `category` (game/software), `color` (coral/sky/butter/lavender/sage), localized title/platform/status_label/description, JSONB `meta`, `actions`, `media`, `tech[]` |
| `experiences` | "Yol · Deneyim" timeline: localized period/subtitle/tag, title, color |
| `skills`, `social_links` | Ordered simple lists |
| `blogs` | `slug` plus localized title/excerpt/content (Markdown), `cover_image`, `published`, `published_at` |
| `contact_messages` | Admin inbox (`read` flag, `locale`) |
| `users`, `conversations`, `messages` | Auth and AI chat history |

**Local native Postgres on Windows:** the cluster lives in `%LOCALAPPDATA%\onlorath-pgdata` and is created with `--locale=C`, because initdb rejects the Turkish Windows locale name.

---

## ✍️ Inline Content Markup

- **Hero headline:**
  - `[[sky:word]]` renders a pastel highlight chip.
  - `[[coral~:word]]` renders a tilted chip.
- **Hero lead and About paragraphs:** `**bold**`.
- **Blog content:** Markdown with GFM (tables, lists, code), rendered by react-markdown.
- **Parsers:**
  - Frontend: `lib/richText.tsx`.
  - Go side (strips markup for the chat prompt): `usecase/chat_prompt.go`.

---

## 🌐 API (`/api/v1`)

**Public**

| Method | Path | Notes |
|--------|------|-------|
| GET | `/site` | Profile, published projects, experiences, skills and socials in one response (all localized fields) |
| GET | `/projects` | Published projects |
| GET | `/blogs`, `/blogs/{slug}` | Published posts only (drafts return 404) |
| GET | `/cv` | Redirects to the uploaded CV if set, otherwise serves `assets/CV.pdf` |
| GET | `/uploads/{file}` | Uploaded files (immutable cache headers) |
| POST | `/contact` | Stored in the inbox, plus optional Discord/Telegram notification. IP rate limited, with a honeypot |
| POST | `/chat/send` | Body: `{message, conversation_id, locale}` with an `X-Session-ID` header. Errors are stable codes (see Chat) |
| GET/DELETE | `/chat/conversations[/{id}]` | Per session or per user |
| POST | `/users/login`, `/users/refresh`, `/users/logout` | `/users/register` returns 403 unless `ALLOW_REGISTRATION=true` |

**Admin** (`/admin/*`, JWT with `role=admin`)

| Method | Path |
|--------|------|
| GET | `stats` |
| GET, PUT | `profile` |
| CRUD + `PUT …/reorder` (body `{ids:[…]}`) | `projects`, `experiences`, `skills`, `socials` |
| CRUD | `blogs` |
| GET, PATCH `{read}`, DELETE | `messages` |
| POST (multipart `file`), DELETE `/{file}` | `uploads` |

- **Uploads:** jpg/png/webp/gif/pdf/mp4/webm. The file content is sniffed and must match the extension. Size limit is `UPLOAD_MAX_MB` (default 25).
- **Writes are full replace (PUT).** An empty `slug` is generated from the Turkish title (`pkg/slug`).
- **Errors:**
  - Validation → 400, not found or malformed id → 404, duplicate slug → 409.
  - Anything else → 500 with a generic message (details are only logged).

---

## 🔐 Auth

- **Admin bootstrap:** `ADMIN_EMAIL` / `ADMIN_PASSWORD` are created, or promoted to admin, on every API start (`UserUseCase.EnsureAdmin`).
- **Access token:** kept in memory in the browser (`lib/api/client.ts`).
- **Refresh token:** HttpOnly cookie. Set `Secure` with `COOKIE_SECURE=true` behind HTTPS.
- **Proxying:** the browser only talks to `/api/v1` on the Next origin, which Next rewrites to Go, so cookies need no CORS setup.
- **Retry on 401:** the client calls `/users/refresh` once, then retries the request.
- **Session restore:** `AuthProvider` calls refresh, then `/me` on load.

---

## 🤖 Chat (Gemini 2.5 Flash)

- **System prompt:** built by `buildSystemPrompt(site, locale)` from the same DB content as the page (cached for 5 minutes). It replies in the site locale and includes anti-prompt-injection rules.
- **Quotas:** `CHAT_USER_LIMIT` (default 15) and `CHAT_GLOBAL_LIMIT` (default 50) per rolling 24h window. Returns 429 plus the `X-Chat-Quota-Exceeded` / `X-Chat-System-Busy` headers.
- **Error codes:** `chat_quota_exceeded`, `chat_system_busy`, `chat_unavailable` (no key or an invalid key → 503), `chat_upstream_busy` (503).
  - The frontend translates them in `dictionaries.ts`.
  - A `GEMINI_API_KEY` that still holds the `your_…` placeholder is treated as unset.

---

## 🛠️ CLI Operations Reference

| Action | Command | Working Directory |
|--------|---------|-------------------|
| Start everything | `.\dev.ps1` (`-StopDb` also stops Postgres on exit, `-Seed` fills empty tables) | repo root |
| Run the API alone | `go run ./cmd/api` (applies migrations) | `backend/` |
| Seed demo content | `go run ./cmd/seed` | `backend/` |
| Backend tests | `go test ./...` | `backend/` |
| Frontend dev | `npm run dev` (set `API_INTERNAL_URL` if the API is not on :8080) | `frontend/web/` |
| Type check | `npm run typecheck` | `frontend/web/` |
| Production build | `npm run build` | `frontend/web/` |
| Docker Postgres (optional) | `docker compose up -d` | `onlorath/infra/` |

---

## 🎨 Frontend Notes

- **Design source:** the Stitch "Pastel Bento" export (`code.html`, `DESIGN.md`, `screen.png`). Tokens are in `globals.css`.
  - Set `.pastel-<color>` on an element to get `--c-soft`, `--c-strong` and `--c-ink` for that color.
- **Rendering:** public pages are Server Components (`cache: 'no-store'`), so admin edits show up immediately.
  - Interactive pieces are client components: filters/accordion, BalloonGame, ContactForm, ChatWidget, LanguageSwitch.
- **Project preview area (`ProjectMedia`):**
  - `builtin` maps to a registry keyed by `media.key`; currently only `balloons` → `BalloonGame`.
  - **Adding a mini game:** add the key to `BUILTIN_GAMES` (`lib/api/types.ts`) **and** `domain.BuiltinMediaKeys` (Go), then render it in `ProjectMedia`.
- **Two root layouts:** `(site)/[locale]` (with `lang` set) and `(admin)/admin`. There is deliberately no `app/layout.tsx`.

---

## 📝 Session History

### 📅 2026-07 (old design)
- 3D rocket and HUD UI with a starfield, a Gemini chat terminal, and a feature-driven folder split. Replaced on 2026-10-25.

### 📅 2026-10-25
- Added `dev.ps1` (single-command local stack, native Windows Postgres, no Docker required).
- **Full redesign to the Pastel Bento UI.**
  - **Backend:**
    - Embedded migrations.
    - Bilingual JSONB content model.
    - `/site` aggregate endpoint.
    - Admin CRUD for profile, projects, experiences, skills, socials, blog and inbox.
    - Admin bootstrap, upload sniffing, chat prompt built from DB content, seed command.
  - **Frontend:** rebuilt from scratch.
    - Public pages: `/tr`, `/en`, blog.
    - Admin CMS.
    - Removed three.js and R3F.
