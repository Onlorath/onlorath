# Workspace Architecture & Agent Instructions

This workspace contains a Go (Clean Architecture) backend and a Next.js App Router frontend. Refer to this map to minimize token usage and redundant tool calls.

---

## 🗺️ Project Structure Map

```
.
├── backend/
│   ├── cmd/api/main.go             # Backend Entry Point
│   ├── config/config.go            # Config Loader (.env)
│   └── internal/
│       ├── delivery/http/
│       │   ├── router.go           # Route definitions (chi)
│       │   ├── handler/            # Controllers (user_handler.go)
│       │   └── middleware/         # Auth (JWT verification)
│       ├── domain/
│       │   └── user.go             # Entities, Requests, Interfaces
│       ├── pkg/
│       │   ├── bcrypt/             # Password hashing
│       │   └── jwt/                # Access/Refresh token generators
│       ├── repository/postgres/    # Database queries (sqlx)
│       └── usecase/                # Business logic (user_usecase.go)
├── frontend/web/                   # Next.js App Router (React 19, TS)
│   ├── app/
│   │   ├── page.tsx                # Portfolio Landing Page
│   │   ├── projects/page.tsx       # Projects Page
│   │   ├── login/page.tsx          # Login Page
│   │   ├── register/page.tsx       # Register Page
│   │   └── globals.css             # Main styling
│   ├── components/
│   │   ├── ContactForm.tsx         # Portfolio Contact Form
│   │   └── TerminalWidget.tsx      # Landing page Terminal Simulation
│   ├── context/AuthContext.tsx     # Auth State Manager
│   └── lib/api.ts                  # Axios interceptors & endpoints
└── onlorath/
    └── infra/
        ├── docker-compose.yml      # Dev environment Postgres setup
        └── init.sql                # DB Schema and Extensions
```

---

## 🗄️ Database Schema & Connection

- **Provider**: PostgreSQL (`onlorath_postgres` container on `localhost:5432`).
- **Connection Details**: DB Name: `onlorath_db`, User: `onlorath_admin`, Pass: `super_secret_password_123`.
- **Primary Schema (`users` table)**:
  ```sql
  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```

---

## ⚙️ App Configurations & Ports

- **Backend**: Chi router runs on `:8080`. Connects to DB via `sqlx`.
- **Frontend**: Next.js development server runs on `:3000` (currently running `npm run dev`).
- **Auth Tokens**: JWT-based.
  - Access Token: HS256, expiration `15m`, returned in response body.
  - Refresh Token: HS256, expiration `168h`, set in HttpOnly cookie `refresh_token`.

---

## 🛠️ CLI Operations Reference

- **Backend Dev Server**: `go run cmd/api/main.go` (run from `backend/`)
- **Backend Tests**: `go test ./...` (run from `backend/`)
- **Frontend Dev Server**: `npm run dev` (run from `frontend/web/`)
- **Start Postgres**: `docker compose up -d` (run from `onlorath/infra/`)

---

## 🚀 Token Saving & Tool Usage Rules (Strictly Enforced)

To prevent wasting tokens and keeping conversations concise, agents MUST adhere to these rules:

1. **No Redundant Discovery**: Do NOT use `list_dir` or `grep_search` to find directories or locate files outlined in the map above. Go directly to the target file.
2. **Strict Range-Based Reads**: Never read whole source files if only a block is needed. Use `StartLine` and `EndLine` parameters in `view_file` to query specific line segments.
3. **Avoid Whole-File Overwrites**: Use `replace_file_content` or `multi_replace_file_content` for precise target edits. Do not overwrite the entire file unless creating a new one.
4. **Skip Planning Mode for Simple Edits**: If a request is simple (debugging, minor logic tweak, configuration change, explanation), do NOT create an `implementation_plan.md`. Go straight to execution.
5. **No Verbose Artifact Summaries**: When creating or editing plans, tasks, or walkthroughs, do not restate the contents of the artifact in the response. Simply present the markdown file link and highlight immediate questions.
6. **Minimize Command Output**: Run commands with precise filters or limits (e.g. `git log -n 5`, targeted tests, only relevant logs).
