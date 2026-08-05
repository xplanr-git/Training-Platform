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
- [x] **Empty states, everywhere.** One `EmptyState` / `EmptyRow` / `NoMatches`
      in `components/empty-state.tsx`, applied to 12 surfaces — five more than
      this item listed (platform tenants, quiz builder, the lesson player's empty
      quiz, and two per-section lists were all missing too). Note: the item said
      "Insights already does this — match that quality"; it did not. Insights was
      a bare grey line like the rest, so the bar had to be set rather than
      matched. Searchable pages now distinguish "no matches" (with Clear search)
      from "nothing yet". Contrast of the muted description is asserted from the
      tokens, not eyeballed.
- [x] **Explicit feedback on reorder.** New `ReorderControls` client component:
      spinner in place of the pressed chevron, BOTH directions disabled while in
      flight, sr-only announcement, visible error on failure. Went with explicit
      over optimistic — optimistic would mean lifting the whole builder list into
      client state, and the complaint ("the click feels lost") is answered by
      making the click visibly land. Also fixed a real race it was provoking: the
      position read sat outside the transaction that wrote, so two overlapping
      moves both read pre-swap positions — two clicks, one move, and in different
      directions, two rows sharing a position. Read is now inside the transaction
      with `FOR UPDATE`.
- [x] **Certificate acknowledgement on course completion.** `CourseComplete`
      panel replaces the progress card on the course outline once finished — the
      page the learner is redirected to on the last click. Shows the issue date, a
      link to the certificate, and the verification code, which is the part worth
      having on screen: a contractor showing a client needs a code the client can
      check without an account, and the only other copy was in an email. Gated on
      `enrollmentId`, so a previewing admin is never told they earned one. Claims
      NO designation — that is the blocked decision in §5, and the certificate page
      derives its own heading from the tenant template.
- [x] **Explain an unconfigured video host.** `videoUnavailableReason` in
      `lib/video-availability.ts` classifies five cases that all rendered as
      "Video unavailable.": not-attached, host-not-configured, unknown-provider,
      unplayable-link, unexpected. The four faults are logged with lesson, course
      and tenant ids; not-attached is not, since it is ordinary mid-authoring
      state and logging it would bury the rest. Learners are told it is not their
      device; admins previewing get the env var name and a builder link.

## 3. Visual and interaction quality

- [x] **Design pass on the learner surfaces.** Scale now written down in
      globals.css and enforced: two section headings were `text-sm`, i.e. SMALLER
      than the body text, and on the course landing exactly the same size as the
      lesson names they grouped — only weight separated them. Page rhythm unified
      to `px-6 py-12 sm:py-14`; container widths kept but their rule stated (grids
      wide, reading columns 3xl); hover on the outline rows now fades like the
      player sidebar already did. Focus verified with a real keyboard Tab, which
      turned up the finding below.
- [x] **Design pass on the admin surfaces — HIGH-severity findings only.** Audited
      with a 5-way fan-out plus an adversarial refuter: 67 findings reported, 47
      confirmed, 20 refuted. All twelve HIGH ones are fixed. It also turned up two
      APP-WIDE rendering defects that had nothing to do with admin (see the log),
      which is the real value of having run it. The 35 medium/low findings are
      listed in the follow-up item below rather than silently dropped.

- [x] **Admin design pass, part two.** Worked the 35 medium/low findings. Five were
      already fixed by part one and dropped. Landed: `platform/page.tsx` now uses the
      Table primitive + Badge with a right-aligned, tabular member count (it was
      hand-rolled markup and a bespoke five-colour status pill); all four tables sit
      on `bg-surface`, WITHOUT which part one's row-hover fix was invisible — the
      admin shell is grey, so an unfilled table hovered grey-on-grey; the certificate
      template form uses Input/Label/Button instead of raw elements; the invite form
      announces its outcome in a live region with `role="alert"` (it is the one admin
      form not routed through NavForm, so it inherited none of that); the mobile
      drawer now carries the sign-out footer, which existed only in the desktop aside
      — a phone had NO way to sign out; destructive buttons keep their colour on
      hover (ghost's `hover:text-accent-foreground` was overriding it); a correct quiz
      option says "(correct)" rather than relying on a tick and a colour (WCAG 1.4.1);
      the quiz card shows the question type; `FeatureGate` renders an h1 so
      /admin/coming-soon has one; the tier help text is associated via
      aria-describedby; the people table's row actions no longer stack and double the
      row height; the edit-lesson disclosure has a real hit area.
      DELIBERATELY SKIPPED: "a saved question has no edit affordance" is a missing
      FEATURE (needs an updateQuestion action and form), not a design defect, and the
      free-text answer-index picker already has its own item in §4 — neither is churn
      to fold in here.

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

- [ ] **Admin shell never scrolls its sidebar.** `admin-shell.tsx:111` is
      `flex min-h-screen`, so the aside grows with the nav instead of the aside's
      own `flex-1 overflow-y-auto` engaging — with ~40 nav items the sidebar
      lengthens the document rather than scrolling inside itself. `h-screen` is
      probably the fix, but it converts the admin area to a fixed app shell and I
      cannot see the admin area to check, so it was left alone deliberately rather
      than changed blind.

- [ ] **In single-tenant mode, `/` is the marketing page, not the catalogue.**
      `tenantRewritePath` deliberately excludes `pathname === '/'` from the
      default-slug rewrite (`lib/host.ts:108`), so on the bare domain the
      storefront is only at `/t/<slug>`. But five places link to `/` meaning
      "the course list": the storefront's own pagination, the learner
      dashboard's "Browse courses", the course landing page's "All courses"
      back-link, `error.tsx` and `not-found.tsx`. A signed-in learner clicking
      any of them lands on a marketing page whose only control is "Sign in".
      Correct on a tenant subdomain, wrong on the apex. Found by clicking the
      link, not by reading the code.
      NEEDS A DECISION: should the bare domain serve marketing or the catalogue
      at `/`? Do not guess — it changes what every visitor sees first.

- [ ] **The UI kit's focus rings render nothing.** Measured in a browser: on both
      a Button and an Input, `focus-visible:ring-*` computes to a TRANSPARENT
      box-shadow, and several components also set `outline-none`. The global
      `:focus-visible` block in globals.css is therefore the ONLY thing giving
      keyboard users a visible focus indicator anywhere in the app — it survives
      `outline-none` purely on specificity (`input:focus-visible` 0,1,1 beats the
      `.outline-none` utility 0,1,0). That works, and is now guarded, but it is
      accidental: the `ring-ring` / `--ring` variable the kit expects is not wired
      to `--color-ring`. Worth fixing properly so components and globals agree.

- [ ] **The lesson player decides playability twice.** The JSX ternary checks
      `hosted?.provider === 'bunny' && env.bunnyLibraryId()` and then
      `youtubeEmbed(...)`; a `playable` const beside it repeats the same
      conditions for the logging gate. A single `resolveVideoSource(content, …)`
      returning bunny | youtube | unavailable would remove the duplication and let
      the player switch on one value. NOT done in the same pass because it means
      restructuring the working playback branches, and there is no way to verify
      playback without an authenticated session — the drift hazard it creates
      (a blank space where the player belongs) is meanwhile closed by a test.

- [ ] **No prettier config in the repo.** `npx prettier --write` therefore uses
      prettier's defaults, which are double quotes — it reformatted a whole file
      away from the codebase's single-quote style before being reverted. Either add
      a `.prettierrc` matching current style or stop reaching for prettier here.

- [ ] **An E2E test that actually signs in.** `tests/e2e/smoke.spec.ts` only
      visits public pages, so *every* authenticated route — the whole admin area,
      the learner dashboard, the lesson player, the builder — has zero
      end-to-end coverage. This is the structural reason regressions kept
      reaching the team while I reported things working: without a session, the
      only routes verifiable from outside are the six public ones, and the other
      sixteen were being checked by reasoning rather than by loading them.
      Needs a seeded test tenant with a known-password admin and learner on a
      non-production Supabase project — NOT the live one. Highest-leverage item
      in this file; it is what stops the next regression rather than fixing the
      last one.

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
- One empty-state component across 12 surfaces, replacing five different
  treatments. The substantive fix was the title colour: every previous empty
  state was muted grey top to bottom, which is what this app uses for disabled
  text, so an empty table read as broken rather than new. Search-empty is now
  distinct from nothing-yet, with "Clear search" as the way out — the classic bug
  is telling someone with 40 courses to create their first one because they
  mistyped. Seven guards, all proven red; the search guard initially did NOT bite
  because it matched the word `NoMatches` in the *import* line, so deleting the
  usage still passed — now scoped to the branch and matching `<NoMatches`. Added a
  computed WCAG contrast test (muted on muted is 4.63:1, i.e. AA by 0.13) proven
  red by a one-step lighter grey. Verified on screen: the no-matches state and
  EmptyRow both render correctly. NOT seen on screen: the first-run copy variants
  — no tenant has zero courses and `?page=99` clamps back to page 1, so that
  branch is unreachable without mutating real data.
- Reorder feedback, plus the bug it was hiding. The two chevrons were separate
  NavForms, so a click dimmed one 16px ghost icon to 60% opacity and left the
  opposite chevron live — which is precisely how you provoke two overlapping
  moves. And overlapping moves were genuinely wrong, not just redundant: the
  position read happened outside the transaction that wrote, so the second call
  re-applied the swap the first had already committed (two clicks, one move), and
  two moves in different directions could leave two rows sharing a position.
  `ReorderControls` now owns one pending state for both directions; the read is
  inside the transaction with `FOR UPDATE`. Verified live on a throwaway probe
  page (the builder needs an admin session): mid-flight both buttons disabled,
  exactly one spinner, live region reading "Moving lesson…"; on failure a
  role=alert with readable text, spinner cleared, buttons re-enabled to retry.
  Seven guards proven red, including the subtle one — `db.select()` inside a
  `db.transaction()` block runs on a different connection, so it compiles, looks
  transactional and locks nothing. NOT verified: the race itself under real
  concurrency. Reproducing it needs concurrent writes against production data,
  which is not something to do unattended. `FOR UPDATE` reaching the wire was
  confirmed by rendering the query: `… order by "lessons"."position" asc for
  update`.
- Completion acknowledgement. Finishing a course issued a certificate, advanced
  the Connect tier and sent an email, then showed the learner a page saying "100%
  complete" with a "Review course" button — the one moment worth marking looked
  like any other visit. `CourseComplete` now replaces that card with the issue
  date, a link, and the verification code. Deliberately asserts no designation:
  §5 leaves the credential's name open, and the certificate page reads its heading
  from the tenant template, so naming one here could contradict the document the
  learner then opens. Caught a contrast trap in the process — `text-muted` on
  `--color-brand-50` is 4.38:1 and FAILS AA, while passing at 4.63:1 on white,
  which is exactly why reaching for it felt right; body copy uses neutral-700
  (9.4:1). The WCAG helpers are now shared in `tests/unit/helpers/contrast.ts`
  rather than duplicated. Ten guards proven red — one sabotage was itself wrong
  (it hit the wrong `Promise.all` on the page) and had to be redone. VERIFIED: the
  panel renders in both states, and the link it emits resolves to a real, valid
  certificate with no sign-in — checked against a genuine code from the database.
  NOT verified: the redirect immediately after the final click, which needs an
  enrolled learner session.
- Unconfigured video host. One bare line, "Video unavailable.", stood for five
  different situations needing different responses — and four of them are nobody-
  in-the-academy's fault. Worth noting `hostedVideoFromContent` returns null for
  any unrecognised provider, so "content exists but is unplayable" was
  indistinguishable from "nothing attached". The classifier went into its own
  module for a concrete reason: `lib/video.ts` imports React's `cache`, which
  exists only in the react-server build, so nothing living there can be
  unit-tested at all — the first version of this test appeared to set
  BUNNY_LIBRARY_ID per case and was pure theatre, since the function never read
  env. It now takes `hostConfigured` as a parameter, so the central claim is
  actually verifiable, and adding an `unexpected` case made TypeScript reject the
  non-exhaustive switches. Thirteen guards proven red (one sabotage was a no-op —
  an empty `if` body — and had to be redone). VERIFIED: all five states render
  with the right copy, the learner variant omits the admin block and never names
  the env var, and all four fault reasons reach the server log with full context
  while not-attached produces no line. NOT verified: the player's own call site
  firing on a real request, which needs an authenticated learner on a lesson whose
  video cannot play; the log mechanism was proven in the same runtime instead.
- Learner design pass. The headline defect was a hierarchy inversion: section
  headings at `text-sm` against a 16px body, and on the course landing the section
  title was the exact same 14px as the lesson names inside it, so the only thing
  marking it as a heading was font weight. Now 16px/600 above 14px/400 — measured
  in the browser, not assumed. Nine `<Link>`s looked like they lacked hover
  affordance and all nine turned out to be `<Button asChild>` wrappers, so nothing
  was "fixed" there. Container widths already followed a rule (grids wide, reading
  columns 3xl) and only looked arbitrary because it was unwritten; it is now in
  globals.css rather than churned. Ten guards proven red. The real find came from
  testing focus with an actual keyboard Tab rather than reading the CSS: the UI
  kit's own `focus-visible:ring-*` computes to a transparent box-shadow, so that
  one global block is the only focus indicator in the app, surviving component
  `outline-none` on specificity alone. Guarded, and logged above as worth fixing
  properly. NOT verified: how any of this LOOKS — the preview pane downscales
  screenshots to unreadability, so the evidence here is computed values; and the
  outline and player changes were not seen at all, since both need an
  authenticated learner.
- Admin design pass (HIGH findings). Ran as a 5-way audit with an adversarial
  refuter, which earned its keep twice over: it killed 20 of 67 findings — several
  of them exactly the kind I have shipped before, e.g. "nav doesn't mark the current
  section" when `aria-current` was right there — and it found two defects that were
  not admin problems at all and had been visible on EVERY surface for months:
  (1) `rounded-[--radius-card]` is not valid Tailwind v4; it emits
  `border-radius: --radius-card`, which browsers drop. Thirty occurrences across
  nineteen files computed to 0px. Every admin table, the accordion, the skeletons,
  and four components written earlier in THIS backlog had square corners. Fixed to
  `rounded-(--radius-card)`; verified in a browser against the served stylesheet
  (0px → 12px, old rule gone).
  (2) `Card` had `rounded-xl border` with no colour, so v4's preflight left it at
  currentColor: every card in the app drew a 1px near-black #0a0a0a border instead
  of #e5e7eb. Verified rgb(10,10,10) → rgb(229,231,235).
  Also: `TableRow` hovered to `bg-muted/50`, but `--color-muted` is the grey TEXT
  token, so rows washed to mid-grey and muted cell text measured 2.43:1 — confirmed
  by computing it. Now `bg-surface-muted` at 4.63:1. Every control in the builder
  and quiz builder gained an accessible name (they were placeholder-only, and a
  placeholder is gone the moment a field has a value — i.e. always, on an edit
  form). And the quiz empty-state copy written by an earlier pass of this backlog
  was factually wrong on both counts: nothing forces answering every question
  (gradeQuiz scores a skip as wrong) and there is no "quiz settings" screen. Both
  claims re-verified against the code before rewriting.
  Deliberately NOT changed: billing's `gated` nav entries, because Stripe is built
  and switched off on purpose; and the admin shell's `min-h-screen`, because the fix
  makes it a fixed app shell and I cannot see the admin area to check. Eleven guards
  proven red, two of my own sabotages having been wrong first (a no-op edit, and one
  that hit the wrong of two identical strings). The `-[--var]` guard is the one that
  matters: that bug class typechecks, lints and builds clean while emitting invalid
  CSS, which is why it survived this long.
  NOT verified: any admin surface as rendered. The fixes were verified on public
  pages and on a throwaway probe rendering the Table and Card primitives directly.
- Admin design pass part two. Five of the 35 were already fixed by part one, which
  is why reconciling the list against the code came first rather than trusting it.
  The most consequential fix was the least glamorous: three of the four admin tables
  had no background, and since the admin shell root is `bg-surface-muted`, those
  tables WERE that grey — so the row-hover fix shipped in part one was hovering grey
  onto grey and changed nothing visible. Giving the tables a white fill is what made
  the previous commit's fix real, which is a good argument for finishing a pass
  rather than stopping at the high-severity items. Also found and fixed while
  verifying: the sign-out button I had just added to the mobile drawer measured 20px
  tall, under WCAG 2.2's 24px minimum — now 86x32. Twelve guards proven red, plus the
  tap-size one. My own test again matched its own explanatory comment (naming
  `<table>` while describing what was removed), for the second time in this backlog,
  so comment-stripping is now a shared helper in that suite.
  VERIFIED: for the first time, the real admin chrome — AdminShell rendered in a
  probe showed the grey shell (#f9fafb) against a now-white table, 12px radius, grey
  row borders, right-aligned numeric and action columns, Badge rendering; and at
  375px the drawer opens with email + Sign out visible, 86x32, no horizontal scroll.
  NOT verified: the admin pages as served to a real admin — still no authenticated
  session, so the probe renders the components, not the routes.
