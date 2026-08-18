Hi Craig — answers to your four below. Where it matters I've separated what the platform
actually does from what the business rule should be, because on a couple of these they don't
match, and the platform shouldn't be treated as the source of truth for the rule.

*(Two spots are marked for me to confirm before this goes out — everything else is checked
against the live system.)*

---

**1. Required training**

For a **Contractor**, the course is **Trained Installer Training** — completing it makes them
Trained. That's already configured (it's still in draft pending quiz sign-off, so nobody has
been through it yet — the only activity to date is pilot testing).

For a **Dealer's Product Champion**, honest answer: **there is no defined Academy course yet.**
Standard Training is the dealer-facing course — its welcome content is addressed to dealers —
but it isn't wired to confer anything, and to date champion training has actually been a single
in-person session at Deck Expo with Curtis supporting, not Academy content at all. So "what
must a Product Champion complete" is a decision your project needs to force, not a rule I can
read out to you. My suggestion would be Standard Training, but Andrea should make that call.

One housekeeping point: an old pilot course (Outdure Deck Frame Installation) also confers
Trained. We should archive it or strip the setting when the real curriculum publishes, so
there's exactly one path to Trained.

**2. Registered → Trained**

Completion of the required training — that's the entire rule. The moment the last lesson
completes, the platform advances the tier, issues the certificate and emails it, all in one
step. There is no review or approval anywhere, no notification to anyone, and that matches
Curtis's original design (his flow goes straight from completion to "certificate issued and
added to google sheet"). There's also no manual override — the platform can't grant or remove
Trained outside a course, which is worth knowing when you design the admin side.

**3. Verified**

Your understanding is correct on all four points:

- **What they submit:** an approved checklist, project photos, and an installer inspection —
  all three. (Curtis's sheet pairs these with commercial notes that read as the evidence coming
  from a real Outdure-supplied job — worth confirming that reading with Curtis directly.)
- **Who approves:** Andrea. She owns the Contractor Partnership Programme and all four tiers —
  the Verified decision is hers, recorded in Connect and the Google Sheet register.
- **Other requirements:** it's open to Contractors and Pro Contractors only — not DIY, dealers
  or distributors. The rewards on the sheet are the directory listing and a rebate, with a
  target of 3–5 Verified installers per location.
- **And yes: completing a course should never make someone Verified.** The two published
  courses conferring `CON_VERIFIED` are a misconfiguration, full stop. Only a test account was
  ever affected — no real contractor holds Verified. We'll untick the setting on both courses;
  it's a one-minute change.

One thing your team should design for: even with the rule confirmed, Academy currently has
nowhere to *put* a Verified decision — no submission flow, no review queue, no approve/reject,
and no manual tier control. Andrea's decision lives entirely in Connect and the spreadsheet,
and Academy never learns about it. If Verified is going to appear in the learner experience,
that gap is the build.

**4. Dealers / Product Champions**

**Stockist vs Reseller:** [Stevie to confirm the business answer — but you should know that the
platform currently models them as *levels*: Stockist rank 0, Reseller rank 1, with promotion
logic that would advance one to the other. Academy copied that structure from Connect's
user-types table. If they're actually distinct business types, as you believe, that's a
modelling error in both places — harmless so far only because no course confers a dealer tier
and nobody holds one.]

**The Product Champion model:** your description — champion completes the training, the dealer
organisation thereby satisfies its requirement — is the right *intended* model, but I want to
be clear that no system implements any part of it today:

- Academy can enrol the champion as an ordinary learner, but nothing marks them as a champion.
- The roll-up to the dealer is impossible right now: Academy has no organisations, no
  locations, and no person→dealer link, and Connect holds dealer companies but has no
  structured Product Champion or location fields either.
- So "dealer satisfies its training requirement" currently has no home in any system — that
  relationship needs a place to live (Connect, the website's dealer record, or Academy once it
  gets organisations), and that's probably the biggest structural decision in front of your
  team.

No exceptions or extra champion rules that I'm aware of — [Stevie: add any informal ones here,
e.g. multiple champions per dealer, replacement when someone leaves.]

---

Happy to pick up assessments, lesson completion, directory rules, renewal and notifications
whenever you're ready — the current-system write-up I sent covers most of the factual side of
those already.
