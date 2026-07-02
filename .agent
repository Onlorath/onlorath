# Workspace Architecture & History

This document outlines the architecture and details of both the backend and frontend components implemented in this workspace.

---

## 1. Backend (Go Clean Architecture)
- **Language/Runtime**: Go 1.22+ (Running `go1.26.4` locally on macOS Apple Silicon).
- **Directory**: `backend/`
- **Architecture Pattern**: Clean Architecture (Hexagonal Architecture) separating delivery handler, domain entity, usecase logic, and repository adapter.
- **Database**: PostgreSQL (Docker container `onlorath_postgres` on port `5432`) connected using `sqlx` (without ORM).
- **Auth Scheme**: JWT authentication.
  - **Access Token**: Signed using HS256, returned in the HTTP JSON response body. Validated via middleware on protected endpoints.
  - **Refresh Token**: Signed using HS256, set inside an `HttpOnly` cookie (`refresh_token`) by the server.

### Backend Endpoints
- `POST /api/v1/users/register`: Creates a user with a hashed password.
- `POST /api/v1/users/login`: Authenticates user, returns the Access Token, and sets the Refresh Token cookie.
- `POST /api/v1/users/refresh`: Validates refresh token cookie and issues a new access token.
- `GET /api/v1/users/me`: Protected endpoint that returns user payload after checking JWT.

---

## 2. Frontend (Next.js App Router & Tailwind CSS)
- **Language/Runtime**: React 19 / Next.js 16 (TypeScript).
- **Directory**: `frontend/web/`
- **Styling**: Tailwind CSS with custom styling and gradients.
- **Key Modules**:
  - `axios`: For HTTP communications.
  - `zod` & `react-hook-form` & `@hookform/resolvers`: For validated user interactions.
  - `lucide-react`: For premium icon components.

### Layout & Pages
- **Public Portfolio Page (`app/page.tsx`)**:
  - Acts as the main landing page. Bypasses session redirects to allow instant public guest access.
  - Features side-by-side Hero area and an interactive custom terminal simulation widget.
  - Integrates technology stacks list and a contact form section.
- **Projects Page (`app/projects/page.tsx`)**:
  - Dedicated route displaying "Mimari & Projeler" (Architecture & Projects) cards.
  - Displays project status tags, tech stacks, and brief systems architecture descriptions.
  - Integrates back-navigation links to return to the home page.
- **Interactive Terminal Widget (`components/TerminalWidget.tsx`)**:
  - Simulated Unix zsh terminal supporting typing commands (`help`, `neofetch`, `skills`, `projects`, `about`, `contact`, `clear`).
  - Supports keyboard cycling through command history using the Up and Down arrow keys.
- **Contact Form Component (`components/ContactForm.tsx`)**:
  - Custom form with validation error handling (name, email format, and message length validation).
  - Handles simulation states for sending request and displaying checkmarks on success.
- **Auth Features (`context/AuthContext.tsx` & `lib/api.ts`)**:
  - Auth components (`/login` and `/register` pages) are preserved, but automatic redirect to `/login` is disabled during session verification failures so public visitors are never locked out of the homepage.
