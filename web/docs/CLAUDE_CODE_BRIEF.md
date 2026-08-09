# CLAUDE CODE BRIEF — Restyle Training Platform (`web/`) onto Structure Build sb-ui v3.0

**Goal:** re-skin the v2 product (`web/` — Next.js 15, Tailwind v4, shadcn-derived UI kit) onto the **Structure Build design system**: monochrome ink, one keyline, squared status tags, blue = links only. Light-only for now (the app is deliberately light-only; the class-based `dark:` variant plumbing already exists — leave it inert, ready for the sb dark tokens later). Run as an autonomous loop until every route conforms.

**Scope:** `web/` only. The root `src/` Vite app is the legacy prototype being cut over — do NOT restyle it. Never touch `db/` schema, migrations, RLS, Server Actions' logic, middleware, tests' assertions about behaviour.

**Package contents** (copy `design-system/` → `web/docs/design-system/`, ledger → `web/docs/`):
- `design-system/sb-ui.css` + `sb-dark.css` — the canonical system (reference only; the app keeps Tailwind)
- `design-system/GUIDELINES.md` — rules of record incl. dark mode — **read fully before starting**
- `theme-tokens-patch.css` — drop-in `@theme` block for `web/src/app/globals.css` (existing token names preserved)
- `DESIGN_LEDGER.md` — route ledger for the loop

---

## Non-negotiable rules (each check in the loop derives from these)

1. **Ink is the accent.** Primary buttons, active nav, selected states = ink `#1B1B1E` (`--color-primary` already is near-ink — the remap is small). Text on ink = white. One primary action per view.
2. **Blue = inline text links only** (`--color-link #1F63C0`). The current brand blues (`--color-brand-500/600/700 #2563eb/...`) must disappear from buttons, banners, active tabs, progress bars, stat tiles. Focus rings: keep them blue via `--color-focus` (sanctioned) — the global `:focus-visible` rule just swaps its var.
3. **The keyline rule.** One dark separator (same colour as text): 2px under header rows; 1px between flush list items (lesson lists, spec rows, accordions). **Data tables NEVER get the dark keyline between rows** — rows keep the light `--color-border` divider. Add `--color-keyline: #1B1B1E` to the theme.
4. **Squared status tags:** Badge radius → 2px, 6px `currentColor` dot + short sentence-case label ("Published", "Draft", "Pending"). Status colours (green/amber/red/blue/grey) are for state only, soft tints, never colour alone.
5. **Radius:** 4px structural (cards, controls, dialogs), 2px tags/chips, 50% avatars only. The current `--radius-card 0.75rem` and shadcn `--radius-lg 0.625rem` ramp collapse to 4px. No pills (`rounded-full` only on avatars/dots).
6. **Type:** page h1 700 with `-0.02em`; section headings ≥700; eyebrows 11px/700/uppercase as kickers only, never the heading. Keep the documented learner-surface scale (3xl front doors / 2xl working pages, container widths, rhythm) — it's good; only weights/tracking change. Numbers/scores/prices: `tabular-nums`, money with a currency indicator, never mono.
7. **Selection/hover = neutral:** sunken `#F1F1F0` fills, ink inset markers for active nav — never `brand-50`/pastel-blue washes.
8. **Surfaces:** warm shell `#FCFCFB` for page backgrounds, white cards. Cards on the shell are borderless (whitespace separates); borders only on controls, floating menus (with the pop shadow), and white-on-white nesting. Kill any per-card drop shadows.
9. **Chevrons** point right collapsed, rotate down when open (audit accordion/collapsible).
10. **Charts/progress** (analytics, course progress): single-measure = ink; multi-series = `--cat-1..5` fixed order with a legend; status colours never decorate charts. Progress bars: ink fill on sunken track.
11. **Accessibility invariants already won in this codebase stay won:** the `#858585` input-border contrast fix (keep ≥3:1 for control boundaries — sb's `--border-input #CFCEC9` FAILS this; keep `#858585` or darken to `#8E8F96`), visible focus, skip link, `color-scheme: light`, class-based `dark:` variant. Never regress these; the a11y comments in globals.css explain each — read them.
12. **Tenant branding stays functional.** `branding.primaryColor` is a tenant feature (settings page, storefront accent at `t/[slug]/page.tsx:63`). Constrain its blast radius to the storefront hero/accents; inside the product shell, ink rules. Don't remove the feature.

## Phase P0 — Setup
1. Branch `design/sb-v3`. Copy the package files in. `npm run build` + `npx tsc --noEmit` green baseline; note how `npm run test:unit` / Playwright are run (some snapshot/style assertions may need updating — behavioural assertions never).
2. Read `GUIDELINES.md` and the globals.css comment blocks end-to-end.

## Phase P1 — Tokens (`web/src/app/globals.css`)
1. Replace the `@theme` block with `theme-tokens-patch.css` (names preserved; values remapped; new: `--color-keyline`, `--color-link`, `--color-focus`, `--color-cat-1..5`, `--color-sunken`).
2. Font: add Inter via `next/font` in `web/src/app/layout.tsx` (weights 400–800, `display: swap`), wire into `--font-sans`. Keep system-ui fallbacks.
3. Global `a` colour → `--color-link` where links are styled; `:focus-visible` outline → `var(--color-focus)`.
4. Grep `brand-` utilities (`bg-brand-*`, `text-brand-*`, `border-brand-*`, `ring-brand-*`) across `web/src` — this is the main workload list. Map: solid brand fills → `bg-primary` (ink); `brand-50/100` washes → sunken or ink-tint `bg-black/5`; `text-brand-*` on non-links → `text-foreground`; on real links → `text-link`. Keep the `--color-brand-*` vars pointing at ink/link values so nothing 404s, but aim for zero direct `brand-` utility use by P4.
5. Commit `design(sb-v3): tokens`.

## Phase P2 — UI kit primitives (`web/src/components/ui/`), one commit each
1. `button.tsx` — default = ink; secondary/outline = quiet border; ghost unchanged; destructive stays red; radius 4px; no blue variant survives.
2. `badge.tsx` — squared 2px, add the dot pattern (or a `StatusBadge` wrapper in `components/`): tone → `{green,amber,red,blue,grey}` soft-tint pairs.
3. `card.tsx` — radius 4px, borderless variant default on shell pages, shadow → none (keep a hairline `--color-border` where nesting demands).
4. `table.tsx` — header row `border-b-2` with `border-keyline`, header cells 12.5px/600 muted **no uppercase**; body rows `border-border`; check every consumer for hand-rolled `<th>` styling.
5. `tabs.tsx` — underline style: ink 2px underline + 700 on active, no filled pill tabs.
6. `input.tsx` / `select.tsx` / `textarea.tsx` / `checkbox.tsx` / `radio-group.tsx` / `switch.tsx` — radius 4px, keep the `#858585`-class boundary contrast, focus ring blue; switch active = ink.
7. `dialog.tsx` / `sheet.tsx` / `dropdown-menu.tsx` / `popover.tsx` / `tooltip.tsx` — radius 4px, border + pop shadow (floating exception), no oversized rounding.
8. `progress.tsx` — ink fill, sunken track, 2px radius.
9. `accordion.tsx` / `collapsible.tsx` — flush with 1px dark keylines between items; chevron right→down.
10. `skeleton.tsx`, `separator.tsx`, `pagination.tsx` (components/) — tokens; pagination active page = ink square.

## Phase P3 — Route loop. Checks per route:
- A — h1 700/-0.02em; headings ≥700; eyebrows kickers only
- B — numbers tabular; money labelled; never mono
- C — tables: 2px keyline under header ONLY, light row dividers, no uppercase headers
- D — controls on the shared kit; radius 4/2; no pills
- E — zero `brand-` utilities, zero raw hex outside globals.css (log exceptions)
- F — status = squared dot+label tag
- G — renders clean (no console errors), focus visible, keyboard nav intact
- H — no blue except links + focus rings
- I — no card drop shadows; borderless-on-shell
- J — active/selected = ink or sunken, never pastel blue

**Route order** (public first — they set the brand impression):
1. `/` (root marketing/landing) · `/login` (+ forgot) · `/signup` · `/auth/set-password` · `/auth/auth-code-error`
2. `t/[slug]` storefront · `t/[slug]/join` · `t/[slug]/courses/[courseSlug]` (course landing)
3. `t/[slug]/dashboard` · `t/[slug]/learn/[courseSlug]` (outline + player + quiz + course-complete)
4. `t/[slug]/admin` (dashboard, courses + editors, people, analytics, certificates, settings, coming-soon) — `admin-shell.tsx` nav: active item = sunken fill + 2px inset ink marker
5. `/dashboard` (cross-tenant), `/platform` (platform-admin), `/verify/[code]` (certificate page — print styles must survive), error/not-found/loading states, `skeletons.tsx`, `empty-state.tsx`
6. Emails (`lib/email.ts`) if styled — ink header, no blue buttons.

**Loop protocol:** batch 4–6 routes → fix → verify in browser (light; spot-check that OS-dark changes nothing) → ledger row PASS with date → commit `design(sb-v3): run N — <routes>`. Repeat until zero TODO. Verify with real content: seed a demo tenant with 2 courses/lessons/quiz + enrolments if the local DB is empty (dev-only, clearly marked).

## Phase P4 — Final sweep
1. Greps → zero (or logged): `#2563eb|#1d4ed8|#1e40af|brand-50|brand-100|bg-brand|text-brand|border-brand|ring-brand`; `rounded-(xl|2xl|3xl|full)` (full = avatars/dots only); `shadow-(md|lg|xl)` outside floating menus; `uppercase` outside eyebrows/kickers.
2. AA spot-checks (muted text on sunken, status text on tints, input borders ≥3:1). Print view of `/verify/[code]` still correct.
3. `tsc` + build + unit tests green; e2e smoke (auth → learn → quiz → cert) passes.
4. Ledger SUMMARY terminal; PR `design/sb-v3` with the ledger as body.

## Definition of done
Every route in the ledger PASSes A–J; the platform reads as the same brand as StructureBuild Connect (ink primaries, one keyline, squared tags, quiet tables, generous whitespace); zero brand-blue outside links/focus; a11y invariants intact; build + tests green.
