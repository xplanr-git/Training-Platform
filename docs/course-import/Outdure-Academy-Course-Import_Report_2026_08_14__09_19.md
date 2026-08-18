# Outdure Academy — Course Import Report

**Source:** Google Sheet "2024 ONLINE TRAINING PLATFORM" (`1lUuWs4JbH_zTt7fURPsVSTgn3yWI0VdcIH5vu0h88Xc`, owner curtis@outdure.com, last modified 2026-08-13).
**Reviewed:** 2026-08-14. All 7 tabs read in full, including cell formatting (which carries meaning — see conventions).

**Companion files in this folder:**

| File | What it is |
|---|---|
| `Outdure-Academy-Course-Import_Extraction_2026_08_14__09_17.json` | The machine-usable manifest: every course, section, lesson, video, quiz and all 75 questions with answer keys. **This is the upload source of truth.** |
| `Outdure-Academy-Video-Upload_Register_2026_08_14__09_17.md` | Checklist of the 56 unique videos with status, duration and where each is used. |

No multi-session loop was needed — the sheet fits one extraction pass. The JSON is the handoff for the actual upload build.

---

## 1. How the sheet encodes meaning (decoded conventions)

The sheet has almost no headers; the structure lives in formatting and formulas:

- **Durations are `mm.ss`** (e.g. `13.57` = 13 min 57 s). Confirmed: across ~60 values none has `.60+`. The sheet's own "hrs" totals sum these as plain decimals, so its totals are slightly off; the JSON carries exact seconds.
- **Questions tab: a green-filled option row (`#B6D7A8`) is the correct answer.** Two or more green rows = multi-select. This yields an explicit answer key for **73 of 75** questions.
- **Column J/K = original question + options; column L = "CHANGES REQUIRED"** (a partial redraft, some with `X"` / "etc" placeholders); **column N = comments** (e.g. "Use new images").
- **Strikethrough = crossed out of that track** (both Standard tabs strike every Welcome video except Dealers).
- **Section membership is proven by the total formulas in column A**, not by row position. Notably, in the 2026 tab the Tile/Turf System Overviews sit *below* the DeckPlanner rows but *are* included in the Product Series total; A205/A206 + their quiz are in **no** 2026 total (dropped from Standard in the 2026 revision).
- Status flags per lesson: `recorded / edited / live / youtube` (TRUE/FALSE/blank).
- Yellow/pink cell fills = attention flags (A220 missing-video block, "Knowledge Quiz A200" in red, A201 + Product Series Intro flagged in the 2026 tab).

## 2. The courses to build

Two live tracks (the FLOW tab: Signup → Qualification questionnaire → choose **Standard Training** or **Trained Installer**). The "2024 Standard training" tab is superseded by the 2026 one and is in the JSON for reference only.

### Course A — Standard Training (2026) · ~1.9 h

| Section | Lessons (duration · status) |
|---|---|
| Welcome | Welcome - Dealers (1:04 · live). *Struck in sheet:* Distributors (1:00 · live), Staff (1:35 · live), Contractors/Installers (coming soon), Home owners (coming soon) |
| Intro Series | Welcome to Outdure (19:05 · live) |
| Product Series – Standard | Product Series Intro & Overview (2:09) · QwickBuild framing (8:18) · **QwickBuild Quiz (9 q)** · A201 90° Bracket (13:30) · **Quiz (4 q)** · A202 Joiner (3:50) · **Quiz (4 q)** · A203 Joist Anchor (5:40) · **Quiz (3 q)** · Twistclips (5:05) · **Quiz (4 q)** · A194/A195 Posts (2:05) · **Quiz (2 q)** · A900 Supports (9:15) · **Quiz (7 q)** · *Course Completion marker* · Tile System Overview (3:37) · Turf System Overview (2:00) |
| DeckPlanner – Standard | General overview (13:57 · status blank) · Shape and size (8:28) · Select surface (1:27) · Design layout (5:10) · Structure (3:22) · Item list (1:51) · Downloading PDF (5:02) — all recorded+edited, **none live yet** |
| Railing *(placeholder)* | A851 Solid Blocking (4:53) — section otherwise empty |

Dropped from 2026 (was in 2024 Standard): A205 (5:21), A206 (3:57), A205/A206 Quiz (4 q).

### Course B — Trained Installer Training · ~3.8 h (superset of Standard)

Welcome + Intro identical to Course A (no strikethroughs — all 5 welcome variants listed). Product Series runs the **full EP1–EP11 curriculum**, DeckPlanner the full EP1–EP5:

| EP | Group | Lessons · quizzes |
|---|---|---|
| EP 1 | Qwickbuild Overview and A100 | Intro & Overview (2:09) · QwickBuild framing (8:18) · **QwickBuild Quiz (9 q)** · A194/A195 Posts (2:05) · **Quiz (2 q)** |
| EP 2 | Most common brackets | A201 (13:30) · **Quiz (4 q)** · A202 (3:50) · **Quiz (4 q)** · A203 (5:40) · **Quiz (3 q)** |
| EP 3 | A200 range | A205 (5:21) · A206 (3:57) · A207 (3:23) · A208 (4:25) · A210/A211 (2:13) · A212 (4:17) · **A220 Beam End Cap — video MISSING** · **Knowledge Quiz A200 (pool of 8 q)** |
| EP 4 | A300 range (for A110) | A301 (4:55) · A302 (3:34) · A306 (3:42) · A307 (3:21) · **Knowledge Quiz A300 (pool of 7 q)** |
| EP 5 | A400 fasteners | A401–A404 (2:33) · A409 (1:17) · A410–A413 (1:34) · A420 (0:51) · **Knowledge Quiz A400 (pool of 3 q)** |
| EP 6 | A500 clips | Twistclips (5:05) · **Quiz (4 q)** · A512 T Clip (2:25) · **Quiz (1 q)** · A590 Starter Clip (3:26) · **Quiz (1 q)** · A595/A596 Screws (1:32) · **Quiz (2 q)** |
| EP 7 | A600 hardwood screws | A610/A611/A620/A621 (2:09) · **Knowledge Quiz A600 (4 q)** |
| EP 8 | A700 tiles | Tile System Overview (3:37) · A701 Rubber Bead (1:42) · **Quiz (3 q)** · A702/A703 Retainers (5:59) · **Quiz (2 q)** · A710/A711 Spacers (1:57) · **Quiz (2 q)** · A712 Tile Trim (4:15) · **Knowledge Quiz A700 (pool of 8 q)** |
| EP 9 | A800 turf | Turf System Overview (2:00) · A801 Turf Baseboard (2:05) · **Quiz (4 q)** · A810/A811 Turf Screws (3:15) |
| EP 10 | Additional A800 | A831/A832 Qwickgrate (9:12) · **Quiz (2 q)** · A840 Anti-Slip (1:39) · A851 Solid Blocking (4:53) · **Quiz (2 q)** · A855 Batten (4:31) · **A855 Quiz — NO questions exist** |
| EP 11 | A900 supports | A900 Supports (9:15) · **Quiz (7 q)** |
| DP 1–5 | DeckPlanner | General overview (13:57) · Create account (3:04) · Dashboard (5:12) · Shape/size (8:28) · Select surface (1:27) · Design layout (5:10) · Structure (3:22) · Item list (1:51) · Downloading PDF (5:02) · Multiple projects (2:38) · Reload plans (1:14) |

### Certificates (FLOW tab)

- Product Series completion → **Product Certificate**
- DeckPlanner Series completion → **DeckPlanner Certificate**
- Trained Installer track completion → **Trained Installer Accreditation** ("certificate issued and added to google sheet")
- Standard-track completion → popup offering the Trained Installer upgrade

This maps onto the Connect contractor ladder (Contractor Mstructure tab): Tier 1 Overview (19 min, everyone) → Tier 2 Basic Training (core products + DeckPlanner, everyone) → Tier 3 Comprehensive Training (= the 3.52 h Trained Installer track; Distributor/Contractor/Pro) → Tier 4 Verified Installer (checklist, photos, inspection — operational, not LMS content) → Tier 5 Trained Partner ($12,500/$10,000 tier; Pro only). Note in sheet: "ALL photos need to be emailed to Parksite and Outdure teams."

## 3. Videos to upload — 56 unique files

Full checklist in the register file. Summary:

| Status | Count | Notes |
|---|---|---|
| Recorded + edited + live | 42 | The whole product curriculum & 3 welcome/intro videos. Only 2 are on YouTube (QwickBuild framing, A194/A195); the rest exist only as edited files. |
| Recorded + edited, not live | 10 | All DeckPlanner videos. |
| Status blank | 1 | DeckPlanner "General overview" (EP 1) — has a YouTube-style title but no flags; confirm it exists. |
| Not recorded | 3 | A220 Beam End Cap (flagged "MISSING VIDEO !"), Welcome - Contractors, Welcome - Home owners (both "COMING SOON"). |

Total unique runtime ≈ **3 h 46 m**. **The sheet contains no video files or links** (one YouTube Studio link only) — the actual files must come from Curtis / YouTube Studio / the drive before Bunny Stream upload. Every video's YouTube title + description (where authored) is in the JSON for metadata reuse.

Also in the sheet but outside both tracks (`future_content` in the JSON): the staff **Outdure Onboarding** series (9 of 12 episodes recorded, 34:28 total — could be a third, staff-only course), plus planned-but-unrecorded groups (How to Order ×4, Resources, What to Know About Building Decks ×4, Surfaces, Sales Cases, Value Added Services) and 4 production assets (intro, ending, A401 insert, deckplanner outro).

## 4. Question bank — 75 questions, 26 blocks

- **Counts cross-checked**: the tab's own counter (`I1 = SUM = 75`) matches the extraction exactly.
- Types: 58 single-choice · 13 true/false · 3 multi-select (Q011 posts sizes, Q022 A203 profiles, Q065 Qwickgrate colours) · 1 matching (Q009 profile↔code).
- **Answer keys: 73/75 explicit** (green fill). Q009's pairs as listed *are* the key; **Q043** ("Is there a one type fits all Twistclip?") is unkeyed — answer is self-evidently B but should be confirmed.
- **Knowledge-quiz pools**: the trained-installer section quizzes draw on per-video blocks — KQ A200 = A205/206+A207+A208 (8 q), KQ A300 = A301+A302+A306/307 (7 q), KQ A400 = A400-screws+A420 (3 q), KQ A700 = A701+A702/703+A710/711+A712 (8 q). The JSON's `question_bank.blocks[].feeds_quiz_lessons` + `quiz_pools` encode this.
- Every question carries: prompt, options with correct flags, the revised "CHANGES REQUIRED" variant where authored, comments, and source row for auditing back to the sheet.

## 5. Issues & decisions needed before/during upload

1. **Video source files** — nothing to upload from the sheet itself; need the edited files (only 2 are even on YouTube).
2. **A220 Beam End Cap** — video missing; ship EP 3 without it or wait.
3. **A855 quiz has no questions** (lesson exists in the sheet); the A410–A413 quiz row is also empty. Write questions or drop those quiz rows.
4. **Q043 answer unmarked** — confirm (B).
5. **9 image-based questions** (A201/A202/A203/A205/A207/A208/A301/Twistclip/T-Clip "which item is…") need image assets; sheet comments say "Use new images". Platform quiz options are text-based today — either attach images to options (build) or reword.
6. **Q009 is a matching question** — the platform quiz builder is MCQ/TF; adapt to MCQ(s) or defer.
7. **"CHANGES REQUIRED" redraft is unfinished** (placeholders like `Low height decks from X" > X"`, options "etc"). Recommendation: upload the **original** wording + keys now; treat column L as an authoring backlog. Where the revision is complete and keyed (e.g. Q005 lengths in ft) it's captured in the JSON (`revised_*` fields).
8. **Welcome videos** — FLOW says "based on customer type", but both Standard tabs strike all except Dealers, and 2 of 5 variants are unrecorded. Decide: Dealers-only for launch, or per-audience welcome (needs per-audience delivery logic the platform doesn't have yet).
9. **DeckPlanner series isn't live** in the sheet (10 videos recorded+edited, EP 1 status blank) — confirm the files are final.
10. **EP 8 has both per-video quizzes AND Knowledge Quiz A700 over the same 8 questions** — decide one or both (duplication if both).
11. **Railing section** is a placeholder (one video). Include under Product Series or hold back.
12. **Pass mark / attempts / retakes are specified nowhere** in the sheet — platform decision needed per quiz (suggest a uniform pass mark, e.g. 80%, owner to confirm for accreditation claims).
13. **2026 vs 2024 Standard** — build 2026; A205/A206 stay Trained-Installer-only.

## 6. Mapping to the platform (for the upload session)

Target: the v2 app (`web/` + `db/`), single-tenant Outdure academy. The JSON maps 1:1 onto the schema:

- `courses` ← Course A (Standard 2026) + Course B (Trained Installer); optional Course C (Staff Onboarding) later.
- `sections` ← the section rows (Welcome / Intro / Product Series / DeckPlanner / EP groupings as desired).
- `lessons` ← `kind: video` rows (Bunny video ID once uploaded; duration from Bunny, sheet duration as cross-check) and `kind: quiz` rows.
- `quizzes` + `quiz_questions` ← question blocks: `options_jsonb` from `options[].text`, `correct_jsonb` from `options[].correct`, `type` from `question.type` (single/multi/TF; matching needs adaptation), 1 point each (sheet weights all questions 1).
- Certificates ← completion-triggered per course (platform already issues completion certificates with `/verify/:code`).
- The FLOW's "qualification questionnaire" and "popup" steps are product features (join flow / UI), not course content.

---
*Extraction pipeline: sheet exported to xlsx (snapshot in session scratchpad), parsed with openpyxl including formatting; extractor script asserts 75 questions / 26 blocks. Re-run against a fresh export if the sheet changes.*
