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
- [ ] **Route-level loading states for the remaining groups.** `admin/` and
      `t/[slug]/` have `loading.tsx`; the apex (`/`, `/login`, `/signup`,
      `/dashboard`, `/verify`) and `/platform` do not.
- [ ] **Skeletons that match their content.** The two existing skeletons are
      generic blocks. Make each mirror the real layout so the page doesn't jump
      when it swaps in.
- [ ] **Cache the per-request Bunny lookups in the builder.** One API call per
      video lesson on every render. Wrap in React `cache()` and consider a short
      revalidate, since encoding state changes on the order of minutes.

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

- Parallelised queries on the four learner-facing pages. Caught a latent
  pagination trap while doing it — deriving the offset from `pageMeta(page, 0)`
  collapses every page to page 1, because pageMeta clamps against a pageCount
  derived from the total. Verified real offset paging against the database (72
  courses, pages 1 and 2 disjoint) and locked the trap with a test proven to
  fail red.
- `b646aa6` — all 28 Server Action forms routed through `NavForm`; destructive
  actions gained confirmations; fitness test added and verified by reverting a
  form and watching it fail.
