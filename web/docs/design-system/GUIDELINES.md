# Structure Build — Design System · Rules of Record

The single source of truth is **`sb-ui.css`**. Every surface — product UI, dashboards,
documents, diagrams, marketing — inherits from it. To rebrand, edit the tokens in `:root`;
change nothing else. All classes are namespaced `sb-` so they never collide with host or
content CSS.

This file records every decision so nothing drifts.

---

## 1. Colour & surfaces

- **Shell / page** `--bg` **#FCFCFB** (warm near-white). **Surface** (cards, tables, inputs)
  **#FFFFFF**. **Sunken** `--sunken` **#F1F1F0**.
- **Monochrome by default.** Ink and neutral grey do the work. Colour appears only when it
  carries meaning.
- **Text is neutral grey-black — never brown.** `--text #1B1B1E`, `--text-2 #45464A`,
  `--text-3 #6A6B70`.
- **Ink** `--ink #1B1B1E` is the primary action and every selected state.
- **The only blue is an inline text link** `--link #1F63C0`. Nothing else is blue — not
  buttons, not selected rows, not tabs. A blue thing on screen always means "clickable text".

## 2. Keylines — and the table exception (read this twice)

- There is **one separator colour**: `--keyline #1B1B1E`, the same near-black as the text.
- The **dark keyline is used in exactly two places**:
  1. **Under a HEADER row** — 2px (heavier than anything below it).
  2. **Between items in flush lists, spec lists and accordions** — 1px.
- **DATA TABLES DO NOT USE THE DARK KEYLINE BETWEEN ROWS.** A data table (task list, order
  register, risk register, legal gating, etc.) gets the **2px dark keyline under its header
  only**; its **rows are separated by a light, quiet divider** (`--border-2 #EFEFED`) **or
  nothing** — never the dark ink line.
  - Putting a dark keyline between every table row is **wrong**. It is the single most common
    mistake and it makes the table look heavy and generated.
  - In practice: use `.sb-table` / `.sb-thead` / `.sb-tr` exactly as shipped and never override
    their row borders. The stylesheet already gets this right.
- Never mix a lighter grey into the *header/list* dark keylines for "some" dividers — that
  inconsistency is an AI tell. (Table rows are the deliberate light-divider case, above.)

## 3. Typography

- One system face: **SF Pro / Inter**, no stylistic alternates, **no monospace for money**.
- One ramp: display 32 / h1 24 / h2 19 / h3 15 / body 14 / meta 12.5 / eyebrow 11.
- Headings are **heavy (700–800)** with tight tracking. Figures are **tabular**.
- The **eyebrow is a kicker only** — a small label above a real heading. Never use the eyebrow
  *as* the heading.

## 4. Spacing & radius

- One spacing scale: **4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 64 · 80**.
- Radius is **minimal: 4px** structural (cards, tables, inputs, buttons), **2px** tags/chips, fully
  round only for avatars. Near-square and crisp — nothing fluffy-pill. For a fully sharp
  "deck-frame" / print look, set `--r:0; --r-sm:0` on `<body>`.
- **Generous whitespace between sections** — this is deliberate, not filler. Give sections a large
  vertical gap; a cramped stack reads as a template, not a designed page.

## 4b. Borders — keylines over boxes

- **A white surface on the off-white shell (`#FCFCFB`) is borderless.** The colour contrast, the
  keylines and the whitespace do the separating; a border on top is just noise. Cards, KPI tiles,
  tables, spec lists and accordions all sit borderless on the shell.
- Keep a border **only where it does real work**: **controls** (inputs, selects, secondary buttons)
  need an edge to read as pressable; **floating** menus / popovers need one (plus a soft shadow) to
  lift off the page; and genuine **white-on-white nesting** needs separation — prefer a keyline, or
  the `.sb-framed` / `.framed` helper for a hairline.
- Discrete labelled objects inside a diagram (tree nodes, workflow steps) keep their outline — they
  are objects, like controls, not background containers.

## 5. Status & charts

- **Six status colours**, each with a soft tint, reserved for state only:
  green complete #17743D · amber in-progress #8A5300 · red overdue/risk #B4302A ·
  blue in-production #2456B5 · grey draft/idle #5E5A52 · purple shipped #6A3FC0.
- **Status is a squared tag with a dot + label — never colour alone.**
- **Categorical chart palette** (separate from status), fixed order, CVD-validated:
  `--cat-1 #2456B5 · --cat-2 #C77400 · --cat-3 #1F8A5B · --cat-4 #7A3FB0 · --cat-5 #B23A48`.
  Assigned in order, never cycled; always paired with a legend and direct labels; a 6th series
  folds into "Other" rather than inventing a hue.
- Single-measure magnitude charts (bar, ranking) use **one ink hue**; multi-series charts use
  the categorical palette. Figures sit in ink, not the series colour. Thin marks, recessive
  gridlines.

## 6. Components

- **Buttons:** primary = ink; secondary = quiet outline; ghost = chrome-free; one height, one
  radius. Full-width ink `.sb-cta` for commitment moments. One primary action per view.
- **Inputs / selects / chips / tabs / breadcrumb:** selection reads through weight and an ink
  underline or fill — never a pastel background.
- **Tables:** one treatment, four densities (`--vcmp / --cmp / --std / --gen`) chosen from a
  **dropdown, not a row of buttons**. Selected row = neutral ink wash, never blue. See §2 for
  the keyline rule.
- **KPI tiles:** big tabular value + delta + sparkline + a "vs target" subline.
- **Options:** selected = 2px inset **ink** ring on a sunken fill (no pastel highlight).
- **Spec lists & accordions:** borderless (`is-flush`), divided by the 1px dark keyline.
  **Chevron: points RIGHT when collapsed, rotates DOWN only when expanded.**
- **Navigation:** top bar + product menu; side menu with an ink active-marker; nested sub /
  sub-sub menus; collapsible sections follow the chevron rule.
- **Task list / hierarchy:** built on `.sb-table`, so it obeys the table keyline rule. Levels are
  **Section** (grouping bar with an ink left-accent) → **Task** (bold ink) → **Subtask** (indented,
  guide-lined) → **Sub-subtask** (indented again, lighter). Nesting is shown by **one indent step
  per level plus tree guide-lines**, never a dark divider. Parent rows get a disclosure chevron
  (down only when open); multiple owners stack as avatars; blockers get a red SHOW-STOPPER flag.
- **Product surfaces:** category listing = quiet card grid; product detail = editorial (label
  column beside content column), flush keyline specs, ink Buy CTA, ink-inset option cards, a
  bill-of-materials accordion, Export CSV / Download PDF. FAQ is left-justified to the content column.
- **Documents & print:** PDFs, agreements, specification & warranty docs, catalogues and slides use
  the same tokens — ink headings, 2px header keyline, flush keyline specs, tabular figures, a footer
  page number. A document, a slide and a dashboard must be visibly one brand.

## 7. Diagrams

- Ink nodes, keyline connectors, categorical palette for phases.
- Structure and org charts carry real depth (subsystems + specs; departments + headcount).
- **Gantt** shows phases, indented subtasks, % complete (darker fill), **finish-to-start
  dependency arrows (predecessors)**, a milestone diamond, and a live red today line.

## 8. Accessibility — WCAG 2.1 AA, by construction

Text/UI meet AA contrast · visible focus rings · fully keyboard-operable · status is dot +
label (never colour alone) · targets ≥ 24px · charts have legend + direct labels + table
fallback · categorical palette CVD-validated · `prefers-reduced-motion` respected.

## 9. The "designed, not AI-generated" test

No fully-rounded fluffy pills · no drop shadow on every card · no pastel state tints
(selection is ink) · blue is links only · no eyebrow-as-heading · no robot-monospace money ·
**no dark keyline between table rows** · one heavy type ramp with tabular figures · one ink
keyline used only where §2 allows · generous whitespace.

## 10. Dark mode

- Dark mode is a **token overlay** — `sb-dark.css`, loaded after `sb-ui.css`. Apply
  `data-theme="dark"` on `<html>` or `<body>`; remove it for light. Nothing else changes.
- The logic inverts, the rules do not: **ink flips to near-white** `#F2F2F3` (`--on-ink`
  near-black `#141416`), shell `#131315`, surface `#1C1C1F`, sunken `#26262A`.
- **The keyline stays the same colour as the text** (`--keyline #E9E9EB`) — the 2px-header /
  1px-flush-list rule and the table exception apply unchanged.
- **Blue is still links only** (`--link #6EA3EA`, lightened for AA on dark).
- Status and categorical hues are **lightened for AA contrast** on their dark tints; the six
  status meanings and the fixed categorical order are unchanged.
- Four literals in `sb-ui.css` were repointed from `#fff` to `var(--on-ink)` so they invert:
  pagination active page, avatar, funnel bar, tree root node. Any new component putting text on
  `var(--ink)` must use `var(--on-ink)`, never `#fff`.
- A handful of light-only literals get surgical `[data-theme="dark"]` overrides at the bottom
  of `sb-dark.css` (active chip wash, input focus glow, select chevron, Gantt bar labels).

---

*Pair with `sb-ui.css`. File naming follows the Structure Build standard:
`Subject_Type_YYYY_MM_DD__HH_MM.ext`.*
