# Outdure Academy — Video → Bunny Register

Executed 2026-08-14 ~16:20–16:50. All 53 recorded training videos moved from the Google Drive folder
(`1D7JP4fzgxEb4mqCpN1puD4HCLYB4WuSy`, sourced per the 2024 ONLINE TRAINING PLATFORM sheet) into **Bunny
Stream library 714204**, then attached to **72 video lessons** across the two draft courses
(`standard-training`, `trained-installer-training`) — shared videos attach to every lesson bearing the title.

Companion files: `Outdure-Academy-Video-Bunny-Attach_Model_2026_08_14__16_51.json` (the exact map the
attach consumed), [db/attach-videos.mjs](../../db/attach-videos.mjs) (dry-run / execute / verify — mirrors the
builder's attachVideo action: content `{provider:'bunny', videoId}`, audit action `lesson.video_attached`).
Supersedes the 'attach the real videos' item in `Outdure-Academy-Platform-Import_Notes_2026_08_14__09_45.md`.

## Verification

- Every file downloaded byte-exact from Drive and ffprobe'd; durations matched the sheet within 3s
  except **A306** (file runs 3:36 vs sheet 3:42 — sheet rounding; file identity is unambiguous).
- `attach-videos.mjs verify`: **PASSED** — 72/72 attached, 3 known placeholders remain, 0 conflicts.
- `verify_audit_chain(outdure)`: 0 real problems; 72 `lesson.video_attached` rows hash-verify.
- Admin builder (localhost:3010, SSR check): both courses render attached cards with CDN thumbnails,
  0 'not attached'; the 3 unrecorded lessons still show attach controls.
- Bunny encode sweep at 16:51: 54/55 videos Ready; **A201 (3.2GB original) still transcoding** — finishes unattended.

## Lessons NOT attached (video never recorded — placeholders stay)

- **A220 - Beam End Cap** — never recorded (register: MISSING VIDEO)
- **Welcome - Contractors** — never recorded (register: COMING SOON)
- **Welcome - Home owners** — never recorded (register: COMING SOON)

## Drive file left unused (owner decision needed)

- `Welcome General.MOV` (27MB, added Mar 2025) — not in the sheet's video list. Possibly the generic
  replacement for the unrecorded Contractors / Home-owners welcome variants. Attach via the builder if wanted.

## The register (53 videos)

| Lesson title (both courses where shared) | Drive file | Bunny video id | Duration |
|---|---|---|---|
| How to reload plans | How to reload plans.MOV | `188ddcf9-6ecd-47db-be7b-c88ff189240a` | 1:15 |
| A420 - Qwickbuild Driver Pack | A420.MOV | `ffb2b81e-613a-41a1-b341-33dd538e5595` | 0:51 |
| Welcome - Distributors | Welcome Distributor.MOV | `1ce5b91b-be72-4233-ba88-67dada3587a3` | 1:00 |
| Welcome - Dealers | Welcome Dealers.MOV | `ced492ad-358b-4c14-871e-b1c9ab1308ec` | 1:05 |
| A409 - Twistclip Screw | A409.MOV | `7815f69f-d71c-4a51-8d37-f3b7ff798625` | 1:17 |
| A410 / A411 / A412 / A413 - Qwickbuild Bolts | A410-A411-A412-A413.MOV | `5bcf49f5-7c36-4cc5-adea-053260019476` | 1:34 |
| Welcome - Staff | Welcome outdure staff.MOV | `11af1d17-f117-44dc-87b4-5d06b02269ec` | 1:36 |
| A194 / A195 Posts | A194 - A195.MOV | `7b3f928d-3b93-44d4-8b18-f680605ad788` | 2:06 |
| Product Series Intro & Overview | Outdure Product range.MOV | `a99640fe-a33a-4662-9a96-2fd3792d831b` | 2:10 |
| A210 / A211 - Beam/post Brackets | A210 - A211.MOV | `a352d71f-37af-49f4-9b79-4faa53a96ff6` | 2:14 |
| A512 - Qwickbuild T Clip | A512.MOV | `f096cf15-6016-4754-bea5-62ef4bab1d2b` | 2:26 |
| A401 / A402 / A403 / A404 | A401-A402-A403-A404.MOV | `8a45364b-9c0f-4eaf-92ce-d2429aafe2f1` | 2:34 |
| A307 - Double Joist Bracket Flat for A110 | A307.MOV | `a73688d6-e972-4a5b-8701-2a11136a5606` | 3:22 |
| A207 - Brace Plate Bracket | A207.MOV | `8bd84c41-927c-4ee8-9ce0-2b46c08e4105` | 3:23 |
| A302 - Joiner Bracket for A110 | A302.MOV | `74632f5f-42ab-49a5-ab8d-861dab6d63ae` | 3:34 |
| A202 - Joiner Bracket | A202.MOV | `463b9c34-551f-4b7c-907f-552404066b89` | 3:50 |
| A206 - Double Joist Bracket Flat | A206.MOV | `d1a23f03-c5f4-473c-a557-64fafc0ce3a6` | 3:57 |
| A212 - Beam/post Bracket Kit | A212.MOV | `79da2c3b-36aa-4a9a-a07e-fd28cfced117` | 4:18 |
| A208 - Trim bracket | A208.MOV | `983da4d1-4fa4-4e89-9700-cb829ec77728` | 4:25 |
| A301 - 90 Bracket & Joist Anchor - for A110 | A301.MOV | `d4931c2b-37e8-440f-9a4c-847c821f1661` | 4:56 |
| A205 - Double Joist Bracket | A205.MOV | `69c7c582-c4ac-4866-b0ec-82968ea0d465` | 5:22 |
| A203 - Joist Anchor | A203.MOV | `60fe2f1d-ac8a-4fdc-84ac-53211fab635a` | 5:41 |
| QwickBuild framing | A100 range.MOV | `dfa2b25c-9f36-428d-85a0-e104171c0f49` | 8:18 |
| Welcome to Outdure | Outdure who are we.MOV | `3ff91fb1-d357-4d19-942f-44baaabebce4` | 19:05 |
| A306 - Double Joist Bracket for A110 | A306.mov | `85373ed5-6f61-42f8-9683-9bce6b507036` | 3:36 |
| Select surface | Surface selection .MOV | `b4c0caf5-74a3-4f33-841a-8111d2021644` | 1:28 |
| Item list | Item list final.MOV | `5b69450a-c19e-4a60-b56a-519c06204332` | 1:51 |
| Create multiple projects | How to create multiple projects.MOV | `a868b33c-f6fa-4494-8a2b-5d8513e9ac03` | 2:38 |
| How to create an account | Create an account on deckplanner.MOV | `bf2ba3eb-e63e-4d96-890c-b729e3156811` | 3:05 |
| Dashboard | Dashboard.MOV | `b54a6e8d-4470-49e2-995c-a13c5d9cf834` | 5:12 |
| Structure | Structure design .mov | `54d9bfa9-04f1-4797-b80b-4d72db60ca78` | 3:22 |
| Shape and size | Shape and size.MOV | `44f5c6ad-eab3-42ad-8833-d763e56ae2ab` | 8:29 |
| A595 / A596 - Composite Decking Screws | A595 - A596 .MOV | `13d53614-277d-4c57-a8da-60bddd3f1c69` | 1:32 |
| A840 - ANTI-SLIP STRIP | A840.MOV | `9f7f5ca0-b28d-4092-bd63-c962d5fbbd29` | 1:40 |
| A701 - Tile Rubber Bead | A701.MOV | `017747ef-d23e-4e9d-9c99-f46ee90ae575` | 1:42 |
| A710 / A711 - Tile Spacers | A710-A711.MOV | `03a01d7f-f337-4225-abc9-959301feb487` | 1:58 |
| Turf System Overview | Turf overview .MOV | `8dd809e3-fc2c-4ece-935c-dcfd388f49f9` | 2:01 |
| A801 - TURF BASEBOARD | A801.MOV | `8591f04b-14b4-46e3-bbf0-8febfb569b8e` | 2:05 |
| A610/ A611/ A620/ A621 | A610-A611-A620-A621.MOV | `7cd34eab-017a-4e8c-abdd-ebce42b957fe` | 2:09 |
| Downloading PDF | Deckplanner PDF.MOV | `cb06069b-41f5-4ddb-962b-ebdb496092a9` | 5:02 |
| A810 / A811 - SCREWS FOR TURF | A810 - A811.MOV | `46a15a7a-4ddb-47ce-a34c-a9868b2091ac` | 3:16 |
| A590 - Qwickbuild Starter Clip | A590.MOV | `f7aeebd1-ee4b-4ab4-a73a-44a306e7f3ed` | 3:26 |
| Tile System Overview | Tile overview.MOV | `c5015254-1742-4eb6-9271-1f58e9f40351` | 3:38 |
| A712 - Tile Trim Bracket | A712- tile trim bracket.MOV | `463d4f93-740a-4a76-ba35-134c1481ef34` | 4:15 |
| A855 - BATTEN | A855.MOV | `10c71cc3-24b8-496e-ab9a-0536188e05c1` | 4:32 |
| A851 - QWICKBUILD SOLID BLOCKING (6X6"X4') | A851.MOV | `bb4f2f91-e46f-45f0-a392-b3583cfc6317` | 4:54 |
| Twistclips | Twistclips.MOV | `0a935b73-2251-460c-ae32-5af939bb3ad7` | 5:05 |
| A702 / A703 - Tile Retainer Brackets | A702-A703.MOV | `baa606f0-c265-475a-b5eb-f88d9b078047` | 5:59 |
| General overview | What is deckplanner .MOV | `c02f27fd-f654-49d3-86e1-000d280448e4` | 13:58 |
| A831 / A832 - QWICKGRATE KIT black/sliver | A831-A832.MOV | `11fde7aa-cf6e-4a4a-824c-c3ea7129fd46` | 9:12 |
| A900 supports | A900.MOV | `1b60e32c-5eec-46f8-92d7-82580691a9f0` | 9:16 |
| Design layout | Design layout.mov | `3658c221-7dc8-478b-a580-467b5ab8dbe2` | 5:10 |
| A201 - 90 Bracket | A201.mov | `012aecb9-1f9e-4810-a9a2-da786a5cb45d` | 13:30 |

## What is still left before publishing (unchanged from the import notes)

1. Confirm Q043's answer key; review the Q009 matching→MCQ expansion; add A855 / A410-413 questions if wanted.
2. Add option images for the 9 image-based questions (or reword them).
3. Set per-quiz pass thresholds if 70% isn't right.
4. Publish each course (runs the completability guards).
