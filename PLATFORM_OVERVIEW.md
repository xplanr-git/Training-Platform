# Outdure Academy — Platform Overview

> **Purpose of this document.** A self-contained explanation of what exists, for
> reference from other projects. It is written to be read by someone with no
> prior context on this codebase.
>
> Phase 1 is **built and live**. Phase 2 is **not built** — it is the expansion
> path, described here so the boundary is unambiguous.
>
> Last verified against the code: 2026-08-04.

---

## 1. What this is

A **product training and certification system** for Outdure / Structurebuild
contractors and dealers. Contractors work through installation courses at their
own pace, on any device, and earn a certification tier that maps to the
company's existing contractor ladder.

It replaces a paid **LearnWorlds** subscription. The two things LearnWorlds did
badly for this use case, and which drove the build:

1. **Multi-session progress.** Contractors watch on site, in short bursts, and
   come back days later. Progress and video position must survive that, across
   devices.
2. **No forced gates.** A failed quiz must not lock anyone out or re-ask
   questions they have already answered. Retry freely, no penalty.

Live at **`training.structurebuild.co`**.

---

## 2. Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js App Router | 15.5.22 |
| UI | React + Tailwind + Radix primitives (18 of them) | 18.3.1 / Tailwind 4 |
| Language | TypeScript, strict | 5.6 |
| Database | Supabase Postgres | — |
| ORM | Drizzle + `postgres` driver, in a separate `db/` workspace package | 0.36 |
| Auth | Supabase Auth via `@supabase/ssr`, with a custom access-token hook | 0.5 |
| Video | **Bunny Stream** (watch tracking + resume). YouTube embeds also render but track nothing | — |
| Email | Resend | 4.0 |
| Payments | Stripe — built, gated off | 17.5 |
| Observability | Sentry + PostHog | — |
| Hosting | Vercel (app) + Supabase (database, auth) | — |
| Tests | Vitest (116 unit) + Playwright (live E2E) | — |

**Scale of the codebase:** 29 routes, 22 database tables, 11 migrations.

---

## 3. Phase 1 — single-brand internal academy (BUILT)

Phase 1 serves **one academy: Outdure's own**, with Outdure's own course
content. No external brand, no sign-ups from the public, no payments.

### 3.1 What a contractor can do

- Sign in (email + password), or accept an emailed invitation and set a password
- Recover a forgotten password
- Browse the course catalogue and open a course landing page
- Enrol (free)
- Work through lessons of four kinds: **video, PDF, rich text, quiz**
- **Resume exactly where they stopped** — including the second within a video —
  on any device, because progress is derived from appended events rather than
  browser state
- Retry a failed quiz with no penalty and no repeated questions
- See honest remaining time ("3 of 5 lessons · about 20 min left") from
  per-lesson author estimates
- Earn a certificate on completion, with a public verification URL
- Advance a certification tier automatically on completing a course that confers
  one

### 3.2 What an admin can do

Seven areas are wired and working:

| Area | Capability |
|---|---|
| Dashboard | Published courses, learner count, completions |
| Courses | Create, edit, publish, archive, delete |
| Course builder | Sections and lessons, drag to reorder, attach a Bunny video, PDF, rich text, per-lesson minute estimates |
| Quiz builder | Questions, options, correct answers, pass threshold |
| People | Invite, change role, activate, deactivate |
| Certificates | View every issued certificate, revoke and reinstate; edit the certificate template |
| Insights | Live metrics plus two things LearnWorlds does not give you (below) |

**Insights is the differentiator.** Beyond enrolments and completion rate:

- **Video engagement** — real seconds played per lesson, viewers, average per
  viewer, furthest point reached, compared against the author's estimate. This
  comes from the player reporting actual playback, *not* from someone clicking
  "complete". A contractor who opens a video and walks away is visible as such.
- **Where learners get stuck** — per question: attempts, average time spent,
  percentage answered wrong. Directly usable for improving the training.

### 3.3 Certification model

Completing a course can confer a tier on the contractor's membership, mirroring
the tier ladder already used in the Structurebuild Connect platform:

```
Registered  →  Trained  →  Verified  →  Strategic Partner
```

Advancement is **upward-only and within the same group**. The certificate
carries a public verification URL (`/verify/<code>`) and a W3C Verifiable
Credential JSON payload, so it can be checked by a third party without trusting
the platform's UI. No blockchain.

### 3.4 What is deliberately switched off

The admin sidebar shows **42 items: 7 live, 35 gated**. Gated items keep their
place in the navigation and route to a labelled "coming soon" panel rather than
a dead link — they exist to show the full commercial scope without pretending it
works. Gated groups: Website builder, Community, Inbox, Mass Emails,
E-commerce, Marketing, Affiliates, Mobile App, Gradebook, Review Center,
Question Banks, User Groups, Tags, Approvals, GDPR tooling.

**Stripe is fully built and switched off.** The client is constructed lazily, so
the app runs without Stripe credentials and only fails if a payment path is hit —
and every payment path is gated. Turning it on is configuration, not
development.

### 3.5 Data model

22 tables. Every domain table carries `tenant_id` from creation — see §4 for why
that matters.

```
tenants, users, memberships, roles, permissions
courses, sections, lessons, lesson_assets
enrollments, progress_events
quizzes, quiz_questions, quiz_attempts, quiz_answers
certificates, certificate_templates
subscriptions, orders, payouts
audit_log, xapi_statements
```

Two design decisions worth carrying into any related project:

**`progress_events` is append-only, enforced by a database trigger.** Nothing
ever updates or deletes a row. Completion, time-on-task, furthest video position
and resume point are all *derived by query*. This is why multi-session resume
works reliably, and why the watch-time analytics are trustworthy — the history
cannot be rewritten.

**`audit_log` is append-only and hash-chained** — each row hashes the previous
one, so a deleted or edited entry breaks the chain detectably. Every sensitive
mutation writes one. This is the evidence trail an accreditation or SOC 2 audit
asks for.

*Built ahead of need, currently unused:* `xapi_statements` (accreditation
reporting), `permissions` (granular roles), `payouts` (affiliates).

---

## 4. How tenancy works — the key architectural fact

**The system was built multi-tenant from day one, and Phase 1 runs it in
single-tenant mode.** This is the single most important thing to understand,
because it is what makes Phase 2 mostly configuration rather than a rewrite.

Every domain table has a `tenant_id`. Every query filters on it. The app resolves
which academy a request belongs to in one of two ways:

- **Subdomain** (multi-tenant shape): `acme.example.com/admin` → internally
  `/t/acme/admin`
- **Single-tenant mode**: a `DEFAULT_TENANT_SLUG` environment variable makes the
  bare domain serve one academy, so `training.structurebuild.co/admin` resolves
  without any subdomain

Middleware rewrites the request; the rest of the application is unaware of which
mode it is in. Unsetting one environment variable restores full subdomain
multi-tenancy.

### Security boundary — read this before extending anything

The Drizzle connection uses the database owner role and **deliberately bypasses
row-level security.** RLS policies exist and protect the Supabase-JS path, but
they do **not** constrain the application's own queries.

**The tenant filter in application code IS the isolation boundary.** There is no
safety net underneath a missing `tenant_id` in a `WHERE` clause. Consequences:

- Every admin action goes through a guard (`requireAdmin` / `requireAdminForSlug`)
  that resolves the caller's academy from a verified JWT claim — never from the
  URL or the form
- Every learner mutation re-checks that the enrollment belongs to the caller
  *and* their academy, then that the target lesson belongs to that enrollment's
  course
- Roles a tenant admin may assign are validated against an allowlist at runtime,
  because a TypeScript type on a Server Action parameter is erased and
  constrains nothing
- A set of **architectural fitness tests** read the source directly and fail CI
  if any of these guards is removed, even though the types would still compile

If you take one idea from this codebase into another project, take that last
one: when the compiler cannot enforce an invariant, write a test that reads the
source.

---

## 5. Phase 2 — multi-brand platform (NOT BUILT)

Phase 2 is opening the same system up so **other brands run their own branded
academies** on it — the LearnWorlds/Thinkific/Teachable category, aimed at
training companies, consultancies and academies delivering accredited learning.

### 5.1 What already exists in its favour

Phase 2 is not a rewrite. The following are already done:

- **Multi-tenant schema** — `tenant_id` on every domain table, enforced
- **Subdomain routing** — middleware maps `<slug>.<root>` to a tenant; works
  today, just not used
- **Per-tenant branding** — name, tagline, logo, primary colour, certificate
  template, all stored per tenant and applied to the storefront
- **Self-service tenant provisioning** — `/signup` creates an academy, its owner
  as admin, a default certificate template and audit rows, in one transaction
- **Roles and memberships** — a user can belong to several academies with
  different roles
- **Platform-admin surface** — `/platform` lists every academy and can suspend
  or reactivate one; suspension is enforced in the page shell *and* in every
  mutation guard
- **Stripe billing** — subscription checkout, customer portal, webhook handling
  for subscription lifecycle and refunds. Built, tested, gated off.

### 5.2 What Phase 2 actually requires

| Area | Work |
|---|---|
| **Flip the switch** | Unset `DEFAULT_TENANT_SLUG`; add a wildcard DNS record and certificate for `*.<root>` |
| **Consent on invitations** | An unsolicited invite currently creates a live membership. Needs a `pending_acceptance` state only the invitee can promote. Mandatory before untrusted admins exist — see §6 |
| **Billing activation** | Turn Stripe on, create the plans, enforce plan limits (active-learner caps), handle dunning and past-due degradation |
| **Tenant onboarding** | Guided setup, sample content, domain verification |
| **Custom domains** | Vercel Domains API, automatic SSL |
| **Per-tenant email identity** | Today all mail sends from one verified domain. Each brand needs its own verified sender, or mail is attributed to the platform |
| **Rate limiting** | None today. Unauthenticated endpoints (password reset, signup) need per-IP and per-address limits before public exposure |
| **Website builder** | The largest gated area, and the main reason customers choose LearnWorlds |
| **Commercial surface** | Offers, coupons, payment plans, affiliates, mass email |
| **Compliance** | SOC 2, GDPR subject-access and deletion endpoints, WCAG 2.1 AA audit |
| **Standards** | SCORM 1.2/2004 playback, xAPI emission into the existing `xapi_statements` table, LTI 1.3 |

### 5.3 Positioning if Phase 2 ships

Two differentiators are already structurally in place rather than aspirational:

- **No transaction fees on any plan.** LearnWorlds charges per sale on its entry
  tier.
- **Audit-grade evidence.** Append-only progress events, a hash-chained audit
  log, real watch-time rather than completion ticks, and verifiable credentials.
  The platform does not hold accreditations; it gives customers the evidence to
  earn their own (CPD, IACET, IOSH, NEBOSH).

---

## 6. Known gaps and honest caveats

Carried here so nobody inherits a false picture.

**Security — open**

- **Unsolicited invitations create live memberships.** Mitigated (an established
  membership can no longer be displaced by an injected one), but a brand-new
  account whose only membership is an unsolicited invite is still scoped to it.
  Blocking for Phase 2; low risk in Phase 1, where the only admin is the owner.
- **No rate limiting** anywhere. Password reset can be triggered repeatedly for a
  known address — a nuisance rather than a breach, since mail only ever goes to
  that address.

**Functional — Phase 1**

- **YouTube lessons record nothing.** Both providers render, but only Bunny
  reports watch time and resume position. The builder still offers a YouTube
  option, so an author can silently lose the evidence trail. Real content should
  be Bunny.
- **No cross-tenant admin.** A platform admin administers only their own academy;
  oversight of others is limited to `/platform`. This is deliberate — a
  half-working cross-tenant admin previously wrote to the wrong academy.
- **The audit log has no viewer.** Every mutation is recorded; reading it means
  querying the database. The "Activity Log" tab is gated.
- **No CSV or PDF export.** Needed for an accreditation submission, not for
  day-to-day training.
- **Video upload is by URL ingest**, not drag-and-drop from a laptop.

**Verification status**

- 116 unit tests, including architectural fitness tests, plus a Playwright live
  E2E suite covering signup → authoring → enrol → complete → quiz → certificate
  → verify.
- The live E2E suite requires credentials and is run by the account owner. Much
  of the recent verification was done by reading the database directly rather
  than by driving an authenticated browser session; treat "renders" and "works"
  as separate claims unless a test covers it.

---

## 7. Where things are

```
CLAUDE.md                     project guide and locked decisions — read first
ARCHITECTURE.md               architecture detail
DEPLOY.md                     deployment runbook, incl. single vs multi-tenant DNS
PLATFORM_OVERVIEW.md          this file

db/                           separate workspace package
  schema.ts                   all 22 tables
  migrations/                 append-only SQL; 0010 is the newest
  audit.ts                    hash-chained audit helper
  client.ts                   Drizzle client — NOTE: bypasses RLS

web/
  src/middleware.ts           tenant resolution + session refresh
  src/lib/host.ts             subdomain / single-tenant routing decision (pure, tested)
  src/lib/tenant.ts           the authorization guards
  src/lib/nav.ts              admin navigation: which items are live vs gated
  src/lib/progress-derive.ts  derives progress from appended events
  src/lib/video.ts            Bunny provider layer
  src/lib/email.ts            Resend templates
  src/app/                    29 routes
  tests/unit/                 116 tests, incl. *-conventions.test.ts fitness tests
  tests/live/                 Playwright E2E against a live environment
```

**Legacy note.** The repository root also contains a superseded Vite prototype
(`src/`, `supabase/`, `vite.config.ts`) on a different Supabase project. It is
not the product and its demo accounts do not work against the live system.
