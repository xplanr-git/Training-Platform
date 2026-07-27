-- Custom SQL migration file, put your code below! --

-- FIX: invited learners had no tenant claim, so they could not enrol or reach
-- their dashboard — the whole invite-based onboarding path was dead.
--
-- The hook previously required status = 'active', but nothing ever flipped a
-- membership from 'invited' to 'active'. An invited user can only obtain a
-- session by proving control of the invited email address (accepting the
-- invite / setting a password), so an invited membership is safe to scope on.
-- 'deactivated' remains excluded. An 'active' membership still wins when a
-- user holds several.

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
    and status in ('active', 'invited')
  order by (status = 'active') desc, created_at desc
  limit 1;

  if m_tenant is not null then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(m_tenant::text));
    claims := jsonb_set(claims, '{role}', to_jsonb(m_role));
  else
    -- No usable membership: ensure no stale scoping claims linger.
    claims := claims - 'tenant_id';
    claims := jsonb_set(claims, '{role}', to_jsonb('learner'::text));
  end if;

  return jsonb_set(event, '{claims}', claims);
end $$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
