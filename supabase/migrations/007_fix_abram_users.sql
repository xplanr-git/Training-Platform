-- ============================================================
-- 007_fix_abram_users.sql
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Fixes login for:
--   1. abram.jamorabo@outdure.com (platform_admin)
--   2. aljamorabo@gmail.com       (company_admin)
--
-- Sets password to: 'outdure'
-- Auto-confirms email.
-- Ensures profile exists.
-- ============================================================

create extension if not exists pgcrypto;

do $$
declare
  v_instance_id uuid;
  v_user_id uuid;
  v_email text;
  v_name text;
  v_company text;
  v_role text;
begin
  -- 1. Get instance_id (fallback to 0000... if empty)
  select instance_id into v_instance_id from auth.users limit 1;
  if v_instance_id is null then
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  end if;

  -- ─────────────────────────────────────────────────────────────
  -- User 1: abram.jamorabo@outdure.com (Platform Admin)
  -- ─────────────────────────────────────────────────────────────
  v_email   := 'abram.jamorabo@outdure.com';
  v_name    := 'Abram Jamorabo';
  v_company := 'Outdure';
  v_role    := 'platform_admin';

  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      v_user_id, v_instance_id,
      'authenticated', 'authenticated',
      v_email,
      crypt('outdure', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', v_name, 'company', v_company, 'role', v_role),
      now(), now()
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', v_email,
      now(), now(), now()
    );
  else
    update auth.users
    set
      encrypted_password = crypt('outdure', gen_salt('bf')),
      email_confirmed_at = now(),
      raw_user_meta_data = jsonb_build_object('name', v_name, 'company', v_company, 'role', v_role),
      updated_at = now()
    where id = v_user_id;
  end if;

  -- Upsert profile
  insert into public.profiles (id, name, company, role, enrolled_courses, completed_lessons)
  values (v_user_id, v_name, v_company, v_role, '{}', '{}')
  on conflict (id) do update
  set role = v_role, company = v_company;


  -- ─────────────────────────────────────────────────────────────
  -- User 2: aljamorabo@gmail.com (Company Admin)
  -- ─────────────────────────────────────────────────────────────
  v_email   := 'aljamorabo@gmail.com';
  v_name    := 'Al Jamorabo';
  v_company := 'Mock Company';
  v_role    := 'company_admin';
  v_user_id := null; -- reset

  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      v_user_id, v_instance_id,
      'authenticated', 'authenticated',
      v_email,
      crypt('outdure', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', v_name, 'company', v_company, 'role', v_role),
      now(), now()
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', v_email,
      now(), now(), now()
    );
  else
    update auth.users
    set
      encrypted_password = crypt('outdure', gen_salt('bf')),
      email_confirmed_at = now(),
      raw_user_meta_data = jsonb_build_object('name', v_name, 'company', v_company, 'role', v_role),
      updated_at = now()
    where id = v_user_id;
  end if;

  -- Upsert profile
  insert into public.profiles (id, name, company, role, enrolled_courses, completed_lessons)
  values (v_user_id, v_name, v_company, v_role, '{}', '{}')
  on conflict (id) do update
  set role = v_role, company = v_company;

end;
$$;