-- Custom SQL migration file, put your code below! --

-- Supabase Custom Access Token Hook.
-- Injects `tenant_id` and `role` into the JWT claims at token issuance so RLS
-- can tenant-scope without reading any table per request (CLAUDE.md §4 #4).
--
-- After applying, enable it in Supabase: Authentication → Hooks →
-- "Customize Access Token (JWT) Claims" → public.custom_access_token_hook.
--
-- Tenant selection: a user may belong to several tenants (memberships). At MVP
-- the token carries the most-recent ACTIVE membership as the primary tenant.
-- Multi-tenant switching (re-issuing the token for another tenant) is post-MVP.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  uid uuid := (event ->> 'user_id')::uuid;
  m_tenant uuid;
  m_role text;
begin
  claims := coalesce(event -> 'claims', '{}'::jsonb);

  select tenant_id, role::text
    into m_tenant, m_role
  from public.memberships
  where user_id = uid
    and status = 'active'
  order by created_at desc
  limit 1;

  if m_tenant is not null then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(m_tenant::text));
    claims := jsonb_set(claims, '{role}', to_jsonb(m_role));
  else
    -- No active membership: ensure no stale scoping claims linger.
    claims := claims - 'tenant_id';
    claims := jsonb_set(claims, '{role}', to_jsonb('learner'::text));
  end if;

  return jsonb_set(event, '{claims}', claims);
end $$;

-- Only the auth admin (which runs the hook) may execute it.
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- The hook reads memberships; let the auth admin bypass RLS for that read.
grant usage on schema public to supabase_auth_admin;
grant select on public.memberships to supabase_auth_admin;
