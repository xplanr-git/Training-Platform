> **ARCHIVED — DO NOT ACT ON THIS DOCUMENT.**
>
> Archived 2026-08-06. It describes a path this project deliberately did not
> take, and it contradicts the source of truth. See
> [CLAUDE.md](../../CLAUDE.md), and [docs/_archive/README.md](README.md) for
> what specifically is wrong with it. The live schema is `db/schema.ts`; the
> live app is `web/`.

# Outdure Edge - Database Schema Design

## Multi-Tenant Data Model Strategy

**Approach**: Shared database with tenant_id column (Row-Level Security)
- All tables include `tenant_id` (school_id) for data isolation
- RLS policies enforce tenant boundaries
- Indexes on tenant_id for query performance
- Exception: Platform-level tables (billing_plans, platform_admins)

---

## Core Tables

### tenants (schools)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL, -- outdure-edge
  name VARCHAR(255) NOT NULL, -- Outdure Edge
  custom_domain VARCHAR(255) UNIQUE, -- learn.outdure.com
  domain_verified BOOLEAN DEFAULT FALSE,
  ssl_status VARCHAR(50) DEFAULT 'pending', -- pending, active, failed
  
  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
  accent_color VARCHAR(7) DEFAULT '#F9FAFB',
  font_heading VARCHAR(100) DEFAULT 'Inter',
  font_body VARCHAR(100) DEFAULT 'Inter',
  tagline TEXT,
  
  -- Settings
  locale VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
  billing_plan_id UUID REFERENCES billing_plans(id),
  trial_ends_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
```

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Auth
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT, -- NULL if using magic link only
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMP,
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(200),
  avatar_url TEXT,
  bio TEXT,
  phone VARCHAR(50),
  
  -- Social
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  
  -- Preferences
  locale VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50),
  notification_preferences JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
  last_login_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(tenant_id, status);
```

### roles
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL, -- Owner, Admin, Instructor, Learner, etc.
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- System role (cannot be deleted)
  is_system BOOLEAN DEFAULT FALSE,
  
  -- Permissions (JSON array)
  permissions JSONB DEFAULT '[]', -- ["courses.create", "users.manage", ...]
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_roles_tenant ON roles(tenant_id);
```

### role_assignments
```sql
CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  
  -- Optional scope (e.g., instructor role scoped to specific courses)
  scope_type VARCHAR(50), -- course, organization, null (global)
  scope_id UUID, -- ID of course or org
  
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, role_id, scope_type, scope_id)
);

CREATE INDEX idx_role_assignments_user ON role_assignments(user_id);
CREATE INDEX idx_role_assignments_tenant ON role_assignments(tenant_id);
```

### permissions
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) UNIQUE NOT NULL, -- courses.create
  category VARCHAR(50) NOT NULL, -- courses, users, commerce, etc.
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed with all available permissions
```

---

## Organizations (B2B)

### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  logo_url TEXT,
  
  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Billing
  billing_email VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_organizations_tenant ON organizations(tenant_id);
```

### org_memberships
```sql
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(50) DEFAULT 'member', -- admin, member
  
  joined_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_memberships_org ON org_memberships(organization_id);
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id);
```

### seat_purchases
```sql
CREATE TABLE seat_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL,
  price_per_seat DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Access
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  
  -- Linked order
  order_id UUID REFERENCES orders(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_seat_purchases_org ON seat_purchases(organization_id);
```

### seat_allocations
```sql
CREATE TABLE seat_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  seat_purchase_id UUID REFERENCES seat_purchases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  allocated_at TIMESTAMP DEFAULT NOW(),
  allocated_by UUID REFERENCES users(id),
  
  UNIQUE(seat_purchase_id, user_id)
);

CREATE INDEX idx_seat_allocations_purchase ON seat_allocations(seat_purchase_id);
CREATE INDEX idx_seat_allocations_user ON seat_allocations(user_id);
```

---

## Courses & Content

### courses
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic Info
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  subtitle TEXT,
  description TEXT,
  
  -- Media
  thumbnail_url TEXT,
  promo_video_url TEXT,
  
  -- Categorization
  category_id UUID REFERENCES categories(id),
  tags TEXT[], -- {marketing, beginner, video}
  
  -- Course Type
  type VARCHAR(50) DEFAULT 'self_paced', -- self_paced, cohort, micro, learning_path, membership, coaching, workshop, download, certification
  
  -- Difficulty & Duration
  level VARCHAR(20), -- beginner, intermediate, advanced
  estimated_duration_minutes INTEGER,
  
  -- Instructor
  instructor_id UUID REFERENCES users(id),
  co_instructors UUID[], -- Array of user IDs
  
  -- Settings
  language VARCHAR(10) DEFAULT 'en',
  certificate_template_id UUID REFERENCES certificate_templates(id),
  allow_discussions BOOLEAN DEFAULT TRUE,
  require_sequential_progress BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_courses_tenant ON courses(tenant_id);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(tenant_id, status);
CREATE INDEX idx_courses_type ON courses(tenant_id, type);
```

### course_versions
```sql
CREATE TABLE course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- Full course structure snapshot
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(course_id, version)
);

CREATE INDEX idx_course_versions_course ON course_versions(course_id);
```

### modules
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Drip
  available_at TIMESTAMP,
  available_after_days INTEGER, -- Days after enrollment
  prerequisite_module_id UUID REFERENCES modules(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_modules_sort ON modules(course_id, sort_order);
```

### lessons
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Lesson Type
  type VARCHAR(50) NOT NULL, -- video, audio, text, pdf, presentation, file_download, embed, assignment, quiz, survey, live_session, community_embed, scorm
  
  -- Content (JSON structure varies by type)
  content JSONB NOT NULL,
  
  -- Completion Rules
  completion_rule VARCHAR(50) DEFAULT 'view', -- view, video_percent, quiz_pass, assignment_submit
  completion_threshold INTEGER, -- e.g., 80% for video, pass mark for quiz
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Drip
  available_at TIMESTAMP,
  available_after_days INTEGER,
  prerequisite_lesson_id UUID REFERENCES lessons(id),
  
  -- Settings
  allow_comments BOOLEAN DEFAULT TRUE,
  is_free_preview BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_sort ON lessons(module_id, sort_order);
CREATE INDEX idx_lessons_type ON lessons(type);
```

### lesson_blocks
```sql
-- For lessons with multiple content blocks (e.g., text lesson with video embeds)
CREATE TABLE lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- text, video, image, embed, file, code, etc.
  content JSONB NOT NULL,
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lesson_blocks_lesson ON lesson_blocks(lesson_id, sort_order);
```

### categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  
  -- Hierarchy
  parent_id UUID REFERENCES categories(id),
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

---

## Enrollments & Progress

### enrollments
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Enrollment Type
  enrollment_type VARCHAR(50) DEFAULT 'purchase', -- purchase, invitation, org_assignment, free
  
  -- Access
  enrolled_at TIMESTAMP DEFAULT NOW(),
  access_expires_at TIMESTAMP,
  
  -- Progress
  progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
  completed_at TIMESTAMP,
  
  -- Cohort (if applicable)
  cohort_id UUID REFERENCES cohorts(id),
  
  -- Source
  enrolled_by UUID REFERENCES users(id), -- Admin who enrolled, null if self-enrolled
  organization_id UUID REFERENCES organizations(id), -- If org assignment
  
  UNIQUE(user_id, course_id, cohort_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_tenant ON enrollments(tenant_id);
```

### lesson_completions
```sql
CREATE TABLE lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  completed_at TIMESTAMP DEFAULT NOW(),
  
  -- Completion details
  time_spent_seconds INTEGER DEFAULT 0,
  
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_completions_enrollment ON lesson_completions(enrollment_id);
CREATE INDEX idx_lesson_completions_user ON lesson_completions(user_id);
```

### video_events
```sql
-- Track video watch progress for analytics
CREATE TABLE video_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  
  event_type VARCHAR(20) NOT NULL, -- play, pause, seek, complete
  timestamp_seconds INTEGER NOT NULL,
  duration_seconds INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_events_lesson_user ON video_events(lesson_id, user_id);
```

### notes
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  -- Video timestamp (if applicable)
  timestamp_seconds INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_lesson ON notes(lesson_id);
```

### bookmarks
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
```

---

## Cohorts

### cohorts
```sql
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  
  -- Schedule
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  
  -- Capacity
  max_participants INTEGER,
  
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, active, completed, cancelled
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cohorts_course ON cohorts(course_id);
CREATE INDEX idx_cohorts_status ON cohorts(status);
```

### live_sessions
```sql
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Meeting Info
  meeting_url TEXT,
  meeting_provider VARCHAR(50), -- zoom, google_meet, teams
  meeting_id VARCHAR(255),
  meeting_password VARCHAR(100),
  
  -- Recording
  recording_url TEXT,
  recording_available BOOLEAN DEFAULT FALSE,
  
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_sessions_cohort ON live_sessions(cohort_id);
```

### session_attendance
```sql
CREATE TABLE session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  attended BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  duration_minutes INTEGER,
  
  UNIQUE(live_session_id, user_id)
);

CREATE INDEX idx_session_attendance_session ON session_attendance(live_session_id);
CREATE INDEX idx_session_attendance_user ON session_attendance(user_id);
```

---

## Assessments

### quizzes
```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Settings
  time_limit_minutes INTEGER,
  passing_score DECIMAL(5, 2), -- e.g., 80.00
  max_attempts INTEGER, -- NULL for unlimited
  randomize_questions BOOLEAN DEFAULT FALSE,
  randomize_answers BOOLEAN DEFAULT FALSE,
  show_correct_answers BOOLEAN DEFAULT TRUE,
  show_answers_after VARCHAR(20) DEFAULT 'immediate', -- immediate, after_deadline, never
  
  -- Question Pool
  questions_to_show INTEGER, -- If less than total, draw random subset
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
```

### questions
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_bank_id UUID REFERENCES question_banks(id), -- If from bank
  
  type VARCHAR(50) NOT NULL, -- mcq, multi_select, true_false, short_answer, essay, matching, ordering, fill_in_blank, hotspot
  
  question_text TEXT NOT NULL,
  question_html TEXT,
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  
  -- Points
  points DECIMAL(5, 2) DEFAULT 1.00,
  
  -- Options (JSON array for MCQ, multi-select, matching, etc.)
  options JSONB,
  
  -- Correct Answer (structure varies by type)
  correct_answer JSONB,
  
  -- Explanation
  explanation TEXT,
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_quiz ON questions(quiz_id, sort_order);
```

### question_banks
```sql
CREATE TABLE question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_question_banks_tenant ON question_banks(tenant_id);
```

### quiz_attempts
```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  
  attempt_number INTEGER NOT NULL,
  
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  
  -- Scoring
  total_points DECIMAL(5, 2),
  earned_points DECIMAL(5, 2),
  score_percentage DECIMAL(5, 2),
  passed BOOLEAN,
  
  -- Answers (JSON: question_id -> answer)
  answers JSONB,
  
  UNIQUE(quiz_id, user_id, attempt_number)
);

CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
```

### assignments
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Submission Type
  submission_type VARCHAR(50) NOT NULL, -- file_upload, text, url, code
  allowed_file_types TEXT[], -- {pdf, doc, docx}
  max_file_size_mb INTEGER,
  
  -- Grading
  max_points DECIMAL(5, 2) DEFAULT 100.00,
  rubric_id UUID REFERENCES rubrics(id),
  
  -- Deadline
  due_at TIMESTAMP,
  allow_late_submission BOOLEAN DEFAULT TRUE,
  late_penalty_percent DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assignments_lesson ON assignments(lesson_id);
```

### assignment_submissions
```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  
  -- Submission
  submission_text TEXT,
  submission_url TEXT,
  file_urls TEXT[],
  
  submitted_at TIMESTAMP DEFAULT NOW(),
  is_late BOOLEAN DEFAULT FALSE,
  
  -- Grading
  grade DECIMAL(5, 2),
  feedback TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMP,
  
  status VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, returned
  
  UNIQUE(assignment_id, user_id)
);

CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_user ON assignment_submissions(user_id);
```

### rubrics
```sql
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Criteria (JSON array)
  criteria JSONB NOT NULL,
  /* Example:
  [
    {
      "name": "Content Quality",
      "weight": 40,
      "levels": [
        {"name": "Excellent", "points": 10, "description": "..."},
        {"name": "Good", "points": 7, "description": "..."}
      ]
    }
  ]
  */
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rubrics_tenant ON rubrics(tenant_id);
```

### gradebook_entries
```sql
CREATE TABLE gradebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  
  -- Item graded (quiz or assignment)
  item_type VARCHAR(20) NOT NULL, -- quiz, assignment
  item_id UUID NOT NULL,
  
  -- Grade
  points_earned DECIMAL(5, 2),
  points_possible DECIMAL(5, 2),
  grade_percentage DECIMAL(5, 2),
  letter_grade VARCHAR(5),
  
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(enrollment_id, item_type, item_id)
);

CREATE INDEX idx_gradebook_course_user ON gradebook_entries(course_id, user_id);
```

---

## Certificates & Badges

### certificate_templates
```sql
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  
  -- Design (HTML template with placeholders)
  html_template TEXT NOT NULL,
  css_styles TEXT,
  
  -- Placeholders: {{learner_name}}, {{course_title}}, {{completion_date}}, {{certificate_id}}, {{instructor_signature}}
  
  -- Background image
  background_image_url TEXT,
  
  -- Settings
  page_size VARCHAR(20) DEFAULT 'letter', -- letter, A4
  orientation VARCHAR(20) DEFAULT 'landscape',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificate_templates_tenant ON certificate_templates(tenant_id);
```

### certificates
```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  
  certificate_template_id UUID REFERENCES certificate_templates(id),
  
  -- Certificate Details
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  -- Generated PDF
  pdf_url TEXT,
  
  -- Verification
  verification_url TEXT,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,
  
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_course ON certificates(course_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
```

### badges
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  
  -- Criteria
  criteria_type VARCHAR(50) NOT NULL, -- course_completion, lesson_count, streak, custom
  criteria_value JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_badges_tenant ON badges(tenant_id);
```

### badge_awards
```sql
CREATE TABLE badge_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  awarded_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(badge_id, user_id)
);

CREATE INDEX idx_badge_awards_user ON badge_awards(user_id);
```

---

## Community

### community_spaces
```sql
CREATE TABLE community_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  
  -- Scope
  scope_type VARCHAR(50) DEFAULT 'school', -- school, course
  scope_id UUID, -- course_id if course-specific
  
  -- Settings
  is_private BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_community_spaces_tenant ON community_spaces(tenant_id);
CREATE INDEX idx_community_spaces_scope ON community_spaces(scope_type, scope_id);
```

### community_channels
```sql
CREATE TABLE community_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  space_id UUID REFERENCES community_spaces(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(space_id, slug)
);

CREATE INDEX idx_community_channels_space ON community_channels(space_id, sort_order);
```

### posts
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES community_channels(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) DEFAULT 'text', -- text, image, video, poll, link
  
  title VARCHAR(500),
  content TEXT,
  content_html TEXT,
  
  -- Media
  image_urls TEXT[],
  video_url TEXT,
  link_url TEXT,
  
  -- Poll (if type = poll)
  poll_options JSONB,
  poll_closes_at TIMESTAMP,
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_removed BOOLEAN DEFAULT FALSE,
  removed_reason TEXT,
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_channel ON posts(channel_id, created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id);
```

### comments
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Threading
  parent_comment_id UUID REFERENCES comments(id),
  
  -- Moderation
  is_removed BOOLEAN DEFAULT FALSE,
  removed_reason TEXT,
  
  -- Engagement
  reactions_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
```

### reactions
```sql
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Target
  target_type VARCHAR(20) NOT NULL, -- post, comment
  target_id UUID NOT NULL,
  
  emoji VARCHAR(10) NOT NULL, -- 👍, ❤️, etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, target_type, target_id, emoji)
);

CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
```

### moderation_actions
```sql
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  action_type VARCHAR(50) NOT NULL, -- remove_post, ban_user, lock_thread, pin_post
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  
  reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moderation_actions_target ON moderation_actions(target_type, target_id);
```

### reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  target_type VARCHAR(50) NOT NULL, -- post, comment, user
  target_id UUID NOT NULL,
  
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(tenant_id, status);
```

---

## Commerce

### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Linked Resource
  product_type VARCHAR(50) NOT NULL, -- course, bundle, membership, coaching, workshop, download
  product_id UUID NOT NULL, -- ID of course, bundle, etc.
  
  -- Pricing
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, archived
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, product_type, product_id)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
```

### pricing_plans
```sql
CREATE TABLE pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL, -- One-time, Monthly, Annual
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2), -- Original price for discounts
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Billing
  billing_type VARCHAR(50) NOT NULL, -- one_time, subscription
  billing_interval VARCHAR(20), -- monthly, yearly (for subscriptions)
  
  -- Trial
  trial_period_days INTEGER DEFAULT 0,
  
  -- Payment Plans
  payment_plan_installments INTEGER, -- e.g., 3 for pay-in-3
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_plans_product ON pricing_plans(product_id);
```

### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Billing
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0.00,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Customer Info
  billing_email VARCHAR(255),
  billing_name VARCHAR(255),
  billing_address JSONB,
  
  -- Payment
  payment_method VARCHAR(50), -- card, paypal, etc.
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, succeeded, failed
  payment_intent_id VARCHAR(255), -- Stripe payment intent
  
  -- Coupon
  coupon_id UUID REFERENCES coupons(id),
  
  -- Affiliate
  affiliate_id UUID REFERENCES affiliates(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, refunded, failed
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### order_items
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  pricing_plan_id UUID REFERENCES pricing_plans(id) ON DELETE SET NULL,
  
  -- Snapshot (in case product/plan is deleted)
  product_name VARCHAR(255) NOT NULL,
  product_type VARCHAR(50) NOT NULL,
  
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### refunds
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  reason VARCHAR(255),
  
  -- Stripe
  refund_id VARCHAR(255), -- Stripe refund ID
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, succeeded, failed
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refunds_order ON refunds(order_id);
```

### coupons
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  code VARCHAR(100) UNIQUE NOT NULL,
  
  -- Discount
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
  discount_value DECIMAL(10, 2) NOT NULL,
  
  -- Restrictions
  min_purchase_amount DECIMAL(10, 2),
  product_ids UUID[], -- Restrict to specific products, NULL for all
  
  -- Limits
  max_uses INTEGER, -- Total uses allowed, NULL for unlimited
  max_uses_per_user INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  
  -- Validity
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_tenant ON coupons(tenant_id);
```

### coupon_redemptions
```sql
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  discount_amount DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(user_id);
```

---

## Affiliates

### affiliates
```sql
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Referral Code
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Commission
  commission_rate DECIMAL(5, 2) NOT NULL, -- Percentage
  
  -- Payout
  payout_email VARCHAR(255),
  payout_method VARCHAR(50), -- paypal, bank_transfer, etc.
  payout_details JSONB,
  
  -- Stats
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, suspended
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_affiliates_tenant ON affiliates(tenant_id);
CREATE INDEX idx_affiliates_code ON affiliates(referral_code);
```

### referral_clicks
```sql
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  
  -- Visitor
  visitor_id VARCHAR(255), -- Cookie-based tracking
  ip_address VARCHAR(50),
  user_agent TEXT,
  referrer TEXT,
  
  -- Conversion (if purchased)
  converted BOOLEAN DEFAULT FALSE,
  order_id UUID REFERENCES orders(id),
  
  clicked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referral_clicks_affiliate ON referral_clicks(affiliate_id);
CREATE INDEX idx_referral_clicks_visitor ON referral_clicks(visitor_id);
```

### commissions
```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid
  
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX idx_commissions_status ON commissions(status);
```

### payouts
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Commission IDs included in this payout
  commission_ids UUID[] NOT NULL,
  
  payout_method VARCHAR(50),
  payout_reference VARCHAR(255), -- Transaction ID
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_payouts_affiliate ON payouts(affiliate_id);
```

---

## Site Builder

### pages
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  
  -- Content (JSON page structure)
  content JSONB NOT NULL,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image_url TEXT,
  
  -- Settings
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  
  -- Page type
  page_type VARCHAR(50) DEFAULT 'custom', -- home, course_catalog, course_detail, about, contact, blog, legal, custom
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_pages_tenant ON pages(tenant_id);
CREATE INDEX idx_pages_slug ON pages(slug);
```

### navigation_menus
```sql
CREATE TABLE navigation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL, -- Header, Footer
  position VARCHAR(50) NOT NULL, -- header, footer, sidebar
  
  -- Items (JSON array)
  items JSONB NOT NULL,
  /* Example:
  [
    {"label": "Home", "url": "/", "order": 0},
    {"label": "Courses", "url": "/courses", "order": 1, "children": [...]}
  ]
  */
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, position)
);

CREATE INDEX idx_navigation_menus_tenant ON navigation_menus(tenant_id);
```

### themes
```sql
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  
  -- Colors
  color_primary VARCHAR(7) DEFAULT '#000000',
  color_secondary VARCHAR(7) DEFAULT '#FFFFFF',
  color_accent VARCHAR(7) DEFAULT '#F9FAFB',
  color_background VARCHAR(7) DEFAULT '#FFFFFF',
  color_text VARCHAR(7) DEFAULT '#000000',
  
  -- Typography
  font_heading VARCHAR(100) DEFAULT 'Inter',
  font_body VARCHAR(100) DEFAULT 'Inter',
  
  -- Layout
  header_style VARCHAR(50) DEFAULT 'default',
  footer_style VARCHAR(50) DEFAULT 'default',
  
  -- Custom CSS
  custom_css TEXT,
  
  is_active BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_themes_tenant ON themes(tenant_id);
```

---

## Marketing & Automations

### email_templates
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- purchase_confirmation, course_enrollment, password_reset, etc.
  
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Variables available: {{learner_name}}, {{course_title}}, etc.
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
```

### automations
```sql
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger
  trigger_type VARCHAR(100) NOT NULL, -- user_signed_up, course_purchased, course_completed, etc.
  trigger_config JSONB, -- Additional trigger settings
  
  -- Conditions (optional)
  conditions JSONB, -- {"has_tag": "vip", "enrolled_in": "course_id"}
  
  -- Actions (array)
  actions JSONB NOT NULL,
  /* Example:
  [
    {"type": "send_email", "template_id": "..."},
    {"type": "add_tag", "tag": "completed"},
    {"type": "grant_access", "product_id": "..."}
  ]
  */
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_automations_tenant ON automations(tenant_id);
CREATE INDEX idx_automations_trigger ON automations(trigger_type);
```

### automation_runs
```sql
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  error_message TEXT,
  
  triggered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_automation_runs_automation ON automation_runs(automation_id);
```

### user_tags
```sql
CREATE TABLE user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  tag VARCHAR(100) NOT NULL,
  
  added_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, tag)
);

CREATE INDEX idx_user_tags_user ON user_tags(user_id);
CREATE INDEX idx_user_tags_tag ON user_tags(tag);
```

---

## Notifications

### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(100) NOT NULL, -- lesson_unlocked, assignment_due, certificate_issued, etc.
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Link
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
```

---

## Integrations

### integrations
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  provider VARCHAR(50) NOT NULL, -- stripe, sendgrid, zoom, google_meet, zapier
  
  -- Credentials (encrypted)
  credentials JSONB NOT NULL,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  connected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_integrations_tenant ON integrations(tenant_id);
```

### api_keys
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed API key
  key_prefix VARCHAR(20) NOT NULL, -- First few chars for display
  
  -- Permissions
  scopes TEXT[] NOT NULL, -- {read:courses, write:users}
  
  last_used_at TIMESTAMP,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
```

### webhooks
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  
  -- Events to subscribe to
  events TEXT[] NOT NULL, -- {course.published, user.enrolled, order.completed}
  
  -- Secret for signature verification
  secret VARCHAR(255) NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
```

### webhook_deliveries
```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  
  -- Response
  response_status INTEGER,
  response_body TEXT,
  
  delivered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
```

---

## Analytics

### analytics_events
```sql
-- Store custom events for analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  event_type VARCHAR(100) NOT NULL, -- page_view, video_play, quiz_attempt, etc.
  
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  
  -- Event data
  properties JSONB NOT NULL,
  
  -- Device info
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_tenant ON analytics_events(tenant_id, created_at);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
```

### daily_stats
```sql
-- Aggregated daily statistics for performance
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  stat_date DATE NOT NULL,
  
  -- Metrics
  metric_type VARCHAR(50) NOT NULL, -- revenue, enrollments, completions, active_users
  metric_value DECIMAL(15, 2) NOT NULL,
  
  -- Dimensions (optional)
  dimension_type VARCHAR(50), -- course, instructor, organization
  dimension_id UUID,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, stat_date, metric_type, dimension_type, dimension_id)
);

CREATE INDEX idx_daily_stats_tenant_date ON daily_stats(tenant_id, stat_date);
```

---

## Audit & Compliance

### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL, -- user.created, course.published, order.refunded
  entity_type VARCHAR(50) NOT NULL, -- user, course, order
  entity_id UUID NOT NULL,
  
  -- Changes (before/after snapshot)
  changes JSONB,
  
  -- Context
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

## Platform Admin (Super Admin)

### billing_plans
```sql
CREATE TABLE billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL, -- Starter, Pro, Business, Enterprise
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- Pricing
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Limits
  max_courses INTEGER,
  max_students INTEGER,
  max_storage_gb INTEGER,
  max_admins INTEGER,
  
  -- Features (JSON array)
  features JSONB NOT NULL, -- ["custom_domain", "white_label", "priority_support"]
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed with default plans
```

### platform_admins
```sql
CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(50) DEFAULT 'admin', -- admin, support, developer
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

---

## Media Library

### media_files
```sql
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100), -- image/jpeg, video/mp4
  file_size_bytes BIGINT,
  
  -- Dimensions (for images/videos)
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  
  -- Folder
  folder VARCHAR(255),
  
  -- Usage tracking
  used_in_count INTEGER DEFAULT 0,
  
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_files_tenant ON media_files(tenant_id);
CREATE INDEX idx_media_files_type ON media_files(file_type);
```

---

## Learning Paths & Bundles

### learning_paths
```sql
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_learning_paths_tenant ON learning_paths(tenant_id);
```

### learning_path_items
```sql
CREATE TABLE learning_path_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Prerequisite
  prerequisite_course_id UUID REFERENCES courses(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learning_path_items_path ON learning_path_items(learning_path_id, sort_order);
```

---

## Relationships Summary

- **tenants** → users, courses, products, organizations, etc. (multi-tenant)
- **users** → role_assignments, enrollments, certificates, posts, etc.
- **courses** → modules → lessons → quizzes/assignments
- **enrollments** → lesson_completions, quiz_attempts, assignment_submissions
- **products** → pricing_plans → orders → order_items
- **organizations** → org_memberships, seat_purchases → seat_allocations
- **community_spaces** → community_channels → posts → comments
- **affiliates** → referral_clicks, commissions, payouts

---

## Indexes Strategy

- All foreign keys have indexes
- Composite indexes on (tenant_id, frequently_queried_column)
- Indexes on status/type columns for filtering
- Timestamps indexed for sorting/range queries
- Unique constraints where applicable

---

## Data Retention & Archiving

- Soft delete pattern for users/courses (status = 'deleted')
- Archive old analytics_events/audit_logs after 90 days
- Anonymize deleted user data for GDPR compliance

---

## Scalability Considerations

- **Read Replicas**: For analytics queries
- **Caching**: Redis for course structure, user sessions, frequently accessed data
- **CDN**: For media files (images, videos)
- **Partitioning**: analytics_events, audit_logs by month
- **Connection Pooling**: PgBouncer or similar

---

This schema supports all features in the LearnWorlds-style platform specification.
