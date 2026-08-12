# Training Platform — Full Review

**Date:** 2026-08-13 · **Target:** `training.structurebuild.co` (live, single-tenant Outdure Academy)
**Signed in as:** platform admin (`stevie.van.heerden@outdure.com`)
**Scope:** every route, page and tab. Video playback excluded (Bunny trial expired), per instruction.

---

## 1. How this was tested

Two passes, run against the live deployment and the repo at `main`.

**Pass A — browser loop (real Chrome, authenticated session).** For every route: navigate → settle → measure. Each page was put through the same instrumented loop rather than eyeballed:

- **Timing** — server render measured as TTFB vs full-stream completion, each route sampled 2–3× so cold-start is separated from steady state.
- **Design-system probe** — a script injected per page that reads *computed* styles across every visible element and checks them against the actual rules in `C:\design-system-main` (`Design-System-Guidelines.md`): chromatic colour outside the sanctioned set, radius, the named type ramp, the 4/8/12/16/20/24/32/40 spacing scale, border widths against the 1px/1.75px two-line system, table row density, tabular figures, WCAG AA contrast computed against resolved backgrounds.
- **Accessibility probe** — accessible names, label association, heading order, landmark structure, target size, plus a real keyboard walk (actual `Tab` presses, focus recorded via a `focusin` listener) because programmatic `.focus()` does not reliably trigger `:focus-visible`.
- **Mobile** — 375px viewport with device emulation, also giving the logged-out experience.

**Pass B — code audit.** 76 agents over `web/` and `db/` across six dimensions (server perf, client/bundle, a11y, DS drift, UX/copy, correctness). Every claim was then handed to an independent adversarial verifier told to refute it. **70 claimed → 34 confirmed, 36 refuted.** Only confirmed findings appear below.

### Two probe results I had to throw away

Worth recording, because both would have been confidently wrong:

- The probe reported **no visible focus ring on 46 elements**. False. A real `Tab` walk shows a correct 2px ring at 2px offset on every control. Programmatic focus doesn't match `:focus-visible`.
- The probe flagged the green status badge (`#17743D`) as a monochrome violation. False — that is the design system's **sanctioned status green**. `#17743D / #8A5300 / #B4302A` are reserved status colours in the DS. Likewise the certificate verification code *looks* monospaced but is Inter + `tabular-nums` + tracking, with a source comment saying the spec rejects monospace. Conformant.

> **Note on CLAUDE.md §13.** Rule 1 reads "The one sanctioned colour is blue (`#1F63C0`) on inline **text links only**". That is incomplete against the master guidelines, which also reserve green/amber/red for status. A contributor trusting §13 literally would "fix" correct status badges into greyscale. Worth amending.

---

## 2. Verdict

This is a well-built product with genuinely good bones — server-side authorisation on every admin action, confirm dialogs whose copy names the consequence, helpful empty states, correct `autocomplete` on auth forms, tables wrapped in horizontal scrollers, strict monochrome discipline, and **zero WCAG AA contrast failures on any page tested**. The fitness-test culture is real and it is working.

The problems cluster in three places:

1. **Certificates can silently lie.** The most consequential surface in an accreditation product has the most defects.
2. **Everything is about a second slower than it needs to be**, from a repeated query pattern and a 756 KB baseline bundle.
3. **The design system is ~85% adopted**, and the remaining 15% is concentrated in the learner-facing UI — so learners see a different visual language than admins.

Nothing here is architectural. It is all correctable without redesign.

---

## 3. P0 — Certificate integrity

These undermine the platform's core claim (audit-grade evidence). Fix first.

| # | Finding | Where |
|---|---|---|
| 1 | **`/verify` returns 404, but every printed certificate says "Verify at training.structurebuild.co/verify".** Confirmed live: `/verify` and `/verify/` both 404 with "Page not found". Anyone following the printed instruction hits a dead end. Needs a landing page with a code input. | `verify/[code]/page.tsx:179` |
| 2 | **A revoked certificate is still shown to the learner as earned**, counted in their stats, with a working "View your certificate" button. Neither learner surface filters on `revokedAt`. Revocation is the deliberate act of withdrawing a credential; the learner never learns it happened. | `t/[slug]/dashboard/page.tsx:67`, `learn/[courseSlug]/page.tsx:77` |
| 3 | **Deleting a course destroys every certificate it ever issued** — and the confirm only says "Delete this course and all its content? This cannot be undone." Cascade runs `courses → enrollments → certificates`, so every public `/verify/:code` a learner is relying on dies with it. The dialog must name certificates and count them. | `admin/courses/[courseId]/page.tsx:143` |
| 4 | **Certificate dates render as `8/11/2026`** — US M/D/YYYY, ambiguous internationally, on an Australian product with British spelling throughout. Worst on the public verify page a third-party auditor reads. The correct pattern already exists in the codebase (`course-complete.tsx:69` uses `en-GB` and renders "11 August 2026") — it just isn't applied at the three bare `toLocaleDateString()` sites. | `verify/[code]/page.tsx:137,146`; `admin/certificates/page.tsx:99` |
| 5 | **Deleting a section strands learners at 100% with no certificate.** `deleteLesson` has an explicit reconciliation pass that re-runs `finalizeCourseCompletion` for affected enrolments, with a comment explaining exactly why. `deleteSection` — which removes more lessons at once — has no such pass. | `builder/actions.ts:250` |
| 6 | **Completing a course that deliberately awards no certificate tells the learner their certificate failed.** `certificateEnabled` is a first-class toggle and `finalizeCourseCompletion` honours it, but the learner page never selects that column, so it reports an error and tells them to contact an admin who has nothing to fix. | `learn/[courseSlug]/page.tsx:131` |

---

## 4. P1 — Speed

Measured warm, steady-state, from the browser to the live deployment. Every admin page splits into ~800 ms shell (auth + tenant resolution) plus 1.0–1.9 s of data time:

| Route | TTFB | Data time | Total |
|---|---|---|---|
| `/admin` | 767 ms | 1095 ms | 1886 ms |
| `/admin/courses` | 988 ms | 1462 ms | 2450 ms |
| `/admin/certificates` | 1006 ms | 1484 ms | 2490 ms |
| `/admin/analytics` | 773 ms | 1568 ms | 2341 ms |
| `/admin/people` | 735 ms | 1916 ms | 2651 ms |
| `/dashboard` (cold) | 928 ms | — | **4346 ms** |

First contentful paint on the admin dashboard measured **3748 ms** — to render three numbers, for an academy with 3 courses and 3 learners. This will not improve on its own as data grows.

**Confirmed causes:**

1. **The same `tenants WHERE slug` query runs 3–4× per page load.** `requireAdminForSlug()` isn't wrapped in `cache()` while its siblings are, so the tenant row is resolved by the admin layout, the page, the tenant layout and `generateMetadata` independently — against a 5-connection pool, so under concurrency they serialise. Fix: one `cache()`d `tenantBySlug` resolver. *(`lib/tenant.ts:185`)*
2. **756 KB of JS on every route before any page code** — 79% of it Sentry + PostHog in the root layout, verified against `.next/build-manifest.json`. The public verify page an auditor lands on and the storefront both pay it. *(`posthog-provider.tsx:4`)*
3. **Paginated admin lists run their COUNT and their rows sequentially** instead of in one `Promise.all`. *(`admin/people/page.tsx:60`)*
4. **`progress_events` has no `(enrollment_id, event_type)` index.** Heartbeats are written every ~15 s, so a learner with 5 hours of watch time has ~1,200 `video_progress` rows against ~30 `completed` rows — and the completed-lessons read scans all of them. The learner's two most-visited pages get slower the more video they actually watch. *(`db/schema.ts:344`)*
5. **The course outline fetches every lesson's `content` jsonb to render a list of titles**, then `getCourseProgress` re-fetches the same lessons. The sibling player already fixed this and left a comment saying so; the overview was left behind. *(`learn/[courseSlug]/page.tsx:58`)*
6. **Four purely presentational primitives are marked `'use client'`** (`table`, `card`, `input`, `textarea`), hydrating every table cell in the admin area for no reason. Note: the bundle saving here is near zero — the honest win is ~175 needless component invocations on `/admin/people`, not payload.
7. **The Sign out button pulls 188 KB of `@supabase/supabase-js`** onto every admin page, the learner dashboard and the storefront.

---

## 5. P2 — UX and dead ends

1. **35 of 41 admin nav items are dead** — only Dashboard, Courses, Certificates, All Users, Insights and Academy Settings work. The other 35 (Gradebook, Question Banks, Community, Offers, Affiliate Programme, Activity Log, Security, Privacy/GDPR…) all route to `/admin/coming-soon`. Two of them shadow the **working** Billing page. This is the single biggest impression problem in the product: the sidebar reads as a mostly-broken application.
2. **`/admin/coming-soon` is a true dead end** — it renders a heading and one sentence with **zero links or buttons**. No way back except browser Back. Its copy ("tell whoever looks after this platform") reads as placeholder, and its `h1` is 20px where every other page uses 24px.
3. ~~**Keyboard users must Tab through all 41 nav links to reach page content**, and the skip link that should rescue them is **1×1px and never becomes visible on focus** — verified by focusing it and measuring: stays 1×1. That's a WCAG 2.4.7 failure on the one control meant to fix the problem.~~ **RETRACTED 2026-08-13 — this was wrong.**

   > The admin skip link **works correctly**. Re-tested with a real `Tab` press in a focused window: it becomes a 139×41 `position: fixed` panel at the top-left with a visible focus ring. The original measurement used a programmatic `element.focus()`, which does **not** match `:focus` while the document lacks window focus — so it reported a 1×1 box and looked exactly like a broken skip link. This is the same false-positive class as the retracted focus-ring finding in §1; I caught that one before publishing and missed this one.
   >
   > **What survives:** there was no skip link on any *learner* surface, which matters most on the lesson player where the entire course outline sits in an `<aside>` before `<main>`. Fixed separately. Screen-reader users on admin pages do still hear all 35 "Soon" items before content, which is an argument for §5.1, not for a skip-link defect.
4. **No skip link at all on any learner surface** — and the lesson player puts the entire course outline before `<main>`. *(`learn/[courseSlug]/[lessonId]/page.tsx:259`)*
5. **A pending or unlinked user is stranded.** The apex dashboard fallback renders a heading and one paragraph — no nav, no sign-out, no link anywhere. It's the guaranteed destination for anyone whose join request isn't accepted yet, and the only exit is editing the address bar. *(`dashboard/page.tsx:49`)*
6. **`/auth/set-password` — every invitee's first screen — shows "This link is no longer valid" while it waits** on a client-side `getUser()` round trip behind a 992 KB download. The least forgiving audience is told they're broken during normal loading. *(`auth/set-password/page.tsx:27`)*
7. **Quiz questions cannot be edited.** The only control is delete, and the confirm admits it destroys learner answers — which are exactly what feeds "Where learners get stuck". Fixing a typo means destroying evidence. *(`builder/quiz/[lessonId]/page.tsx:141`)*
8. **The quiz attempt cap is invisible until it's terminal, and names a recovery that doesn't exist.** On exhaustion: "Ask your administrator to reset it." No reset exists anywhere in the codebase, and there's no per-learner drill-down. The learner is hard-stopped — course can never reach 100%, no certificate ever issues. *(`learn/[courseSlug]/actions.ts:276`)*
9. **Approving a join request emails "You've been invited — accept your invitation"** to someone who already has an account and just asked to join. *(`admin/people/actions.ts:335`)*
10. **Every page's browser title is "Outdure Academy".** No admin page sets metadata; nor does the public verify page, which also has no OpenGraph — so a credential link pasted into an email or Slack shows nothing. History, bookmarks and tabs are all unusable.
11. **"Deactivate" renders on your own row** even though the server always rejects it. `View as` and the role picker are both correctly suppressed there, so the pattern is inconsistent. (The error *is* handled well — `NavForm` surfaces the message in a dialog — but a control that can only fail shouldn't be offered.)
12. **Two URL spaces for the same pages.** Nav links point at `/admin/courses` while direct entry gives `/t/outdure/admin/courses`; both render. Harmless today, but it splits analytics and bookmarks.
13. **The login page has no route to "Request access"** — the landing page has one, login doesn't.
14. `/verify/<bad-code>` returns **200** with "Certificate not found" — graceful, but should be 404.

---

## 6. P3 — Design system conformance

Checked against `C:\design-system-main` (baseline `52edb04`, **no upstream changes** since last reconciliation — verified).

**Strong:** strict monochrome (zero rogue colours on any page), correct status dot+word tags, correct 11px/700/uppercase eyebrows, 2px tag radius, no icons in nav, no block background on the current nav item, tables in scrollers, zero contrast failures.

**Gaps, all verified from computed styles:**

| Rule (DS reference) | Actual | Where |
|---|---|---|
| "Navigation hover/selection is **square** (no radius)"; hover = label darkens to ink, wash only on **press** | Nav items have **4px radius** and take a **rounded grey block wash on hover** | sidebar nav |
| Ink keyline is **1.75px** | **2px** — both the table-header keyline and the current-item underline | `table.tsx`, nav |
| Ink keyline sits **under section headings** | `h2` section headings carry **no** keyline (0px); only a 1px hairline on the parent | builder, analytics |
| Selection underline **hugs the text** | 2px at **4px offset** — visibly detached | nav |
| "Standard interactive/label size is **13.5px**" | **14px** on nav items, buttons and inputs | throughout |
| Meta = **12.5px** | `text-xs` resolves to **12px** — the ramp remap missed this step | badges, slugs, email, captions |
| Body = **14px** | Every page-description `<p>` is **16px** (inherited browser default) | all 11 admin pages |
| Eyebrow = **11px** | "Soon" tag is **10px** | nav |
| Ramp is 32/24/19/15/14/12.5/11 | Verify page uses **30px / 36px / 20px** (`text-3xl`, `text-4xl`, `text-xl`); coming-soon `h1` is **20px**; landing uses 16/18px | `verify/[code]`, `coming-soon`, `/` |
| Spacing scale is 4/8/12/16/20/24/32/40 | **10px** (`gap-2.5`, `px-2.5`) and **6px** (`px-1.5`) in use | nav, tags, buttons |
| "Blue is for inline text links only — **never for icons**"; status colours "reserved strictly for **state**" | **Delete icons are status red `#B4302A`** — colour on an icon *and* a status colour used for an action. Also a blue icon inside the learner dashboard certificate link | builder, `dashboard/page.tsx:220` |
| Tables: Standard density **~44px** | **52–53px** on courses/people/certificates, **36–37px** on analytics — two densities, neither the standard | admin tables |
| Tabular figures on numbers | Dashboard stat cards are `font-variant-numeric: normal`; the Insights KPIs are correct — same pattern, built twice | `admin` vs `admin/analytics` |
| "Current = ink label + 1.75px underline… **never a coloured block, wash, or side bar**" | **Learner lesson nav uses a 2px left bar + block wash + 700 weight** — the exact forbidden treatment. Admins get an underline, learners get a block: two visual languages for one concept | `lesson-nav.tsx:64` |
| Two KPI tile designs | Neither matches the system's specimen | `admin/analytics:141` |
| "Everything is disabled under `prefers-reduced-motion: reduce`" | **Zero occurrences repo-wide**, against 17 `transition-colors`, `animate-pulse` and `animate-spin`. The pulsing skeletons run on every page load | `globals.css` |
| WCAG AA in **both** light and dark | Dark mode is deliberately switched off (`color-scheme: light`, `dark:` variant gated on a `.dark` ancestor that's never applied). Documented in-file as a future toggle — flagging as a known DS gap, not a defect | `globals.css` |

**Course builder** is the least polished screen and worth a focused pass: control heights are **36 / 32 / 29px** side by side, input widths are ragged (**160 / 84 / 80 / 224 / 176 / 209px**), the video URL and video-ID fields have **no labels at all** (placeholder-only), and raw Bunny UUIDs are shown to authors both as placeholder text and in body copy ("A video is attached (2eb2cd49-f01f-…)").

---

## 7. P4 — Accessibility

Zero contrast failures anywhere, correct landmarks, correct heading order, sensible `aria-label`s on icon buttons and row controls, correctly `disabled` reorder buttons. The remaining items:

- Skip link invisible on focus; no skip link on learner surfaces (§5.3–5.4).
- **`NavForm`'s disabled fieldset throws keyboard focus to `<body>` on every submit** — focus is lost after each action. *(`nav-form.tsx:192`)*
- **Two controls use the decorative border token, giving a 1.12:1 boundary** — invisible control edges. *(`print-button.tsx:8`)*
- **The `Progress` primitive ships with no accessible name.** *(`ui/progress.tsx:14`)*
- **Mobile admin drawer close button is a 16px target.** *(`ui/sheet.tsx:72`)*
- Video URL/ID inputs labelled only by placeholder *(`video-upload.tsx:200`)*.
- **Tenant-supplied brand colours reach inline `style` with no format or contrast validation** — a tenant can set unreadable or non-monochrome text. It's also architecturally at odds with the DS ("no brand accent colour in the UI… differentiation is by logo and wordmark only"). *(`admin/settings/actions.ts:18`)*
- Course-title links in tables are 17px tall (under the 24px guideline).

**Mobile (375px):** clean. No horizontal overflow, no sub-44px targets, 44px inputs and buttons, correct `autocomplete="email"` / `current-password`, properly associated labels. Inputs are 16px, which is off the DS control size but is the right call to prevent iOS zoom-on-focus — worth documenting as deliberate so it isn't "fixed".

---

## 8. Suggested order

1. **Certificate integrity** (§3) — six fixes, all small, and they're the ones that damage trust. Start with the `/verify` landing page and the `revokedAt` filters.
2. **`cache()` the tenant lookup + `Promise.all` the COUNT queries** (§4.1, 4.3) — biggest latency win for the least code.
3. **Prune the nav** (§5.1) — ship 6 working items, or group the 35 behind one honest "Not built yet" section. Give `coming-soon` a way out.
4. ~~**Make the skip link visible on focus** (§5.3)~~ — **retracted, the admin skip link was never broken.** Replaced by: add a skip link to the **learner** surfaces (the lesson player buries `<main>` behind the whole course outline). Done.
5. **Per-page `metadata`** (§5.10) — mechanical, immediately visible.
6. **One DS token pass** (§6): keyline 2px→1.75px, nav radius→0, `text-xs`→12.5px, page descriptions→14px, controls→13.5px, one table density, `prefers-reduced-motion` block, drop red from the delete icons. Most of this is a handful of token edits in `globals.css`, not per-component work.
7. **Learner lesson nav** (§6, `lesson-nav.tsx`) — the one place the learner UI contradicts the system outright.
8. **Bundle** (§4.2) — lazy-load PostHog/Sentry off the root layout.
9. **Builder polish** (§6) — labels, control heights, hide the UUIDs.

---

## 9. Doc corrections

- `CLAUDE.md` §13 rule 1 should name the reserved status colours (`#17743D` / `#8A5300` / `#B4302A`) alongside the link blue, or it reads as forbidding correct status badges.
- The 16px mobile input size should be recorded as a deliberate deviation, like the `#858585` input border already is.
