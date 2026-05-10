# UI Pages & User Flows

## UI Sitemap

### PUBLIC SITE (Unauthenticated Visitors)

```
/
├─ / (Home)
├─ /courses (Course Catalog)
│  └─ /courses/{slug} (Course Detail / Sales Page)
├─ /bundles
│  └─ /bundles/{slug}
├─ /pricing (Membership Plans)
├─ /about
├─ /blog
│  └─ /blog/{post-slug}
├─ /contact
├─ /login
├─ /signup
├─ /forgot-password
├─ /reset-password
├─ /terms
├─ /privacy
├─ /refund-policy
└─ /checkout
```

---

### LEARNER PORTAL (Authenticated Students)

```
/dashboard
├─ /dashboard (Overview)
│  ├─ My Learning
│  ├─ Continue Learning (last accessed)
│  ├─ Upcoming Lessons
│  ├─ Achievements
│  └─ Recent Activity
│
├─ /my-courses (All Enrolled Courses)
│  ├─ Active
│  ├─ Completed
│  └─ Archived
│
├─ /course/{slug}/learn (Course Player)
│  ├─ Sidebar: Curriculum
│  ├─ Main: Lesson Content
│  ├─ Top: Progress Bar
│  ├─ Tabs: Overview, Notes, Resources, Community
│  └─ Next Lesson CTA
│
├─ /certificates (My Certificates)
│  └─ /certificates/{id} (View/Download)
│
├─ /community
│  ├─ /community/{space-slug}
│  │  └─ /community/{space-slug}/{channel-slug}
│  │     └─ /community/{space-slug}/{channel-slug}/{post-id}
│  └─ My Posts
│
├─ /calendar (Upcoming Live Sessions)
│
├─ /messages (Direct Messages - Phase 2)
│
├─ /notifications
│
└─ /settings
   ├─ Profile
   ├─ Password
   ├─ Notifications
   └─ Billing
```

---

### INSTRUCTOR PORTAL

```
/instructor
├─ /instructor/dashboard
│  ├─ Overview Stats (students, revenue, engagement)
│  ├─ Recent Activity
│  └─ Quick Actions
│
├─ /instructor/courses
│  ├─ All Courses
│  ├─ Published
│  ├─ Drafts
│  └─ Archived
│
├─ /instructor/courses/new (Create Course)
│
├─ /instructor/courses/{id}/edit
│  ├─ Overview
│  ├─ Curriculum (Modules & Lessons)
│  ├─ Pricing
│  ├─ Settings
│  ├─ Students
│  └─ Analytics
│
├─ /instructor/courses/{id}/curriculum (Course Builder)
│  ├─ Drag-and-drop modules/lessons
│  ├─ Add Content: Video, Quiz, Assignment, Text
│  └─ Preview
│
├─ /instructor/students
│  ├─ All Students
│  ├─ By Course
│  └─ Student Detail (progress, submissions)
│
├─ /instructor/assignments
│  ├─ Pending Grading
│  ├─ Graded
│  └─ Assignment Detail (grade, feedback)
│
├─ /instructor/analytics
│  ├─ Revenue
│  ├─ Enrollment Trends
│  ├─ Engagement (watch time, completion)
│  └─ Course Performance
│
├─ /instructor/community (Course Communities)
│
└─ /instructor/settings
   ├─ Profile
   ├─ Payout Settings
   └─ Notifications
```

---

### SCHOOL ADMIN PANEL

```
/admin
├─ /admin/dashboard
│  ├─ Overview KPIs
│  ├─ Revenue Chart
│  ├─ Enrollment Trends
│  ├─ Recent Orders
│  └─ System Health
│
├─ /admin/courses
│  ├─ All Courses
│  ├─ Create Course
│  ├─ Categories
│  └─ Course Detail/Edit
│
├─ /admin/users
│  ├─ All Users
│  ├─ Add User
│  ├─ Roles & Permissions
│  └─ User Detail (profile, enrollments, progress)
│
├─ /admin/commerce
│  ├─ Products
│  ├─ Orders
│  ├─ Coupons
│  ├─ Affiliates
│  └─ Refunds
│
├─ /admin/community
│  ├─ Spaces & Channels
│  ├─ Posts
│  ├─ Reported Content
│  └─ Moderation Queue
│
├─ /admin/analytics
│  ├─ Dashboard
│  ├─ Revenue
│  ├─ Learners
│  ├─ Engagement
│  ├─ Course Performance
│  └─ Export Reports
│
├─ /admin/organizations
│  ├─ All Organizations
│  ├─ Create Organization
│  └─ Organization Detail
│     ├─ Members
│     ├─ Seat Purchases
│     ├─ Assigned Courses
│     └─ Analytics
│
├─ /admin/site
│  ├─ Pages (Page Builder)
│  │  ├─ Home
│  │  ├─ Course Catalog
│  │  ├─ Custom Pages
│  │  └─ Legal Pages
│  ├─ Navigation
│  ├─ Theme
│  │  ├─ Colors
│  │  ├─ Typography
│  │  ├─ Layout
│  │  └─ Custom CSS
│  └─ SEO
│
├─ /admin/integrations
│  ├─ Stripe
│  ├─ Email Provider
│  ├─ Webhooks
│  ├─ API Keys
│  └─ Zapier
│
├─ /admin/automations
│  ├─ Rules
│  ├─ Create Rule
│  └─ Execution Logs
│
├─ /admin/certificates
│  ├─ Templates
│  ├─ Create Template
│  ├─ Issued Certificates
│  └─ Verify Certificate
│
├─ /admin/media
│  ├─ Library
│  └─ Upload
│
└─ /admin/settings
   ├─ General
   ├─ Domain
   ├─ Billing
   ├─ Email Templates
   ├─ Legal
   └─ Security
```

---

### ORGANIZATION MANAGER PORTAL (B2B)

```
/organization
├─ /organization/dashboard
│  ├─ Seats Overview
│  ├─ Member Activity
│  ├─ Completion Rates
│  └─ Top Courses
│
├─ /organization/members
│  ├─ All Members
│  ├─ Invite Members
│  └─ Member Detail (progress, courses)
│
├─ /organization/courses
│  ├─ Available Courses (catalog)
│  ├─ Assigned Courses
│  └─ Assign Course to Members
│
├─ /organization/seats
│  ├─ Active Seat Purchases
│  ├─ Purchase More Seats
│  └─ Usage Report
│
├─ /organization/analytics
│  ├─ Engagement
│  ├─ Completion Rates
│  ├─ Time Spent
│  └─ Export Reports
│
└─ /organization/settings
   ├─ Organization Profile
   ├─ Billing
   └─ Notifications
```

---

### AFFILIATE PORTAL

```
/affiliate
├─ /affiliate/dashboard
│  ├─ Performance Overview
│  ├─ Clicks, Conversions, Revenue
│  ├─ Commission Earned
│  └─ Recent Conversions
│
├─ /affiliate/links
│  ├─ Generate Links
│  └─ Link Performance
│
├─ /affiliate/commissions
│  ├─ Pending
│  ├─ Approved
│  └─ Paid
│
├─ /affiliate/payouts
│  ├─ Request Payout
│  └─ Payout History
│
└─ /affiliate/settings
   ├─ Profile
   └─ Payment Details
```

---

### PLATFORM SUPER ADMIN (Internal)

```
/platform-admin
├─ /platform-admin/dashboard
│  ├─ Platform-wide KPIs
│  ├─ Schools Overview
│  ├─ Revenue
│  └─ System Health
│
├─ /platform-admin/schools
│  ├─ All Schools
│  ├─ Create School
│  └─ School Detail
│     ├─ Overview
│     ├─ Users
│     ├─ Billing
│     ├─ Usage
│     └─ Impersonate Owner
│
├─ /platform-admin/billing
│  ├─ Plans
│  ├─ Subscriptions
│  └─ Revenue
│
├─ /platform-admin/support
│  ├─ Tickets
│  └─ Impersonate User
│
├─ /platform-admin/analytics
│  ├─ Platform Metrics
│  └─ School Comparisons
│
└─ /platform-admin/settings
   ├─ Feature Flags
   ├─ System Config
   └─ Logs
```

---

## Key UI Pages - Detailed Components

### 1. HOME PAGE (Public)

**Purpose:** Convert visitors into customers

**Sections:**
```
┌──────────────────────────────────────┐
│ NAVIGATION                           │
│ Logo | Courses | Pricing | Login    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ HERO                                 │
│ • Headline                           │
│ • Subheadline                        │
│ • Primary CTA (Browse Courses)       │
│ • Secondary CTA (Sign Up Free)       │
│ • Hero Image/Video                   │
│ • Social Proof (Students, Ratings)   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ FEATURED COURSES                     │
│ • Course Cards (3-4)                 │
│ • Thumbnail, Title, Instructor       │
│ • Rating, Students, Price            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ BENEFITS / FEATURES                  │
│ • Icon + Title + Description         │
│ • 3-6 benefits (grid)                │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ STATS / SOCIAL PROOF                 │
│ • 10,000+ Students                   │
│ • 500+ Courses                       │
│ • 4.8★ Average Rating                │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ TESTIMONIALS                         │
│ • Student reviews (carousel)         │
│ • Avatar, Name, Quote                │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ CTA SECTION                          │
│ • "Start Learning Today"             │
│ • CTA Button                         │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ FOOTER                               │
│ • Links, Social, Legal               │
└──────────────────────────────────────┘
```

**Actions:**
- Browse courses → `/courses`
- Sign up → `/signup`
- Login → `/login`
- View course → `/courses/{slug}`

---

### 2. COURSE CATALOG PAGE (Public)

**Purpose:** Help users find courses

**Components:**
```
┌──────────────────────────────────────┐
│ HEADER                               │
│ Search Bar (with autocomplete)       │
└──────────────────────────────────────┘

┌─────────┬────────────────────────────┐
│ FILTERS │ COURSE GRID                │
│         │                            │
│ □ All   │ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│ □ Cat 1 │ │C1│ │C2│ │C3│ │C4│       │
│ □ Cat 2 │ └──┘ └──┘ └──┘ └──┘       │
│         │                            │
│ Price   │ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│ ○ All   │ │C5│ │C6│ │C7│ │C8│       │
│ ○ Free  │ └──┘ └──┘ └──┘ └──┘       │
│ ○ Paid  │                            │
│         │ Pagination: 1 2 3 ... 10   │
│ Level   │                            │
│ □ Begin │                            │
│ □ Inter │                            │
│ □ Adv   │                            │
└─────────┴────────────────────────────┘
```

**Each Course Card:**
- Thumbnail
- Title
- Instructor (avatar + name)
- Short description
- Rating + review count
- Price (or "Free")
- "View Course" button

**Filters:**
- Search
- Category
- Price (Free/Paid)
- Level (Beginner/Intermediate/Advanced)
- Rating
- Sort (Popular, Newest, Price)

**Actions:**
- Search courses
- Filter/sort
- Click course → `/courses/{slug}`

---

### 3. COURSE DETAIL / SALES PAGE (Public)

**Purpose:** Convince users to enroll

**Layout:**
```
┌────────────────────────┬──────────────┐
│ COURSE HEADER          │ PRICING CARD │
│ • Title                │ • Price      │
│ • Tagline              │ • Enroll Now │
│ • Instructor (avatar)  │ • 30-day MB  │
│ • Rating + Reviews     │ • Includes:  │
│ • Students enrolled    │   - X hours  │
│                        │   - Cert     │
│ VIDEO PREVIEW          │   - Lifetime │
│ (or thumbnail)         │              │
└────────────────────────┴──────────────┘

┌──────────────────────────────────────┐
│ TABS                                 │
│ • Overview | Curriculum | Reviews    │
└──────────────────────────────────────┘

OVERVIEW TAB:
┌──────────────────────────────────────┐
│ What You'll Learn                    │
│ ✓ Skill 1                            │
│ ✓ Skill 2                            │
│ ✓ Skill 3                            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Description                          │
│ (Rich text content)                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Requirements                         │
│ • Basic JavaScript                   │
│ • Computer with internet             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Instructor Bio                       │
│ • Avatar, name, title                │
│ • Bio, credentials                   │
│ • Courses taught, students           │
└──────────────────────────────────────┘

CURRICULUM TAB:
┌──────────────────────────────────────┐
│ ▼ Module 1: Introduction (5 lessons) │
│   • Lesson 1: Welcome (5:23) [FREE]  │
│   • Lesson 2: Overview (8:45) [LOCK] │
│   • Lesson 3: Quiz                   │
│   ...                                │
│                                      │
│ ▼ Module 2: Advanced Topics         │
│   • Lesson 1: ...                    │
└──────────────────────────────────────┘

REVIEWS TAB:
┌──────────────────────────────────────┐
│ 4.8★ (342 reviews)                   │
│                                      │
│ ★★★★★ John Doe                       │
│ "Great course! Learned a lot..."     │
│                                      │
│ ★★★★☆ Jane Smith                     │
│ "Very helpful but..."                │
└──────────────────────────────────────┘
```

**Sticky Pricing Card (Desktop):**
- Price
- "Enroll Now" button
- Course includes:
  - X hours of video
  - Downloadable resources
  - Certificate of completion
  - Lifetime access
  - 30-day money-back guarantee

**Free Preview:**
- Play first lesson(s) without enrolling

**Actions:**
- Enroll → `/checkout?product={id}`
- Preview lesson → Modal player
- View instructor → `/instructors/{id}` (Phase 2)

---

### 4. CHECKOUT PAGE

**Purpose:** Complete purchase

**Layout:**
```
┌────────────────────┬─────────────────┐
│ ORDER SUMMARY      │ PAYMENT FORM    │
│                    │                 │
│ Course Thumbnail   │ Email           │
│ Course Title       │ ┌─────────────┐ │
│ Instructor         │ │             │ │
│                    │ └─────────────┘ │
│ Subtotal: $199.00  │                 │
│ Discount: -$39.80  │ Card Number     │
│ Total:    $159.20  │ ┌─────────────┐ │
│                    │ │             │ │
│ Have a coupon?     │ └─────────────┘ │
│ ┌────────┐ [Apply] │                 │
│ │ SAVE20 │         │ Expiry  CVC     │
│ └────────┘         │ ┌─────┐ ┌─────┐ │
│                    │ │     │ │     │ │
└────────────────────┤ └─────┘ └─────┘ │
                     │                 │
                     │ Name on Card    │
                     │ ┌─────────────┐ │
                     │ │             │ │
                     │ └─────────────┘ │
                     │                 │
                     │ [Complete Order]│
                     └─────────────────┘
```

**Flow:**
1. User lands on checkout (product pre-selected)
2. If not logged in → show login/signup
3. If logged in → show payment form (Stripe)
4. Apply coupon (optional)
5. Complete payment
6. Redirect to success page
7. Auto-enroll in course
8. Send confirmation email

**Stripe Integration:**
- Stripe Elements for card input
- Handle 3D Secure
- Handle errors (card declined, etc.)

**Actions:**
- Apply coupon
- Complete order → Success page
- Cancel → Back to course page

---

### 5. LEARNER DASHBOARD (Student Portal)

**Purpose:** Central hub for learners

**Layout:**
```
┌──────────────────────────────────────┐
│ WELCOME BANNER                       │
│ "Welcome back, John!"                │
│ Your progress: 45% across 5 courses  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ CONTINUE LEARNING                    │
│ Last accessed: Advanced React        │
│ ┌──────────────────────────────────┐ │
│ │ Thumbnail                        │ │
│ │ Lesson: "React Hooks"            │ │
│ │ 45% complete                     │ │
│ │ [Continue] ───────────────────>  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ MY COURSES                           │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│ │ C1 │ │ C2 │ │ C3 │ │ C4 │         │
│ │35% │ │68% │ │90% │ │12% │         │
│ └────┘ └────┘ └────┘ └────┘         │
│                                      │
│ [View All Courses]                   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ UPCOMING                             │
│ • Live Session: "Q&A" - Jan 25, 2pm  │
│ • Assignment Due: "Project" - Jan 27 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ ACHIEVEMENTS                         │
│ 🏅 Completed 3 courses               │
│ 🏅 Perfect quiz score                │
│ [View All Certificates]              │
└──────────────────────────────────────┘
```

**Actions:**
- Continue learning → `/course/{slug}/learn`
- View course → `/my-courses`
- View certificates → `/certificates`
- Browse new courses → `/courses`

---

### 6. COURSE PLAYER (Learning Interface)

**Purpose:** Consume course content

**Layout (Desktop):**
```
┌──────────┬───────────────────────────┐
│  LOGO    │ Course: Advanced React    │
├──────────┴───────────────────────────┤
│          PROGRESS BAR [━━━━━━━━░░░░] │
├──────────┬───────────────────────────┤
│ SIDEBAR  │ LESSON CONTENT            │
│          │                           │
│ ▼ Mod 1  │ ┌───────────────────────┐ │
│ • L1 ✓   │ │                       │ │
│ • L2 ✓   │ │   VIDEO PLAYER        │ │
│ • L3 ▶   │ │                       │ │
│ • L4     │ └───────────────────────┘ │
│          │                           │
│ ▼ Mod 2  │ Transcript | Notes        │
│ • L1     │                           │
│ • L2     │ [Mark Complete] [Next >]  │
│          │                           │
├──────────┴───────────────────────────┤
│ Resources: slides.pdf | code.zip     │
└──────────────────────────────────────┘
```

**Sidebar (Curriculum):**
- Collapsible modules
- Lessons with:
  - Checkmark (completed)
  - Play icon (current)
  - Lock icon (not unlocked)
  - Duration
- Progress percentage per module

**Main Content Area:**
- **Video Lesson:**
  - Video player (custom controls or Vimeo/YouTube)
  - Playback speed, quality, fullscreen
  - Interactive overlays (questions, hotspots)
  - Transcript (auto-scroll with video)
  - Notes (timestamped)
  
- **Text Lesson:**
  - Rich text content
  - Images, embedded media
  
- **Quiz:**
  - Question display
  - Answer options
  - Submit & see results
  
- **Assignment:**
  - Instructions
  - File upload area
  - Submit button
  - View feedback (if graded)

**Bottom Bar:**
- Resources (downloadable files)
- Next lesson button
- Mark complete button

**Tabs:**
- Overview (lesson description)
- Notes (user's notes for this lesson)
- Resources (downloads)
- Community (lesson discussion)

**Actions:**
- Play/pause video
- Skip to next/prev lesson
- Mark lesson complete
- Add note at timestamp
- Download resources
- Ask question in community

**Mobile Responsive:**
- Sidebar becomes drawer (hamburger menu)
- Video in portrait mode
- Simplified controls

---

### 7. INSTRUCTOR DASHBOARD

**Purpose:** Instructor hub

**Layout:**
```
┌──────────────────────────────────────┐
│ OVERVIEW STATS                       │
│ ┌────────┬────────┬────────┬────────┐│
│ │ Total  │ Active │Revenue │ Rating ││
│ │Students│Students│ $5,420 │  4.8★  ││
│ │  1,250 │  842   │        │        ││
│ └────────┴────────┴────────┴────────┘│
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ MY COURSES                           │
│ ┌──────────────────────────────────┐ │
│ │ Advanced React                   │ │
│ │ 450 students | $2,100 revenue    │ │
│ │ [Edit] [Analytics] [Students]    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ JavaScript Basics                │ │
│ │ 800 students | $3,320 revenue    │ │
│ │ [Edit] [Analytics] [Students]    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [+ Create New Course]                │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ PENDING TASKS                        │
│ • 12 assignments to grade            │
│ • 3 student questions unanswered     │
│ [View All]                           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ RECENT ENROLLMENTS                   │
│ • John Doe enrolled in React - 2h ago│
│ • Jane Smith enrolled in JS - 5h ago │
└──────────────────────────────────────┘
```

**Actions:**
- Create course → `/instructor/courses/new`
- Edit course → `/instructor/courses/{id}/edit`
- View analytics → `/instructor/courses/{id}/analytics`
- Grade assignments → `/instructor/assignments`

---

### 8. COURSE BUILDER (Instructor - Curriculum Editor)

**Purpose:** Build course structure

**Layout:**
```
┌──────────────────────────────────────┐
│ Course: Advanced React               │
│ Tabs: Overview|Curriculum|Pricing|... │
└──────────────────────────────────────┘

CURRICULUM TAB:
┌──────────────────────────────────────┐
│ [+ Add Module]                       │
│                                      │
│ ═══ Module 1: Introduction ═══  ⋮    │
│     [+ Add Lesson]                   │
│                                      │
│     ▣ Lesson 1: Welcome Video    ⋮   │
│       Type: Video | 5:23 | Published │
│       [Edit]                         │
│                                      │
│     ▣ Lesson 2: Course Overview  ⋮   │
│       Type: Text | Published         │
│       [Edit]                         │
│                                      │
│     ▣ Quiz 1: Introduction Quiz  ⋮   │
│       Type: Quiz | 5 questions       │
│       [Edit]                         │
│                                      │
│ ═══ Module 2: React Basics ═══  ⋮    │
│     [+ Add Lesson]                   │
│                                      │
│     ▣ Lesson 1: Components       ⋮   │
│       Type: Video | 12:45 | Draft    │
│       [Edit]                         │
└──────────────────────────────────────┘

[Save Draft] [Publish Changes]
```

**Features:**
- Drag-and-drop to reorder modules/lessons
- Click to edit module/lesson
- Add different lesson types:
  - Video (upload or embed)
  - Text (rich editor)
  - Quiz
  - Assignment
  - Download
  - Live session
- Set lesson as free preview
- Set drip schedule

**Lesson Editor Modal:**
```
┌──────────────────────────────────────┐
│ Edit Lesson: Welcome Video      [X]  │
├──────────────────────────────────────┤
│ Title: [Welcome to the course]       │
│                                      │
│ Type: [Video ▼]                      │
│                                      │
│ Video Source:                        │
│ ○ Upload  ● URL                      │
│ URL: [https://vimeo.com/...]         │
│                                      │
│ Description:                         │
│ ┌──────────────────────────────────┐ │
│ │ Rich text editor...              │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ☑ Free Preview                       │
│ ☐ Allow downloads                    │
│                                      │
│ Resources:                           │
│ • slides.pdf [Remove]                │
│ [+ Add Resource]                     │
│                                      │
│         [Cancel] [Save]              │
└──────────────────────────────────────┘
```

**Actions:**
- Add module/lesson
- Reorder via drag-and-drop
- Edit lesson → Modal
- Delete module/lesson
- Preview course
- Save draft
- Publish changes

---

### 9. SCHOOL ADMIN - DASHBOARD

**Purpose:** School management hub

**Layout:**
```
┌──────────────────────────────────────┐
│ OVERVIEW KPIs                        │
│ ┌──────┬──────┬──────┬──────┬──────┐ │
│ │Revenue│Users │Course│Orders│Compl%││
│ │$15.2K│1,250 │  42  │ 156  │ 68%  ││
│ │+12%  │ +8%  │  +3  │ +15% │ +5%  ││
│ └──────┴──────┴──────┴──────┴──────┘ │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ REVENUE CHART (Last 30 Days)         │
│ ┌──────────────────────────────────┐ │
│ │     ╱╲                           │ │
│ │    ╱  ╲    ╱╲                    │ │
│ │   ╱    ╲  ╱  ╲                   │ │
│ │ ─────────────────────────────    │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

┌─────────────────┬────────────────────┐
│ TOP COURSES     │ RECENT ORDERS      │
│ 1. React - $5.2K│ #ORD-001 - $199    │
│ 2. JS - $4.1K   │ #ORD-002 - $99     │
│ 3. CSS - $3.8K  │ #ORD-003 - $299    │
└─────────────────┴────────────────────┘

┌──────────────────────────────────────┐
│ QUICK ACTIONS                        │
│ [+ Add User] [+ Create Course]       │
│ [View Orders] [Generate Report]      │
└──────────────────────────────────────┘
```

**Actions:**
- View detailed analytics → `/admin/analytics`
- Manage users → `/admin/users`
- Manage courses → `/admin/courses`
- View orders → `/admin/commerce/orders`

---

### 10. SCHOOL ADMIN - USERS PAGE

**Purpose:** Manage all users

**Layout:**
```
┌──────────────────────────────────────┐
│ Users                       [+ Add]  │
├──────────────────────────────────────┤
│ Search: [john...]          Filters ▼ │
├──────────────────────────────────────┤
│ ┌──┬────────┬─────────┬──────┬─────┐│
│ │☑│ Name   │ Email   │ Role │ Join││
│ ├──┼────────┼─────────┼──────┼─────┤│
│ │☐│John Doe│john@... │Learn │1/15││
│ │☐│Jane S. │jane@... │Instr │1/10││
│ │☐│Bob A.  │bob@...  │Learn │1/08││
│ └──┴────────┴─────────┴──────┴─────┘│
│                                      │
│ Bulk Actions: [Delete] [Export]      │
│                                      │
│ Pagination: 1 2 3 ... 10             │
└──────────────────────────────────────┘
```

**Filters:**
- Role
- Status (Active/Suspended)
- Date joined
- Enrollment status

**User Detail Modal:**
```
┌──────────────────────────────────────┐
│ User: John Doe                  [X]  │
├──────────────────────────────────────┤
│ Email: john@example.com              │
│ Role: Learner                        │
│ Joined: Jan 15, 2024                 │
│ Status: Active                       │
│                                      │
│ ENROLLMENTS (5)                      │
│ • Advanced React - 45% complete      │
│ • JavaScript Basics - 90% complete   │
│ ...                                  │
│                                      │
│ CERTIFICATES (2)                     │
│ • JavaScript Basics - Jan 20, 2024   │
│ • CSS Fundamentals - Jan 18, 2024    │
│                                      │
│ [Edit] [Suspend] [Delete]            │
└──────────────────────────────────────┘
```

**Actions:**
- Add user → Modal (invite via email)
- Edit user → Modal
- Assign role → Dropdown
- View enrollments
- Delete user

---

## User Flows

### FLOW 1: School Signup → First Course Published

**Actors:** New School Owner

**Steps:**
1. **Visit landing page** → `/`
2. **Click "Create Your School"** → `/signup`
3. **Sign up form:**
   - Email, Password, School Name
   - Submit
4. **Email verification:**
   - Receive email
   - Click link
   - Email verified ✓
5. **Onboarding wizard** (multi-step):
   - **Step 1: Tell us about your school**
     - School category (education, business training, etc.)
     - Number of courses planned
   - **Step 2: Customize branding**
     - Upload logo
     - Choose primary color
     - Choose font
     - Preview
   - **Step 3: Connect Stripe** (for payments)
     - Click "Connect Stripe"
     - OAuth to Stripe
     - Return with credentials saved
   - **Step 4: Create your first course** (optional, can skip)
     - Course title
     - Category
     - Click "Create Course" → Draft created
   - **Step 5: Choose plan**
     - Starter (free)
     - Professional ($99/mo)
     - Business ($299/mo)
     - Select plan
   - **Completion:**
     - "Your school is ready!"
     - Primary CTA: "Go to Dashboard"
     - Secondary: "Browse Templates"
6. **Redirected to:** `/admin/dashboard`
7. **Owner navigates to:** `/admin/courses`
8. **Click existing draft or "Create Course"**
9. **Course creation:**
   - **Overview tab:**
     - Title: "Advanced React"
     - Slug: "advanced-react"
     - Description (rich text)
     - Category
     - Thumbnail upload
     - What you'll learn (list)
     - Requirements (list)
   - **Curriculum tab:**
     - Add Module 1
     - Add Lesson 1 (Video)
       - Upload video or paste URL
       - Title, description
     - Add Lesson 2 (Quiz)
       - Add questions
     - Repeat
   - **Pricing tab:**
     - One-time price: $199
     - Or subscription: $29/month
     - Or free
   - **Settings tab:**
     - Certificate enabled
     - Drip schedule (optional)
10. **Preview course** → See learner view
11. **Click "Publish"** → Course goes live
12. **Success message:** "Course published! Share your course:"
    - Copy link: `https://myschool.outdure-edge.com/courses/advanced-react`
13. **Next steps suggested:**
    - Customize landing page
    - Invite instructors
    - Set up coupons

**Result:** School is live with first published course ✓

---

### FLOW 2: Instructor Creates Course

**Actors:** Instructor (already has account)

**Steps:**
1. **Login** → `/login`
2. **Redirected to:** `/instructor/dashboard`
3. **Click "Create New Course"** → `/instructor/courses/new`
4. **Course setup wizard:**
   - Step 1: Basics
     - Title, tagline, category
   - Step 2: Curriculum (same as admin flow)
   - Step 3: Pricing
   - Step 4: Review
5. **Save as draft** → Course saved
6. **Continue editing** → `/instructor/courses/{id}/edit`
7. **Build curriculum:**
   - Add modules
   - Add lessons (videos, quizzes, assignments)
   - Upload resources
8. **Set pricing:**
   - Free or paid
   - If paid: set price, payment plans
9. **Preview course** → See student view
10. **Click "Submit for Review"** (if school requires approval)
    - Admin gets notified
    - Admin reviews and approves
11. **Or "Publish"** (if instructor has permission)
    - Course goes live immediately
12. **Share course link** with audience

**Result:** Course live and accepting enrollments ✓

---

### FLOW 3: Learner Purchases → Completes → Certificate

**Actors:** New Learner

**Steps:**
1. **Discover course:**
   - Search on Google → lands on course page
   - Or browses catalog → `/courses`
2. **View course detail:** `/courses/advanced-react`
3. **Watch free preview lesson** (if available)
4. **Decide to enroll**
5. **Click "Enroll Now"** → `/checkout?product=xyz`
6. **Checkout page:**
   - If not logged in → Show login/signup inline
   - Sign up:
     - Email, password
     - Or social login (Google)
   - Enter payment details (Stripe)
   - Apply coupon: "SAVE20" → Discount applied
   - Total: $159.20 (was $199)
7. **Click "Complete Purchase"**
   - Payment processed
   - Order created
   - Enrollment created
   - Redirect to success page
8. **Success page:** `/order/success?order=ORD-001`
   - "Thank you! You're enrolled."
   - Receipt emailed
   - "Start Learning" button
9. **Click "Start Learning"** → `/course/advanced-react/learn`
10. **Course player opens:**
    - First lesson auto-loads
    - Watch video
    - Progress tracked automatically
11. **Complete first lesson:**
    - Click "Mark Complete"
    - Or auto-complete when 80% watched
    - Next lesson unlocked (if drip enabled)
12. **Continue learning over days/weeks:**
    - Watch videos
    - Take quizzes (must pass with 70%)
    - Submit assignments
    - Get feedback from instructor
13. **Complete final lesson:**
    - Completion criteria met:
      - All lessons completed
      - All quizzes passed
      - All assignments submitted
14. **Certificate auto-issued:**
    - Notification: "Congratulations! Certificate ready."
    - Email sent with PDF
15. **View certificate:** `/certificates/{id}`
    - Download PDF
    - Share on LinkedIn
    - Verify with public link

**Result:** Learner completed course and earned certificate ✓

---

### FLOW 4: Organization Buys Seats → Assigns Courses → Tracks Analytics

**Actors:** Organization Manager (B2B Client)

**Steps:**
1. **Organization admin contact school owner**
2. **School owner creates organization:** `/admin/organizations/new`
   - Org name: "Acme Corp"
   - Contact email: manager@acme.com
   - Invite org manager
3. **Org manager receives invite email**
4. **Click link → Create account** → `/signup?org_invite=xyz`
5. **Login** → Redirected to `/organization/dashboard`
6. **Dashboard shows:**
   - 0 seats purchased
   - 0 members
   - Prompt: "Purchase seats to get started"
7. **Click "Purchase Seats"** → `/organization/seats/purchase`
8. **Select course/bundle:**
   - Course: "Sales Training"
   - Seats: 50
   - Price: $99/seat
   - Total: $4,950
   - Duration: 12 months
9. **Checkout** (org billing)
   - Stripe payment
   - Invoice generated
10. **Seats purchased** ✓
11. **Navigate to "Members"** → `/organization/members`
12. **Invite members:**
    - Option 1: Bulk CSV upload
      - Upload CSV (name, email)
      - 50 members imported
    - Option 2: Individual invites
      - Enter email
      - Send invite
13. **Members receive invite emails**
14. **Members sign up** → Auto-assigned to organization
15. **Org manager assigns course:**
    - `/organization/courses/assign`
    - Select course: "Sales Training"
    - Select members: All 50
    - Click "Assign"
16. **Members get notification:**
    - "New course assigned: Sales Training"
    - Email + in-app notification
17. **Members start learning** → Consume content
18. **Org manager tracks progress:** `/organization/analytics`
    - View dashboard:
      - 50 members enrolled
      - 30 active (60%)
      - 15 completed (30%)
      - Avg progress: 48%
    - Drill down:
      - See individual progress
      - See who hasn't started
      - Send reminders
19. **Export report:** CSV with all member progress
20. **Share with company leadership**

**Result:** Organization successfully onboarded and trained 50 employees ✓

---

### FLOW 5: Affiliate Shares Link → User Buys → Commission Tracked → Payout

**Actors:** Affiliate, Buyer

**Steps:**
1. **Affiliate applies:** `/affiliate/apply`
   - Name, email, why they want to promote
2. **School admin approves:** `/admin/commerce/affiliates`
   - Review application
   - Click "Approve"
3. **Affiliate gets email:** "You're approved!"
4. **Affiliate logs in:** `/affiliate/dashboard`
5. **Dashboard shows:**
   - Affiliate code: "JOHN123"
   - Referral link: `https://school.com/courses/react?ref=JOHN123`
6. **Affiliate promotes:**
   - Share link on social media
   - Blog post with affiliate link
   - Email newsletter
7. **User clicks affiliate link:**
   - Cookie/session stores ref code
   - Click tracked in database
8. **User browses site** → Decides to buy
9. **User completes purchase** (within 30 days of click)
   - Order: $199 (Advanced React)
10. **System attributes sale to affiliate:**
    - Check cookie for ref code
    - Create commission record:
      - Affiliate: JOHN123
      - Order: ORD-001
      - Amount: $199
      - Commission: $19.90 (10%)
      - Status: Pending
11. **Affiliate sees in dashboard:** `/affiliate/dashboard`
    - Total clicks: 250
    - Conversions: 15
    - Revenue generated: $2,985
    - Commission earned: $298.50
    - Pending: $150.00
    - Paid: $148.50
12. **After 30-day refund period:**
    - Admin approves commissions: `/admin/commerce/affiliates`
    - Batch approve
    - Status: Pending → Approved
13. **Affiliate requests payout:** `/affiliate/payouts/request`
    - Amount: $298.50
    - Method: PayPal
    - PayPal email: affiliate@example.com
14. **School admin processes payout:**
    - `/admin/commerce/affiliates/payouts`
    - Review request
    - Send payment via PayPal
    - Mark as "Paid"
15. **Affiliate receives payment** ✓

**Result:** Affiliate earned commission and got paid ✓

---

This comprehensive UI and flow design provides:
✅ Complete sitemap for all user types
✅ Detailed page layouts and components
✅ Clear user journeys from signup to success
✅ Multi-role experiences (learner, instructor, admin, org, affiliate)
✅ Conversion-optimized flows
✅ Mobile-responsive considerations
✅ Accessibility basics
