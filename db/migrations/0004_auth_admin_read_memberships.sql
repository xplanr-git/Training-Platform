-- Custom SQL migration file, put your code below! --

-- The Custom Access Token Hook runs as the `supabase_auth_admin` role, which is
-- subject to RLS on public.memberships. Without a policy for that role, the
-- hook's membership lookup returns zero rows and every token falls back to
-- role=learner with no tenant_id. This permissive SELECT policy lets the auth
-- admin read memberships during token issuance (Supabase-documented pattern for
-- table-backed access token hooks).

drop policy if exists "auth_admin_read_memberships" on public.memberships;
create policy "auth_admin_read_memberships" on public.memberships
  as permissive for select to supabase_auth_admin
  using (true);
