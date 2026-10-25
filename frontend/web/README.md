# onlorath web

The Next.js 15 frontend of the portfolio: the public one-page site (`/tr`, `/en`), the blog, and the admin CMS (`/admin`).

All content comes from the Go API in `../../backend`. Next.js proxies `/api/v1/*` to `API_INTERNAL_URL` (default `http://localhost:8080`).

From the repository root, run the whole stack (Postgres, API, web) with:

```bash
.\dev.ps1
```

To run only the frontend while the API is already up:

```bash
npm run dev
```

Architecture, API and design notes: [`../../.agents/AGENTS.md`](../../.agents/AGENTS.md).
