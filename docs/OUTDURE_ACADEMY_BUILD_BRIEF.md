# Outdure Academy — Stage 1 Build Brief (autonomous execution)

> Source of truth for the self-paced build loop. This is the actionable checklist behind the
> published plan. Update the checkboxes and the progress memory each iteration.

**Plan artifact (for humans):** https://claude.ai/code/artifact/a028985f-19e3-4c71-9ef1-a1144f6f5569
**Foundation:** branch `phase-b-foundation` — `web/` (Next.js 15) + `db/` (Drizzle/Postgres). Verified live 2026-07-23 (52 unit + 4 live E2E green, 26 routes).
**Go-forward repo:** `Structurebuild/Outdure-Academy`.
**Design reference:** worktree at `C:/Training-Platform-main` (branch `main`) — Abram's polished UI.

## Prime directives

- Internal Outdure / Structurebuild dealer training. **Single tenant `outdure`**. No public signup, no storefront exposure, no Stripe.
- **Keep the working backend; re-skin it** with the old UI's design — do NOT rebuild backend or lift the old mock backend.
- **Core requirements (Craig):** multi-session progress (show what's done / left / time remaining, resume) · **no forced questions** (already satisfied — do not regress) · mobile-first · mock "Outdure Certified" cert on completion (tiers: Registered → Trained → Verified → Strategic Partner).
- Keep tests green (52 unit + 4 live E2E). Do not regress the authz fitness test.
- **Commit per task.** Verify previewable changes in the browser preview. Leave every iteration in a working, committed state.

## Design assets to lift from `C:/Training-Platform-main` (branch `main`)

- `src/app/components/ui/` — 48 Radix/shadcn primitives + `ui/utils.ts` (`cn()`). MUI is dead code; ignore it.
- `src/styles/theme.css` — design tokens.
- Polished screens as re-skin reference: `HomePage.tsx`, `CourseCatalog.tsx` + `CourseCard.tsx`, `CourseDetailPage.tsx`, `LearningPage.tsx`, `DashboardPage.tsx`, `UserManagementPage.tsx`, `AdminSettingsPage.tsx`, `AdminSidebar.tsx`.

## Scope map (design source → working route)

| Feature | Source (main) | Target route (web/) | Work |
|---|---|---|---|
| Home + login | HomePage.tsx | `/` · `/login` | re-skin |
| Course catalogue | CourseCatalog + CourseCard | `/t/[slug]` | re-skin |
| Course detail | CourseDetailPage.tsx | `/courses/[courseSlug]` | re-skin (drop price/buy) |
| Lesson player | LearningPage.tsx | `/learn/[courseSlug]/[lessonId]` | re-skin |
| Quiz-taking | — (old is a stub) | working quiz | skin + timing (G1) |
| Learner dashboard | DashboardPage.tsx | `/t/[slug]/dashboard` | re-skin |
| User management | UserManagementPage.tsx | `/admin/people` | re-skin |
| Insights | AdminAnalyticsPage.tsx (trim) | `/admin/analytics` | build (light) |
| Settings | AdminSettingsPage.tsx | `/admin/settings` | re-skin |
| Certificate view | — (build) | `/verify/[code]` + dashboard | build (G2) |

## Phases & tasks

### Phase 0 — Working home (1–2d)
- [x] P0.1 Seed `Structurebuild/Outdure-Academy` from `phase-b-foundation`; branch protection + CI; park old repo as archive.
- [x] P0.2 Re-verify build + 52 unit + 4 live E2E in the new home.
- [ ] P0.3 Confirm Supabase v2 connection; secrets in env; rotate old anon key.
- [ ] P0.4 Clear test-litter courses/tenants from live DB (keep platform admin).
- [ ] P0.5 Single-tenant/internal: one `outdure` tenant; disable public signup; storefront internal-only.

### Phase 1 — Foundation & branding (2–3d)
- [x] P1.1 Lift `ui/` component library + `cn()` into `web/src/components/ui/` (add "use client" where needed).
- [x] P1.2 Port theme tokens into `web/` globals; Outdure palette light + dark.
- [x] P1.3 Outdure branding (name/logo/colours/favicon/metadata); remove "Teachly".
- [x] P1.4 Re-skin app shell (admin sidebar + learner chrome); mobile nav drawer.
- [x] P1.5 Feature flags via `lib/nav.ts`: live = Courses, Users, Communications, Insights, Settings, Certificates; hide the rest (see Retain-but-hide).

### Phase 2 — Learner experience (4–6d) [Craig core]
- [x] P2.1 Home + login re-skin (strip marketing/pricing).
- [x] P2.2 Course catalogue re-skin (our courses grid + search).
- [x] P2.3 Course detail re-skin (drop price/buy).
- [x] P2.4 Lesson player re-skin (video/pdf/text).
- [x] P2.5 Quiz-taking skin (confirm low-friction) + per-question timing capture (G1).
- [x] P2.6 Learner dashboard re-skin (stat tiles + % + Continue).
- [x] P2.7 Resume + "time remaining" prominence on dashboard + outline.
- [x] P2.8 Learner certificate view + download (G2) — satisfied by the existing printable `/verify/[code]` cert (tenant-branded, revocation-aware, print/download), linked from the dashboard. Tier naming (Registered→Trained→Verified→Strategic Partner) deferred to P4 with real content/roles.
- [~] P2.9 Communications (review) — DEFERRED to post-MVP. Admin→learner messaging needs its own table + compose UI + learner inbox; kept gated as Coming Soon (retain-but-hide pattern). Not blocking the internal launch (Craig: nice-to-have).
- [x] P2.10 Mobile-first QA across learner flow.

### Phase 3 — Admin & authoring (3–5d)
- [x] P3.1 Course list & create re-skin.
- [x] P3.2 Course builder re-skin.
- [x] P3.3 Quiz builder re-skin.
- [ ] P3.4 People & enrolment re-skin (+ bulk import/enrol/CSV).
- [ ] P3.5 Insights (light) + friction metrics (time/attempts per question).
- [ ] P3.6 Settings + certificates admin re-skin.

### Phase 4 — Content & go-live (2–3d) [needs external inputs]
- [ ] P4.1 User types aligned to Outdure Connect. **WALL: role list from Stevie.**
- [ ] P4.2 Load real courses + videos. **WALL: content; YouTube now, Bunny later.**
- [ ] P4.3 Enrol pilot dealers.
- [ ] P4.4 Deploy per DEPLOY.md. **WALL: prod infra/DNS.**
- [ ] P4.5 Live smoke test + handover to Craig.

## Retain-but-hide (keep as Coming Soon / flagged off)
Already gated: e-commerce, marketing, mobile-app admin, automations.
Hide via flags: website builder, multiple seats, leads, tags, user fields, user groups, heavy Reports Center.

## Walls (blocked on external input — skip + note, never spin)
- Outdure Connect user-type list (P4.1)
- Real course content + videos (P4.2)
- Production infra / DNS (P4.4)
- Bunny.net account (video upgrade — fast-follow)
- Outdure brand assets (real logo, exact hex, favicon) for final P1.3 polish — provisional identity in place meanwhile.

## Gaps (genuinely new backend work)
- G1 — per-question timing capture in the quiz player (attempts already recorded).
- G2 — learner-facing certificate view/download (verify data already exists).

## Progress
Track each iteration in memory `project_mvp_progress` (or a stage1 progress note): what task completed, commit hash, what's next, any wall hit.
