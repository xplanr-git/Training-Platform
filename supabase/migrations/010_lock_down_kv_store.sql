-- 010_lock_down_kv_store.sql
--
-- SECURITY FIX. Migration 009 granted every authenticated user unrestricted
-- read/write on kv_store_d60f2898 with a `using (true)` policy. The frontend
-- stores per-tenant data under keys of the form `{feature}:{companyId}:{id}`
-- (tags, analytics-segment, scheduled-report, lead, user-field, user-group,
-- approval, platform_user_added/deleted). The blanket policy therefore let any
-- authenticated user of one tenant read and overwrite every other tenant's data.
--
-- This migration replaces that policy with tenant-scoped access:
--   * platform_admin  -> full access to every key
--   * company_admin   -> only keys whose companyId segment is their own company
--   * everyone else   -> no access
--
-- Keys written by edge functions with the service-role key (user:, admin:,
-- company:, course:, course-section:, course-activity:, website-config:,
-- website-settings:, course-player-settings:, course-video-library:) bypass RLS
-- and are unaffected.

-- Helper: may the current caller act on the given KV key?
-- companyId is the second colon-delimited segment of the key.
create or replace function public.kv_can_access(k text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    get_my_role() = 'platform_admin'
    or (
      get_my_role() = 'company_admin'
      and split_part(k, ':', 2) = get_my_company()
    );
$$;

alter table public.kv_store_d60f2898 enable row level security;

-- Remove the insecure blanket policy from migration 009.
drop policy if exists "authenticated_full_access" on public.kv_store_d60f2898;

create policy "kv_tenant_scoped_select" on public.kv_store_d60f2898
  for select to authenticated
  using (public.kv_can_access(key));

create policy "kv_tenant_scoped_insert" on public.kv_store_d60f2898
  for insert to authenticated
  with check (public.kv_can_access(key));

create policy "kv_tenant_scoped_update" on public.kv_store_d60f2898
  for update to authenticated
  using (public.kv_can_access(key))
  with check (public.kv_can_access(key));

create policy "kv_tenant_scoped_delete" on public.kv_store_d60f2898
  for delete to authenticated
  using (public.kv_can_access(key));
