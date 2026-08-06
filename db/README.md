# @training-platform/db

v2 data model — the source of truth for the platform database (CLAUDE.md §5).
Applied to a **fresh** Supabase project; the legacy project stays untouched until
cutover.

## Layout

- `schema.ts` — Drizzle schema for all 22 tables. Every domain table carries
  `tenantId`. `progress_events` and `audit_log` are append-only.
- `migrations/0000_v2_initial.sql` — generated table DDL (`drizzle-kit generate`).
- `migrations/0001_rls_and_policies.sql` — JWT helpers, RLS policies, seed system
  roles, and the append-only + hash-chain triggers. Hand-written, and **SHIPPED —
  never edit it.** A policy change is a NEW numbered migration, like any other
  (CLAUDE.md §7.3). This line used to say "edit here for policy changes", which
  was a direct instruction to violate that rule; migrations 0014 and 0015 revise
  0001's policies and triggers by superseding them, which is the pattern to
  follow.
- `client.ts` — `db`, a **direct Postgres connection that BYPASSES row-level
  security.** It connects as the role in `DATABASE_URL` (the owner), so RLS does
  not constrain it and neither do the table grants. **Every query must be scoped
  by `tenant_id` in application code**, and authorization must be enforced by the
  guards in `web/src/lib/tenant.ts` — the database will not do it for you. RLS
  protects the PostgREST path (the browser's Supabase client), which since
  migration 0014 has no write access at all.

  > This README previously described `client.ts` as "RLS-enforced,
  > request-scoped" — the exact opposite of what it is, and contradicting the
  > file's own header comment. A developer trusting that sentence would omit
  > tenant filters and leak across academies. It is corrected here because it was
  > the most dangerous sentence in the repo.
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

RLS reads `tenant_id` and `role` from the JWT, injected by the Custom Access
Token Hook (migration 0002, superseded by 0010). It applies to the **PostgREST
path only** — the browser's Supabase client. It does not constrain `client.ts`.

Since **migration 0014**, the `authenticated` role has SELECT and *no write
access whatsoever* in `public`. Before that, one `for all` policy across sixteen
tables plus a blanket write grant let any learner `PATCH` their own membership to
`platform_admin` through the public REST endpoint. Writes are additionally gated
by role-scoped policies, so restoring the grant alone would not restore the hole.
`quiz_questions.correct` is not readable by learners at all.

**Migration 0015** made the audit log genuinely tamper-evident: a per-tenant
advisory lock and a monotonic `seq` so the chain cannot fork under concurrency, a
canonical jsonb payload that includes `id`/`ip`/`user_agent`, and
`verify_audit_chain(tenant)` — which returns one row per problem and nothing at
all when the chain is intact.

> An earlier version of this section claimed tenant isolation, cross-tenant write
> rejection, append-only enforcement and "hash-chain integrity" were all
> *verified against Postgres and passing*. No verifier existed anywhere in the
> repo at the time, and the chain forked under concurrent writes. Treat the
> claims above as **describing the intended model**: run
> `select * from verify_audit_chain(<tenant>)` and the probes in
> `web/tests/live/rls-attacks.spec.ts` against a real project to establish what
> actually holds.
