-- 009_kv_store_frontend_access.sql
--
-- The kv_store_d60f2898 table was created by the edge functions using the
-- service-role key, so no grants were issued to the anon / authenticated
-- roles.  This migration grants authenticated users full CRUD access so
-- the React frontend can persist data (segments, scheduled reports, leads,
-- tags, groups, fields, approvals) directly via the Supabase client.
--
-- RLS is enabled with a single permissive policy for authenticated users.
-- Logical data isolation is handled by the key-naming convention:
--   {entity}:{companyId}:{id}

-- 1. Explicit GRANT so PostgREST will expose the table to these roles
grant usage  on schema public                to authenticated;
grant select, insert, update, delete
             on public.kv_store_d60f2898    to authenticated;

-- 2. Enable RLS (no-op if already enabled)
alter table public.kv_store_d60f2898 enable row level security;

-- 3. Drop stale policies if any
drop policy if exists "authenticated_full_access"  on public.kv_store_d60f2898;
drop policy if exists "service_role_full_access"   on public.kv_store_d60f2898;

-- 4. Allow any signed-in user to read/write
create policy "authenticated_full_access"
  on public.kv_store_d60f2898
  for all
  to authenticated
  using (true)
  with check (true);
