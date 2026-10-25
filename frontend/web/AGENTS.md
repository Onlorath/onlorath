# Frontend notes for agents

- This app runs **Next.js 15.5** (App Router, React 19). Route `params` are Promises (`const { locale } = await params`).
- The full architecture (routes, API contract, design tokens) is documented in `../../.agents/AGENTS.md`.
- Styling is plain CSS: tokens and shared primitives in `src/app/globals.css`, everything else in CSS Modules. There is no Tailwind.
- Never hard-code page content. Texts, projects and links come from the Go API (`/api/v1/site`) and are edited in `/admin`. Only fixed UI strings belong in `src/i18n/dictionaries.ts`, in both `tr` and `en`.
- Verify changes with `npm run typecheck` and `npm run build`.
