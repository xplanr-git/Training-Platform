-- Custom SQL migration file, put your code below! --

-- v2 security layer: JWT helpers, RLS policies, seed system roles, and the
-- append-only + hash-chain enforcement for progress_events and audit_log.
-- Applied to the fresh v2 Supabase project after 0000_v2_initial.sql.

create extension if not exists pgcrypto with schema extensions;

-- ── JWT claim helpers ────────────────────────────────────────────────────
-- The Custom Access Token Hook (see migration 0002) injects `tenant_id` and
-- `role` into the JWT. These read them without touching any table (no recursion).

create or replace function public.app_current_tenant()
returns uuid language sql stable as $$
  select nullif(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'tenant_id',
    ''
  )::uuid;
$$;

create or replace function public.app_current_role()
returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
$$;

create or replace function public.app_is_platform_admin()
returns boolean language sql stable as $$
  select public.app_current_role() = 'platform_admin';
$$;

-- True when the given user shares any tenant with the caller.
create or replace function public.app_shares_tenant(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from memberships m_self
    join memberships m_other on m_other.tenant_id = m_self.tenant_id
    where m_self.user_id = auth.uid()
      and m_other.user_id = target
  );
$$;

-- ── Standard tenant-isolation policy for every domain table ──────────────
-- A caller may touch a row iff they are a platform admin or the row's tenant
-- matches their JWT tenant claim.
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
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_tenant_isolation', t);
    execute format($f$
      create policy %I on public.%I
        for all to authenticated
        using (public.app_is_platform_admin() or tenant_id = public.app_current_tenant())
        with check (public.app_is_platform_admin() or tenant_id = public.app_current_tenant());
    $f$, t || '_tenant_isolation', t);
  end loop;
end $$;

-- ── users ────────────────────────────────────────────────────────────────
alter table public.users enable row level security;

drop policy if exists users_self on public.users;
create policy users_self on public.users
  for all to authenticated
  using (id = auth.uid() or public.app_is_platform_admin())
  with check (id = auth.uid() or public.app_is_platform_admin());

drop policy if exists users_shared_tenant_read on public.users;
create policy users_shared_tenant_read on public.users
  for select to authenticated
  using (public.app_shares_tenant(id));

-- ── tenants ──────────────────────────────────────────────────────────────
alter table public.tenants enable row level security;

drop policy if exists tenants_member_read on public.tenants;
create policy tenants_member_read on public.tenants
  for select to authenticated
  using (
    public.app_is_platform_admin()
    or id = public.app_current_tenant()
  );

drop policy if exists tenants_admin_update on public.tenants;
create policy tenants_admin_update on public.tenants
  for update to authenticated
  using (
    public.app_is_platform_admin()
    or (public.app_current_role() = 'company_admin' and id = public.app_current_tenant())
  )
  with check (
    public.app_is_platform_admin()
    or (public.app_current_role() = 'company_admin' and id = public.app_current_tenant())
  );

drop policy if exists tenants_platform_write on public.tenants;
create policy tenants_platform_write on public.tenants
  for all to authenticated
  using (public.app_is_platform_admin())
  with check (public.app_is_platform_admin());

-- ── roles & permissions ──────────────────────────────────────────────────
alter table public.roles enable row level security;

drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles
  for select to authenticated
  using (is_system or tenant_id = public.app_current_tenant() or public.app_is_platform_admin());

drop policy if exists roles_tenant_write on public.roles;
create policy roles_tenant_write on public.roles
  for all to authenticated
  using (
    public.app_is_platform_admin()
    or (public.app_current_role() = 'company_admin' and tenant_id = public.app_current_tenant())
  )
  with check (
    public.app_is_platform_admin()
    or (public.app_current_role() = 'company_admin' and tenant_id = public.app_current_tenant())
  );

alter table public.permissions enable row level security;

drop policy if exists permissions_read on public.permissions;
create policy permissions_read on public.permissions
  for select to authenticated using (true);

drop policy if exists permissions_platform_write on public.permissions;
create policy permissions_platform_write on public.permissions
  for all to authenticated
  using (public.app_is_platform_admin())
  with check (public.app_is_platform_admin());

-- ── progress_events: append-only ─────────────────────────────────────────
alter table public.progress_events enable row level security;

drop policy if exists progress_events_read on public.progress_events;
create policy progress_events_read on public.progress_events
  for select to authenticated
  using (public.app_is_platform_admin() or tenant_id = public.app_current_tenant());

drop policy if exists progress_events_insert on public.progress_events;
create policy progress_events_insert on public.progress_events
  for insert to authenticated
  with check (public.app_is_platform_admin() or tenant_id = public.app_current_tenant());
-- No UPDATE/DELETE policy → denied by default. Trigger below is belt-and-suspenders.

create or replace function public.forbid_mutation()
returns trigger language plpgsql as $$
begin
  raise exception '% is append-only; % is not permitted', TG_TABLE_NAME, TG_OP;
end $$;

drop trigger if exists progress_events_no_update on public.progress_events;
create trigger progress_events_no_update
  before update or delete on public.progress_events
  for each row execute function public.forbid_mutation();

-- ── audit_log: append-only + hash chain ──────────────────────────────────
alter table public.audit_log enable row level security;

drop policy if exists audit_log_read on public.audit_log;
create policy audit_log_read on public.audit_log
  for select to authenticated
  using (public.app_is_platform_admin() or tenant_id = public.app_current_tenant());

drop policy if exists audit_log_insert on public.audit_log;
create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (public.app_is_platform_admin() or tenant_id = public.app_current_tenant());

-- Computes the tamper-evident chain: hash = sha256(prev_hash || canonical row).
-- Chain is per-tenant. The app never sets hash/prev_hash; the trigger owns them.
create or replace function public.audit_log_hash_chain()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  prev text;
  canonical text;
begin
  select a.hash into prev
  from audit_log a
  where a.tenant_id is not distinct from NEW.tenant_id
  order by a.occurred_at desc, a.id desc
  limit 1;

  NEW.prev_hash := prev;
  canonical := coalesce(prev, '')
    || coalesce(NEW.tenant_id::text, '')
    || coalesce(NEW.actor_user_id::text, '')
    || NEW.action
    || NEW.resource_type
    || coalesce(NEW.resource_id, '')
    || coalesce(NEW.before::text, '')
    || coalesce(NEW.after::text, '')
    || coalesce(NEW.occurred_at::text, now()::text);

  NEW.hash := encode(digest(canonical, 'sha256'), 'hex');
  return NEW;
end $$;

drop trigger if exists audit_log_set_hash on public.audit_log;
create trigger audit_log_set_hash
  before insert on public.audit_log
  for each row execute function public.audit_log_hash_chain();

drop trigger if exists audit_log_no_update on public.audit_log;
create trigger audit_log_no_update
  before update or delete on public.audit_log
  for each row execute function public.forbid_mutation();

-- ── Table privileges ─────────────────────────────────────────────────────
-- RLS filters rows, but the role still needs table-level privileges to reach
-- it. Tables created via raw SQL don't inherit these automatically, so grant
-- them explicitly. Append-only violations on progress_events/audit_log are
-- still blocked by their triggers and the absence of UPDATE/DELETE policies.
grant usage on schema public to authenticated, anon, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;

-- ── Seed system roles ────────────────────────────────────────────────────
insert into public.roles (tenant_id, name, is_system)
values (null, 'platform_admin', true),
       (null, 'company_admin', true),
       (null, 'instructor', true),
       (null, 'learner', true)
on conflict do nothing;
