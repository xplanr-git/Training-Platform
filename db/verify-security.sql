-- Re-runnable security check for the v2 database. SAFE ON PRODUCTION.
--
-- Run it after any migration, or whenever you want evidence rather than
-- assurance:
--
--   psql "$DATABASE_URL" -f db/verify-security.sql
--
-- WHY THIS EXISTS, AND HOW IT DIFFERS FROM tests/live/rls-attacks.spec.ts.
--
-- That Playwright suite attacks PostgREST with a real learner session, which is
-- the most faithful reproduction of the threat — and precisely because it holds
-- a session and WRITES, it refuses to run against the project the app uses. It
-- needs a disposable Supabase project, which is an outstanding task (DEPLOY.md).
-- Until that exists it runs nowhere, so the strongest claim in §4 had no
-- evidence behind it on the database that matters.
--
-- This closes that gap from the other direction. `set local role authenticated`
-- assumes the same role PostgREST uses, so a `permission denied` here is the
-- same refusal a learner would get over HTTP. It needs no session and no
-- credentials, every statement is inside a transaction that ROLLS BACK, and the
-- last section proves nothing changed.
--
-- What it does NOT cover: the RLS POLICIES. With no JWT, app_current_tenant()
-- is null, so every policy denies by default and a pass here says nothing about
-- whether the policy predicates are right. It tests the GRANT layer — which is
-- the layer that actually closed the hole (see 0014), and the layer a future
-- blanket `grant ... to authenticated` would silently reopen.
--
-- Expected output: sections 1-6 every one an ERROR, section 7 succeeding,
-- section 8 showing the same counts you started with.

\pset pager off
\set ON_ERROR_STOP off

\echo ''
\echo '########  1. self-promotion to platform_admin  (MUST ERROR)  ########'
begin;
  set local role authenticated;
  update public.memberships set role = 'platform_admin';
rollback;

\echo '########  2. forge a certificate               (MUST ERROR)  ########'
begin;
  set local role authenticated;
  insert into public.certificates (tenant_id, enrollment_id, verification_code)
  values (gen_random_uuid(), gen_random_uuid(), 'forged-by-verify-script');
rollback;

\echo '########  3. self-enrol, bypassing Stripe      (MUST ERROR)  ########'
begin;
  set local role authenticated;
  insert into public.enrollments (tenant_id, user_id, course_id, source)
  values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'purchase');
rollback;

\echo '########  4. read the quiz answer key          (MUST ERROR)  ########'
begin;
  set local role authenticated;
  select correct from public.quiz_questions limit 1;
rollback;

\echo '########  5. self-complete a course            (MUST ERROR)  ########'
begin;
  set local role authenticated;
  insert into public.progress_events (tenant_id, enrollment_id, event_type)
  values (gen_random_uuid(), gen_random_uuid(), 'completed');
rollback;

\echo '########  6. forge an audit-log entry          (MUST ERROR)  ########'
begin;
  set local role authenticated;
  insert into public.audit_log (tenant_id, action, resource_type, hash)
  values (gen_random_uuid(), 'forged', 'membership', '');
rollback;

\echo ''
\echo '########  7. CONTROL — permitted reads still work  (MUST SUCCEED)  ########'
-- Without this the whole file would also "pass" if SELECT had been revoked
-- wholesale, which is a different and app-breaking outcome. count(*) needs no
-- particular column, so it succeeds while section 4 is denied — which is what
-- proves the restriction is on the `correct` COLUMN and not the table.
begin;
  set local role authenticated;
  select count(*) as quiz_questions_readable from public.quiz_questions;
rollback;

\echo ''
\echo '########  8. append-only enforcement  (first two MUST ERROR)  ########'
begin;
  update public.audit_log set action = 'nope' where seq = (select min(seq) from public.audit_log);
rollback;
begin;
  truncate public.audit_log;
rollback;

\echo ''
\echo '########  9. audit chain integrity, per tenant  ########'
-- No rows at all = every chain intact and fully verified.
-- Rows saying "hash_version 1 predates migration 0015" are EXPECTED and fine:
-- those were written by the old algorithm and are reported as unverifiable
-- rather than as tampered, deliberately.
-- Anything saying "broken link" or "do not match its hash" is a REAL finding.
select coalesce(
         case
           when problem like 'broken link%'            then 'BROKEN LINK — investigate'
           when problem like '%do not match its hash%' then 'CONTENT MISMATCH — investigate'
           when problem like '%not verifiable%'        then 'legacy v1, unverifiable (expected)'
         end, problem) as finding,
       count(*)
from (select id from public.tenants) t,
     lateral public.verify_audit_chain(t.id)
group by 1 order by 2 desc;

\echo ''
\echo '########  10. nothing above changed anything  ########'
select (select count(*) from public.audit_log)       as audit_rows,
       (select count(*) from public.courses)         as courses,
       (select count(*) from public.enrollments)     as enrollments,
       (select count(*) from public.progress_events) as progress_events;
