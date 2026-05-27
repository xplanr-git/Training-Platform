-- 009_kv_store_frontend_access.sql
--
-- The kv_store_d60f2898 table was created by edge functions using the
-- service-role key, so no grants were issued to the authenticated role.
-- Every frontend write silently failed and every read returned nothing.
--
-- This migration grants authenticated users full CRUD access so the React
-- frontend can persist segments, scheduled reports, leads, tags, groups,
-- fields, and approvals directly via the Supabase client.

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.kv_store_d60f2898 to authenticated;

alter table public.kv_store_d60f2898 enable row level security;

drop policy if exists "authenticated_full_access" on public.kv_store_d60f2898;

create policy "authenticated_full_access" on public.kv_store_d60f2898 for all to authenticated using (true) with check (true);
