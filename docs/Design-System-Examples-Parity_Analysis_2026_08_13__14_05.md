# Design-System Examples Parity — Analysis & Implementation

**Subject:** reconciling the Training Platform UI (`web/`) with the design-system `examples/` pack
(commit `16359f2`, 2026-08-11 pages) and closing the residual v4.1 drift.
**Date:** 2026-08-13 14:05 NZST · **Type:** Analysis · **Mode:** implemented in the same pass.
**Standing rule this serves:** CLAUDE.md §7.16 + §13. Supersedes nothing — it continues
`Design-System-Conformance_Audit_2026_08_12__14_33.md`; that audit's batches 1–4b remain accurate history.

---

## 0. TL;DR

The org design system moved from `52edb04` → `16359f2`: **no stylesheet changed** — the commit adds
`examples/`, a pack of rendered HTML pages (Reference, resolved Navigation, Icon set, Product-UI,
Website, deck, multi-brand proof, registers). The examples are the *resolved* rendering of core.css
v4.1, and reviewing the app against them surfaced one class of hard violation, one latent runtime
bug, and a tier of metric drift. **All of it is now implemented** — details and file list below.
`npm run verify` green in `web/` and `db/`; key metrics re-measured in a live browser.

The three findings that mattered most:

1. **The greyscale data-viz ramp did not exist in the app.** Every progress fill was pure ink
   (`bg-primary`) or a status colour (`bg-status-amber`) — both named verbatim violations in v4.1
   ("pure ink is never the default fill for a bar"). Tokens added, all three fills repointed,
   fitness test added.
2. **`cn()` was silently deleting ramp font-sizes.** tailwind-merge doesn't know the custom
   `--text-*` utilities and classified them as text *colours*, so `text-control` +
   `text-primary-foreground` in one merge dropped the size. The Button rendered 16px while its
   source read 13.5px; the filled Badge had been losing `text-meta` since it shipped. Fixed with
   `extendTailwindMerge` in `ui/utils.ts`; regression-tested in `cn-merge.test.ts`, including a
   guard that every `--text-*` token in the theme is registered.
3. **Link grammar had two-way drift** (3 sites underlined at rest, 6 never underlined at all).
   The v4.1 grammar — blue at rest, underline appears on hover — is now applied at all 9 sites and
   enforced by a new fitness test.

## 1. What the examples pack is (and what it resolved)

- `01-Reference/` — the canonical Reference (live specimen of core.css), the **resolved Navigation**
  page (text-forward underline grammar, desktop + mobile drawer/scrim, scrolling top-menu tabs
  instead of a bottom tab bar), and the **Icon set** (single-weight ink line, 16px grid, ~1.4–1.6
  stroke, always `currentColor`, never blue, never a fill; navigation carries **no** icons).
- `02-Surfaces/` — worked examples incl. **Product-UI** (top bar + side nav + KPI row + charts +
  table, identical across the three brands).
- `03-Documents/`, `04-Registers/` — document surfaces (govern the `sb-doc` layer, not this app).

Because no stylesheet changed, "parity" here = the app matching what the examples *demonstrate*:
exact control metrics, the full interaction-state set, the greyscale data discipline, the one link
grammar, and the vertical rhythm.

## 2. Changes implemented (by area)

### Tokens (`web/src/app/globals.css`)
| Token | Value | Why |
|---|---|---|
| `--color-data-1…5`, `--color-data`, `--color-data-strong`, `--color-data-soft`, `--color-data-track` | core.css §1 verbatim | The greyscale data-viz ramp; previously absent entirely |
| `--color-border-strong` | `#d5d4d0` | The firm structural edge (hover states); decoration-tier, deliberately not held to 1.4.11 |
| `--color-primary-hover` | `#000000` | core.css `--ink-hover`; replaces the `bg-primary/90` fade |
| `--text-label` | 11px, normal tracking | The dense LABEL size (table headers, tags) — same 11px as the eyebrow but without the kicker tracking |
| `--text-kpi` | 28px / 1.15 / −0.02em | core.css `.sb-kpi .v` |
| `h1 { font-weight: 800 }` (base layer) | — | Ramp says Display 32/**800**, H1 24/**800**; the app had all headings at 700 |

### Primitives (`web/src/components/ui/`)
- **button** — 13.5px (`text-control`); 38px desktop (44px phone kept, deliberately stricter than
  the system for the on-site/gloves use case); full v4.1 interaction states: primary lifts with
  elevation on hover and presses on active, outline firms to ink over a sunken wash, ghost takes
  the wash + hairline inset.
- **input / textarea / select** — 40px desktop (44px phone), 13.5px on desktop (16px kept below
  `md` so iOS doesn't zoom), hover firms the border to the mid grey; inert `dark:` cruft stripped.
- **checkbox / radio** — 18px box, 1.5px border, checkbox radius 2px (was 4px on a 16px box).
- **switch** — 38×22 track, 18px thumb, 16px travel. Unchecked track stays `#858585`, NOT the
  system's `--border-strong` — same WCAG 1.4.11 divergence as the input border, documented in-file.
- **badge / StatusBadge** — 20px tag at the 11px label size (was 24px/12.5). Filled variant is now
  `--color-data-strong` ("none is ever solid black").
- **tabs** — 48px row, 13.5px, 500 resting → 600 active (was 600→700), 1.75px underline.
- **table** — 46px header at 11px label; row cells `py-2.5` (≈44px standard rows); table data
  12.5px (`text-meta`) constant across densities; header keyline now `1.75px` (`--keyline-w`),
  matching the nav underline and active tab.
- **avatar** — 34px, ink fill + white initials (was 40px stock-grey, and unused; fixed forward).
- **dialog / alert-dialog** — title 16/800 (`.sb-modal .mh h3`).
- **dropdown-menu** — last inert `dark:` variant stripped.
- **progress** — fill `bg-data-strong` on a `bg-data-track` groove (was ink on sunken).

### Call sites
- **Link grammar** (9 sites): `text-link hover:text-link-hover hover:underline`, never underlined
  at rest — login, forgot, people admin, storefront ×3, join ×2, dashboard.
- **Ad-hoc progress fills**: `video-upload.tsx` (was ink), `attached-video.tsx` (was amber — state
  was being smuggled into magnitude; the status word next to the bar already carries it).
- **KPI tiles** (admin Insights + learner dashboard): label 13.5/500 **above** a 28/800 value —
  the two stat surfaces were label-under vs label-over of each other.
- **Section rhythm**: analytics major sections `mt-10` → `mt-16` (64px per the Reference's
  vertical-rhythm spec); `t/[slug]/loading.tsx` now matches the shell it stands in for
  (`py-12 sm:py-14`, was `py-8` — visible jump on load); `/verify` pages get the responsive step.

### Enforcement (tests changed/added)
- `sb-design-conventions.test.ts` — **new**: link-grammar guard (hover-underline required,
  rest-underline banned); **new**: progressbar fills must not be ink/status (scoped to the
  progressbar's own markup window); keyline pin updated to `border-b-[1.75px]`.
- `cn-merge.test.ts` — **new file**: the tailwind-merge regression + completeness guard.
- `mobile-conventions.test.ts` — pins updated to the system heights (38px button / 40px input on
  desktop; 44px phone unchanged).

### Infrastructure (incidental but load-bearing)
- `next.config.mjs`: `distDir` overridable via `NEXT_DIST_DIR` — on Windows, `next build` and a
  running `next dev` fight over `.next` (EPERM on `.next/trace`), which happens whenever two work
  sessions share this checkout. `NEXT_DIST_DIR=.next-verify npm run verify` runs the gate beside a
  live dev server. Unset (CI/Vercel/normal dev) it is exactly `.next`.
- `web/tsconfig.json`: `.next-verify/types/**/*.ts` added to `include` — otherwise `next lint`
  rewrites the file (with CRLF) mid-verify and `repo-hygiene` fails. Matches nothing when the env
  var is unset. `/.next-verify` gitignored.

## 3. Verified

- `npm run verify` — **green in `web/`** (format → typecheck → lint → 659 vitest → build →
  Playwright e2e; live suite default-off as designed) **and `db/`**.
- Browser-measured on the running app (localhost:3010): button 38px/13.5/ink/4px radius; input
  40px/13.5/`#858585` border; forgot-password link blue with no rest underline; storefront h1
  32px/800/−0.02em. (The `cn()` bug was *caught* by this measurement — source read 13.5, computed
  said 16 — which is exactly why §7.13 demands browser verification.)

## 4. Deliberate divergences (unchanged, do not "fix")

1. Input border `#858585` and the switch's unchecked track (WCAG 1.4.11; system tokens fail 3:1).
2. Opaque status tints (system ships alpha tints; contrast must hold on any surface).
3. ~~Light-only~~ — superseded later the same day: dark mode SHIPPED (owner decision; see the §5
   progress log). The class-based `dark:` neutralisation is now the mechanism, not a guard.
4. 44px phone tap targets above the system's one-height-38 (stricter, phone-first product).
5. Icons stay lucide (24-grid/stroke-2 ≈ the DS 16-grid/1.4 proportionally; always `currentColor`,
   never in navigation) — swapping icon sets buys nothing the rules don't already enforce.

## 5. Still open / not adopted (with reasons)

> **Progress log — 2026-08-13 (later the same day)**
> - ✅ **Modal structure shipped.** Dialog + AlertDialog now carry the full `.sb-modal` layout:
>   460px, radius 4, borderless white on shadow-pop, title = 16/800 masthead with the 1px ink
>   keyline, description = 13.5/text-2/1.6 body, footer above the light hairline (gap 12), and an
>   ink-tinted scrim (was pure black). Encoded on Title/Footer rather than Header, so both call
>   sites (`nav-form.tsx`, `role-select.tsx`) needed no change. Guarded in
>   `sb-design-conventions.test.ts` ("the modal masthead carries the keyline"); browser-measured
>   via a throwaway probe (all values on spec).
> - ✅ **accentColor: certificate only** (owner decision 2026-08-13). Storefront h1 + card link no
>   longer take `branding.primaryColor`; the settings field is removed (a colour that paints
>   nothing is a trap) and the settings action merges over stored branding so saved values survive.
> - ✅ **Segmented control shipped** with its first consumer: status filters on admin Courses and
>   People (`SegmentedNav` — link-based, `.sb-seg` metrics, `?status=` validated against a closed
>   set, composes with search + paging, filtered-empty states distinct from first-run).
> - ✅ **Dark mode shipped.** Full `.sb-dark` token set under `.dark`, pre-paint boot script,
>   Light/Dark/Auto `ThemeToggle` (admin shell, storefront, dashboard). Two dark divergences,
>   both WCAG-driven and test-asserted: input border keeps #858585 (system dark border-input is
>   ~1.5:1) and dark muted is #8e8f95 (system --text-3 measures 4.20:1 on the sunken plane — caught
>   by the new dark contrast assertions on their first run).
> - ✅ **Side menu to the resolved grammar** (user-flagged against the Navigation example). The
>   legacy `.sb-side .grp` uppercase micro-labels are retired for `.sb-navsec` collapsible
>   sections (42px rows, right chevron rotating open, ink+600 when open) with `.sb-subnav`
>   children (37px, 12.5, 32px indent, light-hairline brackets). All-gated sections default
>   collapsed; live sections and the active trail default open. `--text-nav-group` token removed.
>   Guarded in `nav-grammar-conventions.test.ts`; browser-measured via an AdminShell probe.

- ~~**Modal header keyline**~~ — **DONE**, see progress log above.
- ~~**Segmented control**~~ — **DONE** (status filters, see progress log). **Toast, mega-menu,
  board, gantt, tree** — still no consumer; pull in per feature.
- ~~**Tenant `accentColor` escape hatch**~~ — **DECIDED + DONE**: certificate only (progress log).
- **Charts** — none exist in the app; the `--color-cat-*` palette and the mono `--color-data-1…5`
  ramp are ready for the first real chart.
- **Outdure artwork** (D1) — still on the Structure Build placeholder; one-asset swap when the
  owner supplies the mark.

## 6. Baseline

Reconciled baseline commit is now **`16359f2`** (`Structurebuild/design-system@main`, 2026-08-12) —
updated in CLAUDE.md §13. Check for updates before any UI work:

```bash
git -C /c/design-system-main fetch --quiet && git -C /c/design-system-main log --oneline 16359f2..origin/main
```

*Naming follows the Structure Build standard. Supersede, don't delete.*
