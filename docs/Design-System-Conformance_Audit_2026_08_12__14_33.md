# Design-System Conformance Audit — Outdure Academy

**Subject:** conformance of the Training Platform UI (`web/`) to the Structure Build / Outdure house design system.
**Date:** 2026-08-12 14:33 NZST · **Type:** Audit · **Mode:** read-only (no code changed for this report).
**Standing rule this serves:** CLAUDE.md **§7.16** + **§13**.

---

## 0. TL;DR

**The app is already ~85–90% on-system.** This is a *version-reconciliation and drift-tightening* job, **not** a rebuild. The single hardest rule — "the only blue is a text link" — holds **perfectly**: zero blue misuse anywhere in `web/src`. Neutral greys are effectively purged (one stray). Radii, pills, shadows and hardcoded hex are essentially clean, and a dense suite of architectural fitness tests already guards the rules in CI.

Two things are true at once:

1. **The design system moved on.** The app implements the system's **v3.0** vocabulary (`web/docs/design-system/`, translated into Tailwind `@theme` tokens in `globals.css`). The org master (`C:\design-system-main`) is now **v4.0/v4.1**: same monochrome DNA, restructured into a brand-agnostic `core.css` + thin brand layers, with a 12-col grid, a fuller component set, a greyscale data-viz ramp, and a *resolved* navigation grammar that differs from v3.0.
2. **Residual drift is concentrated, not diffuse.** The bulk of it is **warning/status surfaces painted with raw `amber/green/red` Tailwind utilities** instead of the `status-*` tokens (28 matches across 11 files), plus a short list of specific violations.

The biggest "not dialled in" gap for an **Outdure** academy specifically: **the product carries none of the real Outdure identity** — a generic graduation-cap icon stands in where the system insists the brand is carried by the Outdure mark (three slashes) + "OUTDURE" wordmark.

**Recommendation:** fix the concentrated drift (Batch 1 below — mechanical, low-risk, high-visual-payoff), make three reconciliation *decisions* (brand mark, nav grammar, type ramp), then adopt v4 additions opportunistically. None of this blocks; all of it is shippable in independent batches.

---

## 1. Method & sources

| Side | What was read |
|---|---|
| **House system (v4.1)** | `C:\design-system-main` — `core.css`, `brand-outdure.css`, `base.css`/`documents.css`, and `reference/` (Guidelines, Multi-Brand, Tuning). Baseline commit `52edb04`. |
| **App (this repo)** | `web/src/app/globals.css` (the token layer), `web/src/components/ui/*` (25 components), `admin-shell.tsx`, `nav.ts`, learner/admin pages, and `web/docs/design-system/` (the v3.0 snapshot). |
| **Enforcement** | 15+ fitness tests in `web/tests/unit/` (`sb-design-conventions`, `status-tone-conventions`, `a11y-conventions`, `focus-conventions`, `tailwind-token-conventions`, `print-conventions`, `mobile-conventions`, …). |

An app-wide anti-pattern sweep quantified the drift (raw palette utilities, hex literals, `rounded-full`, `font-mono`, `text-faint`, `window.confirm`, inline colour styles). Counts below are from that sweep.

---

## 2. Conformance scorecard

| Area | State | Notes |
|---|---|---|
| **Monochrome / "blue = link only"** | ✅ **Exemplary** | 0 blue misuse. `text-link` used 11×, always on text. |
| **Neutral-grey purge** | ✅ Near-complete | 1 live `text-neutral-600` remaining. |
| **Radius / pills / shadows** | ✅ Clean | No oversized radius; `rounded-full` only on avatars/dots/switch/scrollbar; shadows only via `--shadow-*`. |
| **Core components (button/badge/table/tabs/card/input)** | ✅ Re-skinned | ~20/25 fully on-token; keyline rule encoded in `table.tsx`. |
| **Status as dot+word tag** | ✅ For real tags | `StatusBadge` is correct and AA-verified. |
| **Status/warning *surfaces*** | ⚠️ **Drift** | 28 raw `amber/green/red` utilities on banners, quiz boxes, a progress fill (§4.1). |
| **Brand identity (Outdure mark/wordmark)** | ❌ **Absent** | Generic `GraduationCap` icon; no Outdure mark, no wordmark (§4.3). |
| **Navigation grammar** | ⚠️ v3.0 | Wash + left-bar current-marker; v4.1 resolved to text-forward underline (§4.4). |
| **Type ramp** | ⚠️ Translated | Tailwind scale (body 16px) vs DS named ramp (body 14px, 13.5px controls) (§4.5). |
| **shadcn stragglers** | ⚠️ Minor | `dialog`/`sheet` competing focus rings; `radio`/`switch`/`input`/`select` stock `dark:` cruft (§4.6). |
| **v4 additions (grid, data ramp, purple status, container tiers)** | ⏳ Not adopted | Adopt when a surface needs them (§5). |
| **Dark mode** | ⏳ Deferred (documented) | App is deliberately light-only; v4.1 is dark-capable. Keep deferred. |
| **Deliberate WCAG divergences** | ✅ Keep | Input border `#858585`, opaque status tints (§6) — do **not** revert. |

---

## 3. What's already right (do not touch)

- **`button.tsx`** — primary = ink, no blue variant, `link` variant is text-only; outline darkens its edge rather than filling.
- **`badge.tsx` / `StatusBadge`** — dot + label, five AA-verified tones on opaque tints, squared (2px).
- **`table.tsx`** — the keyline rule is encoded in the primitive: 2px ink under the header, light `border-border` between rows, non-uppercase header. This is the single most-often-botched table rule and it's correct here.
- **`tabs.tsx`** — underline tabs (ink 2px + weight), not filled pills.
- **Focus** — one global `:focus-visible` treatment in blue `--color-focus`, guarded by `focus-conventions.test.ts`.
- **Fonts** — Inter loaded via `next/font` (Inter-first, matching v4.1).

---

## 4. Findings (severity-ranked, with the required change)

### HIGH

#### H1 · Warning/status surfaces bypass the status tokens (28 matches / 11 files)
The largest single drift. Banners, quiz result boxes and one progress bar use raw Tailwind `amber-*/green-*/red-*` utilities instead of `--color-status-*`. CI tolerates it only because `border-amber-*` is allow-listed in `tailwind-token-conventions.test.ts`. Consequences: colours diverge from the AA-tuned opaque status palette, and the same semantic (a warning) is painted three different ways.

- `web/src/components/attached-video.tsx:75` — **amber progress-bar *fill*** (`bg-amber-500`). Worst of the set: a coloured *fill*, which the system reserves for greyscale data marks. Should be ink/`--data-strong`.
- `web/src/app/t/[slug]/learn/[courseSlug]/[lessonId]/page.tsx:380–381` — quiz **pass** box `green-*`, **fail** box `amber-*`. Should be `StatusBadge`/status tokens.
- `web/src/components/view-as-banner.tsx:23` — impersonation banner `amber-*`.
- Repeated amber warning boxes: `video-unavailable.tsx:47`, `t/[slug]/courses/[courseSlug]/page.tsx:165`, `t/[slug]/learn/[courseSlug]/page.tsx:116`, `learn/[courseSlug]/[lessonId]/page.tsx:298`, `admin/people/invite-form.tsx:75`, `admin/courses/[courseId]/builder/page.tsx:271`, `reorder-controls.tsx:111` (`text-red-600`).
- `web/src/components/nav-form.tsx:204` — inline error uses `text-red-600` (should be `text-status-red`/`text-destructive`).

**Change:** introduce one `Banner`/`Callout` primitive backed by `status-*` tokens (dot + word + tint), route all of the above through it, then tighten `tailwind-token-conventions.test.ts` to stop allow-listing raw `amber-*`. *Batch 1.*

#### H2 · No Outdure brand identity
`admin-shell.tsx:83,164` render a generic lucide `GraduationCap` as the "brand". The design system is emphatic that **differentiation is carried by the mark + wordmark only** — and Outdure's is specifically the **three-slash mark + "OUTDURE" wordmark** (`brand-outdure.css`). Today an Outdure academy shows no Outdure identity at all (admin masthead, mobile header; also relevant to the storefront and certificate).

**Change:** add the Outdure mark as an inline SVG asset (ink square, three slashes, `currentColor`) + the wordmark, and use them in the admin masthead, storefront header and certificate. This is the highest-leverage "dialled in" change for *this* tenant. Needs the official artwork — **decision D1** below.

### MEDIUM

#### M1 · Navigation grammar is v3.0, not the v4.1 resolution
`admin-shell.tsx:57–60` marks the current item with `bg-sunken` + a 2px inset ink left-bar + bold (the v3.0 `.sb-side` "pale-marker"). v4.1 **resolved** the side-nav to **text-forward with a 1.75px ink underline hugging the label, and explicitly *no* block background or side-bar** (Guidelines §6.2 and the §14 "Don't"). Note: `core.css` still *ships* the wash+left-bar variant, so the system offers both — this is a **decision (D2)**, not a clear bug. (The list is correctly icon-free, which both versions require.)

#### M2 · Verification code in `font-mono`
`web/src/components/course-complete.tsx:95` renders the certificate verification code in `font-mono` — directly against the rule ("no monospace for codes") **and** inconsistent with its sibling `verify/[code]/page.tsx:169`, which deliberately renders the same code in **Sans + tabular**. **Change:** drop `font-mono`, use `tabular-nums`, matching the verify page.

#### M3 · Live `window.confirm` against the in-app-dialog convention
`web/src/app/t/[slug]/admin/people/role-select.tsx:71` calls `window.confirm(...)`. This is the exact pattern we just removed from `nav-form.tsx` (MU1): `window.confirm` is off-brand, not theme-aware, and silently returns `false` once a browser blocks repeat dialogs. **Change:** route the role-change confirm through the `AlertDialog` (reuse the `nav-form.tsx` approach).

#### M4 · Type ramp is Tailwind's, not the DS named ramp
The app uses Tailwind's scale (body `text-base` = **16px**, `text-sm` 14, `text-xs` 12, `text-2xl` 24, `text-3xl` 30 — see the "Learner-surface scale" note in `globals.css`). The DS named ramp is **body 14 / meta 12.5 / h3 15 / h2 19 / h1 24 / display 32**, plus a **13.5px standard control size**. So body copy runs a notch larger and headings don't land on 19/15. This is a deliberate translation, not an accident — but it's the most *pervasive* deviation from the system's typographic feel. **Decision D3:** adopt the named ramp as Tailwind `--text-*` tokens, or ratify the Tailwind scale as the app's sanctioned translation and document it.

#### M5 · shadcn stragglers with competing focus rings
`dialog.tsx:58` and `sheet.tsx` retain stock `focus:ring-ring focus:ring-2 focus:ring-offset-2` — a second focus treatment competing with the global `:focus-visible`, which is exactly the shape `focus-conventions.test.ts` exists to catch (it passes today only because these specific lines aren't yet asserted). **Change:** strip the stock ring, inherit the global focus.

### LOW

- **L1 · Undefined `text-faint` token** — `web/src/components/attached-video.tsx:84`. No `--color-faint` exists, so the class paints nothing (falls back to inherited colour). Either define it or use `text-muted`. (Admin-only surface; cosmetic.)
- **L2 · `font-mono` on technical references** — `segment-error.tsx:49` (error digest), `attached-video.tsx:84` (video ID). Borderline (true machine references), but the system prefers Sans + tabular. Low priority.
- **L3 · Lone neutral-grey utility** — `web/src/app/t/[slug]/layout.tsx:33` `text-neutral-600` → `text-muted`.
- **L4 · Stock `dark:` cruft** — `input.tsx:12`, `select.tsx:34`, `radio-group.tsx:30`, `switch.tsx` carry `dark:bg-input/30` etc. Inert (the app neutralised `dark:` to class-based) but off-system dead code. Strip when touched.
- **L5 · `--color-border` collapsed** — the app maps `--color-border` to `#efefed` (v4's `--border-2`, the row divider), dropping v4's slightly darker `--border #E7E6E3` for card/panel edges. Minor loss of edge definition; reintroduce only if panels start to read flat.

---

## 5. The v3.0 → v4.1 delta (what the org system added)

Adopt these **opportunistically**, when a surface needs them — none is urgent:

| v4.1 addition | Status in app | Recommendation |
|---|---|---|
| **Brand-contract tokens** (`--brand`, `--on-brand`, `--brand-link`) + per-brand layers | Not modelled (single hard-coded palette) | Add an Outdure brand layer mapping so a second tenant brand is a token swap, not a fork. Pairs with **H2**. |
| **Greyscale data-viz ramp** (`--data-1…5`, `--data`, `--data-strong`, `--data-track`) | Not present | Add when charts/progress get built out; fixes **H1**'s amber fill properly. |
| **6th status tone — purple** (`#6A3FC0`, "shipped") | Not present (5 tones) | Add only if a "shipped/dispatched" state appears. Not needed for LMS today. |
| **12-col grid + container tiers** (`--wide`/`--fluid`) | Uses Tailwind grid + the 5xl/4xl/3xl "Learner-surface scale" | Ratify the current translation; no change needed. |
| **Fuller component set** (board/kanban, gantt, tree, mega-menu, segmented, toast, skeleton) | Partial (skeleton yes) | Pull in per feature as Phase 2/3 needs them. |
| **Inter-first font stack** | ✅ Already done | — |

---

## 6. Deliberate divergences to PRESERVE (do not "fix")

These are documented, justified, and correct — a future contributor "restoring" them to the raw system tokens would regress accessibility:

1. **Input border `#858585`** (not the system's `--border-input #CFCEC9`, which measures 1.4:1 and fails WCAG 1.4.11). Documented in `globals.css`.
2. **Opaque status tints** (system ships ~11% alpha; the app composites each over white so contrast holds on *any* surface). Guarded by `status-tone-conventions.test.ts`.
3. **Light-only** (the app neutralised shadcn's `dark:` to class-based and sets `color-scheme: light`). Half a dark theme is worse than none; keep deferred until a real toggle ships.

---

## 7. Prioritised change plan (shippable batches)

Mirrors the workflow used for the last audit: each batch is independently shippable and CI-gated.

> **Progress log — 2026-08-12**
> - ✅ **Batch 1** shipped (`a64719c`): `Callout` primitive; 12 surfaces off raw palette → status tokens; amber progress fill, `text-faint`, `text-neutral-600`, verification-code `font-mono` all fixed; `sb-design-conventions` now bans raw numbered palette utilities.
> - ✅ **Batch 2** shipped (`f44b659`): `RoleSelect` `window.confirm` → `AlertDialog` (+ repo-wide native-popup ban); competing focus rings stripped from `Dialog`/`Sheet` (+ `focus-conventions` tightened to catch the `focus:` variant). **L4 (inert `dark:` cruft across 7 primitives) deferred** to the low-polish sweep.
> - ✅ **Batch 3** shipped (`cd26b60`): `BrandMark` (Structure Build placeholder — ink square + plus) in the admin masthead, mobile header, and 4 auth pages, replacing the generic graduation-cap. One-file swap when Outdure artwork lands.
> - ✅ **Batch 4a** shipped (`c858ae5`): admin sidebar current item → text-forward ink underline (no wash, no side-bar), per D2.
> - ✅ **Batch 4b** shipped (`f800c63` + fix `3d351ec`): the DS named type ramp formalised in `@theme` (`text-display/h1/h2/h3/body/meta/eyebrow`); front-door h1 → `text-display` (32), section heads → `text-h2` (19). Finding: the app was already ~95% on the ramp (working h1 24 = DS h1, body 14 = DS body). **Browser-verified** on `/login` — which caught a regression (a global `body{font-size:14}` shrank inherited titles like `CardTitle` to body size); reverted, DS body stays applied by class.
> - ⏳ **L4** (inert `dark:` cruft in 7 primitives) + the **Low-polish tier** — remaining, low priority.

- **Batch 1 — Status/warning tokenisation (H1, M2, L1–L3).** One `Banner`/`Callout` primitive on `status-*` tokens; migrate the 11 files; fix the amber progress fill; verification code → tabular; remove `text-faint`/stray neutral. Then tighten `tailwind-token-conventions.test.ts` to forbid raw `amber-*`. *Highest visual payoff, lowest risk.*
- **Batch 2 — Convention cleanup (M3, M5, L4).** `role-select` → `AlertDialog`; strip competing focus rings from `dialog`/`sheet`; remove `dark:` cruft. Small, mechanical.
- **Batch 3 — Brand identity (H2 + brand-contract tokens).** Outdure mark/wordmark SVGs; wire into admin masthead, storefront, certificate; add the brand-layer token mapping. **Blocked on decision D1 (artwork).**
- **Batch 4 — Reconciliation decisions (M1 nav, M4 type ramp).** Only after D2/D3 are settled — these change the app's *feel*, so they want sign-off, not a silent refactor.
- **Ongoing — v4 adoption (§5)** as features land, and the **update-check** (CLAUDE.md §13) before each UI task.

---

## 8. Decisions — RESOLVED 2026-08-12

Guiding principle set by the owner: **use the latest design system, always, as the reference for any ambiguity.**

| # | Decision | Resolution |
|---|---|---|
| **D1** | Brand identity artwork | **Use the Structure Build brand as a placeholder now** (ink square + plus mark, "Structure Build" wordmark — `brand-structure-build.css`); swap to the official **Outdure** mark/wordmark when the owner supplies it. Build the brand slot so the swap is one asset change. |
| **D2** | Nav grammar | **Adopt v4.1's resolved treatment: text-forward + 1.75px ink underline, no block background, no side-bar, no icons.** |
| **D3** | Type ramp | **Adopt the DS named ramp** (display 32 / h1 24 / h2 19 / h3 15 / body 14 / meta 12.5 / eyebrow 11, plus the 13.5px control size) as the reference — the Tailwind scale is remapped to it, not kept. |

---

*Naming follows the Structure Build standard (`Subject_Type_YYYY_MM_DD__HH_MM.ext`). Supersede, don't delete — a later pass moves this to `docs/_archive/` rather than overwriting. Pairs with CLAUDE.md §13 and `web/docs/design-system/`.*
