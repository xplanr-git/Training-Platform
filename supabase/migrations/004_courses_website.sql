-- ============================================================
-- Teachly — Courses, Sections, Activities, Website Config,
--            Website Settings
-- Migration 004 — paste ENTIRE file into Supabase SQL Editor
-- ============================================================
--
-- Depends on:
--   001_profiles_and_users.sql  (profiles table + update_updated_at trigger)
--   002_fix_rls.sql             (get_my_role() security-definer helper)
--
-- Tables created:
--   courses            — one row per course
--   course_sections    — child of courses; PK is (course_id, id)
--   course_activities  — child of course_sections; PK is (course_id, section_id, id)
--   website_config     — one row per company (stores full pages JSONB)
--   website_settings   — one row per company (branding / SEO / domain)
-- ============================================================


-- ── HELPER: current user's company slug ──────────────────────
--
-- Converts the profile company name ("Demo Company") into the
-- same slug format the app uses ("demo-company"), so RLS can
-- compare it against the company_id columns below.
--
-- SECURITY DEFINER keeps it recursion-free (same pattern as
-- get_my_role() in migration 002).

create or replace function get_my_company()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(regexp_replace(company, '\s+', '-', 'g'))
  from profiles
  where id = auth.uid();
$$;


-- ── 1. COURSES ───────────────────────────────────────────────
--
-- company_id is the slug ("demo-company", "outdure") set by the
-- app when a company admin logs in:
--   user.company.toLowerCase().replace(/\s+/g, '-')

create table if not exists courses (
  id                    uuid          primary key default gen_random_uuid(),
  company_id            text          not null,

  -- Basic info (matches Course interface in types.ts)
  title                 text          not null,
  description           text          not null  default '',
  instructor            text          not null  default '',
  duration              text          not null  default '',
  level                 text          not null  default 'Beginner'
                                      check (level in ('Beginner','Intermediate','Advanced')),
  category              text          not null  default 'Uncategorized',
  category_id           text,
  image_url             text          not null  default '',
  rating                numeric(3,1)  not null  default 0,
  students_enrolled     integer       not null  default 0,
  price                 text,
  featured              boolean       not null  default false,
  is_private            boolean       not null  default false,

  -- Course settings
  language              text          not null  default 'English',
  certificate_enabled   boolean       not null  default false,
  allow_comments        boolean       not null  default true,
  allow_reviews         boolean       not null  default true,

  -- Access settings
  access_type           text,
  enrollment_type       text,
  max_students          integer,
  prerequisite_courses  text[]        not null  default '{}',
  start_date            timestamptz,
  end_date              timestamptz,

  -- Pricing settings
  pricing_model         text,
  currency              text          not null  default 'USD',
  discount_enabled      boolean       not null  default false,
  discount_price        numeric(10,2),

  -- Metadata
  authors               text[]        not null  default '{}',
  tags                  text[]        not null  default '{}',

  created_at            timestamptz   not null  default now(),
  updated_at            timestamptz   not null  default now()
);

drop trigger if exists courses_updated_at on courses;
create trigger courses_updated_at
  before update on courses
  for each row execute function update_updated_at();

alter table courses enable row level security;

-- Drop any stale policies before recreating
drop policy if exists "platform_admins_full_courses"   on courses;
drop policy if exists "company_admins_own_courses"     on courses;
drop policy if exists "authenticated_read_courses"     on courses;

-- Platform admins: full CRUD on every course
create policy "platform_admins_full_courses"
  on courses for all
  using      (get_my_role() = 'platform_admin')
  with check (get_my_role() = 'platform_admin');

-- Company admins: full CRUD on their own company's courses
create policy "company_admins_own_courses"
  on courses for all
  using (
    get_my_role() = 'company_admin'
    and company_id = get_my_company()
  )
  with check (
    get_my_role() = 'company_admin'
    and company_id = get_my_company()
  );

-- Authenticated users (employees, learners): read-only
create policy "authenticated_read_courses"
  on courses for select
  using (auth.role() = 'authenticated');


-- ── 2. COURSE SECTIONS ───────────────────────────────────────
--
-- The app generates its own IDs (e.g. '1', 'section-abc').
-- The composite PK (course_id, id) keeps them unique per course
-- and lets the component upsert by natural key without needing
-- server-generated UUIDs.

create table if not exists course_sections (
  id          text          not null,   -- client-generated (e.g. '1', 'section-xyz')
  course_id   uuid          not null references courses(id) on delete cascade,
  title       text          not null  default '',
  is_free     boolean       not null  default false,
  "order"     integer       not null  default 0,
  created_at  timestamptz   not null  default now(),
  updated_at  timestamptz   not null  default now(),
  primary key (course_id, id)
);

drop trigger if exists course_sections_updated_at on course_sections;
create trigger course_sections_updated_at
  before update on course_sections
  for each row execute function update_updated_at();

alter table course_sections enable row level security;

drop policy if exists "platform_admins_full_sections"  on course_sections;
drop policy if exists "company_admins_own_sections"    on course_sections;
drop policy if exists "authenticated_read_sections"    on course_sections;

create policy "platform_admins_full_sections"
  on course_sections for all
  using      (get_my_role() = 'platform_admin')
  with check (get_my_role() = 'platform_admin');

create policy "company_admins_own_sections"
  on course_sections for all
  using (
    get_my_role() = 'company_admin'
    and exists (
      select 1 from courses c
      where c.id = course_id
        and c.company_id = get_my_company()
    )
  )
  with check (
    get_my_role() = 'company_admin'
    and exists (
      select 1 from courses c
      where c.id = course_id
        and c.company_id = get_my_company()
    )
  );

create policy "authenticated_read_sections"
  on course_sections for select
  using (auth.role() = 'authenticated');


-- ── 3. COURSE ACTIVITIES ─────────────────────────────────────
--
-- Same composite-PK approach as sections.
-- Every column mirrors a field in the Activity interface in
-- CourseBuilderPage.tsx so the component can upsert directly.

create table if not exists course_activities (
  id                text          not null,   -- client id (e.g. 'activity-abc')
  section_id        text          not null,   -- matches course_sections.id
  course_id         uuid          not null references courses(id) on delete cascade,

  type              text          not null  default 'text',
  title             text          not null  default '',
  duration          text,
  "order"           integer       not null  default 0,

  -- Content fields (only the relevant ones will be set per activity type)
  content           text,
  file_url          text,
  file_name         text,
  description       text,
  embed_code        text,
  video_url         text,
  audio_url         text,
  pdf_url           text,
  presentation_url  text,
  scorm_url         text,
  youtube_url       text,
  soundcloud_url    text,
  meeting_url       text,
  meeting_date      text,
  meeting_provider  text,
  page_count        integer,

  created_at        timestamptz   not null  default now(),
  updated_at        timestamptz   not null  default now(),

  primary key (course_id, section_id, id)
);

drop trigger if exists course_activities_updated_at on course_activities;
create trigger course_activities_updated_at
  before update on course_activities
  for each row execute function update_updated_at();

alter table course_activities enable row level security;

drop policy if exists "platform_admins_full_activities"  on course_activities;
drop policy if exists "company_admins_own_activities"    on course_activities;
drop policy if exists "authenticated_read_activities"    on course_activities;

create policy "platform_admins_full_activities"
  on course_activities for all
  using      (get_my_role() = 'platform_admin')
  with check (get_my_role() = 'platform_admin');

create policy "company_admins_own_activities"
  on course_activities for all
  using (
    get_my_role() = 'company_admin'
    and exists (
      select 1 from courses c
      where c.id = course_id
        and c.company_id = get_my_company()
    )
  )
  with check (
    get_my_role() = 'company_admin'
    and exists (
      select 1 from courses c
      where c.id = course_id
        and c.company_id = get_my_company()
    )
  );

create policy "authenticated_read_activities"
  on course_activities for select
  using (auth.role() = 'authenticated');


-- ── 4. WEBSITE CONFIG ────────────────────────────────────────
--
-- Stores the full "pages" array from WebsiteBuilder.tsx as JSONB.
-- One row per company; upserted on every publish action.
-- Backward-compat note: the builder also checks for a legacy
-- "sections" key inside the JSONB — that's handled in the component.

create table if not exists website_config (
  id          uuid          primary key default gen_random_uuid(),
  company_id  text          not null unique,
  pages       jsonb         not null  default '[]'::jsonb,
  created_at  timestamptz   not null  default now(),
  updated_at  timestamptz   not null  default now()
);

drop trigger if exists website_config_updated_at on website_config;
create trigger website_config_updated_at
  before update on website_config
  for each row execute function update_updated_at();

alter table website_config enable row level security;

drop policy if exists "platform_admins_full_website_config"  on website_config;
drop policy if exists "company_admins_own_website_config"    on website_config;

create policy "platform_admins_full_website_config"
  on website_config for all
  using      (get_my_role() = 'platform_admin')
  with check (get_my_role() = 'platform_admin');

create policy "company_admins_own_website_config"
  on website_config for all
  using (
    get_my_role() = 'company_admin'
    and company_id = get_my_company()
  )
  with check (
    get_my_role() = 'company_admin'
    and company_id = get_my_company()
  );


-- ── 5. WEBSITE SETTINGS ──────────────────────────────────────
--
-- Mirrors every field in the settings state object inside
-- WebsiteSettingsPage.tsx. One row per company; upserted on save.
-- logo / favicon are stored as text (base64 data URIs or URLs).

create table if not exists website_settings (
  id                uuid          primary key default gen_random_uuid(),
  company_id        text          not null unique,

  site_name         text          not null  default '',
  site_description  text          not null  default '',
  primary_color     text          not null  default '#0d9488',
  secondary_color   text          not null  default '#1f2937',
  font_family       text          not null  default 'Inter',
  logo              text,         -- base64 data URI or public URL
  favicon           text,         -- base64 data URI or public URL
  meta_title        text          not null  default '',
  meta_description  text          not null  default '',
  custom_domain     text          not null  default '',

  created_at        timestamptz   not null  default now(),
  updated_at        timestamptz   not null  default now()
);

drop trigger if exists website_settings_updated_at on website_settings;
create trigger website_settings_updated_at
  before update on website_settings
  for each row execute function update_updated_at();

alter table website_settings enable row level security;

drop policy if exists "platform_admins_full_website_settings"  on website_settings;
drop policy if exists "company_admins_own_website_settings"    on website_settings;

create policy "platform_admins_full_website_settings"
  on website_settings for all
  using      (get_my_role() = 'platform_admin')
  with check (get_my_role() = 'platform_admin');

create policy "company_admins_own_website_settings"
  on website_settings for all
  using (
    get_my_role() = 'company_admin'
    and company_id = get_my_company()
  )
  with check (
    get_my_role() = 'company_admin'
    and company_id = get_my_company()
  );


-- ── 6. VERIFY (uncomment and run after migration succeeds) ───
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
-- order by table_name;
--
-- select get_my_company();           -- run while logged in as admin@democompany.com → 'demo-company'
-- select get_my_role();              -- → 'company_admin'
--
-- select count(*) from courses;      -- → 0 (empty until first course is created)
-- select count(*) from course_sections;
-- select count(*) from course_activities;
-- select count(*) from website_config;
-- select count(*) from website_settings;
