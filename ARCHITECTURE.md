# Architecture

> **[CLAUDE.md](CLAUDE.md) is the single source of truth.** This file summarises
> the *as-built* v2 architecture. Where they differ, CLAUDE.md wins.
>
> Deprecated designs (single-brand portal, NestJS backend) are archived under
> [docs/_archive/](docs/_archive/) — do not act on them.

## Shape

Multi-tenant SaaS LMS. Two workspaces coexist during the migration:

- **`web/`** — Next.js 15 (App Router, TS strict, Tailwind v4). The v2 product.
- **`db/`** — Drizzle schema, migrations, and query helpers (the database source
  of truth). Imported by `web/` as `@training-platform/db`.
- **`src/` (root Vite app)** — the legacy prototype, hotfixed for security and
  kept running until each tenant is cut over to `web/`.

## Request flow

```
Browser ─▶ Next.js middleware (web/src/middleware.ts)
             • refreshes the Supabase session
             • rewrites {slug}.domain/* → /t/[slug]/*  (shared routes excepted)
          ─▶ Server Component / Server Action
             • getTenantContext()/withTenant() read tenant_id + role from the JWT
             • data access via:
                 – Supabase JS client  → RLS-enforced (session JWT)
                 – Drizzle (db)        → DIRECT connection, BYPASSES RLS;
                                          scope every query by tenant_id yourself
```

## Tenancy & security

- **Every domain table carries `tenant_id`.** RLS policies (`db/migrations/
  0001_rls_and_policies.sql`) scope by `tenant_id`/`role` claims injected into
  the JWT by a Supabase Custom Access Token Hook (`0002_access_token_hook.sql`).
- **`audit_log` is append-only and hash-chained** per tenant (trigger-computed);
  `progress_events` is append-only. Mutations route through `audited()`.
- **Suspension** lives in `tenants.status`, enforced in the tenant layout + RLS
  + platform-admin panel (replaces the old localStorage hack).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router (Server Actions, ISR) |
| DB / Auth / Storage | Supabase Postgres + Supabase Auth (`@supabase/ssr`) |
| ORM / migrations | Drizzle + drizzle-kit (`db/`) |
| Payments | Stripe (subscriptions + one-time course sales, webhook at `/api/webhooks/stripe`) |
| Email | Resend (`lib/email.ts`, best-effort) |
| Video | YouTube (legacy) today; Mux planned (infra-gated) |
| Certificates | W3C VC / Open Badges 3.0 JSON + public `/verify/[code]` |
| Observability | Sentry + PostHog |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

## Deploy prerequisites (infra-gated)

A fresh Supabase v2 project (apply `db/migrations/*`, enable the access-token
hook), plus `DATABASE_URL`, Supabase keys, Stripe keys + prices, and optionally
Resend/Sentry/PostHog. See `web/.env.example` and `db/README.md`.
