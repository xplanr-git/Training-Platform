# Deployment Runbook

How to take the v2 platform (`web/` + `db/`) live and cut over from the legacy
Vite app. Everything below is **operational** — the application code is complete
(see [ARCHITECTURE.md](ARCHITECTURE.md) and CLAUDE.md); these are the infra
steps only the account owner can perform.

Do the steps in order. Each has a check you can run before moving on.

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
   (Settings → Database → Connection string → URI). Use the **session pooler**
   or direct connection string for migrations.
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

1. Import the repo; set **Root Directory = `web`**.
2. Set environment variables (see `web/.env.example` for the full list):

   | Var | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | v2 project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | v2 anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | v2 service-role key (server-only) |
   | `DATABASE_URL` | v2 Postgres URI (server-only) |
   | `NEXT_PUBLIC_ROOT_DOMAIN` | e.g. `outdure.app` |
   | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | from §4 |
   | `STRIPE_PRICE_STARTER` / `_PRO` / `_BUSINESS` | from §4 |
   | `RESEND_API_KEY` / `EMAIL_FROM` | optional |
   | `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | optional |

3. Add domains: the apex (`outdure.app`) **and** a wildcard
   (`*.outdure.app`) so tenant subdomains resolve. Point DNS per Vercel’s
   instructions (CNAME/A for apex, CNAME `*` for wildcard).
4. Deploy.

**Check:** `https://<apex>` shows the marketing page; `https://<apex>/signup`
provisions a tenant and redirects to `<slug>.<apex>/admin`.

---

## 6. Wire CI (optional but recommended)

`.github/workflows/ci.yml` already runs typecheck/lint/test/build for `db/` and
`web/`. Enable Actions on the repo; no secrets are required (CI uses placeholder
env). Add Vercel’s Git integration for preview deploys.

---

## 7. Migrate legacy course data (optional)

If you have real courses in the legacy project, copy them into v2:

```sh
cd db
export LEGACY_DATABASE_URL="postgres://…legacy…"   # read-only use
export DATABASE_URL="postgres://…v2…"
npx tsx migrate-v1-to-v2.ts --dry-run              # preview counts
npx tsx migrate-v1-to-v2.ts                        # perform
```

It creates a tenant per legacy company slug and maps courses/sections/activities
into the v2 shape. Idempotent (skips already-migrated course slugs). Storage
objects (uploaded files) must be copied separately if you relied on them.

**Check:** the dry-run’s reported counts match expectations; after the real run,
a migrated course appears in that tenant’s admin course list.

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
