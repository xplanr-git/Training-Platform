# Design Ledger — Training Platform → sb-ui v3.0

Live ledger for `design/sb-v3` on `web/` (see `CLAUDE_CODE_BRIEF.md`). Presentational only.
Checks A–J defined in the brief §P3. Update `Last run` + SUMMARY every run.

Last run: — (not started)

**Type decisions (P1):** h1 700/-0.02em (3xl front doors, 2xl working pages — existing scale kept) · section headings ≥700, never below text-base · eyebrows 11/700/uppercase kickers only · table headers 12.5/600 muted, no uppercase.

**A11y invariants (never regress):** input boundary ≥3:1 (#858585 class), global :focus-visible, skip link, color-scheme: light, class-based `dark:` variant inert.

| Route / surface | Status | Last checked | Notes |
|---|---|---|---|
| globals.css tokens + layout font | TODO | | P1 |
| ui/ kit primitives (P2.1–P2.10) | TODO | | one row per commit if useful |
| / (root landing) | TODO | | |
| /login + /login/forgot | TODO | | |
| /signup | TODO | | |
| /auth/set-password · /auth/auth-code-error · /auth/confirm | TODO | | |
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
(add as found; expected: tenant primaryColor accents on storefront hero; focus rings blue; destructive red buttons)

## SUMMARY
Not started. Target: every row PASS or PARTIAL-with-logged-exception, 0 TODO, build + tests green.
