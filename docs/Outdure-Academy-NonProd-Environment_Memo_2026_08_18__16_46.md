# Academy non-production environment — handover

**To:** Craig · **From:** Stevie · **Date:** 2026-08-18
**Re:** Pre-PX request — non-prod environment, local dev repointing, credential rotation

All three items from your note are done and verified. Details below.

---

## 1. Non-production Supabase environment — ready

| | |
|---|---|
| Project | `training-platform-nonprod` (ref `ysuzujgabfynjdylmlrq`) |
| Region | Sydney (`ap-southeast-2`), same as production |
| API URL | `https://ysuzujgabfynjdylmlrq.supabase.co` |
| Schema | All 19 migrations (`0000`–`0018`) applied; custom access-token hook enabled and verified (JWTs carry `tenant_id` + `role`) |
| Org | Same Supabase org as production; expect ~US$10/mo compute on the bill |

### Seeded for learner-journey testing

- Tenant `outdure` — displays as **"Outdure Academy (Non-Prod)"** so it can never be mistaken for production.
- Both real curricula imported via the same audited import used in production, and **published**:
  - **Standard Training** — 26 lessons
  - **Trained Installer Training** — 14 sections, 77 lessons, 21 quizzes / 87 questions
- All 53 Bunny videos attached to 72 lessons (playback works; 3 known never-recorded placeholders remain, same as prod).
- Default certificate template seeded, so course completion issues a certificate and `/verify/<code>` works.
- Audit chain verified clean after seeding.

### Test accounts (non-prod only — useless against production)

| Role | Email | Password |
|---|---|---|
| Admin (company_admin) | `stevie.van.heerden@outdure.com` | `Np-feeab3bc1f83` |
| Learner | `demo-learner@outdure.test` | `Np-f0756df5f75e` |

Verified end-to-end in the running app: learner sign-in → storefront → free
enrol → lesson with video playback. Enrolment and progress rows land in the
non-prod database.

### How to test against it

There is no deployed staging URL (not requested) — the environment is reached
through local dev:

```sh
npm install --prefix db && npm install --prefix web
npm run dev        # → http://localhost:3010, already pointed at non-prod
```

`web/.env.local` on the dev machine carries the full non-prod env. If you need
it on another machine, get the values from Stevie directly — **do not commit
env values to the repo.**

The automated learner-journey suite (`web/tests/live/`) is pre-wired at the
seeded admin: set `ALLOW_LIVE_WRITES=1` in `web/.env.local` and run
`npm run test:live` from `web/`. Writes go to non-prod only.

Known non-prod differences: Resend is deliberately unset (emails no-op, so a
test run can never mail a real person — invite flows won't send mail);
Stripe is off (as in prod); Bunny Stream is shared with production
read-only for playback.

## 2. Local development repointed — done

`web/.env.local` now targets non-prod exclusively. No production credential
remains in local dev. The old production env was backed up outside the repo
and its credentials have since been rotated dead (below), so the backup is
inert apart from the Bunny key.

## 3. Credential rotation — done, verified, one deliberate exception

Probing on 2026-08-18 showed the exposed credentials were still live, so the
rotation was performed that day and every step verified:

| Credential | Action | Old key verified dead |
|---|---|---|
| Supabase service-role (prod) | Legacy JWT keys **disabled**; app now runs on new-style `sb_secret_` / `sb_publishable_` keys in Vercel (production + preview) | Yes — 401 |
| Supabase anon (prod) | Replaced by publishable key in same step | Yes — 401 |
| Resend API key | Old full-access key deleted; replacement is **sending-only** (least privilege) | Yes — refused |
| Database password (prod) | Reset via Management API; Vercel `DATABASE_URL` updated in same pass | Yes — auth failure |
| **Bunny Stream key** | **Left as-is by owner decision** ("keys were never echoed") — can be rotated later with one dashboard reset + redeploy | n/a — still live |

The live site (`training.structurebuild.co`) stayed up throughout; total
disruption was a few seconds during the database password cutover, and no
user sessions were invalidated.

Separate pre-existing item, unchanged: the retired legacy Supabase project's
anon key is committed to git history (DEPLOY.md §8). Simplest closure is
deleting that legacy project outright.

---

**Status: ready for the Academy PX implementation.**
