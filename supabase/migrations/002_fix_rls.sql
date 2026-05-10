-- ============================================================
-- Fix: infinite recursion in profiles RLS policies
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Root cause: the "Platform admins can view all profiles" policy
-- ran  SELECT ... FROM profiles  while evaluating a policy ON
-- profiles — causing infinite recursion.
--
-- Fix: a SECURITY DEFINER function reads the role as the DB owner
-- (bypassing RLS entirely), so no recursion is possible.
-- ============================================================

-- 1. Drop all existing policies so we start clean
drop policy if exists "Users can view own profile"              on profiles;
drop policy if exists "Users can update own profile"            on profiles;
drop policy if exists "Platform admins can view all profiles"   on profiles;

-- 2. Security-definer helper — runs as DB owner, never triggers RLS
create or replace function get_my_role()
returns text
language sql
stable
security definer        -- <-- key: bypasses RLS, no recursion
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- 3. Recreate policies using the helper function

-- Every user can read their own row
create policy "users_read_own"
  on profiles for select
  using (auth.uid() = id);

-- Every user can update their own row
create policy "users_update_own"
  on profiles for update
  using (auth.uid() = id);

-- Platform admins can read ALL rows (uses helper — no recursion)
create policy "platform_admins_read_all"
  on profiles for select
  using (get_my_role() = 'platform_admin');

-- ============================================================
-- Verify: run this to confirm no recursion
-- ============================================================
-- select id, name, role from profiles;
-- ============================================================
