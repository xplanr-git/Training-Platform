# Training Platform — Remediation Register

Working log for the fixes raised in
[Training-Platform-Full-Review_Report_2026_08_13__09_33.md](Training-Platform-Full-Review_Report_2026_08_13__09_33.md).

**Branch:** `fix/review-remediation-2026-08-13` (off `main` @ `76fbbd1`)
**Rule:** one issue at a time; `npm run verify` green before the issue is logged closed.

## The gate

`npm run verify` at the repo root fans out to `db` and `web`. In `web` it is:

```
format:check → typecheck → lint → test (vitest) → build → e2e (Playwright) → test:live
```

> **Doc drift found:** CLAUDE.md §7.13 describes this as "typecheck → lint → vitest → build →
> Playwright". It omits **`format:check`** (which runs *first*, and is what failed on the first
> attempt at Issue 1) and **`test:live`** (last). Worth correcting in CLAUDE.md — a contributor
> who trusts §7.13 will be surprised by a Prettier failure before any test runs.

**Baseline before any change:** `EXIT=0` — fully green (588 unit tests, build, Playwright).
Recorded deliberately, so "no regression" is measured against a known state rather than assumed.

> **Watch the exit code, not the notification.** These runs are wrapped as
> `(npm run verify > log 2>&1; echo "EXIT=$?" >> log)`. The harness reports the *subshell's*
> status, which is always 0 because it ends in `echo` — the first run of Issue 1 was reported
> "exit code 0" while the log said `EXIT=1`. Always `grep EXIT= <log>`.

> **Stop the dev server before running the gate.** A `next dev` on port 3010 holds
> `web/.next`, and `next build` then dies with
> `EPERM: operation not permitted, open 'C:\Training-Platform\web\.next\trace'`. It looks like a
> build regression and is not one — all 625 tests had already passed in the same run. Seen once
> during Issue 9 after leaving the preview server up from a browser check.

---

## Closed

### Issue 1 — Ambiguous, host-dependent dates ✅

**Severity:** P0 (certificate integrity) · **Report §3.4**

Three sites called `toLocaleDateString()` with no arguments. They are server components, so the
locale came from the renderer — `en-US` on Vercel. A certificate issued 11 August 2026 printed as
`8/11/2026`, which most of the world reads as 8 November, **on the public `/verify/:code` page whose
only job is to be trusted by a third party checking someone's credential.**

**Fixed**

- **New** `web/src/lib/format-date.ts` — `formatDateLong` (`11 August 2026`), `formatDateShort`
  (`11 Aug 2026`), `formatCount` (`5,000`). All pin `en-GB` **and** `timeZone: 'UTC'`.
  - The month is spelled/abbreviated deliberately: the point is not that British ordering beats
    American, it is that `11 Aug 2026` cannot be misread by anyone. A numeric date always can.
  - UTC is pinned because the timestamps are stored in UTC, so it is the only rendering that
    cannot disagree with the stored value. A cert issued 23:00 UTC would otherwise date a day
    late for every reader east of Greenwich. No-op on Vercel today — that is the point.
- `web/src/app/verify/[code]/page.tsx` — issued date and revoked date.
- `web/src/app/t/[slug]/admin/certificates/page.tsx` — issued column (short form, keeps the
  column narrow).
- `web/src/components/course-complete.tsx` — routed through the helper. It already used `en-GB`
  correctly and inline; it was the one place that had it right, and is now the shared source.
- `web/src/app/t/[slug]/admin/settings/billing/page.tsx` — `formatCount`. Found by the new guard,
  not by the review: `activeLearnerLimit.toLocaleString()` groups digits per host locale
  (`5,000` vs `5.000`). Same bug class, one severity down.

**Scope note:** whether a credential should be dated in the *issuing academy's* timezone rather
than UTC is a product decision needing a tenant-timezone column. Not decided here; pinning UTC
makes today's behaviour explicit and deterministic instead of accidental. Flagged in the helper's
doc comment.

**Tests** — `web/tests/unit/format-date.test.ts`, 8 tests:
behaviour (long/short/count, `Date`/string/epoch inputs, `—` instead of `Invalid Date`), an
explicit **"never emits an all-numeric date"** assertion, a **UTC day-boundary** test at 23:30Z and
00:30Z, and a **fitness guard** that fails if any file in `src/` reintroduces a zero-argument
`toLocale*String()`. The guard is what caught the billing page.

**Validated**
- 8/8 new unit tests pass.
- Rendered in a real browser against production data: **"Issued 11 August 2026"** (was `8/11/2026`),
  no numeric date anywhere on the page.
- `npm run verify` — see status below.

---

### Issue 2 — `/verify` returned 404 while every certificate points there ✅

**Severity:** P0 (certificate integrity) · **Report §3.1** · **Commit** `31bb39e`

The certificate footer prints `Verify at <host>/verify`. It sits inside the `<article>` so it
survives Save-as-PDF, and it is the only instruction a third party gets. That URL 404'd —
"Page not found" is the worst possible answer to "is this certificate real?", because it reads as
though the issuer is fake.

**Fixed**

- **New** `web/src/app/verify/page.tsx` — the lookup page. A plain **GET form** back to the same
  route, redirecting server-side on `?code=`. No client JS and no Server Action, deliberately:
  this page is opened by people with no account, on someone else's device, often from a printed
  page, so it must work before hydration and with JS disabled. It also sidesteps the Server-Action
  redirect caveat documented in `nav-form.tsx`.
- **New** `web/src/lib/verification-code.ts` — normalises a pasted value into a bare code.
- `web/src/app/verify/[code]/page.tsx` — the not-found state was terminal (a mistyped character
  left the reader with only the address bar); it now offers **"Try another code"**. Per §7.16 the
  lines touched came to system: `text-xl` (20px, off-ramp) → `text-h1`, unsized `<p>` (16px) →
  `text-body`. Added a static title, deliberately **not** the learner's name — a name in the tab
  title follows the reader into their history and any screen share.

**The test found the sharpest bug, not the review.** The printed string is `<host>/verify` with
**no code**. Taking the last path segment yields `"verify"`, which would have redirected to
`/verify/verify` and answered a sincere "is this real?" with a confident *"Certificate not found"*
— on the single most likely paste. Now treated as "no code given", leaving the reader on the form.

**Tests** — `web/tests/unit/verification-code.test.ts`, 8 tests: bare code, case preserved
(`/verify/:code` matches verbatim), four URL shapes, trailing slash / query / fragment, whitespace,
inner-whitespace rejection, and the printed-URL case above.

**Regression caught by an existing guard.** `empty-state-conventions.test.ts` matches the literal
`length === 0` in a page and requires an `<EmptyState>` in that branch. My `entered.length === 0`
was form validation, not absent content. Fixed by writing `!entered` — matching the guard's literal
— rather than adding an exemption, which would have blunted the guard for the pages it polices.

**Validated** — five flows in a real browser against production data: bare code → certificate;
pasted full URL → certificate; printed URL (no code) → stays on form; empty submit → corrective
hint; bad code → not-found **with** a way out. New page measures h1 24px / body 14px / meta 12.5px
(correct `text-meta`, not the `text-xs` 12px used elsewhere), 9.43:1 contrast, associated label,
`aria-describedby`, no overflow. `npm run verify` `EXIT=0` (604 tests, 51 files).

---

### Issue 3 — Revoked certificates still shown to the learner as earned ✅

**Severity:** P0 (certificate integrity) · **Report §3.2**

Neither learner surface filtered on `revokedAt`. An admin could withdraw a credential — the
deliberate act of revoking it — and the learner's dashboard kept counting it in the "Certificates"
tile and kept offering a working **"View your certificate"** button, while the course page kept
congratulating them. They would find out only when someone else checked the code.

**Fixed** — revocation is reversible (`setCertificateRevoked` sets `revokedAt` to a date or back to
`null`) and audited, so all three states are handled rather than the row being filtered out.

- `web/src/app/t/[slug]/dashboard/page.tsx` — selects `certRevokedAt`; the Certificates tile counts
  only unrevoked; the row renders **"Certificate revoked — <date>"** instead of "View certificate".
- `web/src/app/t/[slug]/learn/[courseSlug]/page.tsx` — selects `revokedAt`, passes it through.
- `web/src/components/course-complete.tsx` — a third branch stating the withdrawal and its date,
  pointing at the admin, with the review action kept.

**Deliberate choice:** the link to `/verify/:code` **stays live** when revoked. That page states the
withdrawal and its date, and the learner is entitled to see exactly what a third party sees. What
changes is that nothing claims they hold it. Hiding it would be a second, quieter dishonesty.

**Tests** — `web/tests/unit/course-complete.test.tsx`, 4 render tests (Testing Library): held →
button + code + issue date; revoked → **no** "View your certificate", states withdrawal + date,
status link still present; missing → admits it; `revokedAt` with no code → treated as no
certificate, never links to `/verify/null`.

> Matched the project's assertion style (plain `toBeTruthy` / `toBeNull` / `getAttribute`) rather
> than adding a jest-dom setup file — `nav-form.test.tsx` establishes that convention and there is
> no vitest setup file.

---

### Issue 4 — Course deletion destroyed certificates without saying so ✅

**Severity:** P0 (certificate integrity) · **Report §3.3**

Cascade verified in `db/schema.ts`: `enrollments.course_id → courses` and
`certificates.enrollment_id → enrollments`, both `onDelete: 'cascade'`. So deleting a superseded
course also destroys every certificate it ever issued, and with them every public `/verify/:code`
page a learner may already have shown to a client or an auditor.

The confirmation said only *"Delete this course and all its content? This cannot be undone."* The
danger-zone paragraph listed "sections, lessons, quizzes, and enrolments" — **certificates were the
one thing not named**, and they are the most consequential thing destroyed. "Content" does not read
as "the credentials your learners hold".

**Fixed** — `web/src/app/t/[slug]/admin/courses/[courseId]/page.tsx`

- The confirmation now names certificates *and* the verification links, and that none of it can be
  undone.
- The danger zone shows **the real count for this course** ("This course has issued 3
  certificates…"), fetched with `count()` in the same `Promise.all` as the course row rather than a
  serial round trip. It sits on the page, not only in the dialog, so it is visible **before** the
  click — and a real number resists the click-through that a generic warning invites.

> **Why the confirm text stayed a literal.** `copy-conventions.test.ts` matches
> `confirm="([^"]+)"` — a literal attribute. Making it a dynamic expression to interpolate the
> count would have **silently exempted it from the guard**. Putting the count in the body copy
> keeps the guard live and puts the number somewhere more useful. Same principle as Issue 2: do not
> weaken a guard to fit the change.

**Tests** — `web/tests/unit/destructive-disclosure.test.ts`, 3 tests. Two assert the copy names
certificates and verification, and that the count is a `count()` rather than fetched rows. The
third asserts **the cascade still exists in the schema** — if someone later changes either FK to
`restrict`, the warning becomes a lie in the other direction, and that test is the prompt to
revisit the wording rather than leave it stale.

**Validation gap, stated plainly:** the destructive path was **not** exercised. Proving the cascade
by deleting a production course is not an acceptable test. Evidence is the schema assertion above,
plus the query shape being identical to the working `count()` + `innerJoin` at
`admin/people/page.tsx:62-65`, a page confirmed rendering in production during the review.

---

### Issue 5 — A no-certificate course told the learner their certificate had failed ✅

**Severity:** P0 (certificate integrity) · **Report §3.6**

`courses.certificateEnabled` is a first-class toggle in the course editor ("Turn off for courses
that don't award one"), and `finalizeCourseCompletion` honours it by creating no certificate row
(`web/src/lib/completion.ts:114`). But the learner course page only selected `{ id, title }`, so
`CourseComplete` saw a missing certificate and rendered the *issuance-failed* branch: **"Your
certificate has not been issued yet — contact your academy administrator."**

Every learner finishing such a course was told the platform had failed them, and sent to an admin
who then had nothing to fix. A working configuration was generating guaranteed support load.

**Fixed**

- `web/src/app/t/[slug]/learn/[courseSlug]/page.tsx` — selects `certificateEnabled` and passes it
  through.
- `web/src/components/course-complete.tsx` — a fourth branch. It says the course is finished and
  **names why there is no certificate**, so the absence is not a mystery, rather than staying
  silent about it.

The prop defaults to `true`, matching the column default, so nothing changes for courses that
issue today.

**Tests** — 2 added to `course-complete.test.tsx` (now 6). One asserts the opt-out branch shows no
failure language and never says "administrator"; the other asserts the **genuine issuance failure
is still reported** when `certificateEnabled` is true — the opt-out must not swallow the real error
case sitting next to it.

**Validation gap:** render tests only. Both branches are learner-authenticated, and the local dev
server cannot be signed in without handling a password.

---

### Issue 6 — `deleteSection` stranded learners at 100% with no certificate ✅

**Severity:** P0 (certificate integrity) · **Report §3.5**

Removing course content lowers the denominator progress is derived from, so a deletion can complete
a course for a learner who did nothing. Completion is otherwise materialised only by a learner
completion event — so an unreconciled deletion leaves the course reading **"100% complete"** with
the enrollment still `active`, no certificate ever issued, and no way for the learner to trigger one.

`deleteLesson` handled this, with a comment explaining why. `deleteSection` did not — and
`lessons.section_id → sections.id ON DELETE CASCADE` means deleting a section removes **every lesson
in it**. So the bug scaled with the size of the tidy-up, while the single guarded path handled the
smallest possible case.

**Fixed**

- **New** `reconcileCourseCompletions({ tenantId, courseId })` in `web/src/lib/completion.ts` — the
  pass extracted from `deleteLesson`'s inline body.
- `builder/actions.ts` — `deleteLesson` now calls it; `deleteSection` now calls it (and returns the
  deleted row from its transaction so it can tell whether anything was removed). The now-unused
  `enrollments` import was dropped.

> **The real defect was where the rule lived.** It existed only as a comment *inside* `deleteLesson`,
> so the author of `deleteSection` had no way to know it applied to them. Extracting the helper puts
> the rule somewhere discoverable; the guard below enforces it.

**Tests** — `web/tests/unit/completion-reconciliation.test.ts`, 5 tests. Beyond asserting both
actions reconcile, the durable one **parses every exported action and fails any that deletes from
`lessons` or `sections` without reconciling** — so it fires on the *next* such action rather than
these two. The last test asserts the section→lesson cascade still exists, since that is the fact
that makes the reconciliation necessary.

> **Guard verified non-vacuous.** A source-scanning guard that matches nothing passes silently, so I
> checked its scope directly: it matches exactly `deleteSection` and `deleteLesson` out of 10
> exported actions. Before this fix `deleteSection` would have been in scope and failing.

**Validation gap:** static and unit only. Exercising it would mean deleting a section from a
production course with live enrolments.

---

### Issue 7 — The tenant row was fetched 3–4× per page load ✅

**Severity:** P1 (speed) · **Report §4.1**

`requireAdminForSlug` was **not** wrapped in `cache()` while its siblings `getTenantContext`,
`currentMembershipRole` and `isPlatformAdmin` all were — so the same `tenants WHERE slug` ran once
for the admin layout and again for the page beneath it. On top of that the tenant shell selected
`status, name`, the admin layout selected `name`, the storefront repeated it across
`generateMetadata` and the page body, `/join` did it twice in one file, and Academy Settings
re-queried the same row by `id`.

Worse than a wasted query: `db/client.ts` configures a **5-connection pool**, so under concurrency
the copies stop overlapping and serialise into extra waves before a single row of real data is
fetched.

**Fixed** — new `tenantBySlug(slug)` in `web/src/lib/tenant.ts`, wrapped in React `cache()` so it
deduplicates for the lifetime of one request. It selects the union of what every caller needs
(`id, status, name, branding`) — one slightly wider row beats four narrow ones. Converted **six**
read sites:

`t/[slug]/layout.tsx` · `t/[slug]/admin/layout.tsx` · `t/[slug]/page.tsx` (metadata + body) ·
`t/[slug]/join/page.tsx` (both) · `t/[slug]/courses/[courseSlug]/page.tsx` ·
`t/[slug]/admin/settings/page.tsx`

`requireAdminForSlug` keeps its exact declaration and its literal `'suspended'` / `'cancelled'`
checks — `authz-conventions.test.ts` slices that function's body **by name**, and 47 assertions
depend on it. Verified still green.

**Deliberately not converted:** `signup/actions.ts` (slug availability) and `join/actions.ts`
(resolves inside a mutation). Both are write paths that must see the live row, not a value cached
earlier in the same request.

**Tests** — `web/tests/unit/tenant-lookup-conventions.test.ts`, 3 tests: `tenantBySlug` is
`cache()`-wrapped; `requireAdminForSlug` resolves through it and no longer queries `tenants`
itself; and no page or layout resolves a single tenant for itself.

> **Guard scoped and verified.** First version was too broad — it flagged
> `app/platform/page.tsx`, which lists *every* tenant for the platform console and has nothing to
> deduplicate. Narrowed to queries filtered by `tenants.slug`/`tenants.id`. Then checked against
> the pre-fix code at `ac848e1`: it flags **all six** converted sites and correctly passes the
> platform console.

**Validation gap:** the "before" (~800 ms shell, 1.0–1.9 s data on every admin page) was measured in
the browser during the review; the "after" cannot be measured without deploying. This is a
correct-by-construction fix, not a measured one — the same standing the `getSession` optimisation
in `t/[slug]/page.tsx` documents for itself.

---

### Issue 8 — Paginated admin lists ran COUNT and rows sequentially ✅

**Severity:** P1 (speed) · **Report §4.3**

Courses, People and Certificates each awaited a `count()`, derived `meta` from it, then awaited the
page of rows — two sequential round trips on every visit, where the queries are independent.

They *looked* dependent, which is why they were written that way: `rowsAt` needs `meta.offset`, and
`meta` needs the total. **The storefront had already solved this** (`t/[slug]/page.tsx`) — derive the
offset directly from `?page=`, run both together, and re-query only when the clamped offset differs
(i.e. only when `?page=` is past the end). The three admin lists were left behind. This reuses that
pattern verbatim rather than inventing a second one, and carries the same warning comment: passing a
provisional total of `0` to `pageMeta` would clamp every request to page 1 and silently serve the
first page's rows for every page.

The People page also had a **third** independent query (the pending join-requests list) running
after the other two; it now joins the same batch, taking that page from three waves to one.

**Files** — `admin/courses/page.tsx`, `admin/certificates/page.tsx`, `admin/people/page.tsx`.

**Validation gap:** same as Issue 7 — measured before, not measurable after without deploying.

---

### Issue 9 — Skip link ✅ (and a retracted review finding)

**Severity:** P2 (a11y) · **Report §5.3 / §5.4**

> ### ⚠️ The review was wrong about this, and the correction matters more than the fix
>
> §5.3 claimed the admin skip link was "1×1px and never becomes visible on focus", called it a WCAG
> 2.4.7 failure, and made it item 4 in the recommended work order. **It works correctly.**
>
> Re-tested with a real `Tab` press in a focused window: **139×41, `position: fixed`, top-left,
> `clip-path: none`, visible focus ring** — confirmed by screenshot. `globals.css:305` has had a
> correct `.skip-link:focus` rule all along, with a comment explaining the Tailwind v4 `clip-path`
> subtlety it already had to solve.
>
> **Root cause of the false positive:** a programmatic `element.focus()` does **not** match `:focus`
> while the document lacks window focus. The probe focused the link, measured 1×1, and reported a
> broken skip link. This is the **same class** as the focus-ring false positive caught before
> publishing (46 elements "missing" focus rings that all have them) — caught once, missed once.
>
> **Rule going forward:** never assert a focus-state defect from programmatic focus. Use a real key
> press, in a window that has focus, or do not test it. Written into the component and test comments
> so the next person does not repeat it.

**What was actually real** — there was **no skip link on any learner surface**. It mattered most on
the lesson player: the entire `LessonNav` sits in an `<aside>` **before** `<main>`, so on a
twenty-lesson course a keyboard learner tabs twenty links to reach the video they just opened —
every time they advance a lesson. (Independently found by the code audit at
`learn/[courseSlug]/[lessonId]/page.tsx:259`.)

**Fixed** — extracted `web/src/components/skip-link.tsx` from the inline markup in `admin-shell.tsx`
so the pattern is discoverable, used it in both, and added `id="main-content"` to the player's
`<main>`.

**Tests** — `web/tests/unit/skip-link.test.tsx`, 4 tests: renders with **both** classes (`.sr-only`
hides, `.skip-link:focus` reveals — one without the other is the broken state); the **CSS rule still
exists** with `width/height: auto` and `clip-path: none`; both surfaces render it with a matching
`<main id>`; and the player renders it **before** the outline, since a skip link after the nav it
skips is useless.

> The ordering test failed on its first run — `indexOf('<aside')` matched the prose in my own comment
> explaining the fix. Comments are now stripped first, as the repo's other source-scanning guards do.

---

### Issue 10 — Every admin page shared one browser title ✅

**Severity:** P2 (polish) · **Report §5.10**

All thirteen admin screens rendered the root layout's static `Outdure Academy`. Tabs, history
entries and bookmarks were indistinguishable, and an admin with several tabs open could not tell
which was which.

**Fixed**

- `t/[slug]/admin/layout.tsx` — `generateMetadata` supplying
  `{ default: '<Academy> admin', template: '%s · <Academy>' }`. The template lives **here rather
  than in the root layout** so it uses the academy's own name, which is also what makes it correct
  for a second tenant. It costs nothing: `requireAdminForSlug` has already resolved that row through
  the request-cached `tenantBySlug` added in Issue 7, so it is a map lookup.
- All **13** admin pages now set a short title — Dashboard, Courses, New course, Edit course, Course
  content, Quiz, People, Insights, Certificates, Certificate template, Academy settings, Billing,
  Coming soon.

**Tests** — `web/tests/unit/page-title-conventions.test.ts`, 4 tests: the layout supplies the
academy-scoped template; **every** admin page sets a title (so a new page fails until it does); no
two claim the same title; and a fourth asserting the page glob resolves to **at least 13 files** —
guarding the guard, since a glob that resolves to nothing would let the other two pass while
asserting nothing.

**Not included:** the learner tree. `t/[slug]/page.tsx`, `courses/[courseSlug]` and `join` already
set good titles of their own; the learner dashboard and the two `learn/` routes still inherit the
root default. Adding a template at the tenant layout would need `title: { absolute }` on the three
that already have full titles, so it is a separate change rather than a rushed one.

---

### Issue 11 — Design-system pass, part 1: motion + side-nav grammar ✅

**Severity:** P3 (DS conformance) · **Report §6**

**`prefers-reduced-motion` (Guidelines §7 and §8, required outright).** There was **no handling
anywhere** — zero occurrences of `prefers-reduced-motion`, `motion-safe` or `motion-reduce` across
`src/` — against 17 `transition-colors`, two `animate-spin` and the `animate-pulse` skeletons. The
skeletons are what make this a real accessibility item rather than a box to tick: every admin
navigation shows a large pulsing block for about a second, and a repeating pulse over a large area
is exactly the pattern that triggers vestibular symptoms. Added an unlayered `@media` block using
`0.01ms` rather than `none`, because a `0s` transition can skip `transitionend`, which some
libraries wait on before cleaning up.

**Side-nav grammar.** Three violations of rules the system states explicitly:

| Was | Now | Rule |
|---|---|---|
| `rounded-md` (4px pill on every row) | square | §2 "Navigation hover/selection is **square** (no radius)" |
| grey wash on **hover** | label darkens on hover; wash moved to `active:` (press) | §6 "Hover = the label darkens to ink (rows may take a square grey wash on **press**)" |
| `px-2.5` (10px), `px-1.5` (6px) | `px-3` (12), `px-2` (8) | §2 spacing scale — "do not invent intermediate values" |

**The missing ramp token.** 13.5px is the system's *named* standard interactive/label size — "use it
for all controls and navigation" — and it was **the one named size with no token**, so nav and
controls defaulted to `text-sm` (14). Added `--text-control: 0.84375rem`; the "Soon" badge also went
from an off-ramp `text-[10px]` to `text-eyebrow` (11).

**Verified in a real browser** — the complete ramp now measures to spec:
`display 32 · h1 24 · h2 19 · body 14 · **control 13.5** · meta 12.5 · **eyebrow 11**`, all matching
expected values exactly.

> **A stale dev stylesheet nearly produced a fourth false conclusion.** The first measurement
> reported `text-control` and `text-eyebrow` at **16px**, which reads as "the token does not work".
> Fetching the compiled CSS directly showed both utilities present and correct; the dev server had
> simply served a stylesheet compiled before the edit. Re-measuring gave the right values. **Fetch
> the compiled artifact before concluding a token is broken** — a computed style from a dev server
> mid-recompile is not evidence.

**Tests** — `web/tests/unit/nav-grammar-conventions.test.ts`, 7 tests: nav row is square, hover
darkens rather than fills, press keeps the wash, current item is an underline and **not** a
`border-l-2` side bar, uses `text-control` with the token defined, spacing is on-scale; plus the
reduced-motion block with its `0.01ms`-not-`none` detail.

> The class-extraction helper was wrong first: it sliced past the `<Link>` tag and swallowed the
> "Soon" badge and mobile drawer trigger, which carry a legitimate `rounded-sm`, `py-0.5` and
> `hover:bg-`. It failed against a nav that was already correct. Now bounded to the opening tag.

**Not yet done in §6** (deliberately, as separate changes): `text-xs` (12px) → `text-meta` (12.5)
across ~30 sites; page-description `<p>` 16px → `text-body`; Button/Input 14px → `text-control`;
one table density (52/53px vs 36/37px, spec is ~44); ink keyline 2px → 1.75px; delete icons off
status red.

---

### Issue 12 — The invitee's first screen said their link was already dead ✅

**Severity:** P2 (UX) · **Report §5.6**

`/auth/set-password` is where every invited user lands. `hasSession` starts `false`, so the card
description rendered **"This link is no longer valid."** for the entire session check — a full JS
download **plus** an auth round trip — directly beneath the heading *"Choose a password"*.

The least forgiving audience there is, told on arrival that they were too late. The predictable
response is to close the tab and email whoever invited them, which is support load generated by a
page that was working correctly.

**Fixed** — the copy is now optimistic until the check **resolves**, not until it succeeds. The
invalid case is the rare one, so it is no longer the default; the failure line appears only once the
check has come back and actually failed. The "Checking your link…" status also gained `role="status"`
so the transition is announced rather than silently swapping under a screen-reader user.

**Tests** — `web/tests/unit/set-password.test.tsx`, 3 tests driving the three real states by mocking
`getUser`: **in flight** (a promise that never resolves — the state users actually sat in) shows the
normal copy and no failure text; **resolved with a session** shows the form; **resolved empty** shows
the failure *and* still offers "Send me a new link" rather than being a dead end. The first test
fails against the old code, so it is a genuine regression guard rather than a restatement.

**Validation:** unit only. The defect lives in a transient loading state that cannot be held open in
a browser, which is exactly why mocking the pending promise is the right instrument here.

---

## Open — next up

In report §8 order:

5. Completing a no-certificate course reports a failure (§3.6)
6. `deleteSection` strands learners at 100% with no certificate (§3.5)
7. `cache()` the tenant lookup; `Promise.all` the paginated COUNTs (§4.1, §4.3)
8. Prune the 35 dead nav items; give `coming-soon` a way out (§5.1–5.2)
9. Make the skip link visible on focus (§5.3)
10. Per-page `metadata` titles (§5.10)
11. DS token pass: keyline 1.75px, nav radius 0, `text-xs` 12.5px, body 14px, controls 13.5px,
    one table density, `prefers-reduced-motion` (§6)
