# Design-System Gap Register — everything not yet implemented

**Subject:** complete register of Training Platform UI (`web/`) surfaces that do not yet meet the
Structure Build design system (v4.1 + the `examples/` pack, baseline `16359f2`).
**Date:** 2026-08-13 16:12 NZST · **Type:** Register · **Method:** full page-by-page sweep
(two exhaustive agent passes over every file in `src/app` + `src/components`, cross-checked
against the primitives audit) — prompted by the owner catching the course-edit page's native
controls, which the component-level audits could not see.
**Continues:** `Design-System-Examples-Parity_Analysis_2026_08_13__14_05.md`.

The lesson of the day, twice over: the primitives being on-system does not make the product
on-system. Two blind spots produced everything below — (1) surfaces built against a **legacy
variant** the system still ships (the admin nav, fixed today; the lesson nav, still open), and
(2) **pages bypassing the kit** with hand-rolled elements (the course-edit page's native selects,
blue checkbox, red heading).

---

## CLASS 1 — Resolved-variant misses (the admin-nav failure class)

| # | Finding | Where | Spec |
|---|---|---|---|
| 1.1 | **Lesson player side menu marks the current lesson with the forbidden treatment** — `border-l-2` side bar + `bg-sunken` wash + `font-bold` + `rounded-md`, all four banned by the resolved nav grammar | `components/lesson-nav.tsx:64-67` | Underline current item (1.75px/5px), square rows, hover wash — the exact change already made to the admin shell |
| 1.2 | **Accordion is half-adopted** — keyline + chevron correct, but the trigger has no hover (resolved spec: full-width sunken row wash, no radius, no underline), carries `rounded-md`, and sits at 14px where `.sb-acc .q` is 15/700 with 20/12 padding. Its one call site overrides to `text-base font-semibold` (16/600) — off on both axes | `components/ui/accordion.tsx:42`, call site `courses/[courseSlug]/page.tsx:194` | `.sb-acc` |
| 1.3 | **EmptyState container is off-system** — a dashed border (dashed appears nowhere in core.css) over a sunken wash; `.sb-empty` is an *open* centred composition: 64px padding, 44px sunken icon tile, title 15/**800**, 13px muted body. App title is 16/600 | `components/empty-state.tsx:45,57` | `.sb-empty` |

## CLASS 2 — Pages bypassing the kit (the course-edit failure class)

| # | Finding | Where | Spec |
|---|---|---|---|
| 2.1 | **Nine native `<select>`s in five files, none with the DS treatment** — browser-default chevron (differs per OS), 36px not 40/44, `bg-transparent` not the field fill, off-system `shadow-sm`, 14px not 13.5, no hover grammar. Class string copy-pasted 5× (4 constants + 1 inline). Root cause: **no native-select primitive exists** for server-action forms | `quiz-answer-fields.tsx:7`, `invite-form.tsx:10`, `courses/[courseId]/page.tsx:17`, `role-select.tsx:17`, `lesson-type-fields.tsx:6`, `courses/new/page.tsx:43` | `.sb-select`: 40px, 13.5/600, inline-SVG chevron, hover border firming |
| 2.2 | **The certificate checkbox renders browser-default blue** — native input, no `accent-`, 16px, 4px radius | `courses/[courseId]/page.tsx:129-135` | ui/Checkbox (18px, 1.5px border, 2px radius, ink fill) — Radix supports `name` in forms |
| 2.3 | **Two hand-styled buttons** re-invent the outline variant with the decorative border (1.12:1 edge): billing "Manage billing", verify "Print" | `settings/billing/page.tsx:53`, `components/print-button.tsx:6` | `Button variant="outline"` |
| 2.4 | **Two anchors wear a hand-written button string** (verbatim copies of each other): the lesson "Open PDF in new tab", the pager links | `learn/[lessonId]/page.tsx:367`, `pagination.tsx:38` | `Button asChild` / pageno grammar |
| 2.5 | **File input styles its `file:` button differently from Input's own `file:` treatment** (bordered+filled vs the kit's borderless) | `components/video-upload.tsx:143-162` | one `file:` treatment |

## CLASS 3 — Colour as decoration

| # | Finding | Where |
|---|---|---|
| 3.1 | **"Danger zone" is a red heading at 14px** — the only coloured heading in the tree, and a heading the same size as the body it groups (both violations at once) | `courses/[courseId]/page.tsx:151` |
| 3.2 | **`variant="destructive"` is used zero times** while seven destructive buttons hand-roll red in **three different recipes**: one full red-outline delete (`border-destructive text-destructive hover:bg-destructive/10`), six ghost buttons with red text — one of which (`certificates` Revoke) has no `hover:` pair so it *loses its red on hover* | delete: `courses/[courseId]/page.tsx:182-188`; ghosts: `platform/page.tsx:117`, `certificates/page.tsx:149` (broken hover), `people/page.tsx:203`, `builder/page.tsx:136,185`, `quiz/[lessonId]/page.tsx:148` |
| 3.3 | **Callout's tone strings are copy-pasted by hand twice** — the view-as banner and the quiz score banner (the latter in a file that already imports Callout) | `view-as-banner.tsx:23,30`, `learn/[lessonId]/page.tsx:385-395` |
| 3.4 | **Status colour running across prose**: quiz-builder correct options tint the whole answer text green; course outline renders "Done" as bare green text instead of a StatusBadge | `quiz/[lessonId]/page.tsx:161-165`, `learn/[courseSlug]/page.tsx:202` |
| 3.5 | **Green ticks carry state without a visible label** (lesson sidebar — completion word is sr-only; outline twin also missing `aria-hidden`) | `lesson-nav.tsx:71`, `learn/[courseSlug]/page.tsx:192` |

## CLASS 4 — Typography off the ramp

| # | Finding | Where |
|---|---|---|
| 4.1 | **`CardTitle` applies no size** → four auth pages render their `h1` at inherited **16px, visually smaller than the 18px wordmark above it** (the brand outranks the page title) | `ui/card.tsx:64`; `login`, `login/forgot`, `auth/set-password`, `auth/auth-code-error` |
| 4.2 | **The auth masthead block is copy-pasted 4×** with off-ramp `text-lg` wordmark + off-scale `gap-2.5` — one shared component fixes all four | same four pages |
| 4.3 | **`/platform` h1 is `text-lg`** (18) — a page title below the working-page 24 | `platform/layout.tsx:14` |
| 4.4 | **Admin overview stat tiles use `text-2xl` on a `<p>`** — the one surface missed in the KPI pass (Insights and the learner dashboard were fixed; `/admin` was not) | `admin/page.tsx:58` |
| 4.5 | **`text-base` titles that should be `text-h3` (15)**: empty-state title, video-unavailable title, storefront course-card `h2`, billing plan `h2` | `empty-state.tsx:57`, `video-unavailable.tsx:43`, `t/[slug]/page.tsx:178`, `billing/page.tsx:67` |
| 4.6 | **Ad-hoc tracking**: `attached-video.tsx:95` `tracking-wide` *overrides* the eyebrow token's baked 0.09em; `DropdownMenuShortcut` invents `tracking-widest`; certificate page doubles up `tracking-tight` over the base-layer h1 tracking | listed |
| 4.7 | **Old 2px keyline weight survives in two places** (+ the card.tsx doc comment that recommends it): people "Requests to join" header, lesson-nav side bar (also a 1.1 finding) | `people/page.tsx:176`, `lesson-nav.tsx:64`, `ui/card.tsx:17` (prose) |
| 4.8 | **`/verify/[code]` runs a second type system** — `text-4xl` name, `text-3xl` h1, `text-xl` course title, three trackings — the entire tail of off-ramp type lives in this one file | `verify/[code]/page.tsx:129,144,148` |

## CLASS 5 — Component-spec minors (from the primitives re-check)

| # | Finding | Where |
|---|---|---|
| 5.1 | Tooltip bubble radius 4 vs DS 2px; 12.5 vs 11.5/600 | `ui/tooltip.tsx:45` |
| 5.2 | Quiz option selected = 1px ink border vs `.sb-option.is-sel` 2px ink inset; resting edge is decorative border vs input tone (class string pinned by mobile-conventions — update together) | `quiz-form.tsx:53` |
| 5.3 | Sheet drawer overlay still `bg-black/50` (dialogs got the ink scrim); width 384 vs DS `min(82%, 320px)` | `ui/sheet.tsx:33,57-59` |
| 5.4 | Pagination is a prev/next text pager vs the DS numbered squares; ~33px targets; off-scale `py-1.5` | `pagination.tsx` |
| 5.5 | Theme toggle hand-rolls its segment buttons rather than sharing the segmented styling with `ui/segmented.tsx` (visual output matches; the duplication is the risk) | `theme-toggle.tsx:64` |

## Needs an owner decision (do not fix unilaterally)

| # | Question |
|---|---|
| D1 | **Is `/verify/[code]` a product page or a document?** As a document (certificate), its own display scale + tenant accent is arguably the `sb-doc` layer's job and can be ratified; as a product page it should come to the ramp. Recommendation: ratify as a document surface, write the exception down. |
| D2 | **Floating menu radius**: core.css `.sb-menu` says 10px; the prose says 4px structural; the app uses 4. Repo precedent is "implementation beats prose", which argues 10px on dropdown/popover/select panels. |
| D3 | **feature-gate's `text-xl` h1** carries a comment defending it ("deliberately quieter"). Ratify or bring to `text-h1`. |

## Explicitly sanctioned (checked, not drift — do not "fix")

`global-error.tsx` inline hexes (renders without the stylesheet); certificate accent inline styles
(owner decision 2026-08-13); `input`/`textarea` 16px below `md` (iOS zoom guard); sign-out button
padding (WCAG 2.5.8); brand-mark size prop; admin-shell `3px` subnav metrics (core.css's own
values); switch transparent `border-2` (geometry); `gap-1.5` field stacks (~30×) — **matches
`.sb-field { gap: 6px }` exactly**, an unwritten convention worth a comment, not a change;
progress width-% inline styles; quiz-form + quiz-answer-fields native inputs (both carry
`accent-primary`).

> **Progress log — 2026-08-13 (same day, implemented)**
> All six batches below are **DONE** except the three owner decisions (D1–D3), which remain open:
> - **Class 2**: `ui/native-select.tsx` created (DS chevron via lucide overlay so it follows the
>   theme; Input's metrics and hover grammar); all 9 selects migrated; the certificate checkbox is
>   the kit Checkbox (Radix renders the form input inside NavForm); billing/print/PDF controls on
>   Button; the file field is the Input primitive. Guards: bare `<select>` banned app-wide,
>   accent-less native ticks banned.
> - **Class 3**: "Danger zone" is an ink `text-h3` heading; `variant="destructive"` (delete) and a
>   new `variant="destructive-ghost"` (the six quiet destructive actions — one recipe, red held on
>   hover) replace all three hand-rolled treatments; view-as banner and quiz score banner are
>   Callouts; quiz-builder option prose is ink with green scoped to the tick + "(correct)"; the
>   outline's "Done" is a green StatusBadge and its tick is decorative. Guards: red-via-className
>   on Button banned, coloured headings banned.
> - **Class 1**: lesson-nav current item = underline grammar (side bar + wash + radius removed);
>   accordion trigger = 15/700 with the resolved row-wash hover, square; EmptyState = the open
>   `.sb-empty` composition (dashed box removed, 15/800 title, sunken icon tile).
> - **Class 4**: CardTitle defaults to `text-h3` (auth pages override to `text-h1`); shared
>   `AuthMasthead` (15/800 wordmark) replaces the 4× copy-paste; `/platform` masthead 14/800;
>   `/admin` stat tiles on the KPI grammar; video-unavailable/billing titles to h3;
>   attached-video's tracking override and the dropdown-shortcut tracking removed; the last two
>   2px keylines to 1.75px.
> - **Class 5**: tooltip 2px/11px; sheet on the ink scrim at `min(82%,320px)`; quiz options carry
>   the 2px ink inset when selected with the input-tone resting edge; pager links at control
>   metrics; ThemeToggle shares the exported `.sb-seg` strings with SegmentedNav.
> - Verified: 674 unit tests green including the new guards; full gate green; NativeSelect /
>   Checkbox / destructive variants / EmptyState browser-measured via probe (in dark theme).

## Suggested fix batches

1. **NativeSelect primitive** + migrate the 9 selects; ui Checkbox on course edit. *(kills the screenshot)*
2. **Destructive grammar**: danger-zone heading to `text-h3` ink + the red carried by content and button; all seven buttons onto `variant="destructive"` / one shared ghost-destructive recipe; fix the Revoke hover.
3. **Lesson nav + accordion + empty-state** to resolved grammar (Class 1).
4. **Type ramp sweep**: CardTitle default size, shared auth masthead, platform h1, admin KPI tiles, text-base titles, tracking strays, 2px keylines.
5. **Callout adoption** (view-as banner, quiz score banner) + status-prose fixes + tick labels.
6. **Minors**: tooltip, sheet, quiz option inset, pagination, theme-toggle/segmented sharing.

Each batch gate-checked (`npm run verify` web + db) and browser-verified before commit, fitness
tests extended as each rule lands (native-select ban, destructive-variant requirement, CardTitle
size, coloured-heading ban).

*Supersede, don't delete.*
