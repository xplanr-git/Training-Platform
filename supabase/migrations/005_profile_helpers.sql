-- ============================================================
-- 005_profile_helpers.sql
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Fixes "new row violates row-level security policy for table
-- 'profiles'" that occurs when a user exists in Auth but has no
-- profiles row and the app tries to auto-provision one.
--
-- Root cause: migration 002 created SELECT + UPDATE policies
-- but never created an INSERT policy, so all client-side
-- INSERTs are denied by default (RLS deny-by-default).
--
-- This migration adds three things:
--   1. An explicit INSERT policy so authenticated users can
--      create their own profiles row.
--   2. A SECURITY DEFINER RPC function the client calls —
--      it bypasses RLS entirely and is the primary path used
--      by auth.ts for reliable profile creation.
--   3. A trigger on auth.users that auto-provisions a profiles
--      row the moment any new auth user is created, so this
--      problem can never happen again for new signups.
-- ============================================================


-- ── 1. INSERT POLICY ─────────────────────────────────────────
-- Allow an authenticated user to insert exactly their own row.

drop policy if exists "users_insert_own" on profiles;

create policy "users_insert_own"
  on profiles for insert
  with check (auth.uid() = id);


-- ── 2. SECURITY DEFINER RPC ──────────────────────────────────
-- Called by auth.ts instead of a direct INSERT so RLS can
-- never block profile creation for the authenticated user.

create or replace function public.create_user_profile(
  p_id      uuid,
  p_name    text,
  p_company text default '',
  p_role    text default 'employee'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Safety: callers can only create their own profile
  if auth.uid() is distinct from p_id then
    raise exception 'Forbidden: cannot create a profile for another user';
  end if;

  -- Clamp role to the allowed set
  if p_role not in ('platform_admin', 'company_admin', 'employee') then
    p_role := 'employee';
  end if;

  insert into public.profiles (id, name, company, role, enrolled_courses, completed_lessons)
  values (p_id, p_name, p_company, p_role, '{}', '{}')
  on conflict (id) do nothing;
end;
$$;


-- ── 3. TRIGGER: auto-provision on new auth user ───────────────
-- Runs as the DB owner (SECURITY DEFINER) so it bypasses RLS.
-- Fires for every new row in auth.users — covers Dashboard
-- signups, signUp() calls, and any other creation path.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text;
  v_company text;
  v_role    text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'),       ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'),  ''),
    split_part(new.email, '@', 1)
  );

  v_company := coalesce(nullif(trim(new.raw_user_meta_data->>'company'), ''), '');

  v_role := case
    when new.raw_user_meta_data->>'role' in ('platform_admin', 'company_admin', 'employee')
    then new.raw_user_meta_data->>'role'
    else 'employee'
  end;

  insert into public.profiles (id, name, company, role, enrolled_courses, completed_lessons)
  values (new.id, v_name, v_company, v_role, '{}', '{}')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- ── 4. BACKFILL: existing auth users with no profile row ─────
-- One-time fix for users already in Auth who are missing a row.

insert into public.profiles (id, name, company, role, enrolled_courses, completed_lessons)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'name'),      ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(u.email, '@', 1)
  )                                                   as name,
  coalesce(nullif(trim(u.raw_user_meta_data->>'company'), ''), '') as company,
  case
    when u.raw_user_meta_data->>'role' in ('platform_admin', 'company_admin', 'employee')
    then u.raw_user_meta_data->>'role'
    else 'employee'
  end                                                 as role,
  '{}'                                                as enrolled_courses,
  '{}'                                                as completed_lessons
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- ── Done ──────────────────────────────────────────────────────
-- Verify with:
--   select count(*) from auth.users;
--   select count(*) from profiles;
-- Both counts should match.
-- ============================================================
