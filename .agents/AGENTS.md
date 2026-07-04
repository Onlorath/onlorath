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

---

## 📝 Recent Updates & Session Logs

### 📅 Session: 2026-07-03

#### 🚀 3D Rocket Redesign ([Rocket3D.tsx](file:///Users/macos/Desktop/New%20Project/frontend/web/components/Rocket3D.tsx))
- Changed the blocky hexagonal rocket components to a smooth, aerodynamic fütüristik spaceship model.
- Integrated a bulging, curved fuselage (`THREE.LatheGeometry`), ogive-curved nose cone, torus glowing rings, custom-extruded beveled fins/wings, and capsule-style side boosters.
- Enabled smooth shading (`flatShading: false`) and adjusted metalness and roughness values for polished metal look.

#### 🛡️ Chatbot Security & Prompt Injection Defense ([chat_usecase.go](file:///Users/macos/Desktop/New%20Project/backend/internal/usecase/chat_usecase.go))
- Appended anti-prompt injection security rules to the Gemini client's system instructions.
- Configured the assistant to reject instructions asking to leak, translate, print, or summarize its initial prompt (e.g. "You are..."), or to ignore character rules.

#### ⏳ Chat Request Quota Implementation (Backend & Frontend)
- **Personal Quota (15 Messages per 24h)**: Counts user queries per session/user in the DB within a rolling 24-hour window, blocking requests with HTTP 429 when the limit is reached.
- **Global Quota (50 Messages per 24h)**: Counts all queries within a rolling 24-hour window, returning HTTP 429 ("Şu anda yoğunluk var o yüzden kullanılamıyor") if the overall limit is reached.
- **CORS & HTTP Headers**: Injected `X-Chat-System-Busy` and `X-Chat-Quota-Exceeded` headers into GET and POST chat endpoint responses. Added `Access-Control-Expose-Headers` configuration in [router.go](file:///Users/macos/Desktop/New%20Project/backend/internal/delivery/http/router.go).
- **UI Lock & Banner ([ChatWidget.tsx](file:///Users/macos/Desktop/New%20Project/frontend/web/components/ChatWidget.tsx))**: Modified the React frontend to parse response headers, disable input field and submit buttons, and render premium rose-styled warning banners with the updated 15-message warning text.
- **Removed Admin Bypass**: Unified all limits for all users due to suspended auth states.

#### 🎬 Portfolio Intro Sequence & 3D Rocket Transition (Next.js & Three.js)
- **State Machine Animation**: Implemented an intro sequence inside the standard `animate` loop of [Rocket3D.tsx](file:///Users/macos/Desktop/New%20Project/frontend/web/components/Rocket3D.tsx). During typing, the rocket floats at `(2.4, hoverY, 0)` to clear text, then smoothly flies to the starting landing coordinates `(targetLandingX, 3.6, 0)` over 1.5 seconds using a smoothstep interpolation curve before locking to page scroll control.
- **Typewriter & Overlay ([page.tsx](file:///Users/macos/Desktop/New%20Project/frontend/web/app/page.tsx))**: Built a lightweight typewriter component with neon cyan glow styles and a pulsing cursor cursor. Added a grid-textured `#050505` backdrop overlay that fades out on flight completion.
- **Hydration Protection (`isMounted`)**: Protected the client component mounting using an `isMounted` state wrapper in [page.tsx](file:///Users/macos/Desktop/New%20Project/frontend/web/app/page.tsx) to prevent Next.js SSR hydration mismatches.
- **Intro Cooldown Mechanism (`localStorage`)**: Integrated a 10-minute (600,000 ms) cooldown rule in [page.tsx](file:///Users/macos/Desktop/New%20Project/frontend/web/app/page.tsx). If a user revisits the page within 10 minutes of seeing the intro, the timeline is skipped and page content loads instantly.
- **Twinkling Starfield (`Starfield` in [page.tsx](file:///Users/macos/Desktop/New%20Project/frontend/web/app/page.tsx))**: Modified the custom Canvas starfield component. Replaced spatial drifting velocity (`vx`/`vy`) with static coordinate mapping, implementing a smooth trigonometric wave phase animation to mimic realistic star twinkling.

### 📅 Session: 2026-07-04

#### 📐 Terminal Layout Repositioning & Text Centering
- **Centered Hero:** Centered the Hero (about) title, description, and CTA buttons on the page.
- **Dedicated Terminal Section:** Moved the `TerminalWidget` below the Hero section to a centered, full-width `max-w-4xl` box with a maximum height of `480px` for better readability.

#### 🚀 Procedural Space Fighter Design & Performance
- **Optimized Geometry:** Refactored the procedural `Rocket3D` mesh to resemble a sleek space interceptor fighter with wings (`ExtrudeGeometry`), vertical stabilizer tail fin, wingtip energy spheres, and a cyan cockpit glass canopy.
- **Scroll Restoration Fix:** Disabled browser scroll restoration and autoFocus on the terminal input to prevent jump-scrolling on load, locking the window position to top on mount.

#### 🌐 Bilingual i18n Dil Paketi Entegrasyonu
- ** Biliingual Support (TR/EN):** Added localized translations to both `page.tsx` and `projects/page.tsx` via local storage synchronization.
- **Terminal Translation:** Upgraded `TerminalWidget` to translate greeting text, placeholders, help guides, and command results dynamically according to selected language.

#### 🧹 Git Branch Cleanup
- **Resolved Remote Conflicts:** Synced branches with `git fetch` and pushed backend commits. Deleted the unused 33MB `spaceship.glb` file from the repo.



