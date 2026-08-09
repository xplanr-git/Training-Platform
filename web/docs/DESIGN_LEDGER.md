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
| /t/[slug] (storefront) | TODO | | tenant branding.primaryColor stays functional — hero accent only |
| /t/[slug]/join | TODO | | |
| /t/[slug]/courses/[courseSlug] (course landing) | TODO | | lesson list = flush 1px keylines |
| /t/[slug]/dashboard | TODO | | stat tiles: 700 tabular figures, borderless |
| /t/[slug]/learn/[courseSlug] (outline, player, quiz, complete) | TODO | | quiz radio/checkbox on kit; progress = ink bar |
| /t/[slug]/admin (dashboard) | TODO | | admin-shell nav: sunken + 2px inset ink marker |
| /t/[slug]/admin/courses (+ editors, reorder, video-upload) | TODO | | table keyline rule; drag handles quiet |
| /t/[slug]/admin/people | TODO | | role/status = squared dot+label tags |
| /t/[slug]/admin/analytics | TODO | | charts: ink single-measure, cat palette multi |
| /t/[slug]/admin/certificates | TODO | | |
| /t/[slug]/admin/settings | TODO | | branding form: colour swatch preview keeps arbitrary colour |
| /t/[slug]/admin/coming-soon | TODO | | |
| /dashboard (cross-tenant) | TODO | | |
| /platform (platform admin) | TODO | | |
| /verify/[code] | TODO | | print styles must survive; certificate is a document — keyline header |
| error.tsx / global-error / not-found / loading + skeletons | TODO | | |
| empty-state / pagination / back-link / lesson-nav shared components | TODO | | |
| lib/email.ts templates (if styled) | TODO | | ink header, no blue buttons |

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
- **Admin shell sits on the sunken plane** (`bg-surface-muted` = `#f1f1f0`) with
  content panels on `bg-surface`. `--color-surface` is the warm shell `#fcfcfb`,
  not white, under sb; white is `--color-card`.

## SUMMARY
Not started. Target: every row PASS or PARTIAL-with-logged-exception, 0 TODO, build + tests green.
