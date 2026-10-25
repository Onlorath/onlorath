# Onlorath — Full System Architecture & Agent Instructions

This workspace is a **personal portfolio & CMS platform** consisting of a Go (Clean Architecture / Hexagonal) backend, a Next.js 16 App Router frontend with Three.js 3D visuals, and a PostgreSQL database orchestrated via Docker Compose.

---

## 🗺️ Complete Project Structure Map

```
.
├── backend/                              # Go Chi HTTP API (Port :8080)
│   ├── .env                              # Environment variables (secrets, DB, Gemini key)
│   ├── cmd/api/main.go                   # Entry point — DI wiring, graceful shutdown
│   ├── config/config.go                  # Config loader (godotenv → struct)
│   ├── go.mod / go.sum                   # Go 1.24 module (chi, sqlx, jwt, genai, pq, bcrypt)
│   ├── assets/
│   │   ├── CV.pdf                        # Static CV file served at /api/v1/cv
│   │   └── uploads/                      # User-uploaded images (admin only, max 5MB)
│   └── internal/
│       ├── delivery/http/
│       │   ├── router.go                 # All route definitions (chi), CORS middleware
│       │   ├── handler/
│       │   │   ├── user_handler.go       # Register, Login, Refresh, Logout, Me
│       │   │   ├── chat_handler.go       # SendMessage, ListConversations, GetMessages, DeleteConversation
│       │   │   ├── blog_handler.go       # CRUD + image management (public + admin)
│       │   │   ├── project_handler.go    # CRUD + image management (public + admin)
│       │   │   └── upload_handler.go     # File upload/delete (admin only, .jpg/.png/.webp)
│       │   └── middleware/
│       │       └── auth_middleware.go     # JWT Bearer validation, AdminOnly guard
│       ├── domain/
│       │   ├── user.go                   # User entity, RegisterRequest, LoginRequest, AuthResponse, interfaces
│       │   ├── chat.go                   # Conversation, Message entities, quota errors, interfaces
│       │   ├── blog.go                   # Blog, BlogImage entities, CRUD request types, interfaces
│       │   └── project.go               # Project, ProjectImage entities, CRUD request types, interfaces
│       ├── pkg/
│       │   ├── bcrypt/bcrypt.go          # HashPassword, ComparePassword wrappers
│       │   └── jwt/jwt.go               # Access/Refresh token generation & validation (HS256)
│       ├── repository/postgres/
│       │   ├── user_repository.go        # User CRUD (sqlx, pq unique violation handling)
│       │   ├── chat_repository.go        # Conversation/Message CRUD, quota counting queries
│       │   ├── blog_repository.go        # Blog CRUD, dynamic UPDATE builder, image management
│       │   └── project_repository.go     # Project CRUD, dynamic UPDATE builder, image management
│       └── usecase/
│           ├── user_usecase.go           # Register (hash+create), Login (verify+tokens), Refresh
│           ├── chat_usecase.go           # Gemini 2.5 Flash integration, quota enforcement, context injection
│           ├── blog_usecase.go           # Blog business logic, slug generation (Turkish char support)
│           └── project_usecase.go        # Project business logic
│
├── frontend/web/                         # Next.js 16 App Router (Port :3000)
│   ├── package.json                      # React 19, Three.js, Axios, Zod, react-hook-form, lucide-react, Tailwind 4
│   ├── next.config.ts                    # Default Next.js config
│   ├── app/
│   │   ├── layout.tsx                    # Root layout — AuthProvider wrapper, Vercel Analytics, Geist fonts
│   │   ├── globals.css                   # Tailwind v4 import, CSS custom properties (dark/light)
│   │   ├── page.tsx                      # Portfolio landing page — 3D rocket, starfield, typewriter intro, terminal, hero
│   │   ├── login/page.tsx                # Login form (Zod + react-hook-form)
│   │   ├── register/page.tsx             # Register form (Zod + react-hook-form, password confirm)
│   │   ├── blog/
│   │   │   ├── page.tsx                  # Public blog listing page
│   │   │   └── [slug]/page.tsx font-mono # Public blog detail page (by slug)
│   │   ├── projects/page.tsx             # Public projects listing page (i18n TR/EN)
│   │   └── admin/
│   │       ├── layout.tsx                # Admin sidebar layout (role guard, navigation)
│   │       ├── page.tsx                  # Admin dashboard (blog/project stats)
│   │       ├── blogs/
│   │       │   ├── page.tsx              # Admin blog list
│   │       │   ├── new/page.tsx          # Create new blog
│   │       │   └── [id]/edit/page.tsx    # Edit existing blog
│   │       └── projects/
│   │           ├── page.tsx              # Admin project list
│   │           ├── new/page.tsx          # Create new project
│   │           └── [id]/edit/page.tsx    # Edit existing project
│   ├── components/                       # Base & Shared UI components
│   │   ├── ErrorBoundary.tsx             # React Error Boundary component
│   │   ├── Header.tsx                    # Site navigation header
│   │   └── Starfield.tsx                 # Canvas twinkling starfield
│   ├── features/                         # Feature-driven modular domains
│   │   ├── 3d-graphics/components/Rocket3D.tsx   # Procedural Three.js space fighter
│   │   ├── terminal/
│   │   │   ├── components/TerminalWidget.tsx   # Interactive terminal simulation
│   │   │   └── utils/terminalMarkdown.tsx      # Terminal-safe markdown parser
│   │   ├── blog/components/BlogForm.tsx          # Shared blog form component
│   │   ├── projects/components/ProjectForm.tsx    # Shared project form component
│   │   └── contact/components/ContactForm.tsx     # Portfolio contact form
│   ├── services/                         # Decoupled API service layer
│   │   ├── client.ts                     # Axios instance, token state, auto-refresh interceptor
│   │   ├── chat.service.ts               # Gemini AI chat API endpoints
│   │   ├── blog.service.ts               # Public & Admin blog API endpoints
│   │   ├── project.service.ts            # Public & Admin project API endpoints
│   │   ├── upload.service.ts             # File upload API endpoints
│   │   └── index.ts                      # Unified services export
│   ├── types/                            # Domain entity TypeScript types
│   │   ├── blog.types.ts                 # Blog & BlogImage interfaces
│   │   ├── project.types.ts              # Project & ProjectImage interfaces
│   │   └── index.ts                      # Unified types export
│   └── context/
│       └── AuthContext.tsx               # Global auth state (login, register, logout, session recovery)
│
└── onlorath/infra/                       # Infrastructure
    ├── docker-compose.yml                # PostgreSQL 16 Alpine container
    └── init.sql                          # Full DB schema (6 tables, triggers, indexes)
```

---

## 🗄️ Database Schema (PostgreSQL 16)

**Container**: `onlorath_postgres` on `localhost:5432`
**Credentials**: DB=`onlorath_db`, User=`onlorath_admin`, Pass=`super_secret_password_123`

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Authentication accounts | `id` UUID PK, `email` UNIQUE, `password_hash`, `role` (default `'user'`), timestamps |
| `conversations` | Chat sessions | `id` UUID PK, `user_id` FK→users (nullable), `session_id` VARCHAR (guest), `title`, timestamps |
| `messages` | Chat messages | `id` UUID PK, `conversation_id` FK→conversations CASCADE, `role` CHECK(`'user'`/`'model'`), `content` TEXT, `created_at` |
| `blogs` | Blog posts | `id` UUID PK, `title`, `slug` UNIQUE, `content` TEXT, `cover_image`, `author_id` FK→users SET NULL, `published` BOOL, timestamps |
| `projects` | Portfolio projects | `id` UUID PK, `title`, `description` TEXT, `tech` TEXT[], `status`, `cover_image`, `sort_order` INT, timestamps |
| `blog_images` | Blog gallery images | `id` UUID PK, `blog_id` FK→blogs CASCADE, `url`, `alt_text`, `sort_order`, `created_at` |
| `project_images` | Project gallery images | `id` UUID PK, `project_id` FK→projects CASCADE, `url`, `alt_text`, `sort_order`, `created_at` |

### Triggers & Indexes
- **Auto-update trigger**: `update_modified_column()` fires BEFORE UPDATE on `users`, `conversations`, `blogs`, `projects` → sets `updated_at = NOW()`.
- **Performance indexes**: `idx_conversations_user_id`, `idx_messages_conversation_id`, `idx_messages_created_at`, `idx_blogs_slug`, `idx_blogs_published`, `idx_blogs_created_at`, `idx_projects_sort_order`, `idx_blog_images_blog_id`, `idx_project_images_project_id`.

---

## 🔐 Authentication Flow

```
┌─────────┐    POST /login     ┌──────────┐    JWT Access Token (body)    ┌──────────┐
│ Client  │ ─────────────────→ │ Backend  │ ──────────────────────────→   │ Client   │
│         │    {email, pass}   │          │    + HttpOnly Cookie          │ (stores  │
│         │                    │          │    (refresh_token)            │  in RAM) │
└─────────┘                    └──────────┘                               └──────────┘
     │                              │
     │  On 401 (access expired)     │
     │  ──→ POST /refresh ──────────│──→ Validates refresh cookie
     │      (automatic via          │      Returns new access_token
     │       Axios interceptor)     │
     │  ←── New access_token ───────│
```

- **Access Token**: HS256, 15m expiry, in response body. Claims: `user_id`, `email`, `role`.
- **Refresh Token**: HS256, 168h (7 days) expiry, in HttpOnly/Secure/SameSite=Lax cookie.
- **Axios Interceptor** (`api.ts`): Catches 401s → auto-calls `/refresh` → retries original request. Skips refresh for `/login` and `/register` endpoints.
- **Session Recovery**: On mount, `AuthContext` calls `/me` → triggers 401 → interceptor refreshes → session restored silently.

---

## 🌐 API Endpoint Reference

### Public Routes (no auth)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/api/v1/cv` | inline | Serves `assets/CV.pdf` |
| POST | `/api/v1/users/register` | `userHandler.Register` | Create account |
| POST | `/api/v1/users/login` | `userHandler.Login` | Login → access + refresh tokens |
| POST | `/api/v1/users/refresh` | `userHandler.Refresh` | Renew access token via cookie |
| GET | `/api/v1/blogs` | `blogHandler.ListBlogs` | Published blogs only |
| GET | `/api/v1/blogs/{slug}` | `blogHandler.GetBlog` | Single blog by slug |
| GET | `/api/v1/projects` | `projectHandler.ListProjects` | All projects |
| GET | `/api/v1/projects/{id}` | `projectHandler.GetProject` | Single project by ID |
| GET | `/api/v1/uploads/{filename}` | inline | Serve uploaded file |

### Chat Routes (optional auth via header parsing)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| POST | `/api/v1/chat/send` | `chatHandler.SendMessage` | Send message to Gemini AI |
| GET | `/api/v1/chat/conversations` | `chatHandler.ListConversations` | List user/session conversations |
| GET | `/api/v1/chat/conversations/{id}` | `chatHandler.GetMessages` | Get conversation messages |
| DELETE | `/api/v1/chat/conversations/{id}` | `chatHandler.DeleteConversation` | Delete conversation |

### Protected Routes (JWT required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/api/v1/users/me` | `userHandler.Me` | Current user info |
| POST | `/api/v1/users/logout` | `userHandler.Logout` | Clear refresh cookie |

### Admin Routes (JWT + role=admin)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/admin/blogs[/]` | List all / Create blog |
| GET/PUT/DELETE | `/api/v1/admin/blogs/{id}` | Get / Update / Delete blog |
| POST/GET | `/api/v1/admin/blogs/{id}/images` | Add / List blog images |
| DELETE | `/api/v1/admin/blogs/images/{imageId}` | Delete blog image |
| GET/POST | `/api/v1/admin/projects[/]` | List all / Create project |
| GET/PUT/DELETE | `/api/v1/admin/projects/{id}` | Get / Update / Delete project |
| POST/GET | `/api/v1/admin/projects/{id}/images` | Add / List project images |
| DELETE | `/api/v1/admin/projects/images/{imageId}` | Delete project image |
| POST | `/api/v1/admin/uploads` | Upload file (multipart, 5MB max) |
| DELETE | `/api/v1/admin/uploads/{filename}` | Delete uploaded file |

---

## 🤖 Chat System (Gemini AI Integration)

- **Model**: `gemini-2.5-flash` via `google.golang.org/genai` SDK.
- **System Prompt**: Yusuf Albayrak's portfolio assistant. Includes CV data, dynamically-loaded project list from DB, and anti-prompt-injection rules.
- **Chat History**: Last 20 messages loaded from DB per conversation for context.
- **Quota System**:
  - Personal: 15 messages per 24h rolling window (per user or session).
  - Global: 50 messages per 24h rolling window (all users combined).
  - Response headers: `X-Chat-System-Busy` and `X-Chat-Quota-Exceeded` for frontend UI.
  - HTTP 429 returned when limits reached.

---

## ⚙️ Dependency Injection Wiring (`main.go`)

```
PostgreSQL (sqlx.DB)
  ├── userRepo      → userUseCase      → userHandler
  ├── chatRepo ─┐
  │             ├──→ chatUseCase      → chatHandler
  ├── projectRepo ─┘
  │             └──→ projectUseCase   → projectHandler
  ├── blogRepo      → blogUseCase      → blogHandler
  └── (none)                           → uploadHandler

Config → AuthMiddleware
All handlers + AuthMiddleware → NewRouter()
```

---

## 🛠️ CLI Operations Reference

| Action | Command | Working Directory |
|--------|---------|-------------------|
| Start everything (DB + API + web) | `.\dev.ps1` (`-StopDb` to also stop Postgres on exit) | repo root |
| Start Postgres | `docker compose up -d` | `onlorath/infra/` |
| Stop Postgres | `docker compose down` | `onlorath/infra/` |
| Start Backend | `go run cmd/api/main.go` | `backend/` |
| Run Backend Tests | `go test ./...` | `backend/` |
| Start Frontend | `npm run dev` | `frontend/web/` |
| Build Frontend | `npm run build` | `frontend/web/` |
| Lint Frontend | `npm run lint` | `frontend/web/` |

---

## 🎨 Frontend Architecture Details

### State Management
- **Auth State**: `AuthContext` (React Context) manages `user`, `accessToken`, `isLoading`. Syncs with Axios module-level `_accessToken` variable.
- **Language**: localStorage-based i18n (`lang` key) with TR/EN support in `page.tsx`, `projects/page.tsx`, and `TerminalWidget.tsx`.
- **Intro Cooldown**: localStorage `lastIntroTime` key — 10-minute cooldown to skip typewriter intro animation.

### 3D & Animation Stack
- **Rocket3D.tsx**: Procedural Three.js mesh (no .glb files). Uses `LatheGeometry`, `ExtrudeGeometry`, `SphereGeometry` for space fighter body. Hover animation → intro flight → scroll-controlled positioning via state machine.
- **Starfield**: Custom Canvas component with static star positions + trigonometric twinkling (no velocity drift).

### Key Patterns
- All forms use `react-hook-form` + `zod` for validation.
- `respondWithJSON` / `respondWithError` helper pattern is duplicated across all Go handlers.
- Blog slug generation handles Turkish characters (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u).
- Dynamic UPDATE queries in blog/project repositories use runtime-built SQL with positional parameters.

---

## 🚀 Token Saving & Tool Usage Rules (Strictly Enforced)

1. **No Redundant Discovery**: Do NOT use `list_dir` or `grep_search` to find directories or locate files outlined in the map above. Go directly to the target file.
2. **Strict Range-Based Reads**: Never read whole source files if only a block is needed. Use `StartLine` and `EndLine` parameters in `view_file`.
3. **Avoid Whole-File Overwrites**: Use `replace_file_content` or `multi_replace_file_content` for precise target edits.
4. **Skip Planning Mode for Simple Edits**: If a request is simple (debugging, minor logic tweak, configuration change), go straight to execution.
5. **No Verbose Artifact Summaries**: Don't restate artifact contents in the response. Present the file link and highlight decisions.
6. **Minimize Command Output**: Run commands with precise filters or limits (e.g., `git log -n 5`, targeted tests).

---

## 📝 Session History

### 📅 2026-07-03
- Redesigned 3D Rocket to smooth aerodynamic spaceship (LatheGeometry, torus rings, beveled fins).
- Added anti-prompt injection rules to Gemini system instructions.
- Implemented chat quotas (15 personal / 50 global per 24h).
- Built intro animation state machine (typewriter → flight → scroll lock).
- Implemented 10-minute intro cooldown via localStorage.
- Created twinkling starfield with trigonometric wave animation.

### 📅 2026-07-04
- Centered Hero section, repositioned TerminalWidget below hero.
- Redesigned Rocket3D as space interceptor fighter with wings and cockpit.
- Disabled browser scroll restoration and terminal autofocus.
- Added bilingual i18n (TR/EN) to page.tsx, projects/page.tsx, TerminalWidget.tsx.
- Git branch cleanup, removed 33MB spaceship.glb from repo.

### 📅 2026-07-16
- Fixed Axios interceptor bug: login/register 401 errors were triggering unnecessary `/refresh` calls, masking the actual error with "Refresh token is missing".

### 📅 2026-07-22
- Restructured `frontend/web` into Feature-Driven Architecture (`features/`, `services/`, `types/`).
- Split monolithic `lib/api.ts` into domain services (`client.ts`, `chat.service.ts`, `blog.service.ts`, `project.service.ts`, `upload.service.ts`).
- Moved domain components (`Rocket3D`, `TerminalWidget`, `BlogForm`, `ProjectForm`, `ContactForm`) into feature modules under `features/`.
- Verified clean build and type safety via `npm run build` and `tsc`.
