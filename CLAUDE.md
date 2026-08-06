# Training Platform — Project Guide

> **This file is the single source of truth for contributors and AI assistants.**
> If anything in another doc contradicts this file, this file wins. Update this file when decisions change; do not let other docs drift.
>
> **New to the repo?** Read this end-to-end. The load-bearing sections are §1 (locked decisions), §4 (security issues), and §7 (operating rules for AI assistants).

Last reviewed: 2026-08-06.

---

## 1. Mission

Build a **multi-tenant SaaS Learning Management System** in the LearnWorlds / Thinkific / Teachable category, optimised for **training companies, consultancies, and academies** delivering accredited learning. Customers ("tenants") create branded course catalogues on subdomains and sell courses to their learners.

This is **not** a single-brand corporate L&D portal. It is **not** a Docebo/Cornerstone-style enterprise LMS. It is **not** a marketplace.

### Locked product decisions

These are committed and **not** open for re-litigation without explicit founder approval. Any AI assistant or contributor encountering these decisions: do not propose alternatives unless asked.

| Decision | Choice |
|---|---|
| Product vision | Multi-tenant creator/training-provider SaaS (LearnWorlds-style) |
| Primary buyer persona | Training companies, consultancies, academies (mid-market) |
| Tenancy model | Multi-tenant from day 1 — every domain table carries `tenant_id`, RLS enforces |
| Accreditation positioning | Platform provides audit-grade evidence (SCORM/xAPI/audit log/verifiable certs); customers earn their own accreditations using that evidence |

### Single-tenant mode is a deployment configuration, not a different product

The first production deployment — `training.structurebuild.co`, the Outdure
Academy — runs **single-tenant**: `DEFAULT_TENANT_SLUG=outdure` makes the apex
host serve one academy, so `/admin` and `/learn/...` resolve without a
subdomain. [PLATFORM_OVERVIEW.md](PLATFORM_OVERVIEW.md) describes that
deployment and is accurate.

This does **not** contradict the multi-tenant decision above, and the two docs
are not in conflict. The tenancy model is unchanged: every domain table still
carries `tenant_id`, RLS still enforces it, `memberships` still resolves the
academy, and leaving `DEFAULT_TENANT_SLUG` unset restores subdomain routing
exactly. One tenant is the `n = 1` case of many, not a collapse of the model —
see `tenantRewritePath` in [web/src/lib/host.ts](web/src/lib/host.ts), which is
the whole of the difference.

Stated explicitly because the omission was itself misleading: §1 read as
denying the thing that was actually in production, which invited a contributor
to "fix" the deployment towards subdomains, or to take the overview doc as
evidence the mission had changed. Neither is right.

### What this is **not**

- Not a single-brand portal *as a product* — do not propose collapsing tenants
  or removing `tenant_id`. (Single-tenant *deployment* is supported: see above.)
- Not a marketplace (one storefront, many sellers) — every tenant is the seller.
- Not a self-hosted product (yet) — managed SaaS only until enterprise demands it.
- Not running AI features in the MVP. (See §11 Blue Sky.)

---

## 2. Target tech stack

> **This migration is DONE.** Both tables below are kept as a record of the
> decision and its reasoning, not as outstanding work — the "migrating to"
> column is what `web/` and `db/` are built on today. See §3.

### Migrated **from** (the retired prototype)

- Vite 6 + React 18 + TypeScript
- Tailwind v4 + MUI + Radix UI (overlapping styling systems — MUI gets dropped)
- Supabase JS client (Postgres + Auth + Storage + Edge Functions)
- Hand-rolled state-based routing in [App.tsx](App.tsx) (no react-router)
- Two near-duplicate Hono edge functions

### Migrated **to** (what is running now)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SEO on marketing/course pages, ISR for course landings, Server Actions, native Vercel deploy |
| Language | TypeScript strict mode | — |
| Styling | **Tailwind v4 + Radix primitives** | Drop MUI. shadcn/ui-style component layer on top of Radix. |
| Database | **Supabase Postgres** | Keep — use as managed Postgres + storage + auth issuer |
| ORM | **Drizzle** | Type-safe, light, raw SQL when needed |
| Migrations | Drizzle Kit + `supabase/migrations/*.sql` | Append-only; never edit a shipped migration |
| Auth (core) | **Supabase Auth** | Email/password, magic link, OAuth |
| Auth (enterprise) | **WorkOS** | SAML / OIDC SSO — pluggable when enterprise plan ships |
| Video | **Mux** | DRM, adaptive bitrate, playback analytics, interactive video primitives |
| Payments | **Stripe Billing + Stripe Tax** | Subscriptions per tenant + per-course one-time / payment plans |
| Email | **Resend** | React-email templates |
| Search | Postgres FTS at MVP → **Typesense** at scale | — |
| Background jobs | **Inngest** | Cron, retries, durable workflows |
| SCORM player | **`scorm-again`** (MIT) | SCORM 1.2 + 2004 in-browser playback |
| xAPI LRS | Postgres-backed LRS (`xapi_statements` table) → **Lrsql** if it outgrows | — |
| Verifiable credentials | **`@digitalbazaar/vc`** + Open Badges 3.0 | No blockchain |
| Observability | **Sentry** (errors) + **PostHog** (analytics + replay + flags) + **Better Stack** (uptime + logs) | — |
| Hosting | **Vercel** (Next.js) + **Supabase** (DB/Storage/Edge Functions) + **Inngest Cloud** (jobs) | — |
| CI | GitHub Actions | typecheck → lint → vitest → drizzle migration check → build → Playwright smoke → deploy |

### Dependencies dropped

`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `next-themes`, `cmdk`, `react-slick`, `react-responsive-masonry`, `input-otp`.

**Done — none of these are in [web/package.json](web/package.json).** They remain
in the ROOT `package.json`, which belongs to the retired Vite prototype; they are
not shipped to users. §7.6 (no new MUI imports) still stands.

---

## 3. Current state (be honest with yourself)

**As of 2026-08-06 this is a shipped product, not a prototype.** The v2 app is
live at `training.structurebuild.co`, deployed from remote `academy/main`.

> Until 2026-08-06 this section described a Vite prototype with 5 tables, two
> edge functions and "~75% mock UI" — three months out of date. Noted because
> anyone who trusted it would have gone looking in the wrong codebase entirely.

### Where the code lives

- **`web/`** — Next.js 15 App Router. This is the application.
- **`db/`** — Drizzle schema, **22 tables**, **16 migrations** (`0000`–`0016`).
- **Root `src/`, `index.html`, `vite.config.ts`, `supabase/`** — the **RETIRED
  Vite prototype**. Not deployed, not maintained. `npm run dev:legacy` still
  starts it; `npm run dev` starts the real app. Deletion is unscheduled.

### What works end-to-end, live

Auth (sign-up, sign-in, invitation, password reset, public `/join` gated on
admin approval) · multi-tenant + single-tenant host routing · academy
provisioning · course authoring with sections, lessons and reordering ·
Bunny Stream video with resume and watch-time tracking · quizzes with
server-side grading · enrolment (free and Stripe) · event-sourced progress ·
completion certificates with public `/verify/:code` · admin People, Courses,
Analytics, Certificates and Settings · transactional email via Resend ·
append-only hash-chained audit log.

### What is genuinely not built

SCORM/xAPI playback (`xapi_statements` is schema-only), WorkOS SSO, custom
domains, affiliates, community, interactive video, PWA offline — all Phase 2+.
There is **no Activity Log screen**, so nothing in the product reads
`audit_log` yet.

### Known-open, with the decision owner

- **May learner progress be deleted?** `progress_events` is append-only, which
  is what makes the watch-time evidence trustworthy. Migration `0016` unblocked
  deleting a tenant/course/enrolment *without* deleting events, so this is no
  longer a blocker for housekeeping — but a **GDPR Article 17 erasure request
  still cannot be honoured in-product**. See `docs/POLISH_BACKLOG.md` §5.
- **Certificate wording** — same section.

---

## 4. Security posture

**Read this before hunting for bugs here.** Items 1–6 below are **FIXED**. They
were listed as live and exploitable for three months after they were closed,
which sent every reader looking for bugs that no longer exist and devalued the
entries that are still real.

### Closed

| # | Issue | Closed by |
|---|---|---|
| 1 | Hardcoded admin bypass returning a forged `admin-token-*` JWT | Deleted. **Must stay deleted — §7.12.** Legacy prototype only; the v2 app never had it. |
| 2 | No role check on the edge-function admin routes | v2 replaced them. Every admin Server Action calls `requireAdmin()`, every admin page `requireAdminForSlug(slug)`; `authz-conventions.test.ts` fails CI if a guard is dropped. |
| 3 | Supabase URL + anon key in source | v2 reads `NEXT_PUBLIC_SUPABASE_*` via [web/src/lib/env.ts](web/src/lib/env.ts). **The LEGACY project's anon key was committed and still needs rotating — DEPLOY.md §8.** |
| 4 | JWT carries no role claim | Custom Access Token Hook, migrations `0002`/`0007`/`0010`. |
| 5 | Suspension in `localStorage` | `tenants.status`, enforced in the tenant shell and in `assertTenantActive()`. |
| 6 | CORS `origin: "*"` on edge functions | Allowlist via `ALLOWED_ORIGINS`. **Not yet redeployed to the legacy project — DEPLOY.md §8.** |

### Still open, and what is actually true about each

| # | Issue | State |
|---|---|---|
| 7 | Rate limiting | **Mostly done.** [rate-limit.ts](web/src/lib/rate-limit.ts) covers provisioning, password-reset mail, invitations, join requests, enrolment/checkout, quiz attempts and video heartbeats. Counting is **global** when `UPSTASH_REDIS_REST_*` are set and **per-instance** otherwise — check the deployment before calling it global. It fails **open** to per-instance if the store is unreachable, deliberately. **Sign-in is not covered and cannot be from here**: [login/page.tsx](web/src/app/login/page.tsx) calls `signInWithPassword` from the browser, so the request never reaches our server; password-guessing is bounded only by Supabase's own auth limits. |
| 8 | Audit trail | **Built and enforced.** `audit_log` is append-only and hash-chained; `audited()` is required by `audit-coverage-conventions.test.ts`. Migration `0015` fixed three real defects (chain forked under concurrency, no canonicalisation, provenance fields unhashed) and added `verify_audit_chain()`. **Nothing in the product reads it** — there is no Activity Log screen. |
| 9 | GDPR erasure | **Open.** Progress events now survive deletion of their enrolment, course and academy, so an Article 17 request cannot be honoured in-product. Owner decision — `docs/POLISH_BACKLOG.md` §5. |
| 10 | CSP `script-src` | Allows `'unsafe-inline'` and `'unsafe-eval'`, which the App Router's inline bootstrap currently requires. `connect-src` is a strict allowlist, so exfiltration is still confined. Per-request nonces are the proper fix. |
| 11 | ~~Migrations `0014`–`0016` unapplied~~ | **APPLIED to the v2 project 2026-08-07** and verified against it: `verify_audit_chain` reports 0 broken links and 0 content mismatches across every tenant chain (445 pre-0015 rows correctly reported *unverifiable* rather than tampered); a row altered behind the trigger's back **was detected**; UPDATE and TRUNCATE both refused; a course with 15 progress events deleted successfully. `0015` had to be fixed first — its backfill was an UPDATE, which the table's own append-only trigger rejects. The RLS attack probes are still unrun (they need a disposable project — DEPLOY.md). |

---

## 5. Target data model (Phase 1)

Replace the current schema with this. Every non-system table has `tenant_id uuid not null`. RLS pattern: `tenant_id = current_setting('app.current_tenant_id')::uuid`.

```
tenants              (id, slug, name, plan_id, custom_domain, status, created_at, updated_at)
users                (id ← auth.users.id, email, name, avatar_url, created_at)
memberships          (id, tenant_id, user_id, role, status, invited_by, created_at)
                     -- user can belong to multiple tenants with different roles
roles                (id, tenant_id NULLABLE, name, is_system)
permissions          (id, role_id, action, resource, scope)

courses              (id, tenant_id, title, slug, status, price, currency, ...)
sections             (id, course_id, position, title)
lessons              (id, section_id, type, position, title, content_jsonb)
                     -- type: video | pdf | scorm | quiz | text | live
lesson_assets        (id, lesson_id, kind, mux_asset_id | storage_path, metadata_jsonb)

enrollments          (id, tenant_id, user_id, course_id, status, source, started_at, completed_at)
progress_events      (id, enrollment_id, lesson_id, event_type, payload_jsonb, duration_ms, occurred_at)
                     -- APPEND-ONLY. Derive completion, time-on-task, last-position via queries.

quizzes              (id, lesson_id, settings_jsonb)
quiz_questions       (id, quiz_id, position, type, prompt, options_jsonb, correct_jsonb, points)
quiz_attempts        (id, enrollment_id, quiz_id, started_at, submitted_at, score, passed)
quiz_answers         (id, attempt_id, question_id, response_jsonb, is_correct, points_awarded)

certificates         (id, enrollment_id, template_id, issued_at, revoked_at,
                      verification_code, credential_jsonb)
certificate_templates(id, tenant_id, design_jsonb, accreditation_body)

xapi_statements      (id, tenant_id, actor_jsonb, verb_jsonb, object_jsonb, result_jsonb, timestamp)

subscriptions       (id, tenant_id, stripe_subscription_id, plan_id, status, current_period_end)
orders              (id, tenant_id, user_id, course_id, stripe_payment_intent, amount, status)
payouts             (id, tenant_id, stripe_payout_id, amount, period_start, period_end)

audit_log           (id, tenant_id, actor_user_id, action, resource_type, resource_id,
                     before_jsonb, after_jsonb, ip, user_agent,
                     hash, prev_hash, occurred_at)
                    -- APPEND-ONLY, hash-chained for tamper-evidence.
```

### Modelling rules

- `progress_events` is event-sourced, not state-stored. Never UPDATE; only INSERT. Aggregate views (e.g. `enrollment_progress_view`) derive state.
- `audit_log.hash = sha256(prev_hash || canonical_json(row_payload))` — makes tampering detectable for SOC 2 / HIPAA audits.
- A user can be in many tenants via `memberships`. The current `profiles.company` text slug pattern is the wrong model; deprecate during Phase 1.
- The current 12-URL-column shape of `course_activities` (video_url, pdf_url, scorm_url, etc.) gets normalised into `lessons.content_jsonb` + `lesson_assets`.

---

## 6. Roadmap

### Phase 0 — Foundation reset (Weeks 1–2)

1. **Doc reconciliation** — archive `SIMPLIFIED_ARCHITECTURE.md`, the NestJS sections of `TECHNICAL_ARCHITECTURE.md`, and any other doc that contradicts §1 to `docs/_archive/`. Rewrite `ARCHITECTURE.md` to reflect this CLAUDE.md.
2. **Security fixes** — items 1–7 in §4.
3. **New v2 schema** — Drizzle schema for §5, applied as a parallel migration set on a fresh Supabase project. Do not cut over yet.
4. **Vite → Next.js 15 migration** — feature branch. Copy components, fix `figma:asset/*` imports, set up Vercel + GitHub Actions + Sentry + PostHog + Better Stack.
5. **Design system** — drop MUI, consolidate on Tailwind + Radix. Token file for colours/spacing/type. Storybook optional.

### Phase 1 — Core LMS (Weeks 3–10)

- Cut over to v2 schema. Migrate the five existing tables; deprecate `profiles.enrolled_courses[]` / `profiles.completed_lessons[]`.
- Real authoring: course/section/lesson CRUD, rich text editor, Mux upload widget, PDF upload, basic quiz builder (MCQ + true/false).
- Real learner experience: course catalog (Postgres FTS), Mux player with `progress_events` writes, quiz attempts, completion-triggered certificate.
- Certificates v1: PDF template, verification URL (`/verify/:code`), W3C Verifiable Credential JSON.
- Stripe Billing: per-tenant subscription (Customer Portal for upgrades), per-course one-time + payment plan.
- Resend transactional emails: signup, enrolment, cert issued, payment receipt.
- Tenant subdomain routing on Vercel (`*.outdure.app` → tenant lookup).

**Exit criteria**: 10 friendly beta tenants can run real courses.

### Phase 2 — Accreditation-ready (Weeks 11–18)

- SCORM 1.2 + 2004 playback via `scorm-again`. Course type "SCORM package" — zip upload, manifest parse, asset extraction.
- xAPI emitter. Statements for every progress event written to `xapi_statements`.
- Audit log (append-only, hash-chained). Every mutation routes through it.
- WCAG 2.1 AA audit and fixes.
- GDPR Subject Access Request endpoint and deletion endpoint with email verification.
- WorkOS for SAML/OIDC SSO. Enterprise plan unlocks it.
- Quiz proctoring v1 — browser focus tracking, optional webcam snapshot.

**Exit criteria**: a customer passes a CPD or IACET audit using exported evidence from the platform.

### Phase 3 — Differentiators (Weeks 19–26)

- Interactive video (Mux + overlay primitives: timestamp-pinned quizzes, hotspots, branching).
- Community (discussion forum per course, or Discourse via SSO).
- Custom domains (Vercel domains API, auto-SSL).
- Affiliate program (Stripe Connect express accounts, referral cookie, payout dashboard).
- PWA: offline lesson cache via Service Worker + IndexedDB.

**Exit criteria**: 100 paying tenants, $20k MRR.

### Phase 4 — Scale + enterprise (Weeks 27+)

- SOC 2 Type I → Type II.
- React Native mobile apps sharing the API.
- LTI 1.3 tool provider (sell into universities).
- Embedded analytics per tenant (Metabase or Mode).
- Multi-region (EU + US Supabase projects with replication).
- Zapier + Make; HubSpot/Salesforce native sync.

---

## 7. Operating rules for AI assistants

Read this before doing anything in this repo.

1. **The three locked decisions in §1 are not up for debate.** Do not propose collapsing tenancy, switching personas, or pivoting to a marketplace.
2. **Treat archived docs as poison.** Anything in `docs/_archive/` represents a path we deliberately did not take. Do not pull recommendations from those files.
3. **Migrations are append-only.** Never edit a shipped file in `supabase/migrations/`. Add a new numbered file. The next number is one higher than the highest existing.
4. **Secrets in env vars, never in source.** [utils/supabase/info.tsx](utils/supabase/info.tsx) is the existing anti-pattern — fix it, don't replicate it. Same applies to Stripe keys, Mux keys, WorkOS keys, Resend keys.
5. **Every domain table has `tenant_id` from creation.** Every new RLS policy starts with the tenant-scoping check. There is no exception for "global" tables; if it really is global (e.g. `permissions` for system roles), document why in the migration.
6. **No new MUI imports.** MUI is being removed. Use Radix + Tailwind.
7. **No new state-based "routing".** New pages use Next.js App Router routes. Do not extend the `App.tsx` switch statement.
8. **Don't introduce NestJS, a separate backend service, or microservices.** Target architecture is Next.js full-stack on Supabase, with Inngest for jobs. Older docs mention NestJS — they're wrong (and archived in Phase 0).
9. **AI features are out of scope** for Phase 1–3. If asked to add an AI feature, push back and link the user to §11 Blue Sky.
10. **No blockchain.** Verifiable certificates use W3C VC / Open Badges 3.0 with a public verification URL. No NFTs, no chain integration.
11. **Don't write code that bypasses the audit log.** Once §4 #8 is in, every mutation on `tenants`, `memberships`, `roles`, `courses`, `enrollments`, `certificates` must go through the audit helper.
12. **Don't restore the demo bypass.** The hardcoded admin in §4 #1 must stay deleted. Demo users live in migration `006_fix_demo_users.sql` and sign in via real Supabase Auth.
13. **Verification before "done".** When a change is observable in a browser preview, use the `preview_*` tools to verify it. Do not declare a UI change complete based on type-check passing alone.
    **The gate is `npm run verify` in `web/` and in `db/` — both, not one.** Those two scripts run exactly what CI runs and nothing less: `web` is typecheck → lint → vitest → build → **Playwright**, `db` is `drizzle-kit check` → tsc. Do not hand-assemble a subset. "All tests pass" is ambiguous — `npm test` is vitest only, and a gate that stopped there once shipped a broken smoke test and left CI red for five commits while each was reported green. [ci-parity.test.ts](web/tests/unit/ci-parity.test.ts) fails if CI ever gains a step `verify` does not run.
    One gap `verify` cannot close: it runs the same *commands* as CI, not the same *runtime*. This machine is on Node 18.20.1, CI pins Node 20, so a Node-version-sensitive failure still only shows up on CI. Green locally means "the commands pass", not "CI will pass".
14. **Never amend git commits.** Always create new commits. The pre-existing memory note covers this.
15. **Ask before destructive ops.** Anything that touches production data, drops a table, force-pushes, or affects shared state needs explicit user authorisation. The audit covers what's safe to do unattended.

---

## 8. File map

```
.
├── CLAUDE.md                          ← you are here. Source of truth.
├── PLATFORM_OVERVIEW.md               the LIVE deployment (single-tenant, training.structurebuild.co)
├── DEPLOY.md                          how to stand it up; §8 lists outstanding legacy tasks
├── ARCHITECTURE.md                    architecture doc
├── README.md                          short, points to CLAUDE.md
├── package.json                       monorepo root. `npm run verify` fans out to db + web.
│
├── web/                               ★ THE APPLICATION (Next.js 15, App Router)
│   ├── src/app/                       routes. `t/[slug]/` is the tenant tree:
│   │   │                              admin/ (authoring, people, analytics),
│   │   │                              learn/ (player, quizzes), courses/ (storefront)
│   │   ├── dashboard/page.tsx         apex landing → landAfterSignIn resolves the destination
│   │   ├── verify/[code]/             public certificate verification
│   │   ├── api/webhooks/stripe/       payment + subscription webhooks
│   │   ├── error.tsx, global-error.tsx    error boundaries (segment ones live under t/[slug])
│   │   └── middleware.ts (src/)       session refresh + host→tenant rewrite
│   ├── src/lib/
│   │   ├── tenant.ts                  requireAdmin / requireAdminForSlug / requirePlatformAdmin
│   │   ├── host.ts                    tenantRewritePath — subdomain AND single-tenant routing
│   │   ├── rate-limit.ts              sliding window; shared store when Upstash is configured
│   │   └── safe-redirect.ts           validates ?next= by resolution, not by pattern
│   ├── tests/unit/                    ~520 tests, mostly architectural fitness guards
│   ├── tests/e2e/                     unauthenticated smoke — runs on every push
│   ├── tests/live/                    authenticated journeys + RLS attack probes (opt-in)
│   └── sentry.client.config.ts        browser error reporting
│
├── db/                                ★ THE SCHEMA (source of truth for the database)
│   ├── schema.ts                      22 tables, all tenant-scoped
│   ├── client.ts                      `db` — BYPASSES RLS. Scope by tenant_id yourself.
│   ├── audit.ts                       audited(tx, entry) — required by §7.11
│   └── migrations/                    0000–0016, append-only. Next number is 0017.
│
├── docs/
│   ├── POLISH_BACKLOG.md              live backlog; §5 holds the owner-blocked decisions
│   ├── MVP_EXECUTION_BRIEF.md         build brief
│   ├── 03-permissions-rbac.md         RBAC reference
│   ├── 04-ui-pages-flows.md           UX flows reference
│   └── _archive/                      deprecated — DO NOT ACT ON (§7.2)
│
├── .github/workflows/ci.yml           db · web · e2e · live
└── .claude/launch.json                preview config. `web-dev` (port 3010) is the real app.

RETIRED — the Vite prototype. Not deployed, not maintained:
  src/  index.html  vite.config.ts  utils/supabase/  supabase/
  (supabase/functions/server only. `make-server` was deleted.)
```

---

## 9. Running locally

**Node 20** — pinned in `.nvmrc` and in all three `package.json` `engines`, matching CI.

```sh
# The real app (web/ + db/)
npm install --prefix db && npm install --prefix web
npm run dev                 # → http://localhost:3000  (web/, Next.js)
npm run verify              # the gate: fans out to db/ AND web/. See §7.13.
```

`web/` depends on `../db` via a `file:` link, so `db`'s dependencies must be
installed for `web` to typecheck or build.

The preview harness uses `.claude/launch.json` → **`web-dev`** on port 3010.

```sh
# The RETIRED Vite prototype, if you ever need it
npm run dev:legacy          # → http://localhost:5173
```

### Demo accounts

> **These are for the LEGACY Vite prototype only — they do not work on the live
> platform.** The v2 app (`web/` + `db/`) runs on a different Supabase project
> and has never had these users. Trying them against production fails with
> "Invalid login credentials", which reads as a broken login. For live accounts
> see [DEPLOY.md](DEPLOY.md) §3.

Legacy prototype, defined in [supabase/migrations/006_fix_demo_users.sql](supabase/migrations/006_fix_demo_users.sql). Both passwords are `outdure`.

| Email | Role |
|---|---|
| `curtis@outdure.com` | platform_admin |
| `admin@democompany.com` | company_admin |

If sign-in fails against the *legacy* app, the hosted Supabase project doesn't have them yet. Either visit `/?seed=1` (runs [SeedAccountsPage](src/app/components/SeedAccountsPage.tsx) — requires "Confirm email" off in Supabase Auth settings) or paste `006_fix_demo_users.sql` into the Supabase SQL Editor.

### Environment

Two Supabase projects, and confusing them is the usual cause of "login is broken":

- **v2 (live).** What `web/` uses. Configured entirely through env vars — copy
  [web/.env.example](web/.env.example) to `web/.env.local`. Nothing is hardcoded.
- **Legacy (retired prototype).** Project `fyghhlxsorprmjyzbaiw`, creds hardcoded
  in [utils/supabase/info.tsx](utils/supabase/info.tsx). **That anon key is in git
  history and must be treated as public — rotating it is an outstanding task
  (DEPLOY.md §8).** Do not copy this pattern; §7.4.

`web/.env.local` points at **production**. That matters for anything that writes:
it is why the live E2E suite is default-off and why the RLS probes take their own
`RLS_PROBE_*` target and refuse to run against the app's own project.

---

## 10. Pricing model (target)

| Plan | Monthly | Annual | Limits | Notable features |
|---|---|---|---|---|
| Free trial | $0 | — | 14 days, no card | All Pro features |
| Starter | $39 | $29 | 50 active learners | Unlimited courses, **no transaction fee**, basic certificates, Stripe payments |
| Pro | $129 | $99 | 500 active learners | SCORM, xAPI, interactive video, payment plans, custom branding |
| Business | $399 | $299 | 5,000 active learners | Custom domain, SSO (1 connection), advanced analytics, API access, affiliates |
| Enterprise | from $1,500 | custom | unlimited | SAML/OIDC unlimited, SLA, dedicated CSM, on-prem option, accreditation evidence pack |

Differentiators vs LearnWorlds: **no transaction fees on any plan** (LearnWorlds charges $5/sale on Starter) and **accreditation evidence pack** included.

---

## 11. Blue sky / future considerations

Deliberately deferred. Not in current scope. If a user requests these, surface the trade-off and confirm before pulling them into the active roadmap.

### AI features (originally proposed as a differentiator)

Re-introduce when product-market fit is established and base LMS is solid.

- **Quiz generation from transcripts** — auto-generate MCQs from a lesson video's transcript.
- **AI tutor** — per-course chat assistant grounded in the course content (Claude API with prompt caching for cost control).
- **Transcript search** — semantic search across lesson transcripts.
- **Auto course outline** — instructor uploads a video; AI generates suggested section/lesson structure.
- **Auto-marking of free-text answers** — rubric-based scoring with human review queue.
- **Recommendation engine** — "learners who completed X also completed Y".

Implementation notes when reintroducing: provider-agnostic abstraction at the API layer; Anthropic API as default with prompt caching; per-tenant token quotas tied to plan; opt-in per tenant for GDPR.

### Other deferred items

- **Native mobile apps** (React Native, iOS + Android) — PWA first in Phase 3 covers most cases.
- **LTI 1.3 tool provider** — sell into universities. Phase 4.
- **Multi-region** (EU + US Supabase replicas) — Phase 4, gated by enterprise demand and data-residency requirements.
- **HIPAA BAA** — only if a healthcare customer requires it.
- **ISO 27001** — after SOC 2 Type II if Europe-heavy.
- **Self-host / on-prem option** — Enterprise tier only.
- **Reseller / white-label-of-white-label** — Phase 4.
- **Built-in webinar / live class** (vs Zoom embed) — Phase 4.
- **Marketplace pivot** — explicitly out of scope; would require restructuring tenants → sellers within one storefront.
- **Blockchain certificates / NFT credentials** — explicitly rejected. Use W3C Verifiable Credentials.

---

## 12. Glossary

- **Tenant** — a paying customer of the platform (a training company, consultancy, or academy). Owns a subdomain, branding, courses, learners.
- **Learner** — an end-user enrolled in one or more of a tenant's courses.
- **Membership** — link between a user and a tenant, with a role.
- **SCORM** — legacy e-learning content packaging standard. SCORM 1.2 still dominant in corporate L&D.
- **xAPI / Tin Can** — modern statement-based learning record format. Statements sent to an LRS.
- **LRS** — Learning Record Store. Database for xAPI statements.
- **cmi5** — xAPI profile that replaces SCORM for new content.
- **LTI 1.3** — Learning Tools Interoperability. Standard for embedding the platform inside Canvas, Moodle, Blackboard, etc.
- **Verifiable Credential** — W3C standard for cryptographically signed digital credentials with a public verification URL.
- **Accreditation body** — organisations that audit course providers (e.g. CPD, IACET, IOSH, NEBOSH, ATD, SHRM). They accredit customers' courses, not the platform.
- **Audit log** — append-only, hash-chained record of every mutation. Required for SOC 2 / HIPAA / regulated training audits.
