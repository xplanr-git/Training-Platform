# Deployment Runbook

How to take the v2 platform (`web/` + `db/`) live and cut over from the legacy
Vite app. Everything below is **operational** — the application code is complete
(see [ARCHITECTURE.md](ARCHITECTURE.md) and CLAUDE.md); these are the infra
steps only the account owner can perform.

Do the steps in order. Each has a check you can run before moving on.

---

## Status — where this runbook actually stands (2026-08-06)

This document read as though nothing had shipped, while
[PLATFORM_OVERVIEW.md](PLATFORM_OVERVIEW.md) said the platform was live. Both
were right about different things, and neither said which. **The platform IS
live** at `training.structurebuild.co`, deployed from remote `academy/main` in
single-tenant mode (`DEFAULT_TENANT_SLUG=outdure`).

| § | Step | State |
|---|---|---|
| 0 | Accounts | **Done** — except Upstash, now genuinely used if you want rate limits counted across instances (§9). |
| 1 | Supabase v2 project | **Done.** Migrations `0000`–`0016` all applied (`0014`–`0016` on 2026-08-07). |
| 2 | Access-token hook enabled | **Done** (`0002`, superseded by `0010`). |
| 3 | First academy + admin | **Done.** |
| 4 | Stripe | **Wired, gated off.** |
| 5 | Vercel | **Done.** |
| 6 | CI | **Done** — four jobs: db, web, e2e, live. |
| 7 | Legacy course-data migration | **REMOVED.** Owner decision 2026-08-06; the script lost data silently. Details below. |
| 8 | Harden + retire the legacy project | **NOT DONE — all four items outstanding.** |

### Done 2026-08-07 — the database is current

Migrations `0014`–`0016` are applied to the v2 project. `0014` closed a
privilege-escalation hole that WAS exploitable in production: one `for all` RLS
policy plus a blanket write grant let any learner `PATCH` their own membership
to `platform_admin` through the public PostgREST endpoint, using only the anon
key that ships in the client bundle. Confirmed closed — `authenticated` now
holds **zero** INSERT/UPDATE/DELETE privileges anywhere in `public`.

Re-run the chain check any time:

```bash
psql "$DATABASE_URL" -c "select * from public.verify_audit_chain('<tenant-uuid>');"
```

No rows means intact. Rows saying `hash_version 1 predates migration 0015` are
expected and not a problem — those were written by the old algorithm and are
reported as unverifiable rather than as tampered, deliberately.

> **A note for the next migration.** `0015` could not run as first written: its
> backfill was `update audit_log set hash_version = 1`, and that table's own
> append-only trigger rejects UPDATE. Anything that needs to touch existing rows
> in `audit_log` or `progress_events` must do it through DDL (a column default)
> rather than DML. Same collision as `0009`, `0012` and `0016`.

### Outstanding, in priority order

1. **Rotate the LEGACY anon key** (§8.3). It was committed to source and is in
   git history, so it must be treated as public. **This is now the most exposed
   thing on the list.**

2. **Apply legacy migration `010`** and **redeploy the legacy edge function**
   with `ALLOWED_ORIGINS` (§8.1, §8.2) — or, if the legacy project is genuinely
   finished with, delete the project outright, which closes all three at once.

3. **Deploy the app changes.** The database is ahead of the code: CSP,
   client-side Sentry, the error boundaries and the guard fixes are committed
   but not yet released, so the live site is still serving without them.

4. **Flip DNS** for any remaining legacy tenant (§8.4).

### Not blocking, but worth knowing

- A **disposable Supabase project** would let the `live` CI job actually run.
  Today it passes with every spec SKIPPED, which is honest but is not coverage.
  Populate the `ALLOW_LIVE_WRITES`, `DEMO_ADMIN_*` and `RLS_PROBE_*` secrets in
  GitHub and point them at that project, never at production.
- **GDPR erasure** is not possible in-product. Owner decision, `docs/POLISH_BACKLOG.md` §5.

---

## 0. Accounts you need

| Service | Used for | Required for MVP |
|---|---|---|
| Supabase (new project) | Postgres, Auth, Storage | **Yes** |
| Vercel | Hosting `web/` | **Yes** |
| Stripe | Subscriptions + course sales | **Yes** (skip only if launching free-only) |
| Resend | Transactional email | Optional (emails no-op without a key) |
| Sentry / PostHog | Errors / analytics | Optional |
| Mux, Inngest, Upstash | Video, durable jobs, rate-limiting | Later (structurally wired, not required for MVP) |

---

## 1. Create the fresh Supabase v2 project

The v2 schema goes on a **new, empty** project — the legacy project stays as-is
until cutover (§8).

1. Create a new Supabase project. Note the project ref, the anon key, the
   service-role key (Settings → API), and the Postgres connection string
   (Settings → Database → Connection string → URI).

   > **Two different connection strings.** Use the **session pooler (`:5432`)**
   > or a direct connection for *migrations* (below). The **running app must use
   > the transaction pooler (`:6543`)** — it is serverless, and the session
   > pooler exhausted connections (`MaxClientsInSessionMode`) before that was
   > fixed. Set the `:6543` URI as `DATABASE_URL` in Vercel.
2. Apply the v2 migrations from `db/`:
   ```sh
   cd db
   npm install
   export DATABASE_URL="postgres://postgres:<pw>@<host>:5432/postgres"
   npm run migrate          # applies 0000 → 0003 in order
   npm run check            # should print "Everything's fine"
   ```
   This creates all 24 tables, RLS policies, the JWT helpers, the append-only /
   hash-chain triggers, the access-token hook function, and seeds the 4 system
   roles.

**Check:** in the SQL editor, `select count(*) from public.roles where is_system;`
returns `4`; `select count(*) from information_schema.tables where
table_schema='public';` is ~24.

---

## 2. Enable the Custom Access Token Hook

RLS depends on `tenant_id` + `role` being in the JWT. Migration `0002` created
`public.custom_access_token_hook`; you must turn it on:

- Supabase Dashboard → **Authentication → Hooks → Customize Access Token (JWT)
  Claims** → select `public.custom_access_token_hook` → Enable.

**Check:** sign in as any member and decode the access token (jwt.io) — it should
contain `tenant_id` and `role`. Without this, every tenant-scoped query returns
empty.

---

## 3. Seed the first platform admin

Owners created via signup are `company_admin`. The platform admin (who sees
`/platform`) must be seeded once:

1. Create the auth user (Dashboard → Authentication → Add user, or invite).
2. In the SQL editor, mirror them and grant the role:
   ```sql
   insert into public.users (id, email, name)
   values ('<auth-user-uuid>', 'admin@yourco.com', 'Platform Admin')
   on conflict (id) do nothing;

   -- A platform_admin membership; tenant_id may point at your own tenant.
   insert into public.memberships (tenant_id, user_id, role, status)
   values ('<any-tenant-uuid>', '<auth-user-uuid>', 'platform_admin', 'active');
   ```
   (Create a tenant row first if none exists.)

**Check:** signing in as this user and visiting `admin.<domain>/platform` (or the
apex `/platform`) shows the tenant list.

---

## 4. Configure Stripe

1. Create three recurring **Products/Prices** (Starter, Pro, Business). Copy each
   price id (`price_...`).
2. Add a webhook endpoint: **`https://<app-domain>/api/webhooks/stripe`**,
   subscribing to: `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `charge.refunded`. Copy the signing secret (`whsec_...`).
3. Enable Stripe Tax if you want automatic tax.

These map to the env vars in §5 (`STRIPE_*`).

**Check:** after deploy, Stripe → Webhooks → “Send test event”
(`checkout.session.completed`) returns 200.

---

## 5. Deploy `web/` to Vercel

1. Import the repo, then set **all three** of these — the defaults are wrong:

   | Setting | Value | Why |
   |---|---|---|
   | **Framework Preset** | **Next.js** | Vercel mis-detects the framework because of the legacy prototype's `vite.config.ts` at the repo root. If the preset lands on "Other", the build compiles fine and then fails with `No Output Directory named "public" found` — Vercel serves a static dir instead of `.next`. `web/vercel.json` now pins `"framework": "nextjs"`, which overrides the dashboard; keep them in agreement anyway. |
   | **Root Directory** | **`web`** | The application lives here, not at the repo root. |
   | **Install Command** | `(cd ../db && npm ci) && npm ci` | `web` depends on `file:../db`; npm links it but does **not** install its dependencies, so the build fails with `Cannot find module 'drizzle-orm/pg-core'`. (Same trap the CI workflow hit.) |

   Also enable **Settings → Build → "Include source files outside of the Root
   Directory"**, or `../db` won't exist during the build.

   > **Why the build can still fail at "Collecting build traces".** `web` depends
   > on `file:../db`, which npm installs as a *symlink* out of the root
   > directory. Next infers the file-tracing root from the nearest lockfile
   > (`web/`), so trace collection walks that symlink outside the traced root and
   > the build dies after "✓ Compiled successfully" — before the route table
   > prints. `next.config.mjs` pins `outputFileTracingRoot` to the repo root to
   > prevent this; that setting depends on the "Include source files outside…"
   > toggle above.

2. Set environment variables (see `web/.env.example` for the full list):

   | Var | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | v2 project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | v2 anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | v2 service-role key (server-only) |
   | `DATABASE_URL` | v2 Postgres URI, **transaction pooler `:6543`** (server-only) |
   | `NEXT_PUBLIC_ROOT_DOMAIN` | the host the app is served from, e.g. `training.structurebuild.co` |
   | `DEFAULT_TENANT_SLUG` | **single-tenant mode** — the one academy the apex serves, e.g. `outdure`. Omit for multi-tenant subdomain routing (see §5a) |
   | `BUNNY_API_KEY` / `BUNNY_LIBRARY_ID` / `BUNNY_CDN_HOSTNAME` | Bunny Stream video library |
   | `RESEND_API_KEY` / `EMAIL_FROM` | required for invites — without it nobody can be onboarded |
   | `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | optional |
   | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*` | **omit for internal use** — the Stripe client is lazily constructed, so the app boots fine without them and only throws if a payment path is hit (all gated off) |

3. Add the domain (see §5a — the choice depends on whether you run one academy
   or many).
4. Deploy.

---

## 5a. Domains: one academy, or many?

The routing has two modes, and the DNS you need differs. Getting this wrong is
the most likely reason a fresh deploy “works but every page 404s”.

### One academy (single-tenant) — the internal setup

Serve the academy straight from the host. `/admin`, `/learn/...` and the
storefront all resolve at the top level; no subdomain anywhere.

| Setting | Value |
|---|---|
| Vercel → Settings → Domains | `training.structurebuild.co` |
| DNS (wherever `structurebuild.co` is hosted) | CNAME `training` → `cname.vercel-dns.com` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `training.structurebuild.co` |
| `DEFAULT_TENANT_SLUG` | the tenant's slug, e.g. `outdure` |

No wildcard record, no second certificate. `/platform` (cross-tenant admin),
`/dashboard` and the marketing page `/` deliberately stay at the top level.

> **Without `DEFAULT_TENANT_SLUG`, every `/admin/*` URL 404s on this host** —
> the host is the apex, so nothing resolves to a tenant. That is by design in
> multi-tenant mode and surprising in single-tenant mode, hence this section.

> **Cloudflare:** set the CNAME to **DNS only** (grey cloud). Proxying puts
> Cloudflare's certificate in front of Vercel's — redirect loops and SSL errors
> that look like an outage.

### Many academies (multi-tenant) — the SaaS setup

Each tenant gets a subdomain of the root.

| Setting | Value |
|---|---|
| Vercel → Domains | the apex (`outdure.app`) **and** a wildcard (`*.outdure.app`) |
| DNS | CNAME/A for the apex, CNAME `*` for the wildcard |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `outdure.app` |
| `DEFAULT_TENANT_SLUG` | leave unset |

**Env var changes need a redeploy** — they are not picked up by the existing
build.

**Check:** `https://<apex>` shows the marketing page; `https://<apex>/signup`
provisions a tenant and redirects to `<slug>.<apex>/admin`.

---

## 6. Wire CI (optional but recommended)

`.github/workflows/ci.yml` already runs typecheck/lint/test/build for `db/` and
`web/`. Enable Actions on the repo; no secrets are required (CI uses placeholder
env). Add Vercel’s Git integration for preview deploys.

---

## 7. Migrate legacy course data — REMOVED, and deliberately not replaced

`db/migrate-v1-to-v2.ts` was **deleted on 2026-08-06** by owner decision. There
is no supported path for importing legacy Vite-prototype data, and this section
records why rather than leaving the question open.

The live platform already runs on the v2 project with real content, so no legacy
data is coming across. The script that remained was not a dormant convenience —
it lost data silently, and reported success while doing it:

- **Slug collisions were counted as successes.** `slugify(title).slice(0, 63)`
  with no collision handling: a second course whose first 63 characters matched
  an existing one satisfied the duplicate check, was tallied under
  `stats.skipped`, and never appeared. Dropped, and reported as a clean run.
- **Content only.** No `users`, `memberships`, `enrollments`, `progress_events`,
  `quizzes`, `quiz_attempts`, `certificates` or `orders`. A cutover using it
  would have stranded every learner — CLAUDE.md §6 Phase 1 promises
  `profiles.enrolled_courses[]` / `completed_lessons[]` are carried over, and
  there was no path for them.
- **Quiz activities became empty shells** — no `quizzes` or `quiz_questions`
  rows, silent and uncounted.
- **The dry run was not faithful.** The duplicate check was skipped under
  `--dry-run`, so the preview overstated what a real run would do against a
  partially-migrated target — the one case you use a preview for.
- **Published state was lost** (every course forced to `draft`), legacy
  timestamps were lost, tenant `name` was set to the raw `company_id`, any video
  URL was tagged `kind: 'youtube'` even when it came from `video_url` (so the
  player picked the wrong renderer), and orphan activities were dropped without
  being counted or logged.
- **No `audited()` calls anywhere** — a bulk import creating tenants and courses
  wrote zero audit rows, against CLAUDE.md §7.11.

Keeping it would have meant someone eventually running it, seeing "success", and
losing courses. If legacy import is ever genuinely needed, write it fresh
against the schema of the day, with collision-safe slugs, a faithful dry run and
audit rows — do not resurrect this from git history.

---

## 8. Harden and retire the legacy project

The legacy Supabase project + Vite app stay up (read-only-ish) until every tenant
is cut over. Before/while they do:

1. **Apply migration 010** (`supabase/migrations/010_lock_down_kv_store.sql`) to
   the legacy project — closes the world-writable KV hole.
2. **Redeploy the `server` edge function** (it now has auth guards + CORS
   allowlist). Set its `ALLOWED_ORIGINS` env to the legacy app origin.
3. **Rotate the legacy anon key** (it was previously committed to source).
4. Once a tenant is live on v2, flip its DNS to Vercel and stop serving it from
   the legacy app. Decommission the legacy project when the last tenant moves.

---

## 9. Post-deploy golden-path smoke

### Automated (recommended)

An end-to-end Playwright suite drives the full golden path (signup, authoring,
enroll, complete lesson, pass quiz, certificate, verify) against a live
environment. Point it at that environment's **demo tenant** subdomain and a
seeded company-admin for that tenant:

```sh
cd web
LIVE_BASE_URL="https://demo.<your-domain>" \
DEMO_ADMIN_EMAIL="demo-admin@<your-domain>" \
DEMO_ADMIN_PASSWORD="…" \
npm run test:live
```

All specs should pass (`tests/live/*.spec.ts`: golden-path, quiz-path,
signup-provision, overview-stats). They create real data under the demo tenant
— clean it up afterwards (§ below). Requires `npx playwright install chromium`.

### Manual checklist

Or verify by hand against production:

1. `/signup` → create an academy → lands on `<slug>.<domain>/admin`.
2. Admin → Courses → New → add sections + lessons (text/video/PDF) and a quiz
   with a pass threshold → Publish.
3. Settings → School Settings → set branding; Certificates → Edit template.
4. Visit `<slug>.<domain>` (incognito) → the course appears; open it → enroll
   (free) or buy (Stripe test card `4242 4242 4242 4242`).
5. Complete every lesson; pass the quiz → course completes.
6. Dashboard shows 100% + “View certificate” → `/verify/<code>` shows a branded,
   valid, printable certificate.
7. Admin → Certificates → the issued cert is listed; Revoke → `/verify` shows
   Revoked.
8. Admin → Reports → numbers reflect the above.
9. Platform admin → `/platform` → suspend the tenant → its storefront 403s;
   reactivate.

If all nine pass, the MVP is live.

---

## 10. Rollback

- **Bad web deploy:** revert to the previous Vercel deployment (instant).
- **Bad migration:** v2 migrations are additive; restore from a Supabase
  point-in-time backup if a data migration goes wrong. Never edit a shipped
  migration — add a new numbered one (next is `0004`).
- **Tenant issues:** suspend the tenant from `/platform` to take it offline
  without a deploy.
