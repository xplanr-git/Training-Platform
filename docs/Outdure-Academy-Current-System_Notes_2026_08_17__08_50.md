# Outdure Academy — how it actually works today

Answers to Craig's questions, 17 Aug 2026. Everything below is checked against the running
system (the code that's deployed, plus a read-only look at the live database), not from memory.
No learner names or emails included.

**One thing to set the frame first.** The platform is built and live at
`training.structurebuild.co`, but the real training is **not rolled out yet**. The two proper
courses (Standard Training, Trained Installer Training) are still **draft** — imported and
video-attached on 14 Aug, awaiting quiz sign-off and publish. Live to date: **4 members,
5 enrolments, 3 completions, 3 certificates, 5 quiz attempts** — all pilot/testing on three
small early courses. (One of the five enrolments is Stevie's own, made 17 Aug while capturing
the completion-button screenshot.) So for "what do learners keep asking you", there isn't a body of real
support history yet.

---

## 1. Training structure

Three levels, no more:

**Course → Section → Lesson**

- There is **no programme/pathway level above a course**, and no module level between section
  and lesson. A course is the unit a learner enrols in, completes, and gets a certificate for.
- **Assessments are not a separate object** — a quiz is a *lesson type*. It sits in the running
  order like any other lesson.
- Lesson types available: **video, quiz, text, PDF**. (SCORM and "live" exist in the database
  schema but are not built.)
- A quiz lesson holds questions. Question types in the builder: **multiple choice (one answer),
  multiple choice (many answers), true/false**. No matching, ordering, free-text or file-upload.

Real content, as it stands today:

| Course | Status | Sections | Lessons | of which video | of which quiz | Confers tier |
|---|---|---|---|---|---|---|
| Trained Installer Training | draft | 14 | 77 | 56 | 21 | Contractor: **Trained** |
| Standard Training | draft | 4 | 26 | 19 | 7 | — none set |
| Outdure Deck Frame Installation | published | 1 | 3 | 1 | 1 | Contractor: Trained |
| Outdure Pedestal Systems | published | 1 | 5 | 1 | 1 | Contractor: Verified |
| DeckPlanr – Selecting Surfaces | published | 1 | 1 | 1 | 0 | Contractor: Verified |

The bottom three are early pilot courses, not the real curriculum.

**Screen that shows it:** Admin → Courses → *(course)* → Manage content. That's the builder —
sections as headed blocks, drag-to-reorder lessons inside them. There's no export of the
structure; the screenshot is the artefact.

---

## 2. Lesson completion

**There is no settings screen for this.** The rules are fixed in the platform — an author
cannot change them per lesson or per course. What they are:

| Lesson type | Completes when |
|---|---|
| Video | The learner clicks **"Complete & continue"**. Manual. |
| Text | Same — manual button. |
| PDF | Same — manual button. |
| Quiz | **Automatically, on passing.** No manual option. |

Points worth being explicit about, because they surprise people:

- **Watching the video is not required.** The player tracks watch time (a heartbeat roughly
  every 15 seconds, plus furthest-position for resume-across-devices) and that data feeds the
  Insights screen — but it does **not** gate the Complete button. A learner can open a lesson
  and click Complete without playing anything.
- **No sequential locking.** Every lesson in the outline is a live link. A learner can jump to
  lesson 40 on day one. There is no "finish this before that", no prerequisites between
  courses, no locked sections.
- **Course completion = 100% of lessons complete.** When the last one ticks over, in one step:
  enrolment marked completed → tier advanced (if the course confers one) → certificate issued
  (if enabled) → certificate email sent.
- **Progress is append-only.** A completion can't be undone — not by the learner, not by an
  admin, not in the UI at all. Same for watch time.
- **Admins can't complete anything on a learner's behalf.** There's a "view as" mode for
  support, but it's strictly read-only — no progress, no completion, no certificate.

---

## 3. Assessments

**Settings a quiz actually has — just two,** on Admin → Courses → *(course)* → Manage content →
*(quiz lesson)* → Quiz:

- **Pass threshold (%)** — default **70**
- **Attempts allowed** — default **10**

That's the entire settings surface. There is no time limit, no question randomisation, no
question pooling/banks, no shuffling of options, no "show correct answers", no feedback text
per answer, no weighting beyond points per question, no proctoring.

Behaviour:

- **Grading** is server-side on submit. Each question is **all-or-nothing** — on a
  many-answer question the learner must select exactly the right set. Score = % of points
  earned. Passed if score ≥ threshold.
- **After submitting** the learner sees one banner: *"You scored 74%. Passed."* or *"…Not
  passed — try again."* **They are not shown which questions they got wrong, and never see the
  correct answers.** No feedback is given per answer, right or wrong.
- **Failing** → they can retake immediately, up to the attempt cap. There's also a rate limit
  so a quiz can't be brute-forced by rapid guessing.
- **Failing does not block access to anything.** Every other lesson stays open. But the quiz
  lesson stays incomplete, so the **course** can't complete — which means no certificate and
  no tier advancement. That's the only lever a failed assessment pulls.
- **Attempts exhausted** → they're locked out with *"You have used all 10 attempts at this
  quiz. Ask your administrator to reset it."* **There is no reset button anywhere in the
  admin.** Today that message points at something that doesn't exist — it needs a database
  change. Nobody has hit it yet (5 attempts total, ever).
- Every attempt is written to the tamper-evident audit log with score, pass/fail, the
  threshold *at the time*, and the attempt number — so the evidence survives an admin later
  changing the pass mark.

---

## 4. Contractor training / Trained status

**It's automatic, and it's the only way it happens.**

Each course has a setting **"Confers tier on completion"** (Admin → Courses → *(course)*).
The options mirror the Connect user types:

- Contractor: Registered → **Trained** → Verified → Strategic Partner
- Dealer: Stockist → Reseller

On 100% course completion the learner's tier advances to whatever the course confers. It only
ever moves **upward and within the same group** — it never demotes, and a Dealer course can't
push a Contractor sideways. The tier shows as a tag against the person on the user list (menu: Users → All Users; the screen itself is titled "People" — one screen, two names).

Two things to be clear about:

1. **There is no manual control.** No admin screen sets, overrides, or removes a tier. If
   someone's tier is wrong, or they should be Trained without doing the course in the system,
   it's a database edit — not something the admin UI can do.
2. **It flows nowhere.** The tier codes are a **hand-maintained copy** of Connect's user types.
   Academy and Connect are separate systems with separate databases and **no connection between
   them** — no sync, no API call, no shared table, no export. Nothing on outdure.com, in
   Connect, or in any directory learns that someone became Trained. Someone has to carry that
   across by hand.

Live: **Trained Installer Training** is set to confer Trained. **3 tier advancements** have
happened so far (all pilot).

---

## 5. Dealers + Product Champions

**No — not represented at all.**

There is no organisation, company, branch, location, or site entity anywhere in Academy. The
model is flat: a **person** belongs to **the academy** with a **role** (Admin / Instructor /
Learner) and optionally a tier tag. There is no way to say "this person works for this dealer",
no parent/child between accounts, no Product Champion designation, no ability for one person to
see or manage another's training.

The only dealer-shaped thing is the two **Dealer tier codes** (Stockist, Reseller) — but those
sit on an *individual person*, not an organisation, and no course currently confers either.

So dealer ↔ Product Champion ↔ contractor relationships are held entirely outside Academy.

**Where they live today: nowhere purpose-built.** Dealer *companies* exist as records in
**Connect** — the CRM was migrated there from HubSpot, which is no longer used. But that
is a company record, not a structure training can hang off: there is no dealer
**location**, no **Product Champion** designation as a field, and no link of any kind to
Academy. So the relationship "this location's champion, and these contractors trained under
them" has no home in any system today.

**It will need to be added, and the likely anchor is the Outdure website** — so the dealer
record the public site already implies becomes the same record training and the installer
directory hang off.

That has a knock-on for §6: Curtis's target of **3–5 Verified installers per location**
can't be counted at all until an organisation entity exists for the count to hang off.
"Per location" presumes a location. Academy has no such object today.

---

## 6. Verified contractors

**Half of it exists, and it's the half that doesn't matter.**

**Verified** exists as a tier, and a course can be set to confer it — two of the pilot courses
are. So "complete this course → you're Verified" works mechanically.

What doesn't exist is **any verification process**: no evidence or photo submission, no
inspection record, no application, no review queue, no approve/reject, no assessor sign-off, no
expiry or re-verification, no audit trail of *why* someone was verified beyond "finished a
course". Nothing in Academy asks a human to make a judgement about a contractor.

If Verified is meant to mean more than "watched the videos", that process is currently outside
the platform.

### Who owns the decision

| Person | Role in this | Approver? |
|---|---|---|
| **Andrea** — Partnerships & Activation | Owns the Contractor Partnership Programme and all four tiers. **The Verified decision is hers.** | **Yes** |
| **Craig** — Commercial & Legal | Supports at strategic level only — one-to-many activation: webinars, events. | No |
| **Curtis** — Technical Escalation | Designed the platform flow and the tier sheet. Internal only, never distributor-facing. | No |

### ⚠️ The system currently bypasses that ownership

Worth raising, because it's live right now and it contradicts the governance above:
**two published courses are set to confer Verified automatically on completion** — *Outdure
Pedestal Systems* and *DeckPlanr – Selecting Surfaces*. Anyone who finishes either is granted
Verified by the platform, with no checklist, no photos, no inspection, and no involvement from
Andrea.

No real contractor has been affected — the only account currently holding Verified is a test
account. But the mechanism is switched on, and it should probably be turned off (uncheck
"Confers tier on completion" on both courses) before the real courses are published.

### How Curtis proposed it should work

This is **design intent from the tier sheet, not an operating process** — none of it is built,
and none of it runs today:

- Verified sits at **level 4**, reached after "Outdure Comprehensive Training" at level 3.
- Open to **Contractor and Pro Contractor only** — not DIY, Dealer or Distributor.
- Three requirements, **all three** needed before the tier: **Check List Approved · Photos ·
  Inspected Installer**.
- Each requirement is paired with a commercial note on the sheet: checklist ↔ "Qualifying Lead
  for Supply & Install", photos ↔ "Price m²", inspection ↔ "20m² × $ × =". *That reads as
  Outdure supplying the job — inference from the sheet's layout, worth confirming with Curtis
  rather than treating as settled.*
- Rewards: **directory listing** as a Verified installer, plus a **rebate**. Both depend on the
  approval being recorded somewhere a directory can read — which is the same missing system of
  record as §5.
- Target density: **3–5 Verified installers per location** (see §5 — no location entity exists).

### The manual register was designed in from the start

Curtis's flow issues the Trained Installer accreditation certificate **"and added to google
sheet"**. So the Google Sheet isn't a workaround that grew up around a gap — it was the
intended record from day one. Academy issues the certificate; the sheet (alongside Connect)
is the register.

---

## 7. Automated communications

**Seven emails. All transactional, all fired by something a person just did. There is no
scheduler in the system at all.**

| Email | Trigger |
|---|---|
| Welcome | A new academy is created |
| You've been invited | Admin invites someone from the user list (Users → All Users) |
| Your request was accepted | Admin accepts a self-service join request |
| Reset your password | Learner asks for a reset |
| You're enrolled | Learner enrols in a course |
| Your certificate is ready | Course completed and certificate issued |
| Receipt | Stripe payment (configured; not used for these courses) |

What that means in practice — worth stating plainly because it's the biggest gap:

- **No reminders. No nudges. No chasing.** Nothing goes out to someone who enrolled and
  stalled, who hasn't logged in, who failed a quiz, or whose training is going stale. There is
  no scheduled job of any kind in the platform.
- **No admin notifications.** When someone requests to join, nobody is emailed — an admin has
  to notice it on the user list.
- **No template editing.** All seven are hard-coded. "Email Templates" and "Mass Emails" are in
  the admin menu but greyed out as coming-soon.
- No digests, no expiry warnings, no manager/dealer copies.

---

## 8. Reports + integrations

### Reports

One screen — **Admin → Insights**:

- Eight headline numbers: enrolments, completions, completion rate, learners, active in last
  30 days, new enrolments in 30 days, quiz attempts, quiz pass rate.
- **Video engagement** per lesson: viewers, total watched, average per viewer, furthest point
  reached. (This is the good bit — it's real played time, not "clicked complete".)
- **Where learners get stuck**: the 8 most-attempted questions with average time spent and
  % answered wrong.

Plus **Admin → Certificates**: every certificate issued, with a revoke option, and a public
verification page at `/verify/<code>` that anyone can check without an account.

**There are no exports. None.** No CSV anywhere, no scheduled reports, no training matrix, no
gradebook, no per-learner progress report, no per-course roster you can hand to someone. The
only file you can produce is a certificate, printed from the browser. Training Matrix,
Gradebook, Scheduled Reports and Activity Log all appear in the menu but are coming-soon
placeholders.

Worth noting: a full tamper-evident audit log of every change *is* recorded in the
database — but **there is no screen that reads it**, so it's inaccessible without a developer.

### Integrations

| Connects to | For |
|---|---|
| Supabase | Login and database |
| Bunny Stream | Video hosting and playback |
| Resend | Sending the seven emails |
| Stripe | Payments — wired up, not used for Outdure courses |
| Sentry / PostHog | Error tracking and usage analytics |

**And nothing else.** Specifically: **no connection to outdure.com, no connection to Connect,
no contractor directory, no marketing/email platform, no SSO, no public API, no outbound
webhooks.** Academy is an island. The only way data has ever moved in was a one-off database
import script (which is how the 103 lessons and 125 quiz questions got in on 14 Aug).

**Connect is the one that matters.** Since the CRM migrated off HubSpot, Connect holds the
dealer companies, the contractor records *and* the canonical user types that Academy's tier
codes are a hand-maintained copy of. So the single system Academy has no link to is the system
holding everything it would need — and everything it produces (Trained, Verified, certificates)
has to be re-keyed into by hand.

---

## What has to be done by hand today

Everything in this list is a genuine gap in the software, not a preference:

1. **Anything dealer or Product Champion related** — the concepts don't exist in Academy.
2. **The whole Verified process** — Academy can flip the flag, but can't run the assessment.
3. **Telling Connect / outdure.com / anyone else that someone is now Trained** — no sync.
4. **Any chasing or reminding** — no scheduler, so every nudge is a manual email.
5. **Any report anyone actually asks for** — no exports; it has to be built off the database.
6. **Resetting a learner who has used all quiz attempts** — the error message tells them to ask
   an admin, and the admin has no button.
7. **Fixing a wrong tier** — no manual override.
8. **Undoing a completion or a mistaken tick** — progress is append-only by design.
9. **Enrolling someone into a course** — there is no admin-side enrol. A learner has to enrol
   themselves from the catalogue; an admin can only invite them into the academy.
10. **Adding learners in bulk** — invitations are one at a time.
11. **Certificates as a PDF** — browser print only.

---

## Screenshots to attach

I can't grab these from here (they're behind your admin login). Quickest set, all in
`training.structurebuild.co`:

1. **Structure** — Admin → Courses → *Trained Installer Training* → Manage content. Scroll so a
   few sections and their lessons show together.
2. **Course settings** — Admin → Courses → *Trained Installer Training* (the edit screen). Shows
   "Confers tier on completion" and the certificate toggle in one shot. This one answers Q4 and
   half of Q1 by itself.
3. **Assessment settings** — same course → Manage content → any quiz lesson → Quiz. Shows the
   pass threshold and attempts fields, and the question list.
4. **Lesson completion** — open any video lesson as a learner and capture the bottom of the
   page: the "Complete & continue" button next to the video. That *is* the completion rule —
   there's no settings screen to photograph.
5. **User list** — Users → All Users (the screen is titled "People"). Shows roles and the tier tag. **Blur the names and emails.**
6. **Insights** — Admin → Insights, full page. That's the entire reporting capability.
7. **Certificates** — Admin → Certificates. Redact names.
8. Optional: **Admin menu**, expanded. The greyed-out items are an honest map of what isn't
   built — Training Matrix, Gradebook, Email Templates, Activity Log, Approvals, User Groups.

---

## Left for you to answer

> **Update, 17 Aug 09:30 — four of these five are now answered.** Not from Academy, but from the
> March 2026 Distributor Role Framework, Curtis's live platform sheet, and the production
> database. See **`Outdure-Academy-Open-Questions_Analysis_2026_08_17__09_30.md`**.
>
> One item needs a decision before publish: Academy currently confers **Verified** for finishing
> a course, but the business defines Verified as an inspected installation — checklist, photos,
> completed project.

- ~~Where dealer organisations and Product Champions are actually managed today.~~ → **Connect**
  (migrated from HubSpot, which is no longer used), owned by Partnerships & Activation. Product
  Champion is a *distributor-side* role (the one in-person session at Deck Expo), not a
  contractor tier — and **neither location nor Product Champion is a structured field there
  yet**. See §5: it needs a purpose-built home, likely anchored to the Outdure website.
- ~~How Trained → Verified really happens.~~ → Checklist + photos + inspection, decided by
  Partnerships & Activation (Andrea), recorded in Connect and a Google Sheet. **Not a course.**
- What learners, contractors and dealers actually come back to you about. → **Located** in
  `support@outdure.com` (four-tier triage, Moti oversees), but needs a mailbox export to extract.
- ~~Which spreadsheets or manual steps you run alongside Academy.~~ → Xero, Cin7, Connect,
  DeckPlanr; plus Curtis's platform sheet and the reseller order calculators. `Contractors USA`
  is a competitor lead list, not a register.
- ~~Device split.~~ → **The data does not exist.** PostHog was never switched on in production,
  and `audit_log.user_agent`/`ip` are NULL across all 884 rows. Nothing to dig out.
