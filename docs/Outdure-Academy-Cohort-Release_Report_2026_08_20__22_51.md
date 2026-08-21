# Outdure Academy — Cohort Release Reconciliation & Specification

**Date:** 2026-08-20 22:51 · **Baseline reviewed:** deployed beta at `0866a71` (points at non-prod DB `ysuzujgabfynjdylmlrq`)
**Method:** running-beta navigation at 1280/768/375 + authoritative read-only queries against the real non-prod DB + import-source docs + code inspection (three independent code investigations). Read-only throughout — **the deployed beta was not changed.**
**Status of this document:** specification only. No deploy, no production change, no technical-training-content rewriting.

---

## 0. How this reconciliation changed my own earlier conclusions

The prior audit's "four-item minimum batch" (rename / two image questions / A220 video / admin enrol button) **does not survive scrutiny.** Actively disproving it surfaced that:

1. **The image-question defect is systemic, not two questions.** 46 answer-options across the curriculum are `"Image N …"` placeholders spanning **~9 distinct visual-identification questions**, and the flattened captions **leak the answer** (`"Image 3 90 bracket ✓"` for *"Which item is the 90° bracket?"*). This is the *core* competency of a product course.
2. **The admin problem is visibility, not an enrol button.** A not-enrolled installer's Home CTA already links straight to the right course's self-enrol page (2 clicks). What an admin genuinely *cannot* do is **see whether anyone started, progressed, or completed** (unless a certificate was issued).
3. **"Required training" has no data model** — it is a single hardcoded slug, UI-derived at render time.
4. **The assessment flow has two real defects the prior audit missed** — a reversed button order (violates the explicit §10 rule) and an error/redirect handler that can **strand a learner whose session expires mid-check.**
5. **Technical accuracy of the 125 questions was never verified** and cannot be asserted without an Outdure SME.

The honest release gate is broader than four items — but still a tight, mostly content/business batch, not a rebuild. The V2 experience shell itself is sound.

---

## 1. A/B/C separation (as required)

- **A — Application functionality:** largely **works.** Auth, enrol (self), lessons, video, grading, completion, certificate view, admin invite/roles/audience, view-as, failure states. Two functional defects (ASM-2 redirect-swallow; ADM-1 visibility gap).
- **B — Training content integrity:** **not release-ready.** Image questions, missing A220 video, giveaways, typos, internal labels, and — critically — **no SME sign-off of technical accuracy.**
- **C — Product experience:** **good at the shell level, gaps at the edges.** Orientation/resume/help/account/pathway are coherent; naming/terminology, new-learner framing, and admin operability need work.

A green test suite proves part of A only. Cohort readiness needs acceptable A **and** B **and** C.

---

## 2. Cohort Release Matrix

Severity: **P0** cannot release · **P1** fix before cohort (materially affects learning, trust, administration or integrity) · **P2** shortly after · **P3** later.
Type: **CODE / DATA / CONTENT / BUSINESS** (business = a decision or asset only Outdure can supply; SME = subject-matter expert).
"Release req?" = must be resolved before inviting the cohort.

| ID | Area | Current | Target | Sev | Type | Dependency | Effort | Release req? | Acceptance test |
|----|------|---------|--------|-----|------|-----------|--------|--------------|-----------------|
| **CUR-1** | Curriculum | ~9 visual-ID questions have no image; option captions leak the answer (`"Image 3 Twistclip ✓"`) | Real image-choice questions with Outdure images, **or** reworded/removed; no answer leak | **P1** | CONTENT+CODE | Outdure supplies 9 images, or approves interim rewording | M–L | Each of the 9 questions is answerable without the caption naming the answer; no option text names the correct item |
| **CUR-2** | Content/media | 3 videos missing incl. **A220 Beam End Cap** (required course) → "no video yet" | Video sourced, or lesson hidden/marked for cohort | **P1** (A220), P2 (2 welcomes) | CONTENT | Outdure provides video, or approves hiding | S–M | Required course has no "no video yet" lesson in the cohort path |
| **CUR-3** | Content | Typos in live data: `Alumunium` (a *correct answer*), `Imhae 4`, `sliver` | `Aluminium`, `Image 4`, `silver` | P2 | DATA | none (obvious spelling) — **but applying mutates the beta**, so prepared not applied | S | Strings corrected in candidate seed; no misspelling in learner-facing text |
| **CUR-4** | Naming/IA | Course titled **"Standard Training"**; overlaps ~80% with Installer Training; aimed at dealers (welcome = "Welcome - Dealers") but not modelled as such | A meaningful learner-facing name **and** a decision on whether it belongs in the installer cohort | **P1** | DATA+BUSINESS | Lucy: name + in/out of cohort | S (rename) | No internal/placeholder course name shown to the cohort; each visible course has a clear distinct purpose |
| **CUR-5** | Content/IA | Internal labels live: `EP 1 —`, `Product Series`, `Intro Series`, SKU-only lesson titles | Learner-meaningful topic/lesson names | P2 | DATA/CONTENT | Outdure content owner | M | A learner can tell from a topic title what it covers |
| **CUR-6** | Assessment content | Giveaway answers (`All of the above ✓`, 6-item benefit lists) | Plausible distractors; no telegraphed answer | P2 | CONTENT | SME rewrite | M | Flagged questions no longer have a trivially-correct option |
| **CUR-7** | Assessment design | Only **A400 Fasteners** carries critical questions (3 of 125); nothing else is safety-gated | Confirm which competencies are safety-critical | P2 | BUSINESS/SME | Outdure decides critical set | S (config) | Critical flags match Outdure's stated safety-critical competencies |
| **CUR-8** | Content accuracy | **Technical correctness of all 125 questions/answers is unverified** | Outdure SME sign-off | **P1** | BUSINESS/SME | Outdure SME review | (Outdure) | Documented SME sign-off that questions/answers are technically correct |
| **TERM-1** | Terminology | Lesson player says *"You have passed this quiz"*, *"Pass the quiz to complete"* while outline/remediation say "knowledge check" | One consistent term ("knowledge check") in the player | P2 | CODE | none | S | No "quiz" appears in learner-facing player copy |
| **TERM-2** | Terminology | Standalone check renders raw data title `"A201 - Quiz"` as its H1 | Friendly heading (e.g. "Knowledge check — A201") | P2 | CODE(+DATA) | none for code path | S | No check lesson shows "- Quiz" as its heading |
| **TERM-3** | Terminology | "Other courses"/"Your courses" switch; "My training"/"training record"/"training history" synonyms | Pick one term per concept | P3 | CODE | none | S | One consistent noun per concept |
| **ASM-1** | Assessment UX | Primary **Next renders LEFT of Back** in the DOM (violates §10 "Next then Back to its right") | `← Back` left (quiet), `Next →`/`Finish check` right (primary) | **P1** | CODE | none | S | On screen and by keyboard tab-order, Back is left/secondary, primary is right |
| **ASM-2** | Assessment UX | QuizForm bare `catch` swallows the login redirect and all specific server errors → **session-expiry mid-check strands the learner**; attempt-cap/rate-limit/"quiz changed" all show one generic line | Re-throw framework navigation; surface the actionable server message | **P1** | CODE | none | S–M | Session expiry mid-check redirects to sign-in; attempt-cap/rate-limit messages are shown verbatim |
| **ASM-3** | Assessment integrity | Server grades at Finish; wrong answers recorded incorrect; critical rule enforced; completion only on pass | (verified — **no defect**) | — | — | — | — | Wrong answers cannot falsely pass or bypass a critical check (already true) |
| **ADM-1** | Admin | No per-learner training visibility; admin sees issued certificates only — not who started, % progress, or completed-without-a-cert | A minimal per-learner read view (audience, enrolled, %, completed, certificate) | **P1** | CODE | scope sign-off (minimal is decision-free) | M | Admin can, without View-as, see each learner's training state and progress |
| **ADM-2** | Admin | No admin enrol/assign; `enrollFree` is self-only and blocks View-as | Confirm self-enrol is the model, or add admin enrol | P2 | CODE+BUSINESS | Lucy: onboarding model | M | Decided onboarding path works end-to-end for a new invitee |
| **ADM-3** | Admin | Invites are one-at-a-time | Bulk invite | P3 | CODE | none | M | (post-cohort) |
| **MOD-1** | Model | "Required" = one hardcoded slug; no per-audience/per-person model | Smallest robust required model (see §6) | P2 (cohort) / P1 (later) | CODE+BUSINESS | Lucy: required-by-audience rules | S–M | Required training is data-driven, not a code constant |
| **MOD-2** | Model | Audience gates only UI panels; no course eligibility/recommendation by audience | Decide A/B/C/D relevance model (see §8) | P2 | CODE+BUSINESS | Lucy | S–M | Course visibility/recommendation matches audience policy; admin-assigned course always visible |
| **LX-1** | Learner exp | New-learner Home lacks a plain "what is the Academy"; outcomes/certificate hidden until audience = installer | Answer all §12 fundamentals for a cold new learner | P2 | CODE | none (copy) | S | A new learner with no audience set still sees what the Academy is and what they'll achieve |
| **LX-2** | Learner exp | Continue-hero course can also appear in the "Other courses" list (duplication) | Exclude the current hero course from the list | P2 | CODE | none | S | The resumed course never appears twice on Home |
| **LX-3** | Learner exp | Pathway panel is an informational dead-end (no next step for Verified/Strategic) | Confirm whether an action ("register interest") is wanted | P2 | BUSINESS | Lucy | S | Matches Outdure's intended pathway policy |
| **HLP-1** | Help/ops | Help requests are email + console only; **never persisted**; on prod, lost if email unconfigured | Verify prod email delivery (release); persist requests (P2) | **P1** (verify delivery) / P2 (persist) | CODE+OPS | prod email config | S | A submitted help request reliably reaches Outdure in prod |
| **DATA-1** | Data | Help requests not stored → irrecoverable for Insights | Persist help requests | P2 | CODE | none | S | Help requests queryable later |
| **DATA-2** | Data | Progress events not stamped with curriculum version | Stamp content version on events | P2 | CODE | none | S | Confidence/feedback events attributable to a content version |
| **CRT-1** | Certificate | Certificate is view/print only (no PDF download) | Confirm print is acceptable, or add PDF | P3 | BUSINESS | Lucy | M | Matches Outdure's certificate expectation |
| **FA-1** | Failure state | 404 CTA links to app root `/`, not the tenant home | Link to tenant dashboard | P3 | CODE | none | S | 404 returns the learner to their Academy home |

**Verified PASS (no action):** grading integrity; answer options are real radios/checkboxes with labels, visible focus, 44px targets (no P1 a11y defect in the assessment); missing-video, unauthorized, 404, empty-training, no-certificate, revoked-certificate states all handled cleanly; help flow exposes no internal UUIDs to the learner; pathway asserts no unconfirmed benefits (defers warranty/benefits to Outdure); per-question/critical/confidence/feedback/completion/certificate data all durably captured; account page correctly view-only.

---

## A. Revised cohort-readiness verdict

**NOT READY FOR EXTERNAL COHORT.** The platform runs and a learner can complete training end to end, but three things block a *credible* external release: (1) the core product-identification questions are unanswerable/answer-leaking (CUR-1); (2) no Outdure SME has verified the training is technically correct (CUR-8); (3) an admin cannot actually watch a cohort's progress (ADM-1). Add the reversed assessment buttons (ASM-1) and the mid-check session-expiry strand (ASM-2), and a real installer would hit an embarrassing or confusing moment in the first session.

The V2 experience shell (Home/orientation/shell/nav/learning-units/assessment integrity/help/audience/history/account) is **ready.** The gap is content integrity + a small set of code fixes + admin visibility — an 80/20 batch.

## B. True minimum P0/P1 batch (the release gate)

**P0:** none (nothing prevents the platform operating).

**P1 — code (decision-free; implemented this pass on a working branch, not deployed):**
- ASM-1 assessment button order → `← Back` left / primary right
- ASM-2 quiz-form error + redirect handling (fix the session-expiry strand; surface real server messages)
- TERM-1 lesson-player "quiz" → "knowledge check"
- TERM-2 friendly heading for standalone checks
- LX-2 stop the Continue-hero course duplicating in the list
- ADM-1 minimal per-learner training-status view for admin

**P1 — content/business (prepared where possible; blocked on Outdure):**
- CUR-1 image questions (needs images or rewording approval)
- CUR-2 A220 video (needs the asset or a hide decision)
- CUR-4 "Standard Training" name + cohort in/out
- CUR-8 SME technical-accuracy sign-off
- CUR-3 typos (decision-free data; applied at deploy, not now — applying mutates the live beta)

**P1 — operational:**
- HLP-1 verify support-email delivery is configured in prod (else cohort help is lost)

## C. Business decisions required from Lucy/Outdure

> Format: **Decision — why it matters — recommendation — options — cost of delay.**

1. **"Standard Training" — name, and is it in the cohort at all?**
   *Why:* it overlaps ~80% with Installer Training and its welcome video targets *dealers*; showing both to installers is confusing, and the name is a placeholder.
   *Recommendation:* **exclude it from the installer cohort** and rename it for its real (dealer/overview) audience later.
   *A:* Rename + keep visible to installers. *B:* Rename + restrict to dealers, hide from the installer cohort (recommended). *C:* Unpublish for now.
   *Cost of delay:* installers see a meaningless, redundant second course on day one.

2. **Image questions — supply images or approve rewording?**
   *Why:* ~9 core product-ID questions are currently unanswerable and answer-leaking.
   *Recommendation:* **supply the 9 product images** (source says "Use new images"); I build a reusable image-choice question type. Interim: reword to text.
   *A:* Provide 9 images (best). *B:* Approve interim rewording/removal. 
   *Cost of delay:* the assessment can't credibly test product identification.

3. **A220 Beam End Cap (+ 2 welcome) videos — provide or hide?**
   *Why:* a required-course lesson currently reads "no video yet".
   *Recommendation:* **provide A220**; hide the two welcome placeholders for the cohort.
   *A:* Provide videos. *B:* Hide the affected lessons for the cohort.
   *Cost of delay:* the required path looks unfinished.

4. **SME technical-accuracy sign-off — who, and is fasteners the only safety-critical competency?**
   *Why:* we cannot assert the training is correct; and only A400 Fasteners is currently gated as critical.
   *Recommendation:* an Outdure SME reviews the 125 questions and confirms the critical set.
   *Cost of delay:* releasing unverified technical training under the Outdure name.

5. **Onboarding model — is learner self-enrol acceptable, or does Outdure want to enrol/assign people?**
   *Why:* today admin invites; the learner self-enrols in 2 clicks from Home. There is no admin "assign course".
   *Recommendation:* **self-enrol is fine for a controlled cohort**; add admin visibility (ADM-1) rather than an enrol button now.
   *A:* Self-enrol + admin visibility (recommended). *B:* Also build admin enrol/assign.
   *Cost of delay:* none if self-enrol is accepted; ADM-1 still needed either way.

6. **Certificate — is view/print acceptable, or is a downloadable PDF needed for the cohort?**
   *Recommendation:* print is acceptable for the beta cohort; PDF later.
   *Cost of delay:* minor.

7. **Trained/Verified/Strategic wording** — currently conservative and defers benefits to Outdure (safe). Confirm the three-rung wording is acceptable as-is for the cohort.

## D. Technical changes (code)

Decision-free, implemented on the working branch this pass: **ASM-1, ASM-2, TERM-1, TERM-2, LX-2, ADM-1 (minimal).**
Deferred/business-gated code: MOD-1/MOD-2 (required + audience model), ADM-2 (admin enrol), LX-1 (new-learner framing — partly copy, safe to do), DATA-1/DATA-2 (persistence/versioning), FA-1 (404 CTA), TERM-3.

## E. Content / data corrections

Prepared as an idempotent, non-prod-guarded seed script — **not executed**, because the beta reads non-prod and §21 forbids changing the live beta during reconciliation. Applied at candidate-deploy time.
- CUR-3 typos (`Alumunium`→`Aluminium`, `Imhae 4`→`Image 4`, `sliver`→`silver`).
- CUR-4 course rename (value pending decision #1).
- CUR-1 question rewording (only if decision #2 = rewording).
- CUR-5/CUR-6 title & distractor cleanup (content-owner pass).

## F. Admin corrections

- ADM-1 (P1): minimal per-learner training-status read view (audience, enrolled courses, % complete, completed date, certificate link) over existing `enrollments`/`progress_events`/`certificates` — no new model.
- ADM-2 (P2, business): decide enrol model.
- ADM-3 (P3): bulk invite — explicitly **not** required for a controlled cohort.

## G. Assessment corrections

- ASM-1 button order (P1, code).
- ASM-2 error/redirect handling (P1, code).
- CUR-1 image questions (P1, content/business).
- CUR-6 giveaways, CUR-7 critical set (P2, SME).
- ASM-4 two "back" affordances on the check screen (P3, code).

## H. Accessibility / failure-state corrections

Targeted pass done. **No P1 a11y defect** (real radios/labels, visible focus, 44px targets). Failure states handled except:
- ASM-2 session-expiry-mid-check (P1 — counted under assessment).
- FA-1 404 CTA to app root (P3).
Not exhaustively tested: full screen-reader walk-through and colour-contrast audit of every V2 token — recommended post-cohort, not release-blocking.

## I. Explicitly deferred to P2/P3

CUR-5, CUR-6, CUR-7, TERM-3, ADM-2, ADM-3, MOD-1 (as a full model), MOD-2, LX-1 (beyond copy), LX-3, DATA-1, DATA-2, CRT-1, FA-1, full a11y walk-through, and **all** enterprise-LMS features (bulk invites, automated reminders, certificate expiry, advanced analytics, complex eligibility) — none promoted to P1.

## J. Estimated implementation effort

- Decision-free P1 code (ASM-1, ASM-2, TERM-1/2, LX-2, ADM-1): **~1 focused day.**
- Content/data script (CUR-3, and CUR-4/CUR-1 once decided): **~½ day** to build; execution is minutes at deploy.
- Content authoring (CUR-1 images, CUR-2 A220 video, CUR-5/6 rewrites, CUR-8 SME): **Outdure-owned**, off the code critical path.
Total engineering to a deployable candidate once decisions #1–#4 are made: **~1.5–2 days.**

## K. Recommended implementation sequence

1. **Now (this pass):** decision-free P1 code on a working branch; content/data script prepared but unexecuted; tests green. Return candidate SHA, stop before push.
2. **Lucy decides #1–#4** (name/cohort, images vs rewording, A220, SME).
3. Fold decisions into the content/data script; author/attach any provided assets.
4. Verify prod support-email delivery (HLP-1).
5. Rendered-QA the candidate at 1280/768/375; learner smoke; admin smoke.
6. **Prod deploy order (unchanged):** migrate → seed/content → deploy code. Then verify on prod.

---

## The release question (success criterion)

> If we invite a controlled cohort of real installers tomorrow, can they understand the product, complete the correct training efficiently, be assessed credibly, retrieve their result, ask for help, and can Outdure administer them without manual confusion?

**Today: no** — chiefly because the product-identification questions can't be answered credibly (CUR-1), the training isn't SME-verified (CUR-8), and Outdure can't watch progress (ADM-1). **After the P1 batch and decisions #1–#4: yes.**
