# Outdure Academy — Platform Import Notes

**Executed 2026-08-14 ~09:35** against the live v2 Supabase project (tenant `outdure`,
`f33914c3-6a1e-4c1b-8510-449ca754ea6b`). Both courses created as **draft** — invisible to
learners until published.

| Course | Slug | Id | Content |
|---|---|---|---|
| Standard Training | `standard-training` | `a2cd7c08-0dd2-4eda-92c0-73110a2adfac` | 4 sections · 19 placeholder videos · 7 quizzes · 38 questions |
| Trained Installer Training | `trained-installer-training` | `401a9aff-58e8-4e79-942c-0795e89134c2` | 14 sections · 56 placeholder videos · 21 quizzes · 87 questions |

Payload: `Outdure-Academy-Platform-Import_Model_2026_08_14__09_34.json` (built from the
extraction manifest `..._Extraction_2026_08_14__09_17.json`). Importer: [db/import-courses.mjs](../../db/import-courses.mjs)
(`dry-run` / `execute` / `verify`; refuses to run if the slugs already exist).

## Placeholders

Every video slot is a `video` lesson with **nothing attached** — the builder's own
"not-attached" state. The builder shows Upload / Import-from-link / Attach-Bunny-id controls
on each one; attaching the real video later needs no restructuring. Each placeholder carries
the sheet's metadata in `content.planned` (video name, mm:ss duration, YouTube title +
description where authored, recorded/edited/live status, notes like COMING SOON / MISSING
VIDEO) and `estimated_minutes` from the sheet duration.

## Decisions applied (defaults where the sheet was silent — all reversible in the admin UI)

1. **Welcome section**: Standard = Dealers video only (the sheet strikes the others);
   Trained Installer = all 5 variants (Contractors + Home owners are unrecorded placeholders).
2. **Railing** (2026 tab) not imported — the sheet's own course-total formula excludes it.
   A205/A206 + quiz likewise dropped from Standard (2026 revision); they remain in Trained
   Installer EP 3.
3. **A855 - Quiz** and the **A410–A413 quiz** were not created — the question bank has zero
   questions for them, and an empty quiz blocks publishing by design. Write questions, then
   add the quiz lessons in the builder.
4. **Q009** ("Match profiles with their code name") — matching isn't a platform question
   type; imported as **6 keyed MCQs** (one per size↔code pair) in both QwickBuild quizzes.
   Delete any you don't want.
5. **Q043** ("Is there a one type fits all Twistclip?") had no green answer in the sheet;
   keyed to *"No, there are different type of Twistclips…"* — **confirm**.
6. **Original (column J) wording** used throughout; the unfinished CHANGES-REQUIRED redraft
   lives in the extraction JSON as authoring backlog.
7. **Pass threshold 70% / attempts default** on every quiz (platform default; sheet silent).
   Editable per quiz in the builder.
8. EP 8 keeps **both** the three per-video quizzes and Knowledge Quiz A700 (the sheet lists
   both; the knowledge quiz repeats those 8 questions). Remove one layer if that's not wanted.
9. Trained Installer confers **CON_TRAINED** on completion (sheet tier 3: "listed as a
   trained installer"); Standard confers nothing yet — set in course settings if wanted.

## Verification performed

- `node db/import-courses.mjs verify` — round-trip diff of every section title/order, lesson
  title/type/position/minutes, quiz settings, and question prompt/type/options/correct/points
  against the payload: **PASSED for both courses**.
- The platform's two publish-guard queries (empty quizzes; questions no answer can pass):
  **0 rows** in both courses.
- `verify_audit_chain(tenant)` — **0 real problems**; the 43 reported rows are the known
  pre-0015 legacy rows ("unverifiable, links checked"). The ~278 rows this import appended
  (2 course.create, 18 section.create, 103 lesson.create, 28 quiz.create, 125
  quiz_question.create, 2 course.import) all hash-verify.
- Spot checks against known sheet cells (All-of-the-above key, 7% slope answer, multi-select
  post sizes, A100↔13×45mm pairing): correct.
- Admin UI (localhost:3010 preview, signed in): both drafts listed, builder renders all
  sections + attach controls, quiz editor shows questions with "(correct)" markers.
  Public storefront does **not** show the drafts.
- `npm run verify` in `db/`: green. (No `web/` source was changed by this work.)

## What's left before learners see anything

1. ~~Attach the real videos~~ **DONE 2026-08-14 PM** — all 53 recorded videos uploaded to
   Bunny (library 714204) and attached to 72 lessons; see
   `Outdure-Academy-Video-Bunny_Register_2026_08_14__16_51.md`. Only the 3 never-recorded
   lessons (A220, Welcome-Contractors, Welcome-Home owners) remain placeholders.
2. Confirm Q043's key; review the Q009 expansion; add A855/A410-413 questions if wanted.
3. Add option images for the 9 image-based questions (or reword them).
4. Set each quiz's pass threshold if 70% isn't right for accreditation claims.
5. Publish each course (the publish button runs the completability guards).
