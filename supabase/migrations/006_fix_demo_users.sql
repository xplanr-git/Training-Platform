-- ============================================================
-- 006_fix_demo_users.sql
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
--
-- Fixes "Invalid login credentials" by forcefully ensuring the
-- demo accounts exist, have the correct password ('outdure'),
-- and have their emails confirmed.
--
-- Accounts fixed:
--   1. curtis@outdure.com (platform_admin)
--   2. admin@democompany.com (company_admin)
-- ============================================================

-- Ensure pgcrypto is available for password hashing
create extension if not exists pgcrypto;

do $$
declare
  v_instance_id uuid;
  v_curtis_id uuid;
  v_demo_id uuid;
begin
  -- 1. Attempt to find the correct instance_id
  --    (Defaults to the standard local dev ID if table is empty)
  select instance_id into v_instance_id from auth.users limit 1;
  if v_instance_id is null then
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  end if;

  -- ─────────────────────────────────────────────────────────────
  -- User 1: Curtis (Platform Admin)
  -- ─────────────────────────────────────────────────────────────
  select id into v_curtis_id from auth.users where email = 'curtis@outdure.com';

  if v_curtis_id is null then
    v_curtis_id := gen_random_uuid();
    
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      v_curtis_id, v_instance_id,
      'authenticated', 'authenticated',
      'curtis@outdure.com',
      crypt('outdure', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Curtis","company":"Outdure","role":"platform_admin"}',
      now(), now()
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_curtis_id,
      jsonb_build_object('sub', v_curtis_id::text, 'email', 'curtis@outdure.com'),
      'email', 'curtis@outdure.com',
      now(), now(), now()
    );
  else
    -- Update existing
    update auth.users
    set
      encrypted_password = crypt('outdure', gen_salt('bf')),
      email_confirmed_at = now(),
      raw_user_meta_data = '{"name":"Curtis","company":"Outdure","role":"platform_admin"}'::jsonb,
      updated_at = now()
    where id = v_curtis_id;
  end if;

  -- Upsert profile for Curtis
  insert into public.profiles (id, name, company, role, enrolled_courses, completed_lessons)
  values (v_curtis_id, 'Curtis', 'Outdure', 'platform_admin', '{}', '{}')
  on conflict (id) do update
  set role = 'platform_admin', company = 'Outdure';


  -- ─────────────────────────────────────────────────────────────
  -- User 2: Demo Admin (Company Admin)
  -- ─────────────────────────────────────────────────────────────
  select id into v_demo_id from auth.users where email = 'admin@democompany.com';

  if v_demo_id is null then
    v_demo_id := gen_random_uuid();
    
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      v_demo_id, v_instance_id,
      'authenticated', 'authenticated',
      'admin@democompany.com',
      crypt('outdure', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Demo Admin","company":"Demo Company","role":"company_admin"}',
      now(), now()
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_demo_id,
      jsonb_build_object('sub', v_demo_id::text, 'email', 'admin@democompany.com'),
      'email', 'admin@democompany.com',
      now(), now(), now()
    );
  else
    -- Update existing
    update auth.users
    set
      encrypted_password = crypt('outdure', gen_salt('bf')),
      email_confirmed_at = now(),
      raw_user_meta_data = '{"name":"Demo Admin","company":"Demo Company","role":"company_admin"}'::jsonb,
      updated_at = now()
    where id = v_demo_id;
  end if;

  -- Upsert profile for Demo Admin
  insert into public.profiles (id, name, company, role, enrolled_courses, completed_lessons)
  values (v_demo_id, 'Demo Admin', 'Demo Company', 'company_admin', '{}', '{}')
  on conflict (id) do update
  set role = 'company_admin', company = 'Demo Company';

end;
$$;