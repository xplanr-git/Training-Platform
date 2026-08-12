# Implementation prompt — Training Platform remediation

> Paste everything below the line into a fresh Opus session opened at
> `C:\Training-Platform`. It is written to be self-contained.
>
> Source: audit of branch `phase-b-foundation` @ `623f4ba`, 2026-08-06.

---

You are working in `C:\Training-Platform` on branch `phase-b-foundation`.

Read `CLAUDE.md` first and treat it as binding, with one correction noted in
Work Package 7: its §3 and §4 describe a May 2026 snapshot and are themselves
out of date. Where CLAUDE.md's *rules* (§7) and its *status claims* (§3, §4)
conflict with what you find in the code, the code is the truth and the rules
still bind.

## Non-negotiable constraints

- **Migrations are append-only.** Never edit a shipped file in `db/migrations/`.
  The next number is `0014`. This applies to `0001_rls_and_policies.sql` even
  though `db/README.md` currently tells you to edit it in place — that README
  line is wrong and you will fix it in WP7.
- **The gate is `npm run verify` in BOTH `web/` and `db/`.** Not `npm test`, not
  a subset. `web/tests/unit/ci-parity.test.ts` exists because a partial gate
  once left CI red for five commits that were each reported green. Local green
  means "the commands pass" — this machine is Node 18, CI pins Node 20.
- **Never amend commits.** Always create new ones.
- **Commit as `systems@structurebuild.co`** or the Vercel build is rejected.
- **Do not restore the demo bypass** (CLAUDE.md §7.12) and do not bypass the
  audit helper (§7.11).
- **Ask before destructive operations** on production data. Several items below
  touch live security policy; land them as migrations and say clearly when a
  Supabase dashboard action is needed from the account owner.
- The live deployment is `training.structurebuild.co`, single-tenant mode
  (`DEFAULT_TENANT_SLUG=outdure`), deployed from remote `academy/main`.

Work the packages in order. WP1 is exploitable in production today.

---

## WP1 — CRITICAL: close the PostgREST privilege-escalation hole

**The bug.** `db/migrations/0001_rls_and_policies.sql:46-66` applies one policy
to sixteen domain tables:

```sql
create policy %I on public.%I
  for all to authenticated
  using (public.app_is_platform_admin() or tenant_id = public.app_current_tenant())
  with check (public.app_is_platform_admin() or tenant_id = public.app_current_tenant());
```

`for all`, with no role predicate. Line 226 then grants
`select, insert, update, delete on all tables in schema public to authenticated`.
`memberships` is in the table list and `membership_role` includes
`platform_admin`.

So any learner holding a valid session and the public anon key (which is in the
client bundle by design) can call PostgREST directly:

```
PATCH https://<ref>.supabase.co/rest/v1/memberships?user_id=eq.<self>
{"role":"platform_admin"}
```

Both `using` and `with check` pass — same tenant. On the next token refresh
(≤1h) `custom_access_token_hook` stamps `platform_admin` into the JWT,
`app_is_platform_admin()` returns true everywhere, and `platform/layout.tsx:8`
and `platform/actions.ts:15` admit them to cross-tenant admin.

The app layer is **not** the problem and does not need changing: every admin
Server Action calls `requireAdmin()`, every admin page calls
`requireAdminForSlug(slug)`, and `authz-conventions.test.ts` fails CI if a guard
is dropped. The hole is entirely at the database boundary.

**Same root cause, separately damaging:**

| Table | What a learner can do directly |
|---|---|
| `certificates` | Insert a row; `/verify/[code]` renders it as Valid (`verify/[code]/page.tsx:26-41` looks up by code alone) |
| `enrollments` | Insert a row; bypass Stripe entirely |
| `quiz_questions` | `select correct` — every answer key in the tenant, server-side grading bypassed |
| `progress_events` | Insert `{"event_type":"completed"}` → self-complete a course → auto-issue a certificate |
| `audit_log` | Insert forged entries; the trigger dutifully hash-chains them, indistinguishable from real ones |

Note `progress_events` and `audit_log` have their own insert policies
(`0001:151-154`, `0001:176-179`) that check only `tenant_id` — neither verifies
the row belongs to the caller.

**Fix, as migration `0014`:**

1. Replace the `for all` loop policy with a `for select` policy plus
   `insert`/`update`/`delete` policies gated on
   `app_current_role() in ('company_admin','platform_admin')` (add instructor
   where the product needs it).
2. `revoke insert, update, delete` on `memberships`, `roles`, `certificates`,
   `enrollments`, `orders`, `payouts`, `subscriptions`, `audit_log` from
   `authenticated` outright. Verify first, then state it in the migration
   comment: `web/src` contains **zero** `supabase.from()` calls — every write
   goes through the service-role Drizzle connection — so nothing legitimate
   breaks.
3. Tighten `progress_events_insert` to require the enrollment be the caller's:
   ```sql
   exists (select 1 from enrollments e
           where e.id = enrollment_id
             and e.user_id = auth.uid()
             and e.tenant_id = public.app_current_tenant())
   ```
4. Drop `audit_log_insert` for `authenticated` entirely — `db/audit.ts:41`
   writes over the RLS-bypassing connection, so the grant serves no purpose.
5. Restrict `select` on `quiz_questions.correct`. Either a column-level revoke
   plus a safe view, or move the answer key out of the learner-readable table.

**Acceptance.** Write a test that authenticates as a seeded learner against a
non-production project and asserts each of the six attacks above now fails.
Do **not** run write probes against production.

---

## WP2 — HIGH: stop trusting stale JWT claims in the admin guard

`web/src/lib/tenant.ts:93-100`. `requireAdmin()` takes role and tenant only from
the decoded access token. Demoting an admin (`people/actions.ts:182`) or
deactivating them (`:212`) therefore has no effect until their token refreshes —
up to an hour of full mutation rights on courses, people and certificates for
someone you just removed.

`login/actions.ts:36` and `lib/course-access.ts:27` already re-read the database
for exactly this reason. The guard that matters most does not.

**Fix.** Have `requireAdmin()` and `requireAdminForSlug()` confirm an `active`
membership with an admin role against `memberships`. One indexed lookup, and
`getTenantContext()` is already `cache()`-deduped per request so the cost is
paid once. Add a case to `authz-conventions.test.ts` pinning it.

---

## WP3 — HIGH: make the audit log actually tamper-evident

Three defects in `0001_rls_and_policies.sql:183-213`, all in migration `0014`
or a sibling:

1. **The chain forks under concurrency** (`:189-195`). `select ... order by
   occurred_at desc, id desc limit 1` takes no lock. Two concurrent transactions
   read the same `prev_hash` and both commit, so two rows claim one predecessor
   and no verifier can linearise them. Worse, `occurred_at` defaults to `now()` =
   *transaction start*, so chain order ≠ commit order. Fix with
   `pg_advisory_xact_lock(hashtext('audit_log:' || coalesce(tenant_id::text,'null')))`
   as the trigger's first statement, and/or a monotonic `bigserial` ordered on
   instead of `occurred_at`.
2. **No canonicalisation, no field delimiter** (`:196-204`). Fields are
   concatenated bare, so `action='course.up' + resource_type='date'` hashes
   identically to `action='course.update' + resource_type=''`. A forged row can
   be crafted to collide. Hash a `jsonb_build_object(...)::text` (Postgres sorts
   jsonb keys deterministically) or interpose `chr(31)` between every field.
3. **`ip`, `user_agent` and `id` are excluded from the hash** — exactly the
   provenance fields an attacker rewrites. Include them.

**Also:** there is no verifier anywhere in the repo. A tamper-evident log with
no way to check it is unfalsifiable in both directions, and `db/README.md:35-37`
claims integrity "pass" without one existing. Add
`public.verify_audit_chain(tenant uuid)` that recomputes each row's hash from
its predecessor, plus a test.

**And:** `forbid_mutation` is a row-level trigger, so `TRUNCATE` fires nothing
and bypasses append-only entirely. `authenticated` can't truncate, but the app's
own `DATABASE_URL` role can. Add statement-level `before truncate` triggers on
`audit_log` and `progress_events`.

---

## WP4 — HIGH: unblock deletion, and close the audit gaps

**Deletion is broken.** `progress_events.tenant_id` and `.enrollment_id` are
still `on delete cascade` while `progress_events_no_update` rejects DELETE. So
deleting a tenant, course, or enrollment **aborts** for any learner who
generated a single event. `0011:26-34` flagged this and deferred it;
`db/cleanup-e2e-junk.sql:7-22` confirms it in practice — 59 of 73 junk courses
cannot be deleted. This is a GDPR-erasure blocker, not just housekeeping.

Decide the erasure question, then either drop the two FKs (the resolution
`0009`/`0012` already used for `audit_log`) or add a `security definer` erasure
path that disables the trigger under a guarded session flag. Write down which
and why in the migration.

**Mutations that bypass `audited()`** (CLAUDE.md §7.11 requires all of them):

- `admin/courses/[courseId]/builder/actions.ts` — `addSection:219`,
  `deleteSection:239`, `updateLesson:299`, `deleteLesson:333`, `moveSection:340`,
  `moveLesson:386`
- `builder/quiz/actions.ts` — `ensureQuiz:14`, `setPassThreshold:29`,
  `addQuestion:45`, `deleteQuestion:115`. This file imports no audit helper at
  all, and a silent change to a pass threshold or an answer key is precisely the
  accreditation-relevant event the log exists for.
- `learn/[courseSlug]/actions.ts:262` `submitQuizAttempt`
- `api/webhooks/stripe/route.ts:46-57`, `:150`
- `people/actions.ts:123`, `join/actions.ts:91` (`users.name` overwrite)

Use the existing `db.transaction` + `audited(tx, …)` pattern from the sibling
actions in the same files.

**Unbounded quiz attempts.** `learn/[courseSlug]/actions.ts:262-346` allows
unlimited submissions and returns `?score=&passed=` each time. With a handful of
questions that is a brute-forced pass and an auto-issued certificate in seconds.
Add a `maxAttempts` in `quizzes.settings` checked before grading, plus a
rate-limit bucket keyed on `enrollmentId`.

**Two unverified-ownership writes:** `builder/actions.ts:247` `addLesson` never
checks `sectionId` belongs to `courseId`; `builder/quiz/actions.ts:14`
`ensureQuiz` never checks `lessonId` is in the caller's tenant.

---

## WP5 — The sign-in flow: stop fixing it one symptom at a time

**Status.** The specific loop — sign in, page refreshes, login form returns —
was fixed by `623f4ba` and that build went live at ~15:19 NZST 2026-08-06. I
verified the deployed chunk contains `window.location.replace(null!=l?l:"/dashboard")`
with no server-action reference, which is `623f4ba`'s code. Signed out,
`/dashboard` correctly redirects to `/login`. **I could not confirm the fix from
the user's side because signing in requires their password, which I will not
enter.**

**First, before changing code:** the reporter should hard-reload and retry. If
it still loops for them, the most likely cause is **stale duplicate cookies**.
Commit `083f1ac` (2026-07-09) introduced `cookieOptions: { domain: '.training.structurebuild.co' }`.
Any browser that signed in before that date holds host-only `sb-*-auth-token`
cookies that the browser still sends alongside the new domain-scoped ones; the
server can read the stale one, `getUser()` returns null, and the dashboard
bounces to `/login` — indefinitely, for that browser only. Have them clear
cookies for `training.structurebuild.co` before you debug anything else.

**The real problem is structural.** The last four commits on this branch are all
fixes to the same thirty seconds of user experience:

```
623f4ba fix(auth): stop a successful sign-in resolving its destination to /login
1965ba9 fix(auth): keep the sign-in button busy until the page actually changes
30a0419 perf(auth): make signing out leave, and stop it waiting on work nobody sees
47e8872 fix(storefront): give the catalogue a header, since / now lands there
```

Sign-in destination logic is spread across the client page, `middleware.ts`,
`lib/host.ts`'s rewrite rules, `dashboard/page.tsx`, and two Server Actions in
`login/actions.ts` — and the session cookie is reliably visible to some of those
and not others. Each fix moved work between layers and exposed the next seam.

**Do this:**

1. Write an authenticated end-to-end test for the sign-in journey — learner and
   admin, apex host and tenant subdomain, with and without `?next=` — and get it
   running in CI (see WP6). Until this exists, the next regression ships the
   same way the last four did.
2. Only then consolidate: one server-side resolver owns the destination, reached
   by a full document request, with the client's only job being to leave. That
   is the direction `623f4ba` already took; finish it and delete the alternate
   paths so there is nothing left to drift.
3. Fix `middleware.ts:36-41` while you are here — the `/platform` redirect builds
   a fresh `NextResponse.redirect` without copying the refreshed auth cookies
   from `updateSession`, unlike the rewrite branch at `:31`.
4. `learn/[courseSlug]/actions.ts:241,253` returns a caller-supplied `nextHref`
   as `redirectTo`, which `nav-form.tsx:95` feeds to `router.push`. Run it
   through the existing `safeRedirect()`.

---

## WP6 — You are blind in production

Three gaps that together mean a live failure reaches you only when a user
complains — which is how the login bug was found.

1. **Client-side Sentry is dead.** `@sentry/nextjs` ^8.47.0 is installed, but
   `src/instrumentation.ts` inits **server-side only**. There is no
   `sentry.client.config.ts`, no `withSentryConfig()` in `next.config.mjs` (so
   no source-map upload, despite a comment claiming it is wired in CI), and
   `error.tsx` only `console.error`s. Every browser error goes nowhere. Wire all
   three.
2. **The golden path never runs automatically.** CI's `e2e` job runs
   `tests/e2e/smoke.spec.ts` — four *unauthenticated* checks. The four real
   journeys (`golden-path`, `quiz-path`, `overview-stats`, `signup-provision`)
   live in `tests/live/`, are not in CI, are not in `verify`, have no
   `webServer`, and are default-skipped unless `ALLOW_LIVE_WRITES=1`. The reason
   is sound — `web/.env.local` points at production and the suite used to leave
   junk tenants there. The fix is a disposable Supabase project, not continued
   manual testing. Stand one up, add a CI job, and add `test:live` to `verify`
   so `ci-parity.test.ts` enforces it from then on.
3. **Error boundaries are root-only.** One `error.tsx`, one `not-found.tsx`, no
   `global-error.tsx`, nothing at segment level. One Postgres timeout replaces
   the entire app with a generic page. Add boundaries under `/t/[slug]`,
   `/t/[slug]/admin`, `/t/[slug]/learn`, plus `global-error.tsx`.

Also in this package:

- **Rate limiting** is an in-process `Map` (`lib/rate-limit.ts:46`), so every
  Vercel cold start resets it. Move to a shared store. Uncovered paths worth
  adding: `enrollFree` / `startCoursePurchase` (creates Stripe sessions),
  `recordVideoProgress` (unbounded appends — a storage-cost DoS),
  `submitQuizAttempt`. `requestToJoin` is IP-keyed only, unlike `passwordReset`.
  Sign-in genuinely cannot be covered from here (the browser calls Supabase
  directly) — leave it, and keep saying so.
- **No CSP** in `next.config.mjs:7-20`, while auth cookies are domain-wide and
  necessarily JS-readable (`lib/env.ts:34-40`). One XSS on any subdomain yields
  tokens for every session on the platform. Six other headers are set; add CSP
  allowing self, the Supabase origin, `iframe.mediadelivery.net`, PostHog and
  Sentry.
- **Node is unpinned** outside CI — no `engines`, no `.nvmrc`, no
  `packageManager`. Pin 20 to match CI.

---

## WP7 — The documentation actively misleads

CLAUDE.md calls itself the single source of truth. It is currently the most
drifted file in the repo, and three root docs contradict it from the most
discoverable place a new contributor looks.

1. **`CLAUDE.md` itself.** `Last reviewed: 2026-05-11`, but §7.13 cites work from
   2026-08-06. §3 describes a prototype with 5 tables and two edge functions —
   there are now 22 tables across 14 migrations and a shipped Next.js app. §4
   presents issues **1, 2, 3, 5 and 6 as live and exploitable** when all five are
   fixed, which sends every reader hunting for bugs that no longer exist and
   devalues the entries that *are* still real. §8's file map omits `web/`, `db/`,
   `DEPLOY.md` and `PLATFORM_OVERVIEW.md`. §3 and §8 still reference the deleted
   `make-server` function. Rewrite §3, §4 and §8 to the 2026-08 state.
2. **Archive, with a banner, to `docs/_archive/`:** `IMPLEMENTATION_PLAN.md`
   (Next.js 14, Prisma, NextAuth, SendGrid, corporate-L&D framing — all
   contradict §1/§2), `API_SPECIFICATION.md` (specifies a separate API service
   at `api.outdureedge.com` with `X-Tenant-ID` headers — the exact shape §7.8
   forbids), `DATABASE_SCHEMA.md` (~70 tables against the 22 that exist, with
   diverging names: `lesson_completions` vs `progress_events`, `audit_logs` vs
   `audit_log`). `docs/_archive/README.md` already has the right banner pattern.
3. **Reconcile `PLATFORM_OVERVIEW.md` upward instead of archiving it.** It
   accurately describes the live single-brand deployment at
   `training.structurebuild.co`, while CLAUDE.md §1 says the product is
   explicitly "not a single-brand corporate L&D portal". Add a paragraph to §1
   acknowledging single-tenant mode as a supported *deployment configuration* of
   the multi-tenant product. Right now the source of truth denies the thing that
   is actually in production.
4. **Two README lines that will cause the next bug:**
   - `db/README.md:15` says `client.ts` is "RLS-enforced, request-scoped".
     `db/client.ts:5-13` correctly says it **bypasses** RLS and callers must
     scope by `tenant_id` themselves. A developer trusting the README will omit
     tenant filters. This is the single most dangerous sentence in the repo.
   - `db/README.md:12-14` says `0001_rls_and_policies.sql` is "Hand-written; edit
     here for policy changes" — a direct instruction to violate §7.3.
   - `db/client.ts:11` still points at `withTenant()`, removed months ago.
5. **`DEPLOY.md` and `PLATFORM_OVERVIEW.md` cannot both be right.** One reads as
   though nothing has shipped; the other says the platform is live. Add a status
   line to DEPLOY.md recording which of §1–§8 are done, and confirm the four
   un-ticked §8 items — apply migration `010` to the legacy project, redeploy the
   legacy edge function with `ALLOWED_ORIGINS`, **rotate the legacy anon key**
   (it was committed to source), flip DNS.
6. **Repo hygiene.** Root `package.json` is still named `@figma/my-make-file` and
   its `npm run dev` silently starts the *retired* Vite prototype; `.claude/launch.json`
   lists `vite-dev` first. `tmp/dashboard_replacement.txt` and
   `tmp/patch_check.txt` are tracked junk and `tmp/` is not gitignored. Rename
   the root package, add a root `verify` that fans out to `web` and `db`,
   `git rm` the two files, ignore `tmp/`.

---

## WP8 — `migrate-v1-to-v2.ts` loses data silently

Only run this package if legacy course data will actually be migrated. If the
answer is no, delete the script rather than leaving a loaded gun in the repo.

- `:124` — `slug = slugify(title).slice(0,63)` with no collision handling. Two
  courses with the same first 63 characters: the second matches the duplicate
  check and is counted as `stats.skipped`, i.e. **silently dropped and reported
  as success**.
- `:88` — content only. No `users`, `memberships`, `enrollments`,
  `progress_events`, `quizzes`, `quiz_attempts`, `certificates`, `orders`.
  CLAUDE.md §6 Phase 1 promises `profiles.enrolled_courses[]` /
  `completed_lessons[]` are migrated; there is no path for them here. Cutover as
  written strands every learner.
- `:68-70` — quiz activities become empty shell lessons; no `quizzes` or
  `quiz_questions` rows are created. Silent and uncounted.
- `:126-136` — the duplicate check is skipped under `--dry-run`, so the dry run
  overstates what a real run does on a partially-migrated target. The preview is
  not faithful.
- `:159` — every course forced to `draft`; published state lost with no record.
- `:47-53` — any video URL is tagged `kind: 'youtube'` even when it came from
  `video_url`, so the player picks the wrong renderer.
- `:193` — orphan activities dropped silently, not counted, not logged.
- `:113-116` — legacy timestamps lost; tenant `name` set to the raw `company_id`.
- No `audited()` calls anywhere: a bulk import that creates tenants and courses
  writes zero audit rows.

---

## Sequencing and verification

WP1 → WP2 → WP3 → WP4 are the security spine; land them in that order, each as
its own commit with its own migration where applicable. WP5 needs WP6's test
harness to be worth doing, so do WP6.2 first if you take on WP5. WP7 is
independent and cheap — it can go first if you want a warm-up that makes
everything else easier to reason about.

After each package: `npm run verify` in **both** `web/` and `db/`, and use the
`preview_*` tools for anything observable in a browser. Report honestly — if a
step is skipped or a test fails, say so with the output.

Post a short summary per package: what changed, what it fixes, what you could
not verify from here and what the account owner needs to do in the Supabase or
Vercel dashboard.
