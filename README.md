# Training Platform

Multi-tenant SaaS LMS. **[CLAUDE.md](CLAUDE.md) is the source of truth**;
[ARCHITECTURE.md](ARCHITECTURE.md) summarises the as-built v2 design.

## Layout

- **`web/`** — Next.js 15 app (the v2 product). `cd web && npm install && npm run dev`.
- **`db/`** — Drizzle schema + migrations (`@training-platform/db`). See [db/README.md](db/README.md).
- **`src/`** — legacy Vite prototype (hotfixed, retired at cutover). `npm run dev` from root.

## Going live

See **[DEPLOY.md](DEPLOY.md)** for the full deployment runbook (Supabase v2
project, env, Stripe, Vercel, data migration, cutover).
