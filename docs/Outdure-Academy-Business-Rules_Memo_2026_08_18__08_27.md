# Outdure Academy — answers to Craig's four business-rule questions

Prepared 18 Aug 2026 for Stevie. Each answer is split into **what the system verifiably does
today** (checked against the deployed code and live database), **what the design documents
intended** (Curtis's tier sheet, the March 2026 Role Framework), and **what only you/Andrea can
confirm** — because for every one of these questions, those three things are not the same.

Anything marked ⚠️ CONFIRM is the sentence Craig actually needs from a human.

---

## 1. Required training

**What the system does today.** Three courses are configured to confer a tier on completion:

| Course | Status | Confers | Applies to |
|---|---|---|---|
| Trained Installer Training | **draft** | Contractor: **Trained** | Contractors — this is the real curriculum (14 sections, 77 lessons) |
| Outdure Deck Frame Installation | published | Contractor: Trained | Pilot course, not real curriculum |
| Outdure Pedestal Systems | published | Contractor: **Verified** | Pilot — misconfigured, see Q3 |
| DeckPlanr – Selecting Surfaces | published | Contractor: **Verified** | Pilot — misconfigured, see Q3 |

**Standard Training** (draft, 4 sections / 26 lessons) confers **nothing**. Its Welcome section
was cut to the *Dealers* video only during the import — the sheet strikes the other audiences —
so it reads as the dealer/Product Champion course, but no tier is wired to it.

**No course anywhere confers a Dealer tier** (Stockist or Reseller), and Academy has no concept
of a Product Champion, so there is currently no such thing as "the training a Product Champion
must complete" in the system.

⚠️ CONFIRM for Craig:
- Contractor → Trained requires: **Trained Installer Training** (once published). *(This one is
  effectively settled — it's what the import configured from Curtis's sheet — but say it.)*
- The Product Champion course is: **Standard Training?** — and whether completing it should
  confer anything. The framework documents describe champion training as a **single in-person
  session at Deck Expo** (Curtis supporting), not an Academy course at all, so this is genuinely
  open.
- Whether the pilot course "Outdure Deck Frame Installation" should keep conferring Trained
  once the real curriculum publishes, or be archived.

---

## 2. Registered → Trained

**What the system does today: completion alone, instantly, no human involved.** The moment the
last lesson of a Trained-conferring course completes, one transaction marks the enrolment
completed → advances the tier → issues the certificate → emails it. There is no review queue,
no approval step, no admin notification, and no way to intervene — there is also no manual
override to grant or remove Trained outside a course.

**Design intent agrees.** Curtis's sheet has no approval gate at this level: "certificate
issued and added to google sheet". Trained is meant to be automatic.

⚠️ CONFIRM for Craig: **completion of the required training is the entire rule — no other
review or approval.** (Unless you know of an informal check that happens today, in which case
say that instead — nothing in any system enforces one.)

---

## 3. Verified

**Craig's understanding is right, and it matches everything except the platform's current
configuration.**

- **What they submit** (Curtis's tier sheet): **Check List Approved · Photos · Inspected
  Installer** — all three. The sheet pairs these with commercial notes (checklist ↔ "Qualifying
  Lead for Supply & Install", photos ↔ "Price m²", inspection ↔ "20m² × $ × =") that read as
  the evidence coming from a real Outdure-supplied job — worth Craig confirming that reading
  with Curtis.
- **Who reviews/approves**: **Andrea (Partnerships & Activation)** — she owns the programme and
  all four tiers. Craig supports at strategic level only; Curtis designed the flow but is
  internal-only.
- **Other requirements**: open to Contractor and Pro Contractor only (not DIY, Dealer,
  Distributor); the sheet's rewards are a directory listing and a rebate; target density 3–5
  Verified installers per location. Recorded in Connect and the Google Sheet register.
- **Should a course ever auto-confer Verified? No.** That is the design intent everywhere
  outside the platform.

**The misconfiguration, precisely:** Outdure Pedestal Systems and DeckPlanr – Selecting
Surfaces (both published) confer `CON_VERIFIED` on completion. One account currently holds
Verified this way — **a test account, no real contractor**. The fix is unticking "Confers tier
on completion" on both courses; it takes a minute in the admin.

⚠️ CONFIRM for Craig: **yes — Verified must never be conferred by course completion.** Then
tell me (or Craig's team) to clear the setting on those two courses; I've left it untouched
because changing a live business rule is your call, not mine.

One more thing Craig should know while he's designing for this: even once the rule is
confirmed, **Academy has no way to record a Verified decision at all** — no submission,
review, or approval surface, and no manual tier override. Andrea's decision would live only in
Connect and the Google Sheet, invisible to Academy.

---

## 4. Dealers / Product Champions

**Stockist vs Reseller — the system says the opposite of what Craig believes, and the system
is probably wrong.** Academy models them as a **ladder**: Stockist rank 0 → Reseller rank 1,
same group, and the advancement code would happily promote a Stockist to Reseller if a course
conferred it. (Academy copied this from Connect's user-types table, migration 017.) No course
confers either and nobody holds a dealer tier, so the modelling has never fired — but if
Craig's understanding is right that they are **different business types**, both Academy's copy
and possibly Connect's ordering encode a progression that doesn't exist.

⚠️ CONFIRM for Craig: are Stockist and Reseller **types or levels**? Nothing in the framework
documents settles it. If types: Academy's tier model needs a small correction before any dealer
course ships.

**The Product Champion flow he describes cannot be represented in Academy today, at any step:**

1. *"The individual Product Champion completes the required Academy training"* — possible only
   as an ordinary learner completing an ordinary course. Nothing marks them as a champion.
2. *"The dealer organisation then satisfies the training requirement"* — impossible. Academy
   has no organisations, no locations, no person→dealer link, and nothing that could roll a
   person's completion up to a company's status.
3. The framework adds a wrinkle Craig should hear: to date, champion training has been a
   **single in-person session at Deck Expo**, not Academy content — so the "required Academy
   training" for champions may not exist yet as a course (see Q1).

⚠️ CONFIRM for Craig: the champion → dealer-status flow is the **intended future model**, not a
description of anything that runs today. Where the champion designation and the dealer's
satisfied/not-satisfied status should live (Connect? the Outdure website record? Academy once it
gets organisations?) is the design decision his team is actually facing — it currently lives
nowhere.

---

## The one-paragraph version, if you want to just paste something

> 1) Trained Installer Training → Trained for contractors (auto). Standard Training is the
> dealer-facing course but currently confers nothing — champion training has so far been an
> in-person Deck Expo session, so "required champion course" needs a decision. 2) Registered →
> Trained is completion only; no approval, and that's by design. 3) Confirmed: Verified =
> checklist + photos + inspection, decided by Andrea, recorded in Connect + the Google Sheet —
> never by course completion. The two courses auto-conferring it are a misconfiguration; only a
> test account was affected; we'll clear the setting. 4) Stockist and Reseller: [TYPES / LEVELS
> — Stevie to confirm; the platform currently models levels]. The champion→dealer flow is the
> right intended model but exists in no system today — Academy has no organisations, champions,
> or person→dealer links, so that structure is new build.
