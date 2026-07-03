# @training-platform/db

v2 data model — the source of truth for the platform database (CLAUDE.md §5).
Applied to a **fresh** Supabase project; the legacy project stays untouched until
cutover.

## Layout

- `schema.ts` — Drizzle schema for all 22 tables. Every domain table carries
  `tenantId`. `progress_events` and `audit_log` are append-only.
- `migrations/0000_v2_initial.sql` — generated table DDL (`drizzle-kit generate`).
- `migrations/0001_rls_and_policies.sql` — JWT helpers, RLS policies, seed system
  roles, and the append-only + hash-chain triggers. **Hand-written; edit here for
  policy changes, then it stays append-only like any migration.**
- `client.ts` — `db` (RLS-enforced, request-scoped) connection.
- `audit.ts` — `audited(tx, entry)` helper; every mutation on tenants,
  memberships, roles, courses, enrollments, certificates routes through it
  (§7.11). The per-tenant hash chain is computed by a DB trigger — callers never
  set `hash`/`prev_hash`.

## Commands

```sh
npm install
export DATABASE_URL=postgres://…      # the v2 project's connection string
npm run generate   # regenerate DDL after editing schema.ts
npm run migrate    # apply migrations
npm run check      # validate migration consistency
```

## Security model

RLS reads `tenant_id` and `role` from the JWT (injected by the Custom Access
Token Hook, migration 0002 — pending). Policies: platform admins see everything;
everyone else is scoped to their JWT `tenant_id`. Verified against Postgres:
tenant isolation, cross-tenant write rejection, append-only enforcement, and
hash-chain integrity all pass.
