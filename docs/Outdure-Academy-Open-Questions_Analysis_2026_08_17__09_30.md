# Outdure Academy — the five open questions

Follow-up to `Outdure-Academy-Current-System_Notes_2026_08_17__08_50.md`, which closed with five
things the platform couldn't answer. Four of the five turned out to be answerable — not from
Academy, but from company documents and the live systems. This records what was found, where it
came from, and where it contradicts what the platform actually does.

**Sources used.** All read-only.

| Source | What it is |
|---|---|
| `Outdure_Distributor Partnership Overview & Role Framework` v9, March 2026 | Craig's company-wide reference doc. Authoritative on tiers, roles and ownership. |
| `2024 ONLINE TRAINING PLATFORM` sheet | Curtis's design sheet for this platform. Last modified **13 Aug 2026** — still live. |
| Academy production database | Direct query, read-only. |
| `training.structurebuild.co` | Network trace of a page load. |

**Headline: one finding needs a decision before the courses publish.** Academy is currently
configured to grant **Verified** for finishing a course. The business defines Verified as an
*inspected installation* — checklist, photos, a completed project. See §2.

---

## 1. Dealer organisations and Product Champions

**Partly answered.** They're managed in **Connect**, owned by the Partnerships & Activation
function (Andrea). Not in a spreadsheet, and not in Academy.

> **Two corrections to the sources, 17 Aug.** The framework documents this analysis draws on
> were written in March 2026 and name **HubSpot** throughout. **HubSpot is no longer used** —
> the CRM has been migrated to the in-house **Connect** platform, and every reference below has
> been updated accordingly.
>
> And "managed in Connect" only goes so far: dealer **location** and **Product Champion** are
> not structured fields there. So the relationship this question is really asking about — this
> location, its champion, and the contractors trained under them — still has **no purpose-built
> home in any system**. It needs to be built, most likely anchored to the Outdure website.

The real hierarchy is four levels deep:

```
Outdure International  →  Distributor (regionally exclusive)  →  Dealer (stocking)  →  Contractor / Installer
```

Distributors are named and tracked: Parksite (USA), Vista Railing (Canada), FH Brundle (GB),
Meyer Parkett (Austria), with KR Distribution and Boise Cascade in negotiation. Phase 2 of the
distributor lifecycle exits on "CRM populated with Outdure prospects and **stocking dealers**" —
so dealers are CRM records — now Connect records — created during distributor onboarding.

**"Product Champion" is a distributor-side role, not a contractor one.** The framework uses it
in exactly one context: in-person training. Technical training is "primarily online and
on-demand, with a single in-person session for **product champions**" — conducted once at Deck
Expo, with Curtis supporting. So a Product Champion is the distributor's designated technical
person who gets the face-to-face session that nobody else gets.

Two consequences for Academy:

- Academy has **no organisation entity at all**, so it cannot express distributor → dealer →
  contractor, cannot mark someone a Product Champion, and cannot answer "how is Parksite's team
  tracking".
- The framework sets an obligation Academy can't report on: the accreditation assessment is
  "**mandatory for all customer-facing staff**" at a distributor. Nobody can currently answer
  "has Parksite's customer-facing staff completed it" — there's no org to group them by.

Curtis's sheet adds a target that also implies organisations: Verified Installers, "**ideally
3–5 per location**".

---

## 2. Trained → Verified — who decides, on what evidence

**Answered, and Academy has it wrong.**

Both sources agree, and neither describes a course:

| Source | What Verified requires |
|---|---|
| Role Framework, March 2026 | "Demonstrated installation capability; completed a **verified QwickBuild project**" |
| Curtis's platform sheet | "**Check List Approved** · **Photos** · **Inspected Installer**" — qualifying lead for supply & install |

So the evidence is a checklist, photographs, and an inspection of real work. The decision sits
with **Partnerships & Activation (Andrea)**, who "leads the Contractor Partnership Programme —
driving adoption across all four tiers", with Commercial & Legal (Craig) supporting at a
strategic level. Where it's recorded today: Connect, plus — per Curtis's sheet — a Google Sheet,
which the design explicitly bakes in ("Certificate issued **and added to google sheet**").

**The conflict.** In Academy right now, two published pilot courses are set to confer **Verified**
on 100% lesson completion — and lesson completion doesn't even require watching the video (a
learner can click "Complete & continue" on an unplayed lesson). Verified carries real
entitlements: warranty tier upgrade, inclusion in the verified installer directory, lead access,
rebate. As configured, Academy can mint all of that from clicking through a course.

This is a configuration problem, not a code problem, and it is fixable now: unset "Confers tier
on completion" on `Outdure Pedestal Systems` and `DeckPlanr – Selecting Surfaces`. Whether
Academy should later *run* the verification workflow (submission → photos → review → approve) is
a build decision — it's currently the largest missing capability, and nothing in the platform
asks a human to make a judgement about a contractor.

**Trained, by contrast, Academy can legitimately confer.** The framework defines it as "Completed
the 60-video training series and passed the product accreditation assessment". Trained Installer
Training holds 56 video lessons and 21 quizzes, and is set to confer Trained — that's a fair
match. One nuance: the framework describes a *single* accreditation assessment at the end;
Academy spreads 21 quizzes through the course and completes on 100% of lessons. Same outcome,
different shape — worth a decision if the certificate is meant to name an assessment result.

### How the verification is *meant* to run — and the fact that it doesn't

Searched Drive for the machinery. **None of it exists.**

- The Role Framework defers operational detail to a "**Document 2**" ("obligations, reporting
  cadence, RACI, and review calendar"). **Document 2 is not in Drive.** Either it was never
  written, or it isn't shared with this account.
- **No Verified checklist template exists.** The checklists that do exist are for other things
  entirely: credit application, distributor onboarding (Andrea, 2025), USA/AU/NZ customer
  pre-order.
- The only inspection artefacts are **project QA**, not contractor accreditation, and are five
  years stale: `Outdure Site Inspection Confirmation` and `INSTALL CHECKLIST.xlsx` (2020),
  `TEMPLATE — Site Inspection and/or CDD and Construction Drawing Handover` (2021). Repurposable,
  but not built for this.
- **No verified-installer directory exists as a file** — despite directory listing being the
  headline Verified benefit.

Reading Curtis's sheet by column, the *intended* mechanism appears to be commercial as much as
technical. Level 4 carries a right-hand note column that pairs each requirement with a deal
mechanic:

| Requirement | Paired note |
|---|---|
| (level applies to Contractor + Pro Contractor only) | "Ideally 3–5 per location" |
| Check List Approved | "Qualifying Lead for Supply & Install" |
| Photos | "Price m2" |
| Inspected Installer | "20m2 x $ x =" |

**Inference, not established fact:** that reads as Outdure *supplying* the verification job — a
qualifying supply-and-install lead, priced per m², on a ~20m² sample — which the contractor
completes, photographs, and submits against a checklist for inspection sign-off. Worth confirming
with Andrea rather than assuming; it materially changes what a platform would need to support
(a job assignment, not just an upload form).

**The practical position: nobody has ever been through this.** Academy has 4 members and the real
courses aren't published, so no contractor has reached Trained by the intended route, let alone
Verified. Trained → Verified is a designed intent, not a running process. *(Caveat: Connect may
hold records and workflow I can't see — Drive is the only connected system.)*

### Three tier vocabularies are in circulation

Worth resolving before publish, because they don't line up:

| Academy (code) | Role Framework (Mar 2026) | Curtis's sheet |
|---|---|---|
| Registered | 1 Registered | 1 Overview video |
| Trained | 2 Trained | 2 Outdure Basic Training |
| Verified | 3 Verified | 3 Outdure Comprehensive Training |
| Strategic Partner | 4 Strategic partner | 4 Verified Installer |
| Stockist / Reseller (dealer) | — | 5 Trained Partner |

Academy and the Role Framework agree. **Curtis's sheet is offset by one** and adds a fifth level;
its audience axis is different again (DIY · Dealer · Distributor · Contractor · Pro Contractor)
rather than the Connect user types Academy copied.

---

## 3. What learners, contractors and dealers come back with

**Located, not extracted.** It's all in **support@outdure.com**, which the framework documents as
a four-tier triage:

| Tier | Query type | Handled by |
|---|---|---|
| 1 | Availability, lead times, pricing, order status, simple installation guidance | Philippines team + Design & Estimation |
| 2 | Specification advice, structural questions, project-specific design | Moti |
| 3 | Load calculations, structural compliance, tolerances | Moti → Curtis |
| 4 | Recurring patterns / quality issues | Moti → Craig |

I can't read that mailbox from here — only Drive is connected. If you want the actual answer,
the fastest route is a Tier-1/Tier-2 export from the support inbox for the last 6–12 months; the
recurring Tier 1 items are almost certainly the FAQ the courses should pre-empt.

Relevant gap: **Academy has no question channel of its own.** A learner who is stuck mid-lesson
has no way to ask anything inside the platform, so none of this feedback is attributable to a
course, section or lesson. The "where learners get stuck" panel on Insights is inferred from quiz
data only.

---

## 4. Spreadsheets and manual steps running alongside Academy

**Partly answered.** The named systems are **Xero, Cin7, Connect**, and **DeckPlanr** (operated by
XPlanr, used under licence). Academy connects to none of them.

Spreadsheets found that touch this work:

| Sheet | Owner | Last modified | What it actually is |
|---|---|---|---|
| `2024 ONLINE TRAINING PLATFORM` | Curtis | **13 Aug 2026** | The design sheet for Academy — flow, lesson list, audience tags. Source of the 14 Aug import. Still being edited. |
| `Contractors USA` | you | Feb 2026 | **Not an Outdure register** — a scraped lead list of US contractors carrying *competitor* tiers (Deckorators Certified Pro, TimberTech Gold/Platinum). |
| `NZ installers`, `OUTDURE - AK Commercial installers`, `AU BUILDER CALL BACK LIST` | sales | 2019–2025 | Older regional contact lists. |
| `OUTDURE MASTER RESELLER ORDER CALCULATOR` (many) | ops | 2023–2024 | Commercial ordering, per distributor. Not training. |

There is **no dealer register spreadsheet and no Product Champion spreadsheet** — consistent with
dealers living in Connect. Note this is not the same as saying Product Champions are recorded
anywhere: they are neither in a spreadsheet nor a structured field in Connect.

Manual steps the two documents describe, which Academy does not carry:

1. **"Certificate issued and added to google sheet"** — a manual register step designed into the
   Trained Installer flow from the start.
2. Monthly distributor stock updates → reorder calculators.
3. Quarterly QDSR preparation.
4. Co-op claim processing.

### Three things Curtis's sheet specifies that Academy doesn't do

Flagging these because the sheet is current, not historical:

- **Onboarding branch.** The intended flow is `Signup → Qualification Onboarding Questionnaire →
  popup → Standard Training *or* Trained Installer`. Academy has no questionnaire and no
  branching — learners self-select from a flat catalogue.
- **Audience tagging.** Every lesson in the sheet is tagged TRUE/FALSE against five audiences:
  **Dealers · Distributors · Staff · Contractors · Home Owners**, and the welcome video is
  explicitly "based on customer type". Academy has no audience targeting; every published course
  is visible to everyone.
- **Certificates mid-course.** The sheet issues a *Product* certificate and a *DeckPlanr*
  certificate at series level, then the Trained Installer accreditation. Academy issues exactly
  one certificate, at course completion. Delivering the sheet's model would need those series
  split into separate courses.

---

## 5. Device split

**Answered: the data does not exist.** Not "hard to get" — not collected.

- **PostHog is not running.** A page load of `training.structurebuild.co` makes **zero** requests
  to any PostHog host. The provider only initialises when `NEXT_PUBLIC_POSTHOG_KEY` is set, and
  it isn't set in production or locally. Nothing has ever been captured.
- **The database holds no device signal.** `audit_log` has `user_agent` and `ip` columns, but
  across **884 rows, both are 100% NULL** — the application never passes them. `progress_events`
  carries only `positionSec`.

So there is no historical device split to dig out, and none will accrue. Two options, cheapest
first:

1. **Set `NEXT_PUBLIC_POSTHOG_KEY` in Vercel.** Pageviews with device type start collecting
   immediately; no code change. Gives you an answer in a fortnight, not retrospectively.
2. **Populate `audit_log.user_agent` / `ip`.** `audited()` already accepts both — the call sites
   just never pass them. Worth doing regardless: an append-only, hash-chained audit log that
   records *what* changed but never *from where* is materially weaker as evidence, which matters
   given the log exists for accreditation.

---

## What I'd action from this

| # | Action | Owner | Urgency |
|---|---|---|---|
| 1 | Remove "Confers tier: Verified" from the two pilot courses | you | **Before publish** |
| 2 | Confirm Trained Installer Training → Trained is the intended and only route to Trained | Andrea / Craig | Before publish |
| 3 | Reconcile Curtis's 5-level sheet against the Role Framework's 4 tiers | Andrea + Curtis | Before publish |
| 4 | Decide whether audience tagging (5 audiences) is in scope, or courses stay open to all | you | Before publish |
| 5 | Turn on PostHog in Vercel | you | Now — cheap, and the clock starts on device data |
| 6 | Pass `user_agent`/`ip` into `audited()` | dev | Next change |
| 7 | Pull a support@outdure.com export to answer §3 properly | Moti | When convenient |

Nothing here changes the §1–§8 findings in the current-system notes — those were checked against
the running code and still hold.
