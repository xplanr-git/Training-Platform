# Outdure Academy — Content & SME Handoff

**Date:** 2026-08-20 · **For:** Lucy / Outdure technical owner
**Companion to:** the Cohort Release Reconciliation report and the SME Review Register CSV (same folder).

This is the **complete list of things only Outdure can supply or decide** before an external cohort. Everything else that could be resolved in software has been implemented (see the candidate). Each item says whether the cohort can launch without it.

---

## 1. Decisions & assets required

### D1 — "Standard Training": name and cohort disposition
- **Why needed:** The course titled *"Standard Training"* is a placeholder name, and it overlaps ~80% with *Outdure Installer Training*. Its welcome video is *"Welcome - Dealers"*, so it reads as a dealer/overview course, but that is not modelled.
- **Exact input required:** (a) a learner-facing name; (b) whether it is shown to the installer cohort at all.
- **Where it appears:** course title on Home, course map, certificate, storefront.
- **Recommendation:** rename for its real (dealer/overview) audience and **exclude it from the installer cohort** so installers see one clear path. The software already supports restricting a course by audience (a `courses.audiences` field now exists) with no further engineering.
- **Can the cohort release without it? NO** — an installer seeing a meaningless, redundant second course on day one is exactly the confusion this release is meant to remove.

### D2 — Product images for the visual-identification questions
- **Why needed:** 11 questions (9 distinct) ask the learner to *identify a product from an image*, but no images were ever supplied (the import sheet says *"Use new images"*). Today the options are text placeholders that also **leak the answer**. This is the core competency of a product course.
- **Exact assets required:** one clear product photo per subject below. **Do not** let the image caption name the item on-screen (the software will render the images as unlabelled choices — see Appendix A).
- **Where it appears:** the knowledge checks listed. **Can release without? NO** (or only with the interim rewording in D2-alt).

**Images needed, by question:**

| Course(s) | Question | Image subjects needed (the correct one is starred for SME to confirm) |
|-----------|----------|------------------------------------------------------------------------|
| Installer + Standard | What image shows the twistclip? | T Clip, 90 bracket, **Twistclip***, Joist anchor |
| Installer + Standard | Which item is the A201 90° Bracket? | Double joist bracket, Joist anchor, **90 bracket***, Joiner bracket |
| Installer + Standard | Which item is the A202 Joiner Bracket? | Double joist bracket, Joist anchor, **Joiner bracket***, 90 bracket |
| Installer + Standard | Which Joist/Beam profiles require the A203 on both sides? | The 6 profiles: 13×45, 28×45, 45×45, 90×45, 135×45, 180×45 mm (SME confirms which qualify) |
| Installer | What item is the A205 Double Joist Bracket? | A910 deck support, Joiner bracket, Joist anchor, **Double joist bracket*** |
| Installer | What item is the T clip? | **T Clip***, Joist Anchor, H65 Screw |
| Installer | What screws are supplied with the A207 Brace Plate? | A611, A401, A655, A404 (SME confirms correct screw) |

- **D2-alt (interim, if images cannot be supplied in time):** approve **rewording** each to a text question (or removing it). This unblocks the cohort without images but weakens the product-identification assessment. Outdure must approve the wording — we will not rewrite technical questions without sign-off.

### D3 — Missing videos (3), one in the required path
- **Why needed:** `A220 - Beam End Cap` (in the required installer course) and two welcome videos (`Welcome - Contractors`, `Welcome - Home owners`) show "no video yet".
- **Exact assets required:** the three video files (or a decision to hide those lessons for the cohort).
- **Recommendation:** supply **A220**; hide the two welcome placeholders for the cohort.
- **Can release without? A220 = NO** (a required lesson looks unfinished). Welcomes = YES if hidden.

### D4 — SME technical sign-off of the curriculum
- **Why needed:** No Outdure expert has confirmed the 125 questions and their answer keys are technically correct, and only one topic (A400 Fasteners) is currently flagged safety-critical.
- **Exact input required:** a technical review using the **SME Review Register CSV** (attached — topic, question, options, the configured correct answer, critical y/n, and what to confirm). Open it in Excel; no database access needed. Confirm each answer, and confirm which competencies should be **critical** (currently only fasteners).
- **Can release without? NO** — releasing unverified technical training under the Outdure name is the risk this gate exists to prevent.

---

## 2. Decisions that are NOT blockers (recommended defaults applied)

| Item | Default applied | Change only if Outdure wants |
|------|-----------------|------------------------------|
| Onboarding | Learner self-enrols in 2 clicks from Home; admin now has full per-learner visibility | an explicit admin "assign course" button |
| Certificate | View + print (browser) | a downloadable PDF |
| Trained/Verified/Strategic wording | Conservative; benefits deferred to Outdure ("confirmed by Outdure") | confirm/expand the wording |
| Internal topic labels ("Intro Series", "Product Series") | Left as-is (only unambiguous "EP N —" prefixes auto-cleaned) | provide learner-meaningful topic names |
| Giveaway answers ("All of the above") | Flagged in the register | SME rewrites the distractors |

---

## Appendix A — Visual-identification question capability (technical spec, not yet built)

Per the release rule, the reusable image-choice capability is **specified, not built**, because building it now would require guessing the asset/authoring model while no images exist. When Outdure supplies images (D2), implement this:

- **Schema (additive, backwards-compatible):** add `quiz_questions.option_images jsonb` — an array parallel to `options`, holding `{ url }` or `null` per option. Absent/null ⇒ today's text-only rendering (unchanged). Grading is index-based and **unchanged**.
- **Authoring:** the quiz builder gains an image slot per option (upload → stored asset URL), reusing the existing Bunny/asset upload path.
- **Learner UI (`quiz-form.tsx`):** when a question has `option_images`, render each choice as an image (with the option text as its accessible `alt`/caption **only for screen readers**, never as a visible label that leaks the answer) inside the existing radio/checkbox control. Keyboard/focus semantics stay as they are today.
- **Content:** strip the answer-naming captions from the option text (e.g. options become plain "A", "B", "C" or empty, with the image carrying the meaning).
- **Effort:** ~1 day once images exist. **Do not** create or substitute product images.
