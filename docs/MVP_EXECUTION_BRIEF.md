# MVP Execution Brief — Training Platform

**Audience:** the implementation model/engineer executing the work (and the founder tracking it).
**Authority:** implementation decisions below are made and locked by the auditing senior engineer. Do not re-litigate them; escalate only if a decision is technically impossible.
**Governing doc:** [CLAUDE.md](../CLAUDE.md) — its locked decisions (§1) and operating rules (§7) apply to every task here. This brief operationalizes CLAUDE.md into an executable task list.
**Audit date:** 2026-07-03. Audited: `src/app/App.tsx` router, all 42 components (~41,000 lines), both edge functions (28 routes each), all 9 migrations, utils, tooling.

---

## 1. Executive summary

The codebase is a high-fidelity Figma-Make prototype. The UI surface is enormous (73 sidebar destinations, 18 top-level page states) but the working core is thin: auth, course CRUD, and the course builder persist to real tables; roughly 75% of everything else renders mock arrays or writes to a schemaless JSONB key-value table (`kv_store_d60f2898`) that migration 009 opened to **full read/write by any authenticated user** — meaning every tenant can read and overwrite every other tenant's tags, groups, leads, segments, and user records.

**MVP definition (locked):** CLAUDE.md Phase 0 + Phase 1 — ten friendly beta tenants running real courses end-to-end: tenant signup → author a course (video/PDF/quiz) → publish → learner enrolls (free or Stripe-paid) → watches with tracked progress → passes quiz → receives verifiable certificate → tenant sees real analytics. Everything else on the sidebar ships as visible-but-gated or is removed.

**Estimate to MVP: 60–75 focused dev-days.**
- 1 senior engineer driving an AI implementation model full-time: **9–11 calendar weeks**
- 2 engineers (or 1 engineer running parallel agent tracks): **6–8 calendar weeks**
Confidence: medium-high for Phases A–D, medium for E (billing/webhooks always eat buffer). A 15% buffer is already included. See §8 for the breakdown.

---

## 2. Complete route map

### 2.1 Top-level page states (`App.tsx` state router)

Status legend: **LIVE** = real persistence · **PARTIAL** = some real reads/writes, core loop broken · **MOCK** = renders static data, no persistence · **STUB** = UI shell, handlers are no-ops · **DEAD** = unreachable.

| # | State | Component | Status | What actually happens today | Required for MVP |
|---|-------|-----------|--------|------------------------------|------------------|
| 1 | `?seed=1` | SeedAccountsPage | LIVE | Bulk-creates demo auth users | Keep as dev-only route, exclude from prod build |
| 2 | `home` | HomePage (831 ln) | PARTIAL | Renders 12 mock courses merged with live `courses` rows for selected company | Becomes tenant storefront `/ (subdomain)`; delete mock merge; server-render from DB |
| 3 | `course-detail` | CourseDetailPage | MOCK | Modules/lessons come from mock `courses.ts`; Enroll button mutates React state only | Real course page reading `sections`/`lessons`; enroll writes `enrollments` row (+ Stripe checkout if priced) |
| 4 | `learn` | LearningPage (491 ln) | STUB | YouTube iframe; `onLessonComplete` updates in-memory state, lost on refresh | Rebuild: Mux player, `progress_events` writes, resume position, completion detection |
| 5 | `dashboard` | DashboardPage (1,660 ln) | MOCK | Profile edits, reviews, messages, settings all local state / localStorage | Wire profile to `users`, enrollments to `enrollments` + progress view; cut reviews/messages tabs from MVP |
| 6 | `login` | LoginPage | LIVE | Real Supabase Auth via `auth.ts` | Keep; add rate limiting; remove admin-setup link |
| 7 | `signup` | SignupPage | LIVE | Real signup; new users become `company_admin` | Rework into tenant-provisioning flow (creates `tenants` + `memberships` rows) |
| 8 | `admin-setup` | AdminSetupPage | LIVE | Self-service creation of admin accounts — **anyone can create one** | **Delete** (security hole; superseded by seeding) |
| 9 | `admin` | PlatformAdminDashboard | PARTIAL | Reads all `profiles`, aggregates by company text field | Rewrite queries on `tenants`/`memberships` |
| 10 | `manage-admins` | ManageAdminsPage | PARTIAL | Calls edge-function `/admin/*` routes that have **zero auth** | Rebuild on `memberships` with role guard |
| 11 | `roles-permissions` | RolesPermissionsPage | MOCK | Role toggles are local state | Defer full RBAC editor; hardcode 3 system roles (platform_admin, company_admin, learner) for MVP |
| 12 | `admin-courses` | AdminCoursesPage (2,293 ln) | LIVE | Real course CRUD against `courses` | Keep; port to new schema + audit log |
| 13 | `user-management` | UserManagementPage (1,926 ln) | PARTIAL | Renders 45 mock users; adds/deletes go to the KV store | Rebuild on `memberships` (list/invite/deactivate); delete mockUsers |
| 14 | `admin-analytics` | AdminAnalyticsPage (5,160 ln) | MOCK | Charts render hardcoded data; "segments" persist to KV | MVP: 4 real queries (enrollments, completions, active learners, quiz pass rate) from `progress_events`; gate the other 7 analytics sub-views |
| 15 | `admin-settings` | AdminSettingsPage (2,292 ln) | PARTIAL | Some settings persist; most are local state | Keep tenant profile + branding sections wired to `tenants`; gate the rest |
| 16 | `admin-communications` | AdminCommunicationsPage (5,654 ln) | MOCK | 6 hardcoded inbox messages; composer/templates never send | **Gate entirely.** MVP email = Resend transactional only (Task E9) |
| 17 | `company-admin` | shell → ~60 sub-pages | mixed | See 2.2 | See 2.2 |
| 18 | `courses`, `company-subscribers` | — | DEAD | Declared in the `Page` union / `isAdminPage` list but never rendered | Delete states + dead imports (6 Website*Page imports in App.tsx are also unused) |

### 2.2 Company-admin sub-pages (73 sidebar ids)

| Sidebar group | Sub-pages | Component | Status | MVP disposition |
|---|---|---|---|---|
| Courses | all-courses, add-course, manage-courses, course-catalog | AdminCoursesPage / CourseBuilderPage | **LIVE** — the strongest area; persists to `courses`/`course_sections`/`course_activities`, uploads to Storage, player-settings via edge fn | **Core MVP.** Port to v2 schema (`sections`/`lessons`/`lesson_assets`), swap YouTube for Mux, add quiz builder |
| Courses (assess) | gradebook, activity-matrix, question-banks, review-center, programs-subscription | inside AdminCoursesPage | MOCK | question-banks → part of quiz builder (MVP). Others: gate |
| Courses (certs) | certificates | inside AdminCoursesPage | MOCK | **MVP** — template designer minimal (logo + text), issuance real |
| Website | website-builder, website-pages | WebsiteBuilder (6,073 ln) | PARTIAL — dual-writes `website_config` table AND edge-fn KV | **Freeze.** Not MVP acceptance. Keep table write, delete KV path. Tenant storefront = themed catalog page instead |
| Website | website-settings | WebsiteSettingsPage | PARTIAL (`website_settings` table) | Keep branding/domain fields; wire to `tenants` |
| Website (dead) | blog, popups, funnels, navigation, design-explorer/template | 5 components, ~9,600 ln | STUB, mostly unreachable | Gate/park; do not migrate to Next.js in MVP |
| Users | all-users, add-user, user-roles, approvals, user-activity | UserManagementPage / ApprovalsPage | PARTIAL (KV) | all-users/add-user → **MVP** on `memberships`. approvals/user-activity: gate |
| Users (aux) | leads, user-groups, multiple-seats, tags, user-fields, automations | 5 pages, all KV-backed | PARTIAL (KV) | **Gate all.** KV table gets locked down then dropped |
| Communications | 9 sub-pages | AdminCommunicationsPage | MOCK | Gate (see row 16 above) |
| E-commerce | offers, gifts, licenses, custom-deals, payments, plans, cart-checkout | ComingSoonPage | STUB (already gated) | Replace `plans`/`payments` with real Stripe billing page (MVP); rest stays gated |
| Marketing | affiliate-program, marketing-forms, qualification-forms, nps | ComingSoonPage | STUB | Stays gated (Phase 3) |
| Analytics | overview-analytics, system-health, ai-insights, training-matrix, product-insights, scheduled-reports, report-log, activity-log | AdminAnalyticsPage | MOCK | overview-analytics → **MVP** (real queries). ai-insights violates CLAUDE.md §11 — remove nav item. Rest: gate |
| Mobile app | 6 sub-pages | ComingSoonPage | STUB | Stays gated (Phase 3+) |
| Settings | 13 sub-pages | AdminSettingsPage | PARTIAL | school-info, site-domain-email, billing, team-management → MVP. Rest: gate |

### 2.3 Target Next.js route table (locked)

```
Marketing/platform (apex domain)
  /                          platform marketing page
  /signup                    tenant provisioning wizard
  /login                     shared login
  /verify/[code]             public certificate verification

Tenant storefront ({slug}.domain via middleware rewrite → /t/[slug]/…)
  /                          tenant catalog (ISR)
  /courses/[courseSlug]      course landing + enroll/buy
  /learn/[courseSlug]        player shell
  /learn/[courseSlug]/[lessonId]
  /dashboard                 learner dashboard
  /account                   profile + settings

Tenant admin (/admin under tenant subdomain)
  /admin                     overview
  /admin/courses             list
  /admin/courses/new
  /admin/courses/[id]/builder
  /admin/courses/[id]/quizzes/[quizId]
  /admin/people              memberships list + invite
  /admin/analytics           overview analytics
  /admin/certificates        templates + issued log
  /admin/settings/{profile|branding|domain|billing|team}
  /admin/website             (frozen WebsiteBuilder, feature-flagged)

Platform admin (admin.domain or /platform)
  /platform                  tenant list + health
  /platform/tenants/[id]     detail, suspend/unsuspend
  /platform/admins           platform-admin management

API
  /api/webhooks/stripe       Stripe webhook (Node runtime)
  /api/upload/mux            Mux direct-upload URL grant
  Server Actions for all other mutations (no REST fan-out)
```

---

## 3. API surface audit (edge functions)

Two near-duplicate Hono apps, 28 routes each. The **live** one is [supabase/functions/server/index.tsx](../supabase/functions/server/index.tsx) (its routes carry the `/make-server-d60f2898/` prefix that the frontend hardcodes in CourseBuilderPage.tsx:511, course-builder/VideoLibrary.tsx:50, WebsiteBuilder.tsx:1376). [make-server/index.tsx](../supabase/functions/make-server/index.tsx) is dead — delete it.

Security state of the live function (all confirmed by line-level inspection):

| Severity | Finding | Detail |
|---|---|---|
| CRITICAL | Hardcoded admin bypass | `curtis@outdure.com`/`outdure` at lines ~136–139 returns forged `admin-token-${Date.now()}` |
| CRITICAL | Forged-token acceptance | Any header starting `admin-token-` is treated as a valid platform_admin session (lines ~218, 228) |
| CRITICAL | Zero authz on 25 of 28 routes | `/admin/create`, `/admin/list`, `DELETE /admin/:id`, all course/website/video routes — no JWT check at all |
| CRITICAL | KV table world-writable | Migration 009 grants `authenticated` full ALL on `kv_store_d60f2898` with `using(true)` — cross-tenant read/write from the browser |
| HIGH | Anon key + project id in source | `utils/supabase/info.tsx` |
| HIGH | CORS `origin: "*"` on mutating routes | both functions |
| HIGH | No rate limiting on auth routes | — |
| MEDIUM | No input validation anywhere | arbitrary JSON stored as-is |
| MEDIUM | Suspension is localStorage | `suspendedCompanies.ts`, checked client-side only |

**Decision:** do not harden these functions route-by-route. Fix the four CRITICALs immediately as a hotfix (they're live on a hosted project), then the Next.js migration replaces the entire edge-function surface with Server Actions + RLS. Only the Mux upload-grant and Stripe webhook remain as API routes.

---

## 4. Data layer audit

**Exists (7 tables):** `profiles` (with `enrolled_courses text[]` / `completed_lessons text[]` — the wrong progress model), `courses` (flat, `company_id` is a text slug), `course_sections`, `course_activities` (12 URL columns: video_url, pdf_url, scorm_url…), `website_config`, `website_settings`, `kv_store_d60f2898` (dumping ground for 7 features). RLS exists and is sane on the course/website tables (3-tier via `get_my_role()`/`get_my_company()` security-definer helpers), but tenancy hangs off a free-text company slug derived from `profiles.company`.

**Missing (everything in CLAUDE.md §5):** `tenants`, `users`, `memberships`, `roles`, `permissions`, `lessons`, `lesson_assets`, `enrollments`, `progress_events`, `quizzes`, `quiz_questions`, `quiz_attempts`, `quiz_answers`, `certificates`, `certificate_templates`, `subscriptions`, `orders`, `audit_log`, `xapi_statements`.

**Tooling audit:** no `tsconfig.json`, no ESLint config, no tests, no CI, no `.env` (creds hardcoded). Scripts: `dev`, `build` only.

**KV-store inventory to migrate or drop** (key prefixes → disposition): `course-player-settings:*` → `lessons.content_jsonb` (migrate); `course-video-library:*` → `lesson_assets` (migrate); `website-config/settings:*` → already dual-written to real tables (drop KV side); `tag:*`, `segment:*`, `lead:*`, `group:*`, `field:*`, `approval:*`, `user:*`, `admin:*`, `company:*` → features gated at MVP (drop; export JSON snapshot first).

---

## 5. Locked implementation decisions

1. **MVP scope = §1 definition.** Anything labeled "gate" gets a single `FeatureGate` component (nav item visible, panel says "coming soon", flag in PostHog) — the sidebar breadth is a sales asset; keep it visible, don't wire it.
2. **Fresh Supabase project for v2.** Don't migrate v1 data-in-place; the only data worth keeping is `courses`/`course_sections`/`course_activities` + Storage files, moved by a one-shot script (Task C6). Old project stays up read-only until cutover.
3. **Next.js rebuild is page-by-page port, not lift-and-shift.** Components under ~1,000 lines port with edits; the 5k+ monsters (Analytics, Communications, WebsiteBuilder) do **not** get ported whole — MVP replacements are written fresh and small; originals stay in the Vite tree until deleted.
4. **Drizzle owns the schema**; migrations generated by drizzle-kit, committed under `supabase/migrations/` (append-only rule holds). RLS written as SQL in the same migrations.
5. **JWT claims**: Supabase Custom Access Token Hook injects `role` + `tenant_id`; RLS policies read `auth.jwt()` claims (drop the `get_my_role()` recursion workaround); a single `withTenant()` server helper resolves tenant from subdomain and asserts it against the JWT on every Server Action.
6. **Three system roles only** at MVP: `platform_admin`, `company_admin` (tenant admin), `learner`. The `roles`/`permissions` tables are created per §5 schema but seeded with system rows; the custom-role editor UI is gated.
7. **Video = Mux** from day one of Phase D; YouTube URLs remain as a legacy lesson type so existing demo content still plays. No SCORM/xAPI in MVP (Phase 2 per roadmap).
8. **Payments**: Stripe Checkout (hosted) for one-time course purchase; Stripe Billing + Customer Portal for tenant SaaS subscription. No custom cart. Stripe Tax on. Payment plans deferred to post-MVP.
9. **Certificates v1**: PDF via `@react-pdf/renderer` + `verification_code` UUID + public `/verify/[code]` page + W3C VC JSON blob stored in `credential_jsonb`. Signing via `@digitalbazaar/vc` can land post-MVP; the verify URL is the MVP acceptance.
10. **Audit log ships in Phase B** (schema) with the helper wired into course/membership/tenant mutations — cheaper to build in than bolt on, and it's the accreditation story.
11. **Testing bar**: vitest unit tests for money, progress-derivation, and authz helpers; one Playwright smoke covering the golden path (signup → author → enroll → complete → certificate). Not chasing coverage %.
12. **The Vite app keeps running** during Phases A–B (hotfixed); tenant-facing cutover happens once per tenant at Phase E, flipping DNS/subdomain to Vercel.

---

## 6. Task list

Tasks are ordered; `←` marks hard dependencies. Estimates are focused dev-days for a strong implementation model supervised by an engineer.

### Phase A — Stop the bleeding (hotfixes on current Vite app) — 3 days

| ID | Task | Detail | Acceptance | Est |
|----|------|--------|-----------|-----|
| A1 | Delete auth bypass + forged-token acceptance | Remove hardcoded creds and `admin-token-` checks from `server/index.tsx`; redeploy | Bypass creds return 401; demo users sign in via real Auth (migration 006) | 0.5 |
| A2 | Delete `make-server/` function + `AdminSetupPage` + dead routes | Also remove 6 unused Website*Page imports, `courses`/`company-subscribers` dead states from App.tsx | Build passes; `/admin-setup` gone | 0.5 |
| A3 | Lock down KV table | New migration 010: revoke the `using(true)` policy; replace with per-key-prefix tenant checks for the two prefixes still in use (player-settings, video-library); service-role only for the rest | Authenticated user A cannot read tenant B's keys (SQL test) | 1 |
| A4 | Role-guard the remaining edge routes + CORS | `requireRole` middleware reading real JWT via `supabase.auth.getUser()`; CORS restricted to app origins; `/admin/*` requires platform_admin | Unauthenticated/underprivileged calls → 401/403 | 1 |
| A5 | Move creds to `.env` | `VITE_SUPABASE_URL/ANON_KEY`; delete `utils/supabase/info.tsx` values; rotate anon key after | No secrets in git grep; app boots from env | 0.5 |

### Phase B — Foundation (repo, schema, auth) — 12 days

| ID | Task | Detail | Acceptance | Est |
|----|------|--------|-----------|-----|
| B1 | Scaffold Next.js 15 app | `apps/web` (or repo root `next/`): App Router, TS **strict**, Tailwind v4, Radix/shadcn layer, ESLint, vitest, Playwright, Sentry + PostHog SDKs | `next build` green in CI | 2 |
| B2 | CI pipeline | GitHub Actions: typecheck → lint → vitest → drizzle check → build → Playwright smoke; Vercel preview deploys | Red PR on any failure | 1 |
| B3 | v2 Drizzle schema — full §5 model | All 24 tables incl. `audit_log` (hash-chained) and `xapi_statements` (empty, schema-only); RLS per table: `tenant_id = (auth.jwt()->>'tenant_id')::uuid` pattern; seed system roles | `drizzle-kit` migration applies clean to fresh Supabase project; RLS cross-tenant test suite passes | 4 |
| B4 | Custom Access Token Hook + auth wiring ← B3 | Inject `role`, `tenant_id` claims; Next.js middleware for session; `withTenant()` helper; login/signup pages ported | JWT contains claims; RLS policies resolve from JWT with zero `profiles` reads | 2 |
| B5 | Tenant provisioning flow ← B4 | New signup wizard: create tenant (slug check) + owner membership; subdomain middleware rewrite (`*.domain` → `/t/[slug]`); `tenants.status` suspension enforced in middleware + RLS (kills localStorage hack) | New tenant reachable at `slug.domain`; suspended tenant → 403 everywhere | 2 |
| B6 | Audit-log helper ← B3 | `audited(tx, action, before, after)` wrapper computing sha256 chain; wire into tenant + membership mutations from the start | Tamper test: editing a row breaks chain verification | 1 |

### Phase C — Port the working core — 13 days

| ID | Task | Detail | Acceptance | Est |
|----|------|--------|-----------|-----|
| C1 | Design-token pass + app shells | Colors/spacing/type tokens; admin sidebar layout (ported, nav ids preserved, `FeatureGate` wrapping gated ids); storefront + learner shells | All MVP routes render with shared shells; gated items show flagged panel | 2 |
| C2 | Course CRUD on v2 schema ← B3 | Port AdminCoursesPage list/create/settings onto `courses` (tenant-scoped, slugs, status enum); Server Actions + audit log | Create/edit/archive course as tenant admin; audit rows written | 2 |
| C3 | Course builder port ← C2 | Port CourseBuilderPage onto `sections`/`lessons`/`lesson_assets`; the 12-URL-column shape collapses into `lessons.type` + `content_jsonb` + assets; keep drag-drop (react-dnd); Storage uploads for PDF | Author a course with text/PDF/video(YouTube-legacy) lessons; persisted + reload-safe | 4 |
| C4 | Storefront + course landing ← C2 | Tenant catalog page (ISR, Postgres FTS search) + course detail from real sections/lessons; tenant branding from `tenants` | Anonymous visitor browses catalog on subdomain; SEO meta present | 2 |
| C5 | Memberships/people admin ← B5 | List, invite-by-email (Resend invite), role change, deactivate — on `memberships`; delete mockUsers.ts and KV user writes | Invite → email → accept → learner appears in list; all mutations audited | 2 |
| C6 | v1 → v2 data migration script | One-shot: courses/sections/activities → v2 tables under the correct tenant; Storage object copy; KV export snapshot | Demo tenant's existing courses visible in v2 builder | 1 |

### Phase D — Learner loop (the actual product) — 15 days

| ID | Task | Detail | Acceptance | Est |
|----|------|--------|-----------|-----|
| D1 | Enrollment flow ← C4 | Free enroll Server Action → `enrollments` row; enrollment source tracking; learner dashboard lists real enrollments + progress | Enroll → appears on dashboard with 0% progress | 1.5 |
| D2 | Mux integration ← C3 | Upload grant API route, direct-upload widget in builder, asset webhook → `lesson_assets`; player component | Instructor uploads video; learner plays adaptive stream | 3 |
| D3 | Player + progress events ← D1, D2 | Learn route: lesson nav, Mux player emitting `progress_events` (started/heartbeat/seeked/completed with position), PDF viewer (pdfjs) in learner view, text lessons; `enrollment_progress_view` derives % and resume point | Refresh mid-video → resumes; completion flips at threshold; events are INSERT-only | 4 |
| D4 | Quiz builder + attempts ← C3, D1 | MCQ + true/false authoring (`quizzes`/`quiz_questions`); learner attempt flow with server-side grading (`quiz_attempts`/`quiz_answers`); pass threshold gates course completion | Author 5-question quiz; failing score blocks completion, passing unblocks | 3.5 |
| D5 | Certificates ← D3, D4 | Completion detector (course = all lessons complete + required quizzes passed) → issue certificate: PDF render, `verification_code`, VC JSON; public `/verify/[code]`; minimal template editor (logo, colors, signatory) | Complete course → PDF downloads; verify URL shows valid + revocation state | 3 |

### Phase E — Money, email, analytics, launch — 15 days

| ID | Task | Detail | Acceptance | Est |
|----|------|--------|-----------|-----|
| E1 | Stripe tenant billing ← B5 | Products/prices for Starter/Pro/Business; checkout at tenant signup (14-day trial, no card per pricing model); Customer Portal; webhook → `subscriptions`; plan limits helper (active-learner count) | Tenant subscribes, upgrades via portal, `subscriptions.status` tracks | 3 |
| E2 | Course sales ← D1, E1 | Priced course → Stripe Checkout (tenant's currency), webhook → `orders` + auto-enroll; refund webhook → revoke enrollment | Buy course with test card → enrolled; refund → access revoked | 2.5 |
| E3 | Transactional email (Resend) ← C5 | react-email templates: welcome, invite, enrollment, certificate issued, receipt; sent from Inngest jobs | Each event delivers styled email in test inbox | 1.5 |
| E4 | Inngest setup ← B1 | Job runner for webhook fan-out, email sends, certificate render; retry policy | Failed email retries and dead-letters visibly | 1 |
| E5 | Real analytics overview ← D3 | Replace mock overview-analytics: enrollments over time, completion rate, active learners, quiz pass rate — SQL over `enrollments`/`progress_events`/`quiz_attempts`, tenant-scoped | Numbers match seeded fixture data exactly | 2 |
| E6 | Platform admin panel ← B5 | Tenant list w/ plan + status, suspend/unsuspend (audited), platform-admin management | Suspend → tenant traffic 403s within one request | 1.5 |
| E7 | Hardening + launch checklist | Rate limiting (Upstash) on auth + checkout; security headers; Sentry alerts; Better Stack uptime; Playwright golden-path in CI; load-test catalog ISR; GDPR-minimum (data export on request is manual at MVP — document it) | Checklist signed off; smoke green on prod | 2.5 |
| E8 | Cutover + decommission | Per-tenant DNS flip to Vercel; freeze Vite app; delete edge functions, mock data dir, KV table (post-snapshot); archive contradicting docs per Phase 0 rule | Old stack dark; CLAUDE.md file-map updated | 1 |

**Task-day total: 58. With 15% integration/unknowns buffer: ≈ 67 dev-days.**

---

## 7. Explicitly out of MVP (gated or parked)

Website builder (frozen), blog/popups/funnels/navigation designer, full communications suite (inbox/mass email/push), approvals workflow, tags/user-fields/user-groups/multiple-seats/leads, custom roles editor, e-commerce beyond Stripe checkout (offers/gifts/licenses/custom-deals), marketing suite, mobile-app suite, ai-insights (remove — CLAUDE.md §7.9), scheduled reports/system-health/training-matrix/product-insights analytics, SCORM/xAPI playback (Phase 2), SSO/WorkOS (Phase 2), payment plans, reviews & messaging tabs on learner dashboard.

## 8. Estimate summary

| Phase | Dev-days | 1 eng + AI (calendar) | Notes |
|---|---|---|---|
| A — Hotfixes | 3 | week 1 | Ship immediately; independent of everything |
| B — Foundation | 12 | weeks 1–3 | B3 (schema) is the critical path |
| C — Core port | 13 | weeks 3–5 | C3 (builder) is the riskiest port |
| D — Learner loop | 15 | weeks 5–8 | D3+D4 are the product; don't compress |
| E — Money + launch | 15 | weeks 8–10 | Stripe webhooks always overrun; buffer lives here |
| **Total** | **58 (+15% ⇒ ~67)** | **9–11 weeks** | 2 parallel tracks ⇒ 6–8 weeks |

Parallelization guide: A is independent; B1/B2 can run alongside B3; C4/C5 parallel to C3; D2 parallel to D4 prep; E1–E3 parallel after D1.

Top three schedule risks: (1) CourseBuilder port (C3) — 2,222 lines of drag-drop state tied to the old column shape; budget the full 4 days. (2) Progress-event correctness (D3) — derive-don't-store discipline needs real tests. (3) Stripe webhook edge cases (E2) — refunds, disputes, currency; keep scope to checkout-only.

## 9. Handoff notes for the implementing model

- Read CLAUDE.md §1/§4/§7 first; this brief assumes them.
- Work the task IDs in order within a phase; open one PR per task ID with the ID in the title.
- Never edit shipped migrations; next migration number is 010.
- When a task says "gate", use the shared `FeatureGate` — do not delete the sidebar entry.
- Anything ambiguous: prefer the smaller interpretation that keeps the golden path (signup → author → enroll → complete → certificate) shippable.
