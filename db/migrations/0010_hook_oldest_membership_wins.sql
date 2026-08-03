-- Custom SQL migration file, put your code below! --

-- SECURITY: close cross-tenant account capture through an unsolicited invite.
--
-- inviteMember creates a membership for ANY email address with no consent from
-- the account owner. Combined with `order by created_at desc`, that let a
-- company_admin of tenant B re-point an existing user's session:
--
--   1. B's admin invites victim@other-academy.com. A membership row is created
--      immediately -- no acceptance required.
--   2. That row is now the NEWEST membership for the victim.
--   3. On the victim's next access-token refresh (autoRefreshToken, <= 1h) the
--      hook stamps tenant_id = B and role = whatever B's admin chose.
--   4. Every server-side check reads that claim -- getTenantContext ->
--      requireAdmin / requireAdminForSlug / postSignInDestination -- so the
--      victim signs in at their own URL and is delivered, authenticated, into
--      an academy whose content B controls, served from the trusted origin.
--
-- The single change is `created_at desc` -> `created_at asc`: the user's
-- ESTABLISHED membership wins, so a freshly injected row can never displace it.
-- Ordering by the oldest is not arbitrary -- first membership means the academy
-- the user actually joined.
--
-- 'invited' must stay in the filter. Removing it re-breaks invite onboarding
-- entirely (that was the bug 0007 fixed): nothing flips a membership to
-- 'active' until first sign-in, so an invitee would have no tenant claim and
-- could not enrol or reach their dashboard.
--
-- REMAINING GAP, deliberately not closed here: a brand-new user whose only
-- membership is the unsolicited invite is still scoped to it -- indistinguishable
-- from a legitimate first invite without an acceptance state on the row. Closing
-- that needs a `pending_acceptance` status that only the invitee can promote,
-- plus rejecting setMemberStatus('active') on a never-accepted membership. This
-- migration stops capture of EXISTING accounts, which is the damaging case.

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
  -- An active membership still beats a merely invited one. Within a status the
  -- OLDEST wins, so a newly created row cannot take over an existing session.
  order by (status = 'active') desc, created_at asc
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
