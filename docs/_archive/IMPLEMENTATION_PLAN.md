> **ARCHIVED — DO NOT ACT ON THIS DOCUMENT.**
>
> Archived 2026-08-06. It describes a path this project deliberately did not
> take, and it contradicts the source of truth. See
> [CLAUDE.md](../../CLAUDE.md), and [docs/_archive/README.md](README.md) for
> what specifically is wrong with it. The live schema is `db/schema.ts`; the
> live app is `web/`.

# Outdure Edge - Implementation Plan
## Simplified Business Training Platform

---

## PROJECT OVERVIEW

**Goal**: Build a training platform where businesses can sign up, create training courses, invite employees, assign training, and track completion.

**Timeline**: 8-12 weeks to MVP

**Tech Stack**:
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Payments: Stripe
- Email: SendGrid or Resend
- Hosting: Vercel

---

## DEVELOPMENT PHASES

### PHASE 1: Foundation (Weeks 1-2)

#### Week 1: Project Setup & Database
- [ ] Initialize Next.js project with TypeScript and Tailwind CSS
- [ ] Set up Supabase project
- [ ] Design and create database schema (companies, users, courses, lessons, enrollments, etc.)
- [ ] Set up Prisma ORM
- [ ] Configure environment variables
- [ ] Set up authentication with NextAuth.js or Supabase Auth

#### Week 2: Authentication & Company Onboarding
- [ ] Build company signup flow
  - Signup form with validation
  - Email verification
  - Password requirements
- [ ] Build login flow
- [ ] Build forgot/reset password flow
- [ ] Create onboarding wizard
  - Company setup (name, logo, industry)
  - Plan selection
  - Billing setup (Stripe integration)
- [ ] Build company admin dashboard (empty state)

---

### PHASE 2: Course Management (Weeks 3-4)

#### Week 3: Course Creation
- [ ] Build "Create Course" flow
  - Course details form (title, description, thumbnail, category)
  - Image upload for thumbnails
  - Save as draft
- [ ] Build course builder interface
  - Lesson list view
  - Add/edit/delete lessons
  - Reorder lessons (drag-and-drop)
- [ ] Implement lesson types:
  - [ ] Video lesson (upload to S3 or embed YouTube)
  - [ ] Document lesson (PDF upload)
  - [ ] Text lesson (rich text editor - TipTap or similar)

#### Week 4: Quizzes & Course Publishing
- [ ] Implement quiz lesson type
  - Question builder (MCQ, True/False, Multi-select)
  - Set correct answers
  - Set passing score
- [ ] Build course preview functionality
- [ ] Build publish/unpublish course functionality
- [ ] Build courses list page for admin
- [ ] Build course analytics page (basic)

---

### PHASE 3: Employee Management (Weeks 5-6)

#### Week 5: Employee Invitation
- [ ] Build employee invitation flow
  - Manual email entry (comma-separated)
  - CSV upload for bulk invites
  - Send invitation emails
- [ ] Build invitation acceptance flow
  - Unique token-based link
  - Set password and create account
  - Redirect to employee dashboard
- [ ] Build employees list page
  - Table with search and filter
  - View employee details
  - Remove employee

#### Week 6: Training Assignment
- [ ] Build "Assign Training" flow
  - Multi-select employees
  - Select course
  - Set due date (optional)
  - Send assignment notification emails
- [ ] Build enrollments management
  - View all enrollments
  - Filter by course/employee
  - Unassign training
- [ ] Build employee detail page
  - Show assigned courses
  - Show progress
  - Show certificates

---

### PHASE 4: Learning Experience (Weeks 7-8)

#### Week 7: Course Player
- [ ] Build course player layout
  - Left sidebar with lesson navigation
  - Main content area
  - Top progress bar
- [ ] Implement lesson rendering:
  - [ ] Video player (Video.js)
  - [ ] PDF viewer
  - [ ] Text content display
  - [ ] Quiz interface
- [ ] Implement "Mark as Complete" functionality
- [ ] Implement progress calculation
- [ ] Build "Next Lesson" navigation

#### Week 8: Quizzes & Completion
- [ ] Build quiz-taking interface
  - Question display
  - Answer selection
  - Submit quiz
- [ ] Build quiz results page
  - Score display
  - Correct/incorrect answers
  - Pass/fail status
- [ ] Implement course completion logic
- [ ] Build completion modal/notification
- [ ] Implement time tracking

---

### PHASE 5: Certificates & Analytics (Weeks 9-10)

#### Week 9: Certificates
- [ ] Design certificate template
- [ ] Build certificate generation logic
  - Trigger on course completion
  - Generate unique certificate number
  - Populate template with data
- [ ] Build certificate PDF generation
- [ ] Build certificate view page
  - Display certificate
  - Download PDF button
  - Share functionality
- [ ] Build public certificate verification page

#### Week 10: Analytics & Reporting
- [ ] Build company dashboard
  - Overview metrics (employees, courses, completions)
  - Charts (completion rates, trending)
  - Recent activity
- [ ] Build course analytics page
  - Enrollment stats
  - Completion rates
  - Average time to complete
  - Employee progress table
- [ ] Build employee training record page
  - All assigned courses
  - Progress per course
  - Certificates earned
- [ ] Build export functionality (CSV reports)

---

### PHASE 6: Billing & Polish (Weeks 11-12)

#### Week 11: Billing & Subscriptions
- [ ] Integrate Stripe Checkout
  - Create subscription plans
  - Checkout flow
  - Success/cancel pages
- [ ] Build billing management page
  - Current plan display
  - Upgrade/downgrade
  - Payment method update
  - Billing history
- [ ] Implement subscription webhooks
  - Handle successful payment
  - Handle failed payment
  - Handle cancellation
- [ ] Build usage enforcement
  - Check employee limits based on plan
  - Block actions if limit exceeded

#### Week 12: Notifications & Polish
- [ ] Build notification system
  - In-app notifications
  - Email notifications
- [ ] Implement email templates:
  - [ ] Welcome email (company signup)
  - [ ] Invitation email
  - [ ] Training assigned email
  - [ ] Deadline reminder email
  - [ ] Course completed email
  - [ ] Certificate issued email
- [ ] Build notification preferences page
- [ ] Polish UI/UX
  - Loading states
  - Error states
  - Empty states
  - Success messages
- [ ] Mobile responsiveness
- [ ] Testing and bug fixes
- [ ] Performance optimization

---

## DATABASE SCHEMA (IMPLEMENTATION READY)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  industry VARCHAR(100),
  
  subscription_plan VARCHAR(50) DEFAULT 'trial',
  subscription_status VARCHAR(50) DEFAULT 'trialing',
  trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
  
  primary_color VARCHAR(7) DEFAULT '#000000',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'company_admin', 'employee')),
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  
  last_login_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitations_company ON invitations(company_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  category VARCHAR(100),
  estimated_hours DECIMAL(5,2),
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_company ON courses(company_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_created_by ON courses(created_by);

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'document', 'text', 'quiz')),
  
  content JSONB NOT NULL,
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_sort ON lessons(course_id, sort_order);

-- Enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  total_time_spent_minutes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_assigned_by ON enrollments(assigned_by);

-- Lesson progress table
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  time_spent_minutes INTEGER DEFAULT 0,
  
  quiz_score DECIMAL(5,2),
  quiz_attempts INTEGER DEFAULT 0,
  quiz_answers JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);

-- Certificates table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  pdf_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_course ON certificates(course_id);
CREATE INDEX idx_certificates_company ON certificates(company_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link_url TEXT,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('starter', 'pro', 'enterprise')),
  
  price_per_month DECIMAL(10,2),
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'annual')),
  
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  status VARCHAR(50) CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused')),
  
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  
  canceled_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Media files table (for tracking uploads)
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size_bytes BIGINT,
  
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_files_company ON media_files(company_id);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
```

---

## KEY FEATURES BREAKDOWN

### 1. Company Signup & Onboarding

**Pages**:
- `/signup` - Company signup form
- `/onboarding` - Multi-step wizard

**Components**:
- `SignupForm` - Email, password, company name, industry
- `OnboardingWizard` - Steps: Logo upload, plan selection, billing
- `PlanSelector` - Display plans with pricing

**API Routes**:
- `POST /api/auth/signup` - Create company and admin user
- `POST /api/companies/setup` - Update company settings
- `POST /api/billing/create-subscription` - Stripe checkout

---

### 2. Course Creation

**Pages**:
- `/admin/courses` - List courses
- `/admin/courses/new` - Create course
- `/admin/courses/[id]/edit` - Edit course and lessons

**Components**:
- `CourseForm` - Title, description, thumbnail, category
- `LessonBuilder` - Add/edit/reorder lessons
- `VideoLessonForm` - Upload video or paste YouTube URL
- `DocumentLessonForm` - Upload PDF
- `TextLessonEditor` - Rich text editor (TipTap)
- `QuizBuilder` - Add questions, set correct answers

**API Routes**:
- `POST /api/courses` - Create course
- `PATCH /api/courses/[id]` - Update course
- `POST /api/courses/[id]/lessons` - Add lesson
- `PATCH /api/lessons/[id]` - Update lesson
- `DELETE /api/lessons/[id]` - Delete lesson
- `POST /api/courses/[id]/publish` - Publish course

---

### 3. Employee Management

**Pages**:
- `/admin/employees` - List employees
- `/admin/employees/invite` - Invite employees
- `/admin/employees/[id]` - Employee details

**Components**:
- `EmployeeTable` - Searchable table
- `InviteForm` - Email input or CSV upload
- `EmployeeDetail` - Show courses, progress, certificates

**API Routes**:
- `GET /api/users` - List employees
- `POST /api/users/invite` - Send invitations
- `GET /api/users/[id]` - Get employee details
- `DELETE /api/users/[id]` - Remove employee

---

### 4. Training Assignment

**Pages**:
- `/admin/courses/[id]/assign` - Assign course to employees

**Components**:
- `EmployeeSelector` - Multi-select with search
- `AssignmentForm` - Select course, due date
- `EnrollmentsList` - View all enrollments

**API Routes**:
- `POST /api/enrollments` - Create enrollments (bulk)
- `GET /api/enrollments` - List enrollments
- `DELETE /api/enrollments/[id]` - Remove enrollment

---

### 5. Course Player (Employee Side)

**Pages**:
- `/learn/courses/[id]` - Course player

**Components**:
- `CoursePlayer` - Main layout
- `LessonNavigation` - Sidebar with lesson list
- `VideoPlayer` - Video.js player
- `PDFViewer` - Embedded PDF
- `TextContent` - Rendered HTML
- `QuizInterface` - Question display and answers
- `ProgressBar` - Top progress indicator

**API Routes**:
- `GET /api/courses/[id]/learn` - Get course with lessons (for enrolled user)
- `POST /api/enrollments/[id]/start` - Mark started
- `POST /api/lesson-progress` - Save progress
- `POST /api/lesson-progress/[id]/complete` - Mark lesson complete
- `POST /api/quizzes/[id]/submit` - Submit quiz

---

### 6. Certificates

**Pages**:
- `/certificates` - List user's certificates
- `/certificates/[id]` - View certificate
- `/verify/[certificateNumber]` - Public verification

**Components**:
- `Certificate` - Styled certificate display
- `CertificatePDF` - PDF generator

**API Routes**:
- `GET /api/certificates` - List certificates
- `GET /api/certificates/[id]` - Get certificate
- `GET /api/certificates/verify/[number]` - Verify certificate (public)

---

### 7. Analytics

**Pages**:
- `/admin/dashboard` - Company dashboard
- `/admin/courses/[id]/analytics` - Course analytics
- `/admin/employees/[id]/progress` - Employee progress

**Components**:
- `DashboardMetrics` - Metric cards
- `CompletionChart` - Bar/line chart
- `ProgressTable` - Employee progress table
- `ExportButton` - Export CSV

**API Routes**:
- `GET /api/analytics/dashboard` - Company stats
- `GET /api/analytics/courses/[id]` - Course stats
- `GET /api/analytics/employees/[id]` - Employee stats

---

## DEPLOYMENT CHECKLIST

### Pre-Launch
- [ ] Set up production Supabase project
- [ ] Set up production Stripe account
- [ ] Configure SendGrid/Resend for production emails
- [ ] Set up AWS S3 bucket for file storage (or use Supabase Storage)
- [ ] Configure environment variables in Vercel
- [ ] Set up domain DNS (outdureedge.com)
- [ ] Configure SSL certificate
- [ ] Test all email templates
- [ ] Test payment flows (live mode)
- [ ] Load testing
- [ ] Security audit

### Launch Day
- [ ] Deploy to Vercel production
- [ ] Verify database migrations ran
- [ ] Test signup flow end-to-end
- [ ] Test course creation and publishing
- [ ] Test employee invitation
- [ ] Test course completion and certificate generation
- [ ] Test billing and subscription
- [ ] Monitor error logs (Sentry)
- [ ] Monitor performance (Vercel Analytics)

### Post-Launch
- [ ] Customer support setup (email, chat)
- [ ] Documentation and help center
- [ ] Onboarding emails and guides
- [ ] Marketing and outreach
- [ ] Collect user feedback
- [ ] Iterate and improve

---

## SUCCESS METRICS

### Week 4
- [ ] 5 beta companies signed up
- [ ] 10 courses created
- [ ] 50 employees invited

### Week 8
- [ ] 20 companies signed up
- [ ] 100 courses created
- [ ] 500 employees active
- [ ] 1,000 course completions

### Week 12 (3 months post-launch)
- [ ] 50 paying companies
- [ ] $5,000 MRR
- [ ] 2,000 active employees
- [ ] 5,000+ course completions
- [ ] 80%+ course completion rate
- [ ] < 5% churn rate

---

This implementation plan provides a clear, week-by-week roadmap to build and launch the simplified Outdure Edge training platform.
