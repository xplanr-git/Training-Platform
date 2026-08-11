# Training Platform — Production-Readiness Audit

**Date:** 2026-08-10 · **Last updated:** 2026-08-11 (resolution status added — see Resolution Log) · **Scope:** `web/` (Next.js 15 App Router) + `db/` (Drizzle schema/migrations). The retired root Vite prototype was excluded per CLAUDE.md.
**Method:** Full source review across five parallel deep-review tracks (security, performance/data-access, reliability, code quality/architecture, frontend/UX/accessibility); independent source confirmation of the top findings; a `tsc --noEmit` gate (passed clean); and hands-on browser testing of the live-config dev server for the routes that were serveable. No files were modified during the audit itself. No production data was created, edited, or deleted during the audit.

---

## Executive Summary

**This is a mature, unusually well-engineered codebase — not a prototype.** The discipline described in CLAUDE.md is genuinely implemented, and much of it is enforced by source-reading "fitness tests" that fail CI when an invariant regresses. The honest headline is that there are **no currently-exploitable Critical security holes and no crash-class Critical reliability defects.** That is a real and uncommon result for a pre-production audit, and it should be stated plainly.

| Dimension | Assessment |
|---|---|
| **Code quality** | Strong. Heavily commented with the *reason* each guard exists; consistent transaction+audit discipline; pure/testable cores split from IO. A few god-functions and duplication hotspots. |
| **UX quality** | Good and deliberate — empty/loading/error states are considered, accessibility is systemic (skip links, live regions, measured contrast, 44px targets). A handful of genuine friction/clarity gaps, one of them consequential (the role control). |
| **Performance** | Good instincts (query batching, pagination, `cache()` dedupe), but two real scale traps: an N+1 on the learner dashboard and missing indexes on the fastest-growing table. |
| **Reliability** | Very defensive; the classic races (reorder, watch-time, Stripe order) are already fixed with commentary. Remaining gaps cluster in the **completion/certificate lifecycle** and **display-trust**, not crashes. |
| **Security** | Hardened. Every RLS-bypassing Drizzle query is explicitly tenant/user-scoped; auth guards re-read role from the DB, not the JWT; the DB write surface is revoked at the Postgres level. |

**Biggest risks (all fixable, none catastrophic):**
1. A **refunded/cancelled learner keeps full course access and can still earn a verifiable certificate** — revenue leak + accreditation-integrity gap.
2. A **broken onboarding-email link in the paid-purchase and signup flows** in the single-tenant deployment (the live Outdure config) — a known-class bug reintroduced by copy-paste.
3. A **subscription-webhook type cast (`as never`)** that turns two real Stripe statuses into an infinite retry loop, leaving tenant billing entitlement stuck.
4. A **one-click, unconfirmed, label-shaped control that grants or revokes admin** in the People table.

**Biggest opportunities:** collapse the dashboard N+1 and add three indexes (large, cheap scale win); wire the certificate-enablement flag that already exists in the schema; replace the role-cycle control and the `window.confirm` pattern with the accessible dialog primitives the kit already ships; and add machine-checking of the tenant-scoping predicate to match the existing guard/audit fitness tests.

### Note on the testing environment (not a product defect)
The shared dev server on port 3010 (owned by another session) was serving a **corrupted `.next` build**: previously-compiled routes rendered their server HTML correctly (`/login`, `/signup`, `/login/forgot`, `/admin`, `/admin/courses` all returned real data), but freshly-requested routes 500'd (`/`, `/join`, `/admin/analytics`) and `_next/static` chunks 404'd with a `text/plain` MIME. A clean `tsc --noEmit` passed, and the code paths for the 500'ing routes are trivial and cannot throw — so this is a wedged dev process (most likely two `next dev` instances sharing one `.next`), **not** a code fault. Consequence for this audit: I could validate server-rendered content, data flow, routing, and auth-gating live, but not live styling, responsive behaviour, or client-side interactivity. Those dimensions were covered by code-level review instead, and are flagged as such. **Recommended ops action:** restart the dev server against a fresh `.next` and ensure only one instance runs per working tree.

---

## Resolution Log — updated 2026-08-11

Since this audit was written, the items below were fixed, verified through CI
(typecheck, lint, unit/fitness tests, production build, Playwright e2e **and**
authenticated live-journey suites — all green) and deployed to production from
`academy/main`. Commit hashes are in the Structurebuild/Outdure-Academy repo.

**All four "fix immediately" Highs — done (`0126eed`):**
- **H1** refund/cancelled access → access now requires enrollment status `active`/`completed`, enforced through one shared `ENROLLED_STATUSES` across `resolveCourseView`, the learn player's `verifyEnrollment`, and the storefront.
- **H2** broken onboarding emails → paid-purchase (Stripe webhook) and signup welcome emails build the link via `tenantOrigin()`; the duplicated inline origin is gone.
- **H3** subscription webhook `as never` → replaced with an exhaustive Stripe→enum map (`paused`/`incomplete_expired` handled), so those events can't wedge the webhook in a retry loop.
- **H4** People role control → replaced the click-through cycle with a direct dropdown; grant/revoke of Admin confirms first; the signed-in admin's own row and any `platform_admin` are read-only; `setMemberRole` also refuses a self role-change server-side.

**"Fix soon" → reliability batch — done:**
- **MR1** quiz "Passed" banner spoofable via URL (`cd093ab`) → rendered from the recorded `quiz_attempts` row; grade state removed from the URL.
- **MR2** `certificateEnabled`/template never read (`b569b75` + migration `0017`) → issuance is gated on the per-course flag and the chosen template is persisted; the course editor gained an opt-out toggle. Migration `0017` applied to production (all 77 courses backfilled to `true`, column default now `true`), a no-op for prior behaviour with no window where certificates stopped.
- **MR3** zero-lesson course strands learners (`cd093ab`) → `setCourseStatus` refuses to publish a course with no lessons.
- **MR4** completion vs certificate drift (`b6d7d30`) → completion logic extracted into an idempotent, learner-parameterised `finalizeCourseCompletion`; `deleteLesson` reconciles affected enrollments so a deletion self-heals the drift.

**Also fixed — surfaced by a live login incident, related to §4 #7 (sign-in rate limiting):**
- Password-manager auto-submit storm tripping Supabase's auth rate limit (`e884c35`) → client-side submit guard + escalating cooldown so an auto-submit can't flood sign-in.
- `refresh_token_not_found` login bounce (`69d4368`) → root cause was split-scope auth cookies (client host-only vs server domain-scoped); now deterministically host-only, plus a middleware self-heal that clears an unusable session so any already-broken browser recovers automatically on its next request.

**Still open from this report (tracked, not yet started):** the performance batch (learner-dashboard N+1, missing indexes on `progress_events`/`quiz_attempts`/`quiz_answers`/`certificates`, analytics query waves, jsonb over-fetch); the UX-polish items (AlertDialog confirmations vs `window.confirm`, `/admin/people` nav de-dup, type-aware lesson-editor fields); the code-quality/architecture items (machine-checked tenant scoping, `isTenantAdmin` status-filter drift, shared error codes, centralised jsonb types); and the Low-priority tier. The findings below are retained in full as the record; a **✅ RESOLVED** tag marks the ones now fixed.

---

## Critical Findings

**None identified.** No finding meets the bar of data loss, a currently-exploitable security breach, or an app-wide unusable state. The four items in "High Priority" below are the ones to fix before continued production use; they are serious but bounded, and each has a small-to-medium fix.

---

## High Priority Findings — *Fix immediately*

### H1 — ✅ RESOLVED (`0126eed`) — A refunded/cancelled learner retains full course access and can still earn a certificate
- **Issue:** Course access is decided purely by the *existence* of an `(user_id, course_id)` enrollment row. No access check anywhere filters on `enrollments.status`, so the `cancelled` state set on refund (and the `expired` state) grants exactly the same access as `active`.
- **Where:** `web/src/lib/course-access.ts:52-57` (`resolveCourseView`), `web/src/app/t/[slug]/learn/[courseSlug]/actions.ts:45-63` (`verifyEnrollment`), `web/src/app/t/[slug]/courses/[courseSlug]/page.tsx:100-106` (enrolled check). Refund sets `cancelled` at `web/src/app/api/webhooks/stripe/route.ts:241-244`; enum at `db/schema.ts:76-81`.
- **Why it matters:** A learner who buys a paid course, completes it, then gets a refund keeps watching, keeps completing lessons, passes quizzes, and is issued a **publicly-verifiable certificate**. For a paid, accreditation-positioned product this is both a revenue leak and a credential-integrity problem.
- **How to reproduce:** Enroll via purchase → refund in Stripe (fires `charge.refunded` → enrollment `cancelled`) → the learn player and course page still grant full access and completion.
- **Fix:** Filter to `status in ('active','completed')` in the three access checks above. Decide product-side whether a cancelled enrollment should also hide already-earned certificates.
- **Confirmed?** CONFIRMED (traced in source). **Priority:** High. **Effort:** Small.

### H2 — ✅ RESOLVED (`0126eed`) — Broken onboarding-email links in the paid-purchase and signup flows (single-tenant / live config)
- **Issue:** `host.ts` exposes `tenantOrigin(slug)` precisely because in single-tenant mode (the live `DEFAULT_TENANT_SLUG=outdure` deployment) the multi-tenant `slug.rootdomain` host exists in neither DNS nor the TLS cert. Two call sites reimplement the origin inline as `https://${slug}.${root}` and get single-tenant mode wrong.
- **Where:** `web/src/app/api/webhooks/stripe/route.ts:163-166` (paid-purchase "Start learning" email) and `web/src/app/signup/actions.ts:138-141` (welcome email). Canonical helper: `web/src/lib/host.ts:42-46`. The **free** enrollment path already uses `tenantOrigin` correctly (`courses/[courseSlug]/actions.ts:74`).
- **Why it matters:** The same enrollment email is correct on the free path and broken on the paid path — a paying customer's "Start learning" link points at a host the browser can't resolve. `host.ts:37-46` documents that this exact failure already broke this link once.
- **Fix:** Replace both inline blocks with `tenantOrigin(slug)`. Add a grep-style fitness test forbidding inline `${slug}.${root}` / `.startsWith('localhost')` origin construction outside `host.ts` (matches the repo's existing convention-test style).
- **Confirmed?** CONFIRMED. **Priority:** High. **Effort:** Small (~15 min).

### H3 — ✅ RESOLVED (`0126eed`) — Subscription webhook casts Stripe status with `as never`; two real statuses cause an infinite retry loop
- **Issue:** `sub.status as never` writes Stripe's status union straight into the `subscription_status` pg enum. Stripe also emits `paused` and `incomplete_expired`, which the enum rejects → the `UPDATE` throws → the handler returns 500 → Stripe retries the event indefinitely, and the subscription row (which decides whether the tenant may trade) never updates.
- **Where:** `web/src/app/api/webhooks/stripe/route.ts:67`; enum at `db/schema.ts:98-105`.
- **Why it matters:** A tenant can get stuck in the wrong entitlement state (e.g. still "active" after a pause, or unable to be updated), and the webhook endpoint accumulates a permanently-failing event. `as never` removes the one compile-time signal that would have caught the mismatch.
- **Fix:** Replace the cast with an explicit `mapStripeSubscriptionStatus()` (exhaustive switch, documented fallback for unmapped states), or extend the enum via a new migration. Do not cast.
- **Confirmed?** CONFIRMED. **Priority:** High. **Effort:** Small.

### H4 — ✅ RESOLVED (`0126eed`) — People "Role" control grants/revokes admin on one unconfirmed, label-shaped click
- **Issue:** The Role cell is a ghost `Button` that renders the role label and, on click, immediately advances the role (`learner → instructor → company_admin → learner`) via a `quiet` NavForm with **no** confirmation. It looks like a status label, not a control. A `platform_admin` member falls into the `else` branch and is demoted to `learner` in one click.
- **Where:** `web/src/app/t/[slug]/admin/people/page.tsx:206-222` and `nextRole()` at `:313-317`. Contrast: the Deactivate control immediately to its right *does* carry `confirm=` (`:265-274`), and the invite form already offers a proper role `<select>`.
- **Why it matters:** Granting/revoking admin is the most consequential action in a tenant, yet it is the only consequential action on the page with no confirmation and no visible affordance that clicking mutates state. Cycling also means you can't set a role directly, and one accidental click silently changes privilege.
- **How to reproduce:** Open Admin → People, click a member's role label — the role changes with no prompt.
- **Fix:** Replace the cycle button with a role `<select>` posting on change (mirroring the invite form), and add `confirm=` on any elevation to `company_admin`. Minimum viable: add a confirmation to the existing control.
- **Confirmed?** CONFIRMED (traced). **Priority:** High. **Effort:** Small–Medium.

---

## Medium Priority Findings — *Fix soon*

### Performance & data access
- **MP1 — Learner dashboard N+1 (`1 + 2N` queries), amplified by the connection pool.** `dashboard/page.tsx:53-66` maps `getCourseProgress` over every enrollment; each call (`lib/progress.ts:14-28`) runs two queries. With the Drizzle pool at `max: 5` against Sydney (`db/client.ts`), a learner in 10 courses issues ~21 queries in ~5 serial round-trip waves, and concurrent learners contend for the same 5 slots. **Fix:** replace the loop with two set-based queries (completed-count per enrollment; lesson-count per course) and derive in memory — collapses to ~3 flat queries. CONFIRMED. Effort: Small–Medium.
- **MP2 — No index on `progress_events` for the analytics filters.** The table grows fastest of any (one row per ~15s of video watched), yet the analytics queries (`admin/analytics/page.tsx:70-73`, `:94-107`) filter `tenant_id`/`event_type`/`occurred_at` with only `enrollment_id` and `lesson_id` indexed (`db/schema.ts:339-342`) → full seq scans on every Insights load. Because the live deployment is single-tenant, a bare `tenant_id` index gives no selectivity — index `(tenant_id, event_type, lesson_id)` and `(tenant_id, occurred_at)`. Longer term, precompute per-lesson watch rollups. CONFIRMED. Effort: Small (indexes) → Medium (rollup).
- **MP3 — Missing `tenant_id` indexes on `quiz_attempts`, `quiz_answers`, `certificates`.** All three back admin list/analytics pages that filter `tenant_id`; `quiz_answers` has no index beyond its PK. Add `(tenant_id)` (and `(tenant_id, question_id)` / `(tenant_id, passed)`). CONFIRMED. Effort: Small.
- **MP4 — Over-fetching the `content` jsonb on learner lesson-list reads.** `learn/[courseSlug]/page.tsx:52` and `.../[lessonId]/page.tsx:88` do `db.select().from(lessons)` pulling every lesson's `content` (lesson bodies) when only the outline fields — and the *current* lesson's content — are needed. Project columns; fetch the current lesson's `content` separately. The builder legitimately needs full content — leave it. CONFIRMED. Effort: Small.
- **MP5 — Analytics runs 4 sequential DB waves.** `admin/analytics/page.tsx` awaits counts, then `active`, then `friction`, then `watch` separately though they're independent → 3 avoidable serial round trips. Fold into one `Promise.all`. CONFIRMED. Effort: Trivial.

*(All index additions belong in a new append-only migration `db/migrations/0017_*.sql` per CLAUDE.md §7.3.)*

### Reliability & correctness
- **MR1 — ✅ RESOLVED (`cd093ab`) — Quiz "Passed" banner is driven by URL query params, not the recorded attempt.** `learn/.../[lessonId]/page.tsx:62,329-339` renders "You scored 100%. Passed." from `?score=&passed=`. Actual completion and certificate issuance are server-authoritative (derived from `progress_events` + server-side grading), so this grants no real pass — but a learner can screenshot a spoofed "Passed" banner, which for an audit-grade-evidence product is a trust/integrity defect. Render the banner from the persisted `quiz_attempts` row instead. CONFIRMED (independently). Effort: Small.
- **MR2 — ✅ RESOLVED (`b569b75` + migration `0017`) — `certificateEnabled` / `certificateTemplateId` are never read.** The schema carries both (`db/schema.ts:197-198`, default `false`) but no code references them (grep: zero matches). Every completion issues a certificate regardless of the admin's setting, and the chosen template is ignored (`templateId` inserted null). Gate the cert insert on `course.certificateEnabled` and persist the template id — or, if always-on is intended for MVP, delete the misleading flags. CONFIRMED. Effort: Small.
- **MR3 — ✅ RESOLVED (`cd093ab`) — A zero-lesson course can be published and permanently strands learners.** `setCourseStatus` (`admin/courses/actions.ts:143-217`) validates quizzes but never requires ≥1 lesson; `deriveProgress` makes `isComplete` unreachable when `total === 0`. A learner enrolls, sees "0 of 0 lessons", and can never complete or earn a certificate. Refuse to publish a course with no lessons. CONFIRMED. Effort: Small.
- **MR4 — ✅ RESOLVED (`b6d7d30`) — Completion can reach 100% with no certificate/enrollment-completed (derived vs materialised drift).** Enrollment `completed` + certificate are written *only* inside `recordLessonCompleted`, triggered by a completion action. If an admin deletes the last incomplete lesson, `done >= total` becomes true, the UI shows the completion card (`learn/[courseSlug]/page.tsx:125`), but no completion event fired — so no certificate exists and the card shows a null verification code. Reconcile on read (issue idempotently when `isComplete && status != 'completed'`) or re-check after lesson deletion. CONFIRMED. Effort: Medium.
- **MR5 — Stripe webhook fulfils without checking `payment_status === 'paid'`.** `api/webhooks/stripe/route.ts:36-44,104-146` enrolls on `checkout.session.completed` without confirming funds settled. Signature verification and payment-intent idempotency are both correct, so this is nil-risk for card-only checkout but real if any async/delayed payment method is ever enabled. Gate on `payment_status`, or fulfil on `checkout.session.async_payment_succeeded`. CONFIRMED (absence) / POTENTIAL (exploitability). Effort: Small.
- **MR6 — Paid purchase with an undelivered webhook leaves the buyer charged but not enrolled, with no in-app reconciliation.** `startCoursePurchase` redirects to `/learn/...` immediately; the order+enrollment are written only by the webhook. Add success-page session reconciliation (`session_id` in `success_url`) and monitor webhook failures. CONFIRMED (design gap) / POTENTIAL in practice. Effort: Medium.

### UX & accessibility
- **MU1 — All destructive confirmations use native `window.confirm`; the built accessible `AlertDialog` is unused.** `nav-form.tsx:83` + ~9 call sites. Beyond being off-brand and not theme-aware, repeated dialogs trigger the browser's "prevent this page from creating additional dialogs" — after which every confirm silently returns `false`, the action never fires, and because these forms are `quiet` there is **zero feedback** (reads as "delete is broken"). Wire the existing `components/ui/alert-dialog.tsx` into NavForm's confirm path. Effort: Medium.
- **MU2 — `/admin/people` is linked twice and shows up under three names.** `nav.ts:68` ("All Users") and `:132` ("Team Management") both point at `/people`, while the page is titled "People". The active-state logic then sets `aria-current="page"` on two links and highlights both. Remove the duplicate (or repoint it) and align labels. Effort: Small.
- **MU3 — Lesson editor shows fields that don't apply to the selected type.** `builder/page.tsx:228-266,338-364` renders a "Text body" *and* a "PDF URL" input for every non-quiz lesson, server-rendered so changing the type reveals nothing — an author can type into the wrong box (the very failure `quiz-answer-fields.tsx` was rewritten to remove). Make these small client fields that reveal only the control matching the chosen type. Effort: Medium.
- **MU4 — The admin nav is ~85% "Soon", and gated items navigate to a dead-end page.** Of ~42 items only 6 are live; a gated click is a full navigation to `/admin/coming-soon` requiring Back to recover, and gated items look nearly identical to live ones. This is a documented product/sales decision, flagged not faulted — consider rendering the "soon" panel inline (non-navigating) or receding gated items further so the working surface reads clearly. Effort: Small–Medium.

### Code quality & architecture (maintainability)
- **MC1 — Tenant-scoping predicate isn't machine-checked, unlike the guard and audit.** `authz-conventions.test.ts` and `audit-coverage-conventions.test.ts` fail CI on a dropped role guard or un-audited mutation — excellent — but a query that omits `.where(eq(x.tenantId, ...))` would still pass both. Since the `db` client bypasses RLS, this manual predicate is the whole tenant boundary. Add a source-test flagging `from(<domain table>)` without a tenant predicate, or a thin tenant-scoped query wrapper. Effort: Medium.
- **MC2 — `isTenantAdmin` uses a `{active}`-only status filter while every sibling helper uses `{active, invited}`.** `course-access.ts:27-39` vs `tenant.ts:94,248` / `login/actions.ts:37`. By `tenant.ts`'s own documented logic (nothing flips invited→active on a subdomain), this denies a freshly-invited admin the read-only course preview. Extract one shared `membershipRole(userId, tenantId, statuses)` helper and align. Effort: Small–Medium.
- **MC3 — Client error copy is coupled to magic thrown-string literals.** `nav-form.tsx:23-48` substring-matches `'UNAUTHENTICATED'`, `'FORBIDDEN'`, `'Enrollment not found'`, etc., thrown as bare strings in `tenant.ts`/`learn actions`. Rename a string → the user-facing mapping silently degrades to the generic fallback, with no type error or test failure. Introduce shared error codes imported by both thrower and matcher. Effort: Small–Medium.
- **MC4 — jsonb shapes are cast independently in many places (drift risk).** `quiz.settings`, `q.correct`/`q.options`, `branding` are `as`-asserted across several files with no single definition; if a shape drifts, TS won't catch it. Define `QuizSettings`/`QuizContent`/`Branding` once and parse through them (the `video-source.ts` typed-read-with-runtime-guard pattern is the model). Effort: Medium.
- **MC5 — `recordLessonCompleted` is a ~120-line god-function** (`learn actions:90-209`) doing event-append + progress derivation + meta fetch + tier advancement + a multi-write transaction + email. Correct today, but it's where all future certificate work (templates, revocation, VC signing) will land. Extract `issueCertificate(tx, …)` and `advanceMembershipTier(tx, …)`. Effort: Medium. Not urgent.

---

## Low Priority Findings — *Good improvements / Nice to have*

**Reliability**
- `enrollFree` double-submit races the unique constraint and surfaces a generic error though the learner *is* enrolled — use `.onConflictDoNothing()` and always return the redirect (the webhook path already does this). `courses/[courseSlug]/actions.ts:40-66`.
- `uniqueCourseSlug` is computed outside the insert transaction (TOCTOU) → concurrent same-title creates hit a generic unique-violation instead of auto-suffixing. `admin/courses/actions.ts:28-56`.
- Quiz pass threshold can be set to 0% → passes unconditionally and (per MR2) issues a certificate. Floor at 1. `builder/quiz/actions.ts:73`.
- Quiz `maxAttempts` cap is check-then-act (TOCTOU) → a race can overshoot by a few; bounded by the rate limiter. `learn actions:356-370`.
- No unique constraint on `certificates.enrollmentId` — duplicate-cert prevention is currently safe *only* as an emergent property of the enrollment row-lock ordering. Add `unique(enrollmentId)` + `onConflictDoNothing` to make it a DB guarantee. `db/schema.ts:450`.
- `courses.title` has no server-side length cap (unbounded `text` insert).

**Security (defense-in-depth; none currently exploitable)**
- `env.ts` co-locates secret accessors (`serviceRoleKey`, `stripeSecretKey`) with client-safe ones and can't be `server-only` (it's imported by the client Supabase module). Values don't leak today (Next only inlines `NEXT_PUBLIC_*`), but a future refactor calling a secret accessor from a shared module wouldn't be caught. Split into `env.client.ts` / `env.server.ts`. `lib/env.ts`.
- Enum-typed Server Action params (`setTenantStatus` status, builder lesson `type`) aren't runtime-validated — they fail closed at the pg enum (500) rather than cleanly. Add allowlist parsers like `validation.ts` already uses elsewhere. `platform/actions.ts:13`, `builder/actions.ts:350,367`.
- Webhook replay with a null `payment_intent` can insert a duplicate order + re-send a receipt (idempotency guard is inside `if (paymentIntent)`); enrollment stays idempotent. Fall back to `session.id`, or dedupe on `event.id`. `stripe/route.ts:110-121`.
- `markLessonComplete` issues completions (and, on the final lesson, a certificate) for non-quiz lessons with no proof-of-engagement (watch-time/dwell). Likely intentional for self-paced learning; worth an explicit product decision given the accreditation positioning. `learn actions:265-296`.
- Audit coverage is enforced per-*file*, not per-*mutation*: the purchase and refund enrollment writes are audited as `order.*`, so an auditor querying `audit_log` by `resource_type='enrollment'` misses every *purchased* enrollment (the free path does emit `enrollment.create`). `stripe/route.ts:133-146,241-253`.
- `/join` lets an unauthenticated caller create a `pending` membership in a victim's name (surfaces name+email to that academy's admin). Grants nothing, sends no mail, rate-limited — nuisance only.

**Code quality**
- `moveSection` / `moveLesson` are ~50 near-identical concurrency-critical lines — extract `swapAdjacentPosition(...)`. `builder/actions.ts:408-515`.
- Three ad-hoc Server Action return shapes (`{redirectTo}`, void+throw, `ActionResult`) with no shared type — document/define one. 
- `audit_log.ip` / `user_agent` are modelled (and folded into the hash by migration 0015) but never populated — wire them from `headers()` or drop the fields.
- `_courseId` unused params on `markLessonComplete`/`submitQuizAttempt` (course is correctly derived from the enrollment) — drop them. `attachVideo` inlines `revalidatePath` while the file has a `revalidateBuilder` helper. Stray `\ Read-only…` comment typo at `learn/.../[lessonId]/page.tsx:77`.

**UX / accessibility**
- `text-faint` references an undefined token (`--color-faint`) → the video id renders full-ink instead of faint. `attached-video.tsx:84`.
- Verification code is sans+tabular on `/verify` but `font-mono` in `CourseComplete` — pick one.
- Preview/draft/quiz-result banners use raw `bg-amber-50`/`text-green-800` palette classes instead of the contrast-tested `--color-status-*` tokens the rest of the app uses.
- "Manage billing" uses a raw `<button>` instead of the `Button` primitive (no 44px target/disabled semantics). `settings/billing/page.tsx:50`.
- Analytics has no top-level empty state — a new academy sees a grid of zeros. Add "No activity yet" when `totalEnr === 0`.
- On mobile the action-bearing tables (People, Certificates) scroll horizontally with the **Actions** column pushed off-screen first — consider a stacked/card layout or a frozen actions column at small breakpoints.
- Certificate template editor has no preview (not even a colour swatch, unlike Settings).
- Decorative lucide icons are inconsistently `aria-hidden` (brand marks / some button icons aren't).

**Performance**
- `posthog-js` (~50–60 KB gz) ships in the shared client bundle on every route via the root layout; lazy-`import()` it inside the effect behind the key check. `posthog-provider.tsx`.
- Public course/storefront pages are fully dynamic (no ISR) though CLAUDE.md targets ISR for course landings — low priority for the internal deployment.
- The slug→tenant lookup in `requireAdminForSlug` isn't `cache()`-wrapped, so the same row is fetched ~3–4× per admin navigation (the auth lookups *are* deduped — well done). `tenant.ts:184-188`.

**Already-documented open items (not re-litigated; state confirmed accurate):** sign-in rate limiting (browser→Supabase, can't be limited from app code), GDPR Article 17 erasure, CSP `unsafe-inline`/`unsafe-eval`, no Activity Log reader UI for `audit_log`, and the legacy prototype's committed anon key needing rotation. See CLAUDE.md §4.

---

## UX Journey Review

### First-time visitor / marketing
- **Overall:** Minimal, clean single-screen landing (Sign in + Request access).
- **Works well:** On-brand primary/secondary buttons, 44px tap targets, `/join` link correctly shown only in single-tenant mode.
- **Confusion / friction:** `/signup` ("Create your academy") is reachable by direct URL but not linked from the front door, and it exposes full **multi-tenant provisioning** (with a `.rootdomain` subdomain field) on what is deployed as a single-tenant internal academy — likely unintended surface for the Outdure deployment.
- **Recommend:** Decide whether public self-serve academy creation should exist on this deployment; if not, gate `/signup` behind config (it already keys off `DEFAULT_TENANT_SLUG` for `/join`).

### Sign in / forgot password / set password
- **Overall:** Clean, correctly labelled forms; enumeration-safe reset.
- **Works well:** Proper `<label>`s, forgot link, "Back to sign in", friendly translation of Supabase rate-limit errors.
- **Confusion / friction:** Sign-in itself isn't rate-limited by the app (documented limitation — the call goes browser→Supabase). Not fixable from here without proxying auth.

### Sign up (create academy)
- **Overall:** Complete provisioning form with good affordances ("14-day free trial. No card required.", "At least 8 characters.").
- **Where users may get confused / friction:** The welcome-email "start" link is broken in single-tenant mode (**H2**).
- **Recommend:** Fix H2; reconsider exposure per the marketing note above.

### Join / request access
- **Overall:** Correctly rewritten to the tenant, gated on admin approval (`pending` grants nothing by construction — a nice invariant).
- **Friction:** Account-existence enumeration nuisance (Low).

### Learner dashboard
- **Overall:** Strong. Good empty state with a create CTA, resume/continue/review CTAs derived from real progress, "about N min left" with correct partial-estimate hedging.
- **Works well:** Completion derived from the append-only log (adding a lesson re-opens a finished course without invalidating the earned cert — thoughtful).
- **Friction / perf:** The N+1 (**MP1**) is the main risk as enrollments grow.

### Course landing & enrolment
- **Overall:** Good; draft courses 404 for non-admins (doesn't confirm existence), queries batched.
- **Where users may get confused:** A refunded learner still sees full access (**H1**); a rapid double-click on Enrol shows a generic error though enrolment succeeded (Low, MR-adjacent).

### Learn player (video / pdf / text / quiz)
- **Overall:** The strongest surface. Watch-time can't be inflated by seeking; resume can't move backward; quizzes are server-graded, rate-limited and attempt-capped; preview mode records nothing.
- **Where users may get confused:** Spoofable "Passed" banner (**MR1**); a zero-lesson course strands the learner (**MR3**); completion-vs-certificate drift after lesson deletion (**MR4**).

### Admin — courses & builder
- **Overall:** Renders real data; Archive/delete actions carry confirmations.
- **Friction:** Type-irrelevant lesson fields (**MU3**); `window.confirm` foot-gun (**MU1**).

### Admin — people
- **Overall:** Good table with proper empty states (distinguishes "no one yet" from "no search match").
- **Consequential issue:** The role control (**H4**) and the nav duplication / three-names problem (**MU2**).

### Admin — analytics / certificates / settings
- **Overall:** Functional; certificate revoke is confirmed; verify page leaks no PII.
- **Friction:** No top-level analytics empty state (Low); no certificate-template preview (Low); analytics query waves (**MP5**) and missing indexes (**MP2/MP3**).

### Platform admin (cross-tenant)
- **Overall:** Correctly gated behind a DB-backed `platform_admin` membership check (not the JWT claim); suspend/unsuspend audited with Stripe as a null actor. Solid.

### Certificate verification (public)
- **Overall:** Exemplary — looked up by 128-bit random code, exposes only name/course/tenant/dates (never the learner email in the stored credential), clear revoked/valid states.

---

## What Is Done Genuinely Well (verified, not assumed)

1. **Source-level architectural fitness tests (~44).** `authz-conventions`, `audit-coverage-conventions`, `video-cache-conventions`, `status-tone-conventions`, etc. encode *why* an invariant exists and fail CI on regressions types can't catch. For a service-role/RLS-bypass app this is exactly the right defence and is rare to see done this thoroughly.
2. **DB-not-JWT authorization, everywhere.** Every guard re-reads the current role from `memberships`, closing the up-to-an-hour stale-claim window; `requireAdminForSlug` deliberately has no platform-admin bypass and returns 404 (not 403) on mismatch; migration `0014` revokes the entire `authenticated` write surface (with a column-level revoke on quiz answer keys) so the anon-key PostgREST path can't self-promote.
3. **Reliability primitives already in place.** `FOR UPDATE` on reorder swaps; append-only hash-chained audit + progress with concurrency-safe per-tenant sequencing; watch-time integrity (forward-only real-time deltas, server clamp, `max(position)` resume); server-authoritative grading with attempt caps + rate limits; best-effort emails sent only after commit so they never roll back a membership or certificate.
4. **Accessibility is systemic, not sprinkled.** Skip link, a dedicated focus-ring colour, sr-only live regions for otherwise-silent actions, `StatusBadge` encoding state as dot+label (never colour alone), tap targets pinned by tests, and contrast measured against each element's own background with rationale in `globals.css`. The `NavForm` pattern (an inert `<fieldset>` during submit) prevents double-submit across an arbitrary child tree.
5. **The video layer decomposition** (`video.ts` / `video-source.ts` / `video-availability.ts`) — a pure, unit-testable `resolveVideoSource` split from the React-`cache`-bound provider — is the model the jsonb-typing cleanup (MC4) should follow.

---

## Prioritized Improvement Plan

A practical sequence, not a flat list. Each stage is independently shippable.

### Stage 1 — Fix before continued production use (days)
1. **H1** refund/cancelled access filter — closes a live revenue + credential-integrity gap. *(Small)*
2. **H2** replace inline origins with `tenantOrigin()` + add the fitness test — fixes a broken paid-onboarding link in the live config. *(Small)*
3. **H3** map Stripe subscription status instead of `as never` — stops a possible infinite-retry billing wedge. *(Small)*
4. **H4** replace the People role-cycle with a confirmed `<select>` — removes a one-click privilege foot-gun. *(Small–Medium)*
5. **Ops:** restart the wedged dev server on a clean `.next`; ensure one `next dev` per tree. *(Trivial)*

*Expected benefit: closes every "someone loses money, access, or a credential's meaning" path currently open.*

### Stage 2 — High-value reliability + scale (1–2 weeks)
6. **MP1 + MP2 + MP3 + MP5** — dashboard N+1 rewrite and migration `0017` with the missing indexes; fold the analytics waves. *(Small–Medium total)*
7. **MR2** wire `certificateEnabled`/`certificateTemplateId` (or delete the dead flags); **MR3** block publishing a zero-lesson course; **MR1** render the quiz banner from the persisted attempt. *(Small each)*
8. **MR4** reconcile completion-vs-certificate on read; **MR5/MR6** payment-status gate + success-page reconciliation if any async payment or higher volume is planned. *(Medium)*

*Expected benefit: the product scales past a handful of learners without seq-scan cliffs, and the completion/certificate lifecycle stops producing "complete but no certificate" and "certificate that shouldn't exist" states.*

### Stage 3 — UX polish + maintainability (1–2 weeks, parallelizable)
9. **MU1** wire the existing `AlertDialog` into NavForm; **MU2** de-duplicate the People nav; **MU3** type-aware lesson fields; **MU4** reconsider the "Soon" dead-ends. *(Small–Medium)*
10. **MC1** machine-check the tenant-scoping predicate; **MC2** unify the membership-role helpers; **MC3** shared error codes; **MC4** centralize jsonb types; **MC5** decompose `recordLessonCompleted`. *(Medium total)*
11. The Low-priority a11y/token cleanups (undefined `text-faint`, status-token banners, raw buttons, mobile action-column layout, decorative `aria-hidden`).

*Expected benefit: removes the highest-consequence UX confusion, and closes the maintainability gaps most likely to let a future change silently reintroduce a tenant-isolation or error-copy regression.*

### Stage 4 — Defense-in-depth & documented backlog (as capacity allows)
12. Security hardening: split `env.client/server`, validate enum params at the boundary, webhook `event.id` dedupe, per-mutation audit coverage for purchased enrollments.
13. The Low reliability items (enrollFree `onConflictDoNothing`, slug TOCTOU, threshold floor, cert unique constraint, title length cap).
14. The CLAUDE.md-tracked items (GDPR erasure, CSP nonces, Activity Log reader UI, legacy anon-key rotation) on their existing owner-decision timelines.

---

*Prepared as a non-destructive review. No source files, migrations, or production data were modified.*
