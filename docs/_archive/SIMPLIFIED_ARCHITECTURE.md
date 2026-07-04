# Outdure Edge - Simplified Business Training Platform
## Architecture for Business-Hosted Training

---

## PLATFORM VISION

**Single branded platform** where businesses can:
1. Sign up and create a company account
2. Upload and manage their training courses
3. Invite and manage their employees
4. Assign training to employees
5. Track completion and progress
6. Issue certificates

**Think**: Udemy for Business meets internal LMS

---

## CORE CONCEPT

```
┌─────────────────────────────────────────────────────────────┐
│              OUTDURE EDGE PLATFORM                          │
│              (Single Website & Brand)                       │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │Company A│       │Company B│       │Company C│
   │(Acme)   │       │(TechCo) │       │(FinCorp)│
   └─────────┘       └─────────┘       └─────────┘
        │                  │                  │
   ┌────┴────┐        ┌────┴────┐       ┌────┴────┐
   │Employees│        │Employees│       │Employees│
   │(Learners)│       │(Learners)│      │(Learners)│
   └─────────┘        └─────────┘       └─────────┘
```

---

## USER TYPES (SIMPLIFIED)

### 1. Platform Super Admin (Outdure Edge Team)
- Manage all companies
- View platform-wide analytics
- Handle billing and support
- Manage platform content and settings

### 2. Company Admin (Business Owner/HR/Training Manager)
**Who**: Person who signs up the company
**Can**:
- Manage company profile
- Create/upload training courses
- Invite employees
- Assign training to employees
- View company analytics
- Manage billing

### 3. Company Employee (Learner)
**Who**: Employees of the company
**Can**:
- Access assigned training
- Complete courses
- Take quizzes
- Earn certificates
- View their progress

---

## DATABASE SCHEMA (SIMPLIFIED)

### companies
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  industry VARCHAR(100),
  
  -- Billing
  subscription_plan VARCHAR(50), -- starter, pro, enterprise
  subscription_status VARCHAR(50), -- active, trial, cancelled
  trial_ends_at TIMESTAMP,
  
  -- Settings
  primary_color VARCHAR(7) DEFAULT '#000000',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  
  role VARCHAR(50) NOT NULL, -- super_admin, company_admin, employee
  
  status VARCHAR(20) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
```

### courses
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id), -- Which company owns this course
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  category VARCHAR(100), -- compliance, onboarding, skills, safety, etc.
  estimated_hours DECIMAL(5,2),
  
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_company ON courses(company_id);
```

### lessons
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50), -- video, document, quiz, text
  
  -- Content (flexible JSON)
  content JSONB NOT NULL,
  /* Examples:
    Video: {"videoUrl": "...", "duration": 600}
    Document: {"documentUrl": "...", "pages": 10}
    Text: {"html": "<p>...</p>"}
    Quiz: {"questions": [...]}
  */
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lessons_course ON lessons(course_id, sort_order);
```

### enrollments
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Assignment
  assigned_by UUID REFERENCES users(id), -- Admin who assigned
  assigned_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  
  -- Progress
  status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Time tracking
  total_time_spent_minutes INTEGER DEFAULT 0,
  
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_company ON enrollments(user_id) 
  INCLUDE (course_id) WHERE user_id IN (SELECT id FROM users);
```

### lesson_progress
```sql
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  time_spent_minutes INTEGER DEFAULT 0,
  
  -- For quizzes
  quiz_score DECIMAL(5,2),
  quiz_attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
```

### certificates
```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  pdf_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
```

### invitations
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES users(id),
  
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired
  
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitations_company ON invitations(company_id);
CREATE INDEX idx_invitations_email ON invitations(email);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  plan VARCHAR(50) NOT NULL, -- starter, pro, enterprise
  
  -- Pricing
  price_per_month DECIMAL(10,2),
  billing_cycle VARCHAR(20), -- monthly, annual
  
  -- Stripe
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  status VARCHAR(50), -- active, past_due, cancelled
  
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
```

### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(100), -- course_assigned, deadline_approaching, certificate_earned
  title VARCHAR(255),
  message TEXT,
  link_url TEXT,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
```

---

## API ENDPOINTS (SIMPLIFIED)

### Authentication
```
POST   /api/auth/signup              # Company signup
POST   /api/auth/login               # User login
POST   /api/auth/logout              # Logout
POST   /api/auth/forgot-password     # Request password reset
POST   /api/auth/reset-password      # Reset password
GET    /api/auth/me                  # Get current user
```

### Companies
```
POST   /api/companies                # Create company (signup)
GET    /api/companies/:id            # Get company details
PATCH  /api/companies/:id            # Update company settings
GET    /api/companies/:id/stats      # Company dashboard stats
```

### Users (Employees)
```
GET    /api/users                    # List employees (company admin)
POST   /api/users/invite             # Invite employee
GET    /api/users/:id                # Get employee details
PATCH  /api/users/:id                # Update employee
DELETE /api/users/:id                # Remove employee
```

### Courses
```
GET    /api/courses                  # List company's courses
POST   /api/courses                  # Create course
GET    /api/courses/:id              # Get course details
PATCH  /api/courses/:id              # Update course
DELETE /api/courses/:id              # Delete course
POST   /api/courses/:id/publish      # Publish course
```

### Lessons
```
GET    /api/courses/:courseId/lessons           # List lessons
POST   /api/courses/:courseId/lessons           # Create lesson
GET    /api/lessons/:id                         # Get lesson
PATCH  /api/lessons/:id                         # Update lesson
DELETE /api/lessons/:id                         # Delete lesson
```

### Enrollments & Assignments
```
POST   /api/enrollments                         # Assign training to employees
GET    /api/enrollments                         # List enrollments (filter by user/course)
GET    /api/enrollments/:id                     # Get enrollment details
DELETE /api/enrollments/:id                     # Unassign training

POST   /api/enrollments/:id/start               # Start course
POST   /api/enrollments/:id/lessons/:lessonId/complete  # Mark lesson complete
```

### Progress & Certificates
```
GET    /api/users/:userId/progress              # Employee progress report
GET    /api/courses/:courseId/analytics         # Course completion analytics
GET    /api/certificates                        # List certificates
GET    /api/certificates/:id                    # Get certificate
GET    /api/certificates/verify/:number         # Verify certificate (public)
```

### Media Upload
```
POST   /api/media/upload                        # Upload file (video, PDF, image)
GET    /api/media                               # List uploaded media
DELETE /api/media/:id                           # Delete media
```

### Analytics
```
GET    /api/analytics/company                   # Company dashboard analytics
GET    /api/analytics/courses/:courseId         # Course analytics
GET    /api/analytics/employees/:userId         # Employee training record
```

---

## USER FLOWS

### Flow 1: Company Signs Up

```
1. Visit outdureedge.com
   ↓
2. Click "Get Started for Your Business"
   ↓
3. Fill signup form:
   - Company name
   - Industry
   - Your email (becomes admin)
   - Password
   - Accept terms
   ↓
4. Email verification
   ↓
5. Welcome screen:
   "Welcome to Outdure Edge! Let's set up your training platform"
   ↓
6. Setup wizard:
   Step 1: Upload company logo
   Step 2: Choose your plan (Starter/Pro/Enterprise)
   Step 3: Enter billing details (Stripe)
   ↓
7. Redirect to Company Dashboard
   ↓
8. Show onboarding checklist:
   ☐ Create your first course
   ☐ Invite employees
   ☐ Assign training
```

---

### Flow 2: Admin Creates Training Course

```
1. Company admin logs in → Dashboard
   ↓
2. Click "Create Course"
   ↓
3. Fill course details:
   - Title: "Safety Training 2025"
   - Description: "Annual safety training for all employees"
   - Category: "Compliance"
   - Estimated duration: "2 hours"
   - Upload thumbnail
   ↓
4. Click "Create" → Course created (draft)
   ↓
5. Redirect to Course Builder
   ↓
6. Add lessons:
   
   Lesson 1:
   - Type: Video
   - Title: "Introduction to Workplace Safety"
   - Upload video file (or paste YouTube URL)
   
   Lesson 2:
   - Type: Document
   - Title: "Safety Guidelines PDF"
   - Upload PDF file
   
   Lesson 3:
   - Type: Quiz
   - Title: "Safety Knowledge Check"
   - Add questions:
     Q1: What should you do in case of fire? (MCQ)
     Q2: Where are the fire extinguishers located? (MCQ)
     Q3: True or False: You can block emergency exits (True/False)
   - Set passing score: 80%
   
   Lesson 4:
   - Type: Text
   - Title: "Summary and Next Steps"
   - Enter rich text content
   ↓
7. Preview course
   ↓
8. Click "Publish Course"
   ↓
9. Course now available to assign to employees
```

---

### Flow 3: Admin Invites Employees & Assigns Training

```
1. Admin → "Employees" section
   ↓
2. Click "Invite Employees"
   ↓
3. Options:
   A) Enter emails manually (comma-separated)
   B) Upload CSV file with columns: Email, First Name, Last Name
   ↓
4. Select option A, enter:
   - john.doe@company.com
   - jane.smith@company.com
   - mike.johnson@company.com
   ↓
5. Click "Send Invitations"
   ↓
6. System sends email to each:
   
   Subject: "You've been invited to Outdure Edge Training"
   
   Body:
   "Hi,
   
   Your company (Acme Corp) has invited you to join their training platform.
   
   Click here to create your account: [Link with token]
   
   Once registered, you'll have access to assigned training courses.
   
   - Outdure Edge Team"
   ↓
7. Employees click link → Create password → Account created
   ↓
8. Admin sees employees in "Employees" list
   ↓
9. Admin assigns training:
   - Select employees: [✓] John, [✓] Jane, [✓] Mike
   - Select course: "Safety Training 2025"
   - Set due date: "February 28, 2025"
   - Click "Assign Training"
   ↓
10. System creates enrollments
    ↓
11. Sends email to employees:
    
    Subject: "New Training Assigned: Safety Training 2025"
    
    Body:
    "Hi John,
    
    You've been assigned a new training course:
    
    Course: Safety Training 2025
    Due Date: February 28, 2025
    Estimated Time: 2 hours
    
    Start training now: [Link]
    
    - Outdure Edge"
```

---

### Flow 4: Employee Completes Training

```
1. Employee receives assignment email → Clicks link
   ↓
2. Login (or prompted to set password if first time)
   ↓
3. Redirect to Employee Dashboard showing:
   
   Assigned Training:
   - Safety Training 2025 [Not Started] Due: Feb 28
   
   Click "Start Training"
   ↓
4. Course Player opens:
   
   Left Sidebar: Lesson list
   - ✓ Lesson 1: Introduction to Workplace Safety (completed)
   - → Lesson 2: Safety Guidelines PDF (current)
   - ○ Lesson 3: Safety Knowledge Check (locked)
   - ○ Lesson 4: Summary (locked)
   
   Main Area: Lesson content
   
   Top: Progress bar (25% complete)
   ↓
5. Employee watches Lesson 1 video
   ↓
6. Video ends → "Mark as Complete" button appears
   ↓
7. Click "Mark as Complete" → Lesson 2 unlocks
   ↓
8. Employee views PDF in Lesson 2 → Click "Mark as Complete"
   ↓
9. Lesson 3 (Quiz) unlocks
   ↓
10. Employee takes quiz:
    - Answers 3 questions
    - Clicks "Submit Quiz"
    ↓
11. Quiz results show:
    - Score: 100% (3/3 correct)
    - Status: PASSED ✓
    ↓
12. Lesson 4 unlocks
    ↓
13. Employee reads summary text → Click "Mark as Complete"
    ↓
14. Progress bar shows 100%
    ↓
15. Course completion modal appears:
    
    "🎉 Congratulations!
    
    You've completed Safety Training 2025
    
    Your certificate is ready!
    
    [View Certificate] [Back to Dashboard]"
    ↓
16. Click "View Certificate"
    ↓
17. Certificate displays:
    
    ╔══════════════════════════════════════╗
    ║                                      ║
    ║    CERTIFICATE OF COMPLETION         ║
    ║                                      ║
    ║    This certifies that               ║
    ║    JOHN DOE                          ║
    ║    has successfully completed        ║
    ║                                      ║
    ║    Safety Training 2025              ║
    ║                                      ║
    ║    Date: January 29, 2025            ║
    ║    Certificate #: CERT-2025-001234   ║
    ║                                      ║
    ║    [Company Logo]                    ║
    ║                                      ║
    ╚══════════════════════════════════════╝
    
    [Download PDF] [Share] [Verify]
    ↓
18. Employee downloads certificate
    ↓
19. Admin receives notification:
    "John Doe completed Safety Training 2025"
```

---

### Flow 5: Admin Views Analytics

```
1. Admin → Dashboard
   ↓
2. Dashboard shows:
   
   ┌─────────────────────────────────────────────┐
   │  Company Overview                           │
   ├─────────────────────────────────────────────┤
   │  Total Employees: 45                        │
   │  Active Courses: 8                          │
   │  Courses Completed (This Month): 23         │
   │  Avg Completion Rate: 78%                   │
   └─────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────┐
   │  Training Status                            │
   ├─────────────────────────────────────────────┤
   │  ▓▓▓▓▓▓▓▓░░ 78% Completed                  │
   │  ▓▓░░░░░░░░ 15% In Progress                │
   │  ▓░░░░░░░░░  7% Not Started                │
   └─────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────┐
   │  Courses                                    │
   ├─────────────────────────────────────────────┤
   │  Safety Training 2025                       │
   │  Assigned: 45  |  Completed: 42  |  93%    │
   │                                             │
   │  Onboarding Program                         │
   │  Assigned: 12  |  Completed: 8   |  67%    │
   │                                             │
   │  Compliance Training                        │
   │  Assigned: 45  |  Completed: 30  |  67%    │
   └─────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────┐
   │  Upcoming Deadlines                         │
   ├─────────────────────────────────────────────┤
   │  5 employees - Safety Training (2 days)     │
   │  3 employees - HR Policies (5 days)         │
   └─────────────────────────────────────────────┘
   ↓
3. Admin clicks "Safety Training 2025" → Course Analytics
   ↓
4. Course Analytics shows:
   
   ┌─────────────────────────────────────────────┐
   │  Safety Training 2025                       │
   ├─────────────────────────────────────────────┤
   │  Total Enrolled: 45                         │
   │  Completed: 42 (93%)                        │
   │  In Progress: 3 (7%)                        │
   │  Not Started: 0                             │
   │                                             │
   │  Avg Time to Complete: 1.8 hours            │
   │  Avg Quiz Score: 94%                        │
   └─────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────┐
   │  Employee Progress                          │
   ├─────────────────────────────────────────────┤
   │  Name           Status      Completion      │
   │  John Doe       ✓ Done      100%  Jan 29    │
   │  Jane Smith     ✓ Done      100%  Jan 28    │
   │  Mike Johnson   In Progress  75%            │
   │  Sarah Lee      ✓ Done      100%  Jan 27    │
   │  ...                                        │
   └─────────────────────────────────────────────┘
   
   [Export Report (CSV)]
   ↓
5. Admin clicks "Export Report"
   ↓
6. CSV downloaded with:
   Employee Name, Email, Status, Progress %, Started Date, Completed Date, Quiz Score, Certificate #
```

---

## PRICING PLANS

### Starter Plan - $99/month
- Up to 25 employees
- Unlimited courses
- Basic analytics
- Email support
- Certificate generation

### Pro Plan - $249/month
- Up to 100 employees
- Unlimited courses
- Advanced analytics & reports
- Priority support
- Custom branding
- API access

### Enterprise Plan - Custom pricing
- Unlimited employees
- Unlimited courses
- Dedicated account manager
- SSO integration
- Custom integrations
- White-label option

**Or**: Per-employee pricing (e.g., $10/employee/month)

---

## UI PAGES (SIMPLIFIED)

### Public Site

#### 1. Homepage (outdureedge.com)
- Hero: "Training Platform for Modern Businesses"
- Features: Course creation, Employee management, Progress tracking, Certificates
- Pricing table
- Testimonials
- CTA: "Start Free Trial"

#### 2. Pricing Page
- Plan comparison table
- FAQ
- CTA: "Get Started"

#### 3. About Page
- Mission, team, story

#### 4. Contact Page
- Contact form, email, phone

---

### Authentication

#### 5. Company Signup Page
- Company name, industry
- Your name, email, password
- Terms checkbox
- "Create Account" button

#### 6. Login Page
- Email, password
- "Forgot password?" link
- "Log In" button

#### 7. Employee Invitation Accept Page
- Welcome message
- "You've been invited to join [Company Name]"
- Set password form
- "Create Account" button

---

### Company Admin Portal

#### 8. Dashboard
- Overview metrics cards
- Training status chart
- Courses list with completion rates
- Upcoming deadlines
- Recent activity

#### 9. Courses Page
- List of company's courses
- Search and filter
- "Create Course" button
- Course cards showing title, status, enrollments, completion rate

#### 10. Course Builder
- Course details form (title, description, thumbnail, category)
- Lessons list (drag to reorder)
- "Add Lesson" button
- For each lesson:
  - Type selector (Video, Document, Text, Quiz)
  - Content upload/editor
  - "Save Lesson"
- "Preview Course" button
- "Publish Course" button

#### 11. Employees Page
- List of employees
- Search and filter
- "Invite Employees" button
- Employee table: Name, Email, Joined Date, Assigned Courses, Completion Rate, Actions
- Actions: View Progress, Edit, Remove

#### 12. Assign Training Page
- Select employees (checkboxes or multi-select)
- Select course
- Set due date (optional)
- Send notification checkbox
- "Assign Training" button

#### 13. Analytics Page
Tabs:
- Overview: Company-wide stats
- Courses: Per-course analytics
- Employees: Per-employee training records
- Reports: Export options

#### 14. Settings Page
Tabs:
- Company Profile: Name, logo, industry
- Billing: Plan, payment method, invoices
- Branding: Colors, logo (Pro+)
- Notifications: Email templates
- Users: Company admins

---

### Employee Portal

#### 15. Employee Dashboard
- Welcome message
- Assigned Training section:
  - Not Started courses
  - In Progress courses (with progress bars)
- Completed Training section
- Certificates section

#### 16. Course Player
- Left Sidebar: Lesson navigation
  - Show progress (✓ completed, → current, ○ locked)
- Main Area: Lesson content
  - Video player with controls
  - PDF viewer
  - Text content
  - Quiz interface
- Top Bar: Course title, progress bar, "Mark as Complete" button
- "Next Lesson" button

#### 17. Quiz Page
- Question counter (Question 1 of 5)
- Question text
- Answer options (radio buttons for MCQ, checkboxes for multi-select)
- "Previous" and "Next" buttons
- "Submit Quiz" button on last question

#### 18. Quiz Results Page
- Score display (3/3 correct - 100%)
- Pass/Fail status
- Correct/incorrect answers breakdown
- "Continue" button

#### 19. Certificate View Page
- Certificate preview (PDF or styled HTML)
- Download PDF button
- Share buttons (LinkedIn, email)
- Verification number displayed

#### 20. Employee Profile Page
- Avatar upload
- Edit name, email
- Change password
- Notification preferences

---

## TECHNICAL STACK (SIMPLIFIED)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **Video**: Video.js
- **Charts**: Recharts

### Backend
- **Framework**: Next.js API Routes (or NestJS if prefer separate)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js or JWT
- **File Storage**: AWS S3 or Supabase Storage
- **Email**: SendGrid or Resend
- **Payments**: Stripe

### Infrastructure
- **Hosting**: Vercel (frontend + API) or Railway
- **Database**: Supabase or Railway
- **Storage**: S3 or Supabase Storage
- **CDN**: CloudFlare (for video/media)

---

## MVP FEATURES (2-3 Months)

✅ **Must Have**:
1. Company signup and onboarding
2. Employee invitation system
3. Course creation with lessons:
   - Video (upload or YouTube embed)
   - Document (PDF upload)
   - Text (rich text editor)
   - Quiz (MCQ, True/False)
4. Course assignment to employees
5. Employee learning portal
6. Progress tracking
7. Certificate generation
8. Basic analytics dashboard
9. Stripe billing integration
10. Email notifications

❌ **Phase 2**:
- Advanced quiz types (fill-in-blank, matching, etc.)
- SCORM support
- Live sessions
- Discussion forums
- Mobile app
- SSO for enterprise
- Custom branding (white-label)
- API for integrations

---

This simplified approach focuses on the core value: **Businesses can easily create training, assign it to employees, and track completion** - all on the Outdure Edge platform.
