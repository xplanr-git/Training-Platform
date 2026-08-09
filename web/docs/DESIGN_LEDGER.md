# Design Ledger — Training Platform → sb-ui v3.0

Live ledger for `design/sb-v3` on `web/` (see `CLAUDE_CODE_BRIEF.md`). Presentational only.
Checks A–J defined in the brief §P3. Update `Last run` + SUMMARY every run.

Last run: 2026-08-09 — run 1 (P0–P2 + public/auth routes)

**How a route is verified.** Not by screenshot: the browser pane is not displayed
in this environment, so every PASS below is a computed-style / DOM-class
measurement taken against the dev server at :3010, which is stricter anyway.
The per-route sweep fetches the route, parses it, and asserts the rendered DOM
carries zero `-brand-N` utilities, zero `rounded-full|2xl|3xl` outside
avatars/dots, zero `shadow-md|lg|xl` outside floating layers, and zero off-token
`neutral|slate|gray|zinc` greys. Scanning raw HTML does NOT work — the dev
server inlines the whole compiled stylesheet, so every page appears to contain
every utility in the app.

**Type decisions (P1):** h1 700/-0.02em (3xl front doors, 2xl working pages — existing scale kept) · section headings ≥700, never below text-base · eyebrows 11/700/uppercase kickers only · table headers 12.5/600 muted, no uppercase.

**A11y invariants (never regress):** input boundary ≥3:1 (#858585 class), global :focus-visible, skip link, color-scheme: light, class-based `dark:` variant inert.

| Route / surface | Status | Last checked | Notes |
|---|---|---|---|
| globals.css tokens + layout font | PASS | 2026-08-09 | Inter via next/font. Focus moved to its own `--color-focus` — it was `--color-brand-500`, which is now ink, so the app's one focus ring would have gone invisible with every test green. Added `--color-foreground-2` (sb `--text-2`). Status tints made opaque; see NOTES. |
| ui/ kit primitives (P2.1–P2.10) | PASS | 2026-08-09 | Table keyline rule encoded in the primitive, not the 4 call sites. Chevron right→down. `StatusBadge` added with the dot. Button sizes untouched (44px tap target). |
| / (root landing) | PASS | 2026-08-09 | Two hand-rolled anchors (neutral-900 fill / neutral-300 outline) replaced with the Button kit — a second button language on the front door. |
| /login + /login/forgot | PASS | 2026-08-09 | Ink medallion; "Forgot password?" and "Back to sign in" are real text links → `text-link`. Card takes the sanctioned hairline (white-on-white nesting, GUIDELINES §4b). |
| /signup | PASS | 2026-08-09 | h1 inherits 700/-0.02em from base; `text-neutral-600` → `text-foreground-2`. |
| /auth/set-password · /auth/auth-code-error | PASS | 2026-08-09 | Ink medallion, hairline card, `text-red-600` → `text-destructive`. `/auth/confirm` is a route handler with no UI — nothing to style. |
| /t/[slug] (storefront) | PASS | 2026-08-09 | DOM-verified. Nav links → `text-link`. Course-card hover was `border-brand-500 + shadow-md`; now an ink hairline, no shadow. `branding.primaryColor` untouched and still applies to the hero h1 and the card CTA — the two accent points the brief sanctions. |
| /t/[slug]/join | PASS | 2026-08-09 | DOM-verified. |
| /t/[slug]/courses/[courseSlug] (course landing) | PASS-src | 2026-08-09 | `text-neutral-700` → `text-foreground-2`. Needs a published course to render; source-verified + build. |
| /t/[slug]/dashboard | PASS-src | 2026-08-09 | Certificate link → `text-link`, keeps its `py-3` tap target. Requires auth. |
| /t/[slug]/learn/[courseSlug] (outline, player, quiz, complete) | PASS-src | 2026-08-09 | Completion cues → `text-status-green`. Quiz option selected = ink border on sunken (was `border-brand-500`/`bg-brand-50`), native `accent-primary`. Lesson-nav active = sunken + 2px inset ink marker via a transparent-when-inactive left border, so selecting does not shift the list. Requires auth + enrolment. |
| /t/[slug]/admin (dashboard) | PASS-src | 2026-08-09 | Nav active = sunken + 2px inset ink marker (transparent-when-inactive left border, so switching items does not shift the labels). Stat tiles borderless white on the sunken shell; `hover:shadow-md` replaced with an ink hairline. |
| /t/[slug]/admin/courses (+ editors, reorder, video-upload) | PASS-src | 2026-08-09 | Status → `StatusBadge` (published green / draft amber / archived grey). Upload progress bar ink on sunken, squared. Builder disclosure loses its underline — an underline means "link". |
| /t/[slug]/admin/people | PASS-src | 2026-08-09 | Status → `StatusBadge`. The Connect **tier** stays a plain squared Badge with NO dot — see NOTES. "Requests to join" is a flush list, so it takes the 2px header + 1px item keylines, not table dividers. |
| /t/[slug]/admin/analytics | PASS-src | 2026-08-09 | No charts exist yet — both panels are tables, already fully `tabular-nums`. KPI figures to 800/-0.02em. `--color-cat-1..5` are defined and unused; the first chart to land takes them. |
| /t/[slug]/admin/certificates | PASS-src | 2026-08-09 | Valid → green, Revoked → red. |
| /t/[slug]/admin/settings (+ billing) | PASS-src | 2026-08-09 | Billing's hand-rolled `bg-brand-600` button — the last blue fill in the admin area — moves to the kit. Branding colour swatch keeps its arbitrary tenant colour. |
| /t/[slug]/admin/coming-soon | PASS-src | 2026-08-09 | The round pale-blue "Coming soon" pill becomes a squared grey status tag with its dot. |
| /dashboard (cross-tenant) | PASS-src | 2026-08-09 | `text-neutral-600` → `text-foreground-2`. Requires auth. |
| /platform (platform admin) | PASS-src | 2026-08-09 | Tenant status map → tones (active green, trial blue, past_due amber, suspended red, cancelled grey). Requires platform admin. |
| /verify/[code] | PASS | 2026-08-09 | DOM-verified (not-found branch). **The default accent was `#2563eb`** — every tenant without a configured colour printed a blue-framed certificate. Now ink; tenant `accentColor` still wins. Status pill squared with its dot; print behaviour unchanged and re-guarded. Card shadow dropped — the 3px accent frame is the frame. |
| error.tsx / global-error / not-found / loading + skeletons | PASS | 2026-08-09 | DOM-verified via a 404. Hand-rolled brand-600 buttons → kit. "404" becomes a proper eyebrow (it was brand blue, so it read as a link to nowhere). `global-error` keeps inline styles by necessity — see NOTES. |
| empty-state / pagination / back-link / lesson-nav shared components | PASS | 2026-08-09 | Empty-state icon medallion squared. Pagination controls take the `--color-input` boundary (they are controls, 3.59:1) and tabular figures. |
| lib/email.ts templates | PASS | 2026-08-09 | Shell greys → sb values. No buttons exist — every CTA is a bare `<a>`, so there was no blue button to remove and links staying blue is correct. |

## NOTES / intentional exceptions

- **Focus rings stay blue** (`--color-focus #1F63C0`) — the one sanctioned
  non-link blue, and now a token of its own so a palette change cannot reach it.
- **Destructive stays red** (`--color-destructive #B4302A`, sb's red).
- **Status tints are OPAQUE, deviating from sb-ui**, which ships them at ~11%
  alpha. A translucent tint inherits contrast from whatever is behind it:
  measured, green composited to **4.43:1 on the sunken plane** (the admin
  shell's own background) — under AA — while the identical tag read 4.99:1 on a
  white table. Each value is now that alpha composited over white, so it renders
  as sb intended where it already passed and holds everywhere else. Asserted in
  `status-tone-conventions.test.ts`.
- **`--color-input` stays `#858585`**, NOT sb's `--border-input #CFCEC9`, which
  measures 1.4:1 and fails 1.4.11 for a control boundary. Pre-existing a11y
  decision in this codebase; not regressed.
- **The unchecked Switch stays `bg-input`** rather than the softer
  `--color-switch-background #CFCEC9`, for the same reason — an off switch still
  needs a 3:1 boundary.
- **`font-mono` on the certificate verification code** survives the "never mono"
  rule, which is aimed at money and scores. This is an identifier someone reads
  aloud or transcribes, where character disambiguation is the point.
- **`rounded-full` retained** on: avatars, the radio dot, the status dot, the
  scroll-area thumb, and the Switch track/thumb — all either dots or the
  universal affordance for that control.
- **`PASS-src` means source + build verified, not DOM-verified.** Those routes
  need an authenticated learner with an enrolment, and no test account exists on
  this Supabase project (the app's `.env.local` points at production, so signing
  in or seeding is not something to do casually from here). They are covered by
  the opt-in live Playwright journeys, which are default-off. Distinguished
  rather than glossed, because "PASS" on a route nobody rendered is the kind of
  claim this ledger exists to prevent.
- **A tenant whose `primaryColor` is blue will show blue on the storefront hero**,
  which locally contradicts "blue = links only". That is the tenant branding
  feature working as specified (brief rule 12); it is confined to the storefront
  and never enters the product shell.
- **`global-error.tsx` keeps raw hex inline styles.** It renders its own
  `<html>`/`<body>` and is the boundary that fires when the root layout itself
  failed — it deliberately does not load the app's CSS, so no token is available
  to it. Its `#2563eb` button is now `#1b1b1e`. Same reasoning for the certificate
  accent default, which crosses into `style` and into print.
- **The Connect tier column keeps a dotless Badge**, though this row's original
  note asked for "role/status = squared dot+label tags". A tier is a category,
  not a state, and GUIDELINES.md §5 is explicit that tones map to state and never
  to category — a dot on it would claim the tier is a status the row is currently
  in. Squared and neutral; the dot is reserved for the Status column beside it.
- **`uppercase` on the lesson-nav section label** is treated as a kicker, which
  is the sanctioned use. It labels a group in a side nav rather than heading a
  section of prose. Flagging it because it is a judgement call, not a rule.
- **Admin shell sits on the sunken plane** (`bg-surface-muted` = `#f1f1f0`) with
  content panels on `bg-surface`. `--color-surface` is the warm shell `#fcfcfb`,
  not white, under sb; white is `--color-card`.

## SUMMARY
Not started. Target: every row PASS or PARTIAL-with-logged-exception, 0 TODO, build + tests green.
