# Archived documents — do not act on these

These docs describe paths the project deliberately did **not** take. They are
kept for history only. The authoritative design is [CLAUDE.md](../../CLAUDE.md)
and [ARCHITECTURE.md](../../ARCHITECTURE.md).

- `SIMPLIFIED_ARCHITECTURE.md` — single-brand portal model (contradicts the
  multi-tenant decision in CLAUDE.md §1).
- `TECHNICAL_ARCHITECTURE.md` — NestJS backend design (superseded by the
  Next.js full-stack + Supabase architecture; see CLAUDE.md §7.8).
- `MVP_ROADMAP.md` — earlier roadmap referencing the archived stack; superseded
  by CLAUDE.md §6 and docs/MVP_EXECUTION_BRIEF.md.

Archived 2026-08-06. These three sat in the repo ROOT — the most discoverable
place a new contributor looks — and each contradicted CLAUDE.md from there:

- `IMPLEMENTATION_PLAN.md` — Next.js 14, Prisma, NextAuth and SendGrid, framed
  as a corporate L&D portal. Every one of those conflicts with CLAUDE.md §1/§2:
  the stack is Next.js 15, Drizzle, Supabase Auth and Resend, and the product is
  a multi-tenant training-provider SaaS.
- `API_SPECIFICATION.md` — specifies a separate API service at
  `api.outdureedge.com` with `X-Tenant-ID` headers. That is precisely the shape
  §7.8 forbids ("don't introduce a separate backend service"); tenancy is
  resolved from the host and the JWT, never from a client-supplied header.
- `DATABASE_SCHEMA.md` — around 70 tables against the 22 that exist, with names
  that diverge from the real schema (`lesson_completions` vs `progress_events`,
  `audit_logs` vs `audit_log`). The live schema is `db/schema.ts`, which is the
  source of truth; CLAUDE.md §5 is its summary.
