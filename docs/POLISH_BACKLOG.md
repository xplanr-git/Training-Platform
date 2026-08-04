# Polish backlog

Working queue for the recurring polish loop. **This file is the loop's memory** —
each run reads it, takes the topmost unchecked item, implements it, ticks it with
a one-line note, and pushes. Without it every run would re-derive the plan and
repeat itself.

Ordered by what a user feels soonest. Work top to bottom; don't skip ahead
unless an item is blocked, in which case mark it `BLOCKED` with the reason and
move on.

**Definition of done for every item:** typecheck, lint, `vitest`, and
`next build` all pass; a fitness test locks in anything that could silently
regress; committed and pushed to both remotes.

**Standards being applied** (SaaS baseline, not invention):
- Every navigation shows something within ~100ms — a skeleton, never a frozen page.
- Every mutation reports in-flight, success, and failure states.
- Every destructive action confirms first.
- Every list has a designed empty state that tells you what to do next.
- Nothing communicates by colour alone; every control has an accessible name.
- No page issues sequential queries it could issue in parallel.

---

## 1. Speed and perceived speed

- [x] **Parallelise sequential queries, page by page.** Done for the four
      learner-facing pages, which is where the round trips stacked worst:
      lesson player 7 serial DB hops → 2 plus 3 parallel batches; course landing
      6 → 2; course outline 4 → 2; storefront count and rows now concurrent.
      *Admin pages not yet audited — a later pass.*
- [x] **Route-level loading states.** Added for `/platform`, `/verify/[code]`
      and `/dashboard`. Deliberately NOT added for `/`, `/login` or `/signup`:
      `/` does no server work and the other two are client components, so a
      loading file there would never meaningfully render.
- [x] **Skeletons that match their content.** Shared shapes in
      `components/skeletons.tsx`, and per-route files for the distinct layouts:
      the admin tables, Insights' 8-tile grid, and the lesson player's
      two-column layout with a reserved `aspect-video` block. All now use the
      `Skeleton` primitive — which already existed and was unused, while the
      first two loading states hand-rolled their own pulse.
- [x] **Cache the per-request Bunny lookups in the builder.** Split into
      `getBunnyVideo` (fresh) and `getBunnyVideoCached` (`cache()` + 20s
      revalidate). `attachVideo` must keep the fresh one — it verifies a
      just-uploaded video exists, and a cached 404 would reject a video that is
      plainly there. Both halves pinned by a fitness test.

## 2. Feedback and state (partially done — verify, then extend)

- [x] Every Server Action form routes through `NavForm`: in-flight disable,
      "Saved." confirmation, readable errors, confirmation on destructive
      actions. Fitness test at `tests/unit/form-feedback-conventions.test.ts`.
      *(b646aa6)*
- [ ] **Empty states, everywhere.** Courses, People, Certificates, Insights,
      learner dashboard, storefront, course outline. Each should say what the
      thing is and what to do next, not just "None yet." Insights already does
      this for quizzes — match that quality.
- [ ] **Optimistic or explicit feedback on reorder.** Moving a lesson currently
      round-trips before anything moves; the click feels lost.
- [ ] **Certificate acknowledgement on course completion.** The certificate is
      issued but the learner is shown nothing — no confirmation, no link, no
      verification code. Highest-value learner-facing gap.
- [ ] **Explain an unconfigured video host.** A missing `BUNNY_LIBRARY_ID` shows
      learners a bare "Video unavailable" with nothing logged and no way to
      diagnose. Distinguish "not configured" from "no video attached".

## 3. Visual and interaction quality

- [ ] **Design pass on the learner surfaces first** — storefront, course landing,
      course outline, lesson player. These are what a dealer sees. Consistent
      spacing scale, type hierarchy, focus states, hover affordances.
- [ ] **Design pass on the admin surfaces** — tables, forms, the builder. The
      builder especially: it is a dense row of unlabelled inputs.
- [ ] **Mobile.** Contractors use this on site. Verify every learner page at
      375px: no horizontal scroll, tap targets ≥44px, the lesson sidebar
      collapses sensibly.
- [ ] **Accessibility sweep** (WCAG 2.1 AA). Contrast, focus visibility, form
      labels, heading order, `aria-live` for async regions. Use the
      `design:accessibility-review` skill.
- [ ] **Copy pass.** Buttons that say what happens, errors that say how to fix
      it, no internal vocabulary leaking into the UI. Use the `design:ux-copy`
      skill.

## 4. Correctness items already identified

- [ ] **Require a name on invitation.** Without one a certificate can read
      "This certifies that " and nothing in the product can repair it.
- [ ] **Honest "about N min left".** When only some remaining lessons carry an
      estimate the figure silently under-reports, with no hint it is partial.
- [ ] **Friendlier correct-answer picker.** Right answers are typed as numbers
      ("2", or "1,3"). Error-prone for whoever writes quizzes.
- [ ] **Retire the legacy YouTube renderer** once no lesson content holds a
      `youtubeUrl`. Check the database before removing.

## 5. Blocked — needs a decision from the account owner

- [ ] **BLOCKED: may learner progress be deleted?** `progress_events` is
      append-only, which is what makes the watch-time evidence trustworthy — and
      also why "Delete course" fails for any course with learner activity.
      Permitting deletion weakens the guarantee; refusing it means a GDPR erasure
      request cannot be honoured in-product. Do not decide this unilaterally.
- [ ] **BLOCKED: certificate wording.** Proposed "Outdure Certified — Trained"
      using the Connect tiers, rather than a generic "Certificate of Completion".

## 6. LAST — public learner sign-up

Do not start this until sections 1–4 are complete.

`/signup` today provisions a whole **academy** (a tenant plus an owner admin).
What is wanted is different: a member of the public creating a **learner** account
on the existing academy.

- [ ] **Decide the gate, then build it.** Open sign-up on an internal dealer
      academy is a spam and access-control problem, so it needs one of:
      an invitation code, an email-domain allowlist, or admin approval
      (`status: 'pending'` until an admin accepts). Recommend admin approval —
      it needs no secret distribution and gives the academy a record of who
      asked. **Surface this choice to the owner before building.**
- [ ] **Build it.** A `/join` route on the academy that creates the auth user and
      a learner membership in the chosen state, reusing the existing
      set-password flow rather than a second password path. Must not touch
      `/signup`, which remains the academy-provisioning route.
- [ ] **Admin side.** Pending requests visible in People with accept/decline,
      audited like every other membership mutation.
- [ ] **Guard it.** Rate limiting is still absent platform-wide; an open
      registration endpoint makes that materially worse. Note the exposure
      explicitly even if the limiter lands later.

---

## Log

Newest first. One line per completed item: what changed, and the commit.

- Loading states for every server-fetching page, shaped to match their real
  layouts. Found the unused `Skeleton` primitive and adopted it, dropping its
  needless `"use client"` so it renders server-side. Two fitness guards, both
  proven red: a data page with no loading boundary, and a hand-rolled pulse.
- Parallelised queries on the four learner-facing pages. Caught a latent
  pagination trap while doing it — deriving the offset from `pageMeta(page, 0)`
  collapses every page to page 1, because pageMeta clamps against a pageCount
  derived from the total. Verified real offset paging against the database (72
  courses, pages 1 and 2 disjoint) and locked the trap with a test proven to
  fail red.
- `b646aa6` — all 28 Server Action forms routed through `NavForm`; destructive
  actions gained confirmations; fitness test added and verified by reverting a
  form and watching it fail.
- Split the Bunny video read in two: cached for the builder's display cards
  (React `cache()` to dedupe within a render, plus a 20s revalidate, which is
  the bigger win — the builder was one API call per video lesson on *every*
  render), fresh for `attachVideo`, which uses the same lookup to verify a
  just-uploaded video exists. `bunnyFetch` had `cache: 'no-store'` hardcoded
  *after* `...init`, so no caller could opt in; it now takes `revalidate` and
  picks one policy or the other, never both. Four guards, all proven red:
  attachVideo using the cached read, the builder using the fresh one, the
  revalidate going missing, and no-store being pinned again. NOT verified: the
  call collapsing at runtime — that needs a live Bunny key and an authenticated
  builder session. Both halves are framework contracts already relied on
  elsewhere (`cache()` in `tenant.ts`), and the failure mode is "no speedup",
  not wrong data.
