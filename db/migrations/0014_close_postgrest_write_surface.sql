-- Custom SQL migration file, put your code below! --

-- SECURITY (critical): any learner could promote themselves to platform_admin,
-- forge a certificate, enrol without paying, read every answer key, and write
-- forged rows into the append-only audit log — all without touching the app.
--
-- ── The hole ─────────────────────────────────────────────────────────────
--
-- 0001 did two things that combine badly. It applied ONE policy to sixteen
-- domain tables:
--
--   create policy <t>_tenant_isolation on public.<t>
--     for all to authenticated
--     using       (app_is_platform_admin() or tenant_id = app_current_tenant())
--     with check  (app_is_platform_admin() or tenant_id = app_current_tenant());
--
-- `for all`, with no predicate on WHO may write — only on WHICH TENANT's rows.
-- Then it granted the matching table privileges:
--
--   grant select, insert, update, delete on all tables in schema public
--     to authenticated;
--
-- The anon key is in the client bundle by design, and PostgREST is a public
-- endpoint on every Supabase project. So a learner holding nothing but their own
-- valid session could call the REST API directly, bypassing the app entirely:
--
--   PATCH https://<ref>.supabase.co/rest/v1/memberships?user_id=eq.<self>
--   { "role": "platform_admin" }
--
-- Both `using` and `with check` pass — it is their own tenant. `memberships` is
-- in the table list and `membership_role` includes 'platform_admin'. On the next
-- token refresh (<= 1h, autoRefreshToken) custom_access_token_hook stamps
-- platform_admin into the JWT, app_is_platform_admin() returns true everywhere,
-- and the app's own guards admit them to cross-tenant administration.
--
-- Same root cause, separately damaging:
--
--   certificates     insert a row; /verify/<code> looks up by code alone and
--                    renders it as "Valid certificate"
--   enrollments      insert a row; Stripe bypassed entirely
--   quiz_questions   select `correct` — every answer key in the tenant, which
--                    makes server-side grading pointless
--   progress_events  insert {"event_type":"completed"} — self-complete a course
--                    and trigger automatic certificate issuance
--   audit_log        insert forged entries; the hash-chain trigger dutifully
--                    chains them, indistinguishable from genuine ones
--
-- The app layer was never the problem and is unchanged by this migration: every
-- admin Server Action calls requireAdmin(), every admin page calls
-- requireAdminForSlug(slug), and authz-conventions.test.ts fails CI if a guard
-- is dropped. The hole was entirely at the database boundary.
--
-- ── Why revoking the write grants is safe ────────────────────────────────
--
-- Verified before writing this, and the whole fix rests on it: `web/src`
-- contains ZERO PostgREST data calls. Every `.from(...)` in the app is a Drizzle
-- table object, not `supabase.from(...)`. The Supabase JS client is used for
-- authentication ONLY — auth.getUser, auth.signInWithPassword, auth.signOut,
-- auth.updateUser, auth.verifyOtp, auth.admin.*. Reproduce with:
--
--   grep -rE "supabase\s*\.\s*from|\.rpc\(" web/src     # → no matches
--
-- Every read and every write in the application goes through the service-role
-- Drizzle connection (db/client.ts), which connects as the DATABASE_URL role and
-- is therefore unaffected by both RLS and these grants. Table owners bypass RLS,
-- and grants do not apply to the owner.
--
-- So nothing legitimate breaks. If a future feature genuinely needs a
-- browser-side write, it must add an explicit, narrow grant and a matching
-- policy — which is the point: that decision becomes visible in a migration
-- instead of being inherited silently by every table in the schema.
--
-- supabase_auth_admin is untouched. It holds its own `grant select on
-- public.memberships` (0002) and its own permissive read policy (0004), so the
-- access-token hook keeps working.
--
-- ── Belt and braces, deliberately ────────────────────────────────────────
--
-- Two independent layers, because either alone has a failure mode. The GRANTS
-- are what actually close the hole today. The POLICIES matter if a later
-- migration re-runs a blanket `grant ... to authenticated` (0001 shows exactly
-- how easily that happens) — with role-gated policies in place, restoring the
-- grant would no longer restore the escalation.

-- ── 1. Helper: does this enrollment belong to the caller? ────────────────
-- security definer because the policy body would otherwise re-enter
-- enrollments' own RLS, which both recurses and returns nothing useful.
create or replace function public.app_owns_enrollment(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments e
    where e.id = target
      and e.user_id = auth.uid()
      and e.tenant_id = public.app_current_tenant()
  );
$$;

revoke execute on function public.app_owns_enrollment(uuid) from anon;

-- ── 2. Split the `for all` policy into read + role-gated write ───────────
-- Read: any authenticated member of the tenant, as before.
-- Write: company_admin or platform_admin only.
--
-- `instructor` is deliberately NOT granted write here. The role exists in the
-- enum but the application gives it no write path today — isAdminRole() in
-- web/src/lib/tenant.ts admits company_admin and platform_admin only. Adding
-- instructor to this list without also building the app-side guard would grant
-- a capability nothing checks. Add it here when the product actually needs it.
--
-- Note these policies read the JWT `role` claim, which lags a demotion by up to
-- an hour. That staleness is real but no longer load-bearing: the grants below
-- remove the write privilege outright, so the policy is the second line, not the
-- first. The app-side equivalent is fixed separately in web/src/lib/tenant.ts.
do $$
declare
  t text;
  domain_tables text[] := array[
    'memberships','courses','sections','lessons','lesson_assets',
    'enrollments','quizzes','quiz_questions','quiz_attempts','quiz_answers',
    'certificate_templates','certificates','xapi_statements',
    'subscriptions','orders','payouts'
  ];
begin
  foreach t in array domain_tables loop
    -- Retire the over-broad policy.
    execute format('drop policy if exists %I on public.%I;', t || '_tenant_isolation', t);

    execute format('drop policy if exists %I on public.%I;', t || '_tenant_read', t);
    execute format($f$
      create policy %I on public.%I
        for select to authenticated
        using (public.app_is_platform_admin() or tenant_id = public.app_current_tenant());
    $f$, t || '_tenant_read', t);

    execute format('drop policy if exists %I on public.%I;', t || '_admin_insert', t);
    execute format($f$
      create policy %I on public.%I
        for insert to authenticated
        with check (
          public.app_is_platform_admin()
          or (public.app_current_role() = 'company_admin'
              and tenant_id = public.app_current_tenant())
        );
    $f$, t || '_admin_insert', t);

    execute format('drop policy if exists %I on public.%I;', t || '_admin_update', t);
    execute format($f$
      create policy %I on public.%I
        for update to authenticated
        using (
          public.app_is_platform_admin()
          or (public.app_current_role() = 'company_admin'
              and tenant_id = public.app_current_tenant())
        )
        with check (
          public.app_is_platform_admin()
          or (public.app_current_role() = 'company_admin'
              and tenant_id = public.app_current_tenant())
        );
    $f$, t || '_admin_update', t);

    execute format('drop policy if exists %I on public.%I;', t || '_admin_delete', t);
    execute format($f$
      create policy %I on public.%I
        for delete to authenticated
        using (
          public.app_is_platform_admin()
          or (public.app_current_role() = 'company_admin'
              and tenant_id = public.app_current_tenant())
        );
    $f$, t || '_admin_delete', t);
  end loop;
end $$;

-- ── 3. progress_events: an event must be about the caller's own enrolment ─
--
-- Honest note on what this does and does not achieve. The listed attack —
-- insert {"event_type":"completed"} to self-complete a course and trigger a
-- certificate — is NOT closed by an ownership check, because the attacker's
-- enrolment is their own. Ownership only stops a learner writing events onto
-- SOMEONE ELSE's enrolment (falsifying another learner's training record, which
-- for accredited training is its own serious problem).
--
-- What closes the self-completion attack is the revoke in section 6: the
-- `authenticated` role loses INSERT on this table altogether, and the only
-- writer left is recordVideoProgress / markLessonComplete over the service-role
-- connection, which grade and gate server-side.
--
-- Both are applied. This policy is what remains if the grant is ever restored.
drop policy if exists progress_events_insert on public.progress_events;
create policy progress_events_insert on public.progress_events
  for insert to authenticated
  with check (
    tenant_id = public.app_current_tenant()
    and public.app_owns_enrollment(enrollment_id)
  );

-- ── 4. audit_log: no insert path for `authenticated` at all ──────────────
-- db/audit.ts writes over the RLS-bypassing service connection, so this policy
-- never served a legitimate caller — it only let a learner forge entries that
-- the hash-chain trigger would then chain as if genuine, which is strictly worse
-- than having no log. Dropped outright rather than narrowed: there is no
-- browser-side audit write, and there should never be one.
drop policy if exists audit_log_insert on public.audit_log;

-- ── 5. quiz_questions.correct is not readable by learners ────────────────
--
-- Postgres note that makes this less obvious than it looks: a table-level SELECT
-- grant confers SELECT on every column, and a column-level REVOKE cannot carve
-- an exception out of it. The only way to restrict a column is to drop the
-- table-level grant and re-grant the permitted columns individually.
--
-- Nothing in the app reads this table over PostgREST — the quiz player and the
-- grader both go through Drizzle — so no view is needed to keep anything
-- working. Adding one would be unused surface area. If a browser-side quiz
-- renderer is ever built, give it a view over the columns below rather than
-- restoring the table grant.
revoke select on public.quiz_questions from authenticated;
grant select (id, tenant_id, quiz_id, position, type, prompt, options, points)
  on public.quiz_questions to authenticated;

-- ── 6. Remove the write surface ──────────────────────────────────────────
-- The blanket grant in 0001 is what turned a permissive policy into a
-- privilege-escalation primitive. `authenticated` keeps SELECT (still filtered
-- by the read policies above) and loses every write.
revoke insert, update, delete on all tables in schema public from authenticated;

-- Sequences: no write path remains, so the usage grant would be vestigial.
revoke all on all sequences in schema public from authenticated;
grant select, usage on all sequences in schema public to service_role;

-- 0001 also set DEFAULT PRIVILEGES, so every table created afterwards inherited
-- the same writable grant automatically. Reset that, or the next `drizzle-kit
-- generate` silently reopens the hole on any new table.
alter default privileges in schema public
  revoke insert, update, delete on tables from authenticated;
alter default privileges in schema public
  grant select on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;

-- service_role is unchanged and still holds everything; restated so the intent
-- survives anyone reading this migration in isolation.
grant all on all tables in schema public to service_role;
