-- ============================================================
-- Teachly — Profiles table + RLS + Demo users
-- Paste the ENTIRE file into Supabase SQL Editor → Run
-- ============================================================


-- ── 1. PROFILES TABLE ────────────────────────────────────────

create table if not exists profiles (
  id                uuid        primary key references auth.users(id) on delete cascade,
  name              text        not null,
  company           text        not null default '',
  role              text        not null default 'employee'
                                check (role in ('platform_admin', 'company_admin', 'employee')),
  enrolled_courses  text[]      not null default '{}',
  completed_lessons text[]      not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();


-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────

alter table profiles enable row level security;

drop policy if exists "Users can view own profile"             on profiles;
drop policy if exists "Users can update own profile"           on profiles;
drop policy if exists "Platform admins can view all profiles"  on profiles;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Platform admins can view all profiles"
  on profiles for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'platform_admin'
    )
  );


-- ── 3. DEMO USER: curtis@outdure.com (platform_admin) ─────────

do $$
declare
  v_id uuid;
begin
  -- Reuse existing user if already created
  select id into v_id from auth.users where email = 'curtis@outdure.com';

  if v_id is null then
    v_id := gen_random_uuid();

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      v_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'curtis@outdure.com',
      crypt('outdure', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', ''
    );

    -- Identity row is required — without it login always fails
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id,
      jsonb_build_object('sub', v_id::text, 'email', 'curtis@outdure.com'),
      'email', 'curtis@outdure.com',
      now(), now(), now()
    );
  end if;

  insert into profiles (id, name, company, role)
  values (v_id, 'Curtis', 'Outdure', 'platform_admin')
  on conflict (id) do update
    set name = excluded.name, company = excluded.company, role = excluded.role;
end;
$$;


-- ── 4. DEMO USER: admin@democompany.com (company_admin) ───────

do $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = 'admin@democompany.com';

  if v_id is null then
    v_id := gen_random_uuid();

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      v_id, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin@democompany.com',
      crypt('outdure', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id,
      jsonb_build_object('sub', v_id::text, 'email', 'admin@democompany.com'),
      'email', 'admin@democompany.com',
      now(), now(), now()
    );
  end if;

  insert into profiles (id, name, company, role)
  values (v_id, 'Demo Admin', 'Demo Company', 'company_admin')
  on conflict (id) do update
    set name = excluded.name, company = excluded.company, role = excluded.role;
end;
$$;


-- ── 5. VERIFY (uncomment and run after the above succeeds) ────
-- select u.email, p.name, p.company, p.role,
--        (select count(*) from auth.identities i where i.user_id = u.id) as identity_rows
-- from profiles p
-- join auth.users u on u.id = p.id
-- order by p.role;
