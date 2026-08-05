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

- [x] **Mobile.** Measured at 375px in a browser, page by page. NO horizontal
      scroll anywhere — every learner page was already clean on that count. Tap
      targets were not: `Input` (36px) and `Button` default (40px) are the two
      commonest controls in the app and both missed the bar, now `h-11 sm:h-9` so a
      phone gets 44px and desktop density is untouched (verified 44px at 375px,
      36/40px at 1280px). Nine back-links shared one hand-written class string and
      measured 20px — under even WCAG 2.2's 24px floor — now one `BackLink`
      component at 44px, using `-my-1.5` so a bigger target does not push the
      heading down. Also fixed: quiz answer rows 38px → 46px (the highest-frequency
      deliberate tap in the product), "Open PDF in new tab" 20px → 44px,
      dashboard "View certificate" 20px → 44px, "Forgot password?" 16px → 44px.
      SIDEBAR: it was `hidden lg:block` with only a back link and a progress bar
      below that, so on a phone the course structure was *absent* — no lesson list,
      no sense of position, no way to jump. Extracted `LessonNav` and added a
      `<details>` disclosure, collapsed by default; rows are `py-3 lg:py-1.5`, so
      44px on a phone and the original 32px in the desktop sidebar.
      Remaining under 44px and left deliberately: the storefront search input/button
      pair (36/40px → now 44px via the primitives) is fine, but pagination
      prev/next is ~33px and only renders above 25 courses. Noted, not chased.
- [x] **Certificate print output.** One `@media print` block plus `@page`, scoped to
      `[data-print-certificate]` so no other page's print output changes. Fixes three
      real things: the screen shell is a centred `min-h-screen` column, and in print
      `100vh` resolves against the page box, so `justify-center` pushed the
      certificate down the sheet and the leftover height could spill onto a blank
      second page; the certificate could be split across two sheets; and there were
      no page margins of our own. Reading the markup also turned up that
      `print:hidden` on the status row was hiding the **Revoked** badge from print —
      PrintButton already carries its own rule, so the row's only effect was to
      suppress the one warning that matters on a printed document. The revoked badge
      now prints with an outline (backgrounds drop in print, borders and text colour
      do not); the "Valid certificate" badge still does not, being a screen
      affordance rather than part of the document.

- [x] **Accessibility sweep (WCAG 2.1 AA).** Audited by concern with an adversarial
      refuter (5 concerns, 14 findings confirmed of ~40 reported) plus my own live
      browser sweep. Fixed: the skip link painted NOTHING when focused (Tailwind v4
      moved `.sr-only` from `clip` to `clip-path`; the focus rule released only the
      old one) — 2.4.7; `--color-input` #e5e7eb was 1.24:1, the sole boundary of every
      text field — now #858585, 3.69:1 on the page and 3.53:1 on the field's own fill
      — 1.4.11; `CardTitle` hardcoded `<h4>`, so four auth pages had NO h1 and started
      their outline at level 4 while the storefront skipped h1→h4 — the level is now a
      REQUIRED prop, so the compiler asks — 1.3.1; the signup error was inserted with
      no role and no live region, i.e. a failed signup was silent — 4.1.3; the video
      file input had an empty accessible name (type=file has no placeholder fallback)
      — 4.1.2; amber-600 body text was 3.20:1 — 1.4.3; two quiz `aria-label`s
      overrode their visible wrapping labels — 2.5.3; signup fields gained
      `autocomplete` — 1.3.5. Also found and fixed off-list: the app ships seven
      `dark:` variants with no dark theme, and v4's `dark:` defaults to
      prefers-color-scheme, so dark-preferring machines got half a dark theme — now
      class-based, plus `color-scheme: light`.
- [x] **Copy pass.** Audited by concern with an adversarial refuter (75 findings
      confirmed of ~140 reported) plus my own extraction of every button label,
      confirmation and thrown error. Fixed: "School Settings" (LearnWorlds
      vocabulary, directly above a subtitle saying "academy"); "Enroll for real",
      a developer shorthand on the public course page, and American "Enroll"
      throughout; raw Stripe `past_due` rendered as "Past_due" on the billing page;
      Supabase's "Invalid login credentials" passed through verbatim on the
      most-used screen; "No tenant context" reaching a learner under the enrol
      button; "Please contact support" pointing at a support channel that does not
      exist anywhere in the product; "ingest" as a button label; and ~20 errors
      that said only that something failed. Four confirmations now name what is
      lost and whether it can be undone.

## 4. Correctness items already identified

- [x] **Admin shell never scrolls its sidebar.** Root is now `flex h-dvh
      overflow-hidden` instead of `min-h-screen`. Both the sidebar nav and `<main>`
      already carried `flex-1 overflow-y-auto`, which can only engage against a
      DEFINITE height — measured at 1280x720 with the real 42-item nav: 2013px of
      links in a 575px column, which instead made the whole document 2000px tall and
      pushed the email and sign-out footer off the end of it. `dvh` rather than `vh`
      because the admin area is used on phones, where a collapsing browser toolbar
      makes 100vh taller than the visible viewport. This was deferred last time as
      unverifiable; it is verifiable — AdminShell is a client component and renders
      in a probe.

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

- [x] **The UI kit's focus rings — the item's premise was WRONG, and the real defect
      was the opposite.** They rendered fine. Re-measured with a real keyboard Tab: a
      Button painted a white 2px offset plus a #171717 4px ring ON TOP OF the global
      brand-blue outline — three visual bands in two colours on one control, on every
      focusable element in the kit. The original "renders nothing" reading was taken
      while the DOCUMENT did not have focus, so `:focus-visible` never matched and the
      box-shadow was the unfocused baseline; that is the same artifact recorded in the
      accessibility log. Resolved by making the global outline the single treatment —
      it is the only one that reaches links, summaries and `[tabindex]` at all — and
      removing 47 competing ring utilities across 18 files. `focus-visible:border-ring`
      is deliberately kept: the field's own boundary darkening is a different signal,
      not a duplicate.

- [x] **The lesson player decides playability twice.** Now once:
      `resolveVideoSource(content, { libraryId })` in `lib/video-source.ts` returns a
      discriminated union — bunny | youtube | unavailable — and the JSX switches on
      `kind`. The `playable` const and the duplicated conditions are gone, and so is
      the `: null` fallback: the branches are exhaustive by construction, so the "empty
      space where the player belongs" hazard cannot be written any more. Kept free of
      `env` and of `lib/video.ts` (which imports React's `cache` and so cannot be
      unit-tested), which is what made 14 behavioural tests possible. Deferred
      originally as unverifiable — it is pure logic, so exhaustive unit tests are better
      evidence than a browser check.

- [x] **No prettier config in the repo.** Added `.prettierrc.json` matching the
      MEASURED style (single quotes 3176 vs 1647, semicolons, 2-space, printWidth 100
      — p99 line length is 102, and 100 minimises churn: 106 differing files vs 110 at
      90 and 125 at 120). Deliberately did NOT run a sweep: 106 of 167 files still
      differ, so this repo is hand-formatted, not prettier-formatted, and reformatting
      two thirds of it is a scope decision for the owner rather than a side effect of a
      config commit. The config exists so that IF anyone reaches for prettier it
      produces house style instead of double quotes and CRLF — the two things that
      actually caused damage. Also added `.gitattributes` (`* text=auto eol=lf`) and
      `.editorconfig`, and normalised 31 working copies that were LF in HEAD but CRLF
      on disk — every one a landmine that turns the next edit into a whole-file diff.

- [ ] **Run a prettier sweep, or decide not to.** NEEDS A DECISION: 106 of 167 files
      differ from `prettier --check` at the configured width. Formatting them is one
      zero-behaviour commit that makes `prettier --check` usable as a CI gate, at the
      cost of churning two thirds of the repo's `git blame`. Not mine to choose.

- [x] **My local gate did not include the E2E suite.** `npm run verify` in `web/` and
      `db/` now runs exactly what CI runs; ci-parity.test.ts fails if CI gains a step it
      does not. Turned out the `db` job was missing from my gate too, not just e2e.

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
      `youtubeUrl`. CHECKED 2026-08-05: of 3 video lessons, 1 still holds a
      `youtubeUrl` and 2 are Bunny-hosted; none hold both. So the branch is live and
      cannot be removed yet — migrating that one lesson to Bunny is the blocker, and it
      is the same lesson flagged for migration earlier. The renderer now lives behind
      `resolveVideoSource`, so retiring it is deleting one branch of a tested union.

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
- Mobile at 375px. Horizontal scroll turned out to be a non-issue — every learner
  page was already clean, measured, not assumed. Tap targets were the real problem,
  and the worst offenders were the shared primitives: `Input` at 36px and `Button`
  at 40px, i.e. almost every control a contractor touches. Fixing those mobile-first
  (`h-11 sm:h-9`) fixed whole pages at once and left desktop untouched, which I
  verified at both widths. Nine duplicated back-links at 20px became one component.
  The sidebar item was the most substantive: on a phone the lesson list was not
  collapsed, it was gone, so a `<details>` disclosure now carries the same
  `LessonNav` the desktop aside uses.
  The audit also found something that has nothing to do with mobile and matters more
  than any of it: the certificate's verification code carried `print:hidden`, sat
  OUTSIDE the `<article>`, and there is no `@media print` block anywhere to put it
  back — so printing, or Save-as-PDF on a phone, produced a certificate with no code
  and no verify URL. Unverifiable, which is the one thing that page exists to
  provide. The code now lives inside the certificate and prints, with the host to
  check it against. I used `env.appOrigin()` rather than `absoluteUrl()` on purpose:
  absoluteUrl throws on a loopback origin in production, which is right for an email
  link and would 500 the certificate here.
  Methodology note worth keeping: running the audit CONCURRENTLY with my own fixes
  made several agent findings stale, and their refuters caught that — "the reporter
  appears to have measured the pre-fix version". Better to audit, then fix. And the
  comment-matching trap bit in BOTH directions this time: two guards passed because
  the file's own doc comment contained the string, and one sabotage edited a comment
  instead of code. All source assertions in that suite now read comment-stripped.
  NOT verified: the outline, player and dashboard as served — still no authenticated
  session, so those three were measured via probes rendering the real components.
- Certificate print stylesheet. Verified by flipping every `@media print` block to
  `all` in the browser and reading computed styles before and after — the honest way
  to check print CSS short of rendering to paper. Confirmed: `min-height 812px → 0`,
  `justify-content center → flex-start`, `padding-top 56px → 0`, `box-shadow →
  none`, `break-inside auto → avoid`, and screen state restored afterwards. The
  certificate is 540px against ~1016px of printable A4 at 14mm margins, so it fits
  one sheet with room. Two things worth recording. First, my initial flip found only
  ONE print block and appeared to show `print:hidden` not working — Tailwind v4
  compiles its `print:` variants inside `@layer utilities`, so a top-level walk of
  `sheet.cssRules` misses them; recursing found four blocks and the rules applied
  correctly. Second, reading the markup found a defect the item had not asked about:
  `print:hidden` on the status row hid the Revoked badge, and since PrintButton
  already carries its own rule, that was the row's *only* effect. A printed revoked
  certificate now carries the warning at the top as well as the notice in the body.
  NOT verified: actual paper or PDF output — there is no way to render one from here,
  so this is computed-style verification, not visual. And the revoked path has no
  real data to test (61 certificates, 0 revoked), so I applied the exact class string
  the component emits for a revoked certificate to the live DOM and measured that,
  rather than revoking a real certificate.
- WCAG 2.1 AA sweep. Two of my own measurement methods were wrong before any finding
  was: my first contrast pass parsed digits out of `getComputedStyle().color`, which
  silently mangles every `oklch()` colour Tailwind v4 emits — it reported the "Valid
  certificate" badge at 1.03:1 when a canvas-based conversion puts it at 4.72:1,
  passing. And `:focus` styles cannot be measured unless the DOCUMENT has focus, which
  the preview pane only has right after a `computer` interaction; three readings said
  "still broken" when the fix was fine. Both are recorded because the wrong number is
  more dangerous than no number.
  Best finds: the skip link — v4 changed `.sr-only` from `clip` to `clip-path`, and
  `.skip-link:focus` released only `clip`, so on focus it became a correctly
  positioned 133x42 box, white background, brand outline, painting nothing whatsoever.
  And `--color-input` at 1.24:1: the border is the ONLY thing marking a field's extent
  because the fill is 1.05:1 against the page. #949494 was rejected on measurement —
  3.03:1 on white but 2.90:1 against the field's own fill, i.e. it fails on the side
  nobody checks.
  I declined the audit's fix twice. It wanted the Suspend button to surrender its red
  on hover (4.41:1); darkening to red-700 keeps the destructive cue at 5.91:1. And my
  own first instinct there was also wrong — `hover:bg-destructive/10` measures 4.13:1,
  worse than what it replaced.
  Sixteen guards proven red. The comment-matching trap struck a FOURTH time: a CSS
  guard passed because the block comment above the declaration contained the string it
  searched for. Every source assertion in this suite now strips comments first.
  NOT verified: the admin and player surfaces as served, still. And no screen reader
  was actually run — these are structural and computed checks, which is not the same
  as hearing what NVDA says.
- Copy pass. The refuters were worth more here than on any previous item: they threw
  out roughly half of what was reported, almost all of it padding a label that was
  already clear in context, and they caught a constraint I would have walked into —
  `friendly()` in nav-form.tsx passes a thrown message through only if it is UNDER 120
  characters, so two of the proposed "more helpful" errors would have been swallowed
  and shown as "Something went wrong." Every replacement is now length-checked, and a
  guard fails the build if any thrown error crosses the line.
  They also talked me out of a change I had queued: stripping the video id and vendor
  name from a builder warning. Admins are given infrastructure detail deliberately
  (video-unavailable.tsx documents the rule), so the id stays and only the missing
  retry instruction was added.
  Two findings came from my own guard rather than the audit, because the audit's
  concerns did not cover email templates or a second occurrence: "Congratulations!"
  in the certificate email (the only exclamation mark in the product), and a second
  "No tenant context" I had missed on my first pass. The unreachable twin in
  tenant.ts now throws the TENANT_NOT_FOUND sentinel that friendly() already maps,
  rather than carrying prose nobody will read.
  Twelve guards proven red. VERIFIED in a browser: "Sign in to enrol" on the real
  course page with no American or internal words anywhere in the rendered text, and —
  end to end against real auth — a deliberately failed sign-in now shows "That email
  and password do not match. Check them, or use Forgot password? to set a new one."
  in a role=alert, where it used to show Supabase's own wording.
  NOT verified: the admin surfaces as served, still no session; and the email copy was
  changed without sending one.
- Admin shell scroll. The item had been parked as "cannot see the admin area to
  check", which was true when it was written and stopped being true two passes later:
  AdminShell is a client component, so a probe page renders the real chrome. Worth
  remembering that a blocker can expire quietly.
  The defect was real and measurable: 2013px of nav inside a 575px column at
  1280x720, so `flex-1 overflow-y-auto` on both the nav and `<main>` was inert and the
  document itself grew instead. Fixed and verified at both sizes — desktop: document
  no longer scrolls, nav and main each scroll internally, footer pinned and visible;
  375px: aside hidden, main scrolls, the last row is reachable, no horizontal scroll,
  and the drawer still opens with its own scrolling nav and visible sign-out.
  It also broke one of my own guards, which is the interesting part: the admin-table
  suite asserted the literal string `flex min-h-screen bg-surface-muted` when all it
  cared about was that the shell is GREY (the reason those tables need a white fill).
  An over-specified guard fails on unrelated work, and the tempting fix is to delete
  it. Narrowed to the background alone and re-proven by turning the shell white.
  NOT verified: the admin routes as served — still no session, so this is the real
  component in a probe rather than /admin itself.
- UI kit focus rings. The item was wrong and I wrote it. The rings worked all along;
  what was actually broken was that every focusable control carried TWO indicators in
  two colours — the kit's near-black ring inside the global brand outline. The original
  measurement was taken without document focus, so `:focus-visible` never matched. That
  artifact is now recorded in three places, because it produced a false finding that
  sat in the backlog for two passes.
  Fixed by choosing one treatment: the global outline, which is the only one that
  covers links, summaries and `[tabindex]`. 47 ring utilities removed across 18 files;
  every one of the ten focusable primitives verified to still have exactly one
  indicator, including the Radix checkbox.
  I also introduced a regression mid-pass and caught it by measuring rather than by
  reasoning: my removal regex used a word boundary after `]`, which never matches, so
  every `focus-visible:ring-[3px]` survived — stripped of its colour class it fell back
  to currentColor and painted an OPAQUE near-black ring, worse than the translucent one
  it replaced. There is now a guard for exactly that shape, since a ring width with no
  colour is a silent downgrade.
  VERIFIED with real keyboard focus on a probe: link, Button, Input and a Radix
  checkbox each show a single 2px brand-500 outline and no ring bands; fields keep the
  border-darkening signal. NOT verified: the admin routes as served, and no screen
  reader was run.
- One playability decision. The player tested the same two conditions in two places —
  a JSX ternary and a `playable` const — and I had patched around the drift risk with a
  test rather than removing it. `resolveVideoSource` now returns a discriminated union
  and the JSX switches on `kind`, which makes the branches exhaustive: the `: null`
  fallback that was the actual hazard no longer has anywhere to live.
  The item was parked as "no way to verify playback without a session". That framing was
  wrong about what needed verifying — the decision is pure logic, so 14 unit tests state
  every case outright, including the one that matters most: a lesson carrying BOTH a
  Bunny id and a stale youtubeUrl must report host-not-configured rather than quietly
  playing the YouTube copy, because the YouTube path records no progress at all and a
  learner would finish a lesson the platform has no evidence of.
  Three older guards had to be rewritten, not relaxed — they were pinned to the shape
  being removed (`const unavailable`, `!playable &&`), while the invariants they protect
  now hold structurally. All eight guards proven red.
  Also checked the database while here, which answers the next item: 1 of 3 video
  lessons still holds a youtubeUrl, so the legacy branch is live and cannot be retired.
  NOT verified: actual playback. No session, so no video was played in a browser — the
  logic is tested exhaustively, the rendering is not.
- Prettier config, line endings, and a CI break I caused. The item offered two
  options — a config matching current style, or stop using prettier. Measuring settled
  it: even at the best-fitting width, 106 of 167 files differ, so no config "matches
  current style" and a sweep is a 106-file decision I should not take unasked. What I
  did instead fixes the damage prettier actually did: pin singleQuote and endOfLine so
  running it cannot produce double quotes or CRLF.
  The line-ending work is the substantive part. 31 tracked files were LF in HEAD but
  CRLF on disk, with nothing declaring a convention and zero files CRLF in HEAD — so LF
  was already the rule, unwritten. Normalising them produced NO diff (they matched HEAD
  once renormalised) and removed 31 landmines, each of which would have turned its next
  edit into a whole-file rewrite. That is not hypothetical: it happened last pass, where
  a 26-line change showed as 932 changed lines. The cause was my own Python text-mode
  writes, which translate to CRLF on Windows — the Write tool is fine.
  Guard scoped to web/ and db/ on purpose: the legacy Vite prototype at the root is 127
  CRLF files that CLAUDE.md schedules for deletion, and drizzle's migration metadata is
  covered by the append-only rule. Six guards proven red.
  And the thing that matters most from this pass: the user showed me CI was RED on my
  previous commit. My gate ran vitest and never Playwright, so I had claimed a green
  build on a red one. The break was my accessibility fix removing the placeholder the
  smoke test asserted; the test now asserts the label, which is both correct and
  unbreakable by the same improvement. `npm run e2e` is part of the gate from now on.

- **The gate is now one command per workspace, and a test guards it.** Last pass I said
  "`npm run e2e` is part of the gate from now on", which was a promise, not a mechanism.
  Replaced it with `npm run verify` — `web/` runs typecheck, lint, vitest, build,
  Playwright; `db/` runs `drizzle-kit check` and tsc. Writing it out exposed a second
  hole I had not noticed: the `db` job was never in my gate at all, so the migration
  consistency check had gone unrun for the whole backlog (it passes). ci-parity.test.ts
  reads ci.yml, extracts every `run:` per job, and fails if any is absent from that
  workspace's `verify`, so the next step added to CI cannot silently skip my gate.
  Proven red five ways: dropping e2e from verify, dropping the drizzle check, adding a
  CI step that verify does not run, reverting an action to the deprecated v4, and
  letting one job's Node pin drift. Also fixed the deprecation warning on every CI run —
  it was the *action* runtime (checkout/setup-node@v4 target Node 20), not our
  `node-version: 20`, which CLAUDE.md pins deliberately; both actions are now @v5.
  Stated in CLAUDE.md rule 13, including the gap `verify` cannot close: it matches CI's
  commands but not its runtime, since this machine is Node 18.20.1 and CI is Node 20.
