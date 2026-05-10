# Outdure Edge - MVP Roadmap & Implementation Plan

## MVP SCOPE (Phase 1) - 3-4 Months

### Goal
Launch a functional multi-tenant LMS that enables schools to create courses, sell access, manage learners, and track basic analytics.

### Core Features

#### 1. Multi-Tenant Infrastructure ✓
- School (tenant) creation and management
- Custom subdomain support (e.g., `school-name.outdureedge.com`)
- Tenant data isolation
- Basic branding (logo, colors, tagline)

#### 2. Authentication & User Management ✓
- Email/password authentication
- JWT-based sessions
- User roles: Owner, Admin, Instructor, Learner
- Basic RBAC (role-based access control)
- User invitation system
- Profile management

#### 3. Course Creation & Management ✓
- Course CRUD operations
- Module and lesson structure
- Lesson types:
  - Video (upload + embed)
  - Text/Article
  - PDF viewer
  - Embed (YouTube, Vimeo)
  - Quiz (basic MCQ, multi-select)
  - File download
- Course status: draft, published
- Basic drip content (by date)

#### 4. Learner Experience ✓
- Course catalog (public)
- Course detail/sales page
- Course player with:
  - Video playback
  - Lesson navigation
  - Progress tracking
  - Notes (basic)
  - Mark lesson as complete
- Learner dashboard showing:
  - Enrolled courses
  - Progress
  - Certificates

#### 5. Progress Tracking ✓
- Track lesson completion
- Calculate course progress percentage
- Course completion detection
- Basic certificate issuance

#### 6. Assessments (Basic) ✓
- Quiz creation with question types:
  - Multiple choice (MCQ)
  - Multi-select
  - True/False
- Quiz attempts
- Auto-grading
- Pass/fail logic
- Show results

#### 7. Commerce (Stripe Integration) ✓
- Product creation (link course to product)
- One-time payment pricing
- Stripe checkout integration
- Order creation and tracking
- Basic invoice generation
- Coupon codes (percentage, fixed amount)
- Payment confirmation → auto-enrollment

#### 8. Certificates ✓
- Basic certificate template system
- Auto-issue certificate on course completion
- PDF generation
- Verification URL (public)
- Display certificates in learner profile

#### 9. Site Builder (Basic) ✓
- Pre-built templates for:
  - Home page
  - Course catalog
  - Course detail page
  - Checkout
- Basic page customization:
  - Hero section
  - Feature list
  - Course grid
  - Footer
- Navigation menu management

#### 10. Admin Dashboard ✓
- School dashboard with:
  - Revenue overview
  - Total enrollments
  - Active users
  - Recent orders
- User management (list, create, edit, delete)
- Course management
- Order management
- Basic settings (branding, domain)

#### 11. Analytics (Basic) ✓
- School-level metrics:
  - Total revenue
  - Number of enrollments
  - Active users
  - Course completion rate
- Course-level metrics:
  - Enrollment count
  - Completion rate
  - Average quiz score

#### 12. Email Notifications ✓
- Transactional emails via SendGrid:
  - Welcome email
  - Purchase confirmation
  - Enrollment confirmation
  - Course completion
  - Password reset
- Basic email templates

### MVP Technical Implementation

#### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS v4
- React Query (data fetching)
- Zustand (state management)
- React Hook Form (forms)
- Video.js (video player)
- Recharts (basic charts)

#### Backend
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis (sessions + cache)
- BullMQ (background jobs)
- Stripe SDK

#### Infrastructure
- Vercel (frontend hosting)
- Railway or Render (backend hosting)
- Supabase (PostgreSQL + auth alternative)
- AWS S3 or DigitalOcean Spaces (file storage)
- SendGrid (email)
- Stripe (payments)

### Excluded from MVP (Phase 2+)
- ❌ Custom domains (CNAME)
- ❌ Advanced lesson types (SCORM, live sessions, assignments with file uploads)
- ❌ Cohort-based courses
- ❌ Community/discussion features
- ❌ Advanced drip content (by prerequisite, by enrollment day)
- ❌ Learning paths/bundles
- ❌ Memberships/subscriptions (recurring)
- ❌ B2B organizations and seat management
- ❌ Affiliate system
- ❌ Automation engine
- ❌ Advanced analytics and reports
- ❌ Social login (Google, Facebook)
- ❌ MFA (two-factor authentication)
- ❌ Advanced site builder (drag-and-drop)
- ❌ Mobile app

---

## PHASE 2 (Months 5-7) - Advanced Features

### Features
1. **Custom Domains** - CNAME + SSL setup
2. **Advanced Course Types**:
   - Cohort-based courses with start/end dates
   - Learning paths (course bundles)
   - Subscriptions (monthly/annual membership)
3. **Assignments**:
   - File upload submissions
   - Instructor grading with rubrics
   - Feedback and comments
4. **Community Platform**:
   - Spaces and channels
   - Posts, comments, reactions
   - Moderation tools
5. **Live Sessions**:
   - Zoom/Google Meet integration
   - Session scheduling
   - Attendance tracking
   - Recording playback
6. **Advanced Drip Content**:
   - By prerequisite completion
   - By enrollment day (relative)
7. **Email Marketing**:
   - Broadcast emails
   - User segmentation
   - Email campaigns
8. **Payment Plans**:
   - Pay-in-3, pay-in-6 installments
   - Subscription billing (Stripe Subscriptions)
9. **Gradebook**:
   - Weighted grades
   - Multiple assessment types
   - Export grades
10. **Advanced Analytics**:
    - Funnel tracking (page → checkout → purchase)
    - Video engagement heat maps
    - Drop-off analysis
    - Export reports (CSV/PDF)

---

## PHASE 3 (Months 8-12) - Enterprise & Scale

### Features
1. **B2B Organizations**:
   - Seat-based licensing
   - Organization admin dashboard
   - Bulk user imports (CSV)
   - Organization-specific analytics
2. **SSO (Single Sign-On)**:
   - SAML integration
   - OAuth 2.0 for enterprise
3. **Affiliate System**:
   - Affiliate registration and approval
   - Referral tracking
   - Commission management
   - Payout processing
4. **Automation Engine**:
   - Trigger-based workflows
   - Multi-step automations
   - Integration with Zapier
5. **Advanced Site Builder**:
   - Drag-and-drop page builder
   - Custom HTML/CSS sections
   - A/B testing for landing pages
6. **Mobile App** (React Native):
   - iOS and Android apps
   - Offline course downloads
   - Push notifications
7. **Gamification**:
   - Badges and achievements
   - Leaderboards
   - Points system
8. **Compliance & Security**:
   - GDPR tools (data export, deletion)
   - SCORM/xAPI support
   - Advanced audit logs
   - SOC 2 compliance
9. **White-Label**:
   - Remove Outdure Edge branding
   - Custom email sender domain
   - Custom mobile app branding
10. **Advanced Integrations**:
    - CRM integrations (Salesforce, HubSpot)
    - Marketing tools (Mailchimp, ConvertKit)
    - Analytics (Google Analytics, Mixpanel)

---

## USER FLOWS

### Flow 1: School Owner Onboarding

```
1. Visit outdureedge.com
   ↓
2. Click "Start Free Trial"
   ↓
3. Fill signup form:
   - School name
   - Email
   - Password
   - Accept terms
   ↓
4. Email verification (click link)
   ↓
5. Redirect to onboarding wizard:
   Step 1: Choose subdomain (e.g., myschool.outdureedge.com)
   Step 2: Select billing plan (Starter/Pro/Business)
   Step 3: Customize branding (logo, colors, tagline)
   Step 4: Connect Stripe account (OAuth flow)
   ↓
6. Onboarding complete → Redirect to dashboard
   ↓
7. Show "Create Your First Course" prompt
   ↓
8. Create course:
   - Enter course title, description
   - Upload thumbnail
   - Add modules and lessons
   - Set pricing
   - Publish
   ↓
9. View published course on school site
   ↓
10. Share course link with learners
```

---

### Flow 2: Instructor Creates Course

```
1. Instructor logs into school admin panel
   ↓
2. Navigate to "Courses" → "Create Course"
   ↓
3. Fill course details:
   - Title, subtitle, description
   - Thumbnail, promo video (optional)
   - Category, tags
   - Level (beginner/intermediate/advanced)
   - Language
   ↓
4. Click "Create Course" → Course created in draft
   ↓
5. Add modules:
   - Click "Add Module"
   - Enter module title, description
   ↓
6. Add lessons to module:
   - Click "Add Lesson"
   - Choose lesson type (video, text, quiz, etc.)
   - Upload/configure content
   - Set completion rule (e.g., watch 80% of video)
   - Save lesson
   ↓
7. Repeat for all modules/lessons
   ↓
8. Set course pricing:
   - Navigate to "Pricing" tab
   - Create pricing plan (one-time or subscription)
   - Set price, currency
   - Save
   ↓
9. Preview course as learner
   ↓
10. Publish course → Status changes to "published"
    ↓
11. Course appears in catalog for learners to purchase
```

---

### Flow 3: Learner Purchases & Completes Course

```
1. Learner visits school site (e.g., myschool.outdureedge.com)
   ↓
2. Browse course catalog
   ↓
3. Click on course → View course detail page with:
   - Description, curriculum, instructor info
   - Price and "Enroll Now" button
   ↓
4. Click "Enroll Now" (not logged in)
   ↓
5. Redirect to signup/login page
   ↓
6. Signup:
   - Email, password, first name, last name
   - Accept terms
   ↓
7. Email verification (optional: skip for MVP)
   ↓
8. Redirect back to course checkout
   ↓
9. Enter payment details (Stripe Checkout)
   - Card number, expiry, CVV
   - Billing address
   - Apply coupon code (optional)
   ↓
10. Click "Complete Purchase"
    ↓
11. Stripe processes payment → Success
    ↓
12. Backend creates order and enrollment
    ↓
13. Send purchase confirmation email
    ↓
14. Redirect to course player
    ↓
15. Start learning:
    - Watch video lessons
    - Read text lessons
    - Take quizzes
    - Mark lessons as complete
    ↓
16. Track progress in sidebar (e.g., 12/24 lessons complete)
    ↓
17. Complete all lessons → Course progress = 100%
    ↓
18. Certificate auto-issued
    ↓
19. Notification: "Congratulations! You've earned a certificate"
    ↓
20. View certificate in learner dashboard
    ↓
21. Download certificate PDF or share verification link
```

---

### Flow 4: Organization Purchases Seats & Assigns Courses

```
1. Org admin logs into school site
   ↓
2. Navigate to "Organizations" (if enabled for school)
   ↓
3. Click "Purchase Seats"
   ↓
4. Select number of seats (e.g., 50)
   ↓
5. Select seat duration (e.g., 1 year)
   ↓
6. Review pricing → Checkout
   ↓
7. Complete payment (Stripe)
   ↓
8. Seats purchased → Redirect to org admin dashboard
   ↓
9. Invite learners:
   - Click "Invite Users"
   - Upload CSV with emails or enter manually
   - Send invitations
   ↓
10. Learners receive email invitation
    ↓
11. Learners signup/login
    ↓
12. Org admin assigns courses:
    - Select learners
    - Choose courses to assign
    - Click "Assign"
    ↓
13. Learners auto-enrolled in assigned courses
    ↓
14. Learners notified via email
    ↓
15. Org admin tracks progress:
    - View org analytics dashboard
    - See seat utilization
    - View completion rates per learner
    - Export reports
```

---

### Flow 5: Affiliate Shares Link & Earns Commission

```
1. Affiliate signs up as affiliate (or admin approves)
   ↓
2. Affiliate receives unique referral link
   ↓
3. Affiliate shares link on social media, blog, email
   ↓
4. Visitor clicks referral link
   ↓
5. Cookie stored in visitor's browser (30-day tracking)
   ↓
6. Visitor browses site, views courses
   ↓
7. Visitor purchases course
   ↓
8. Backend checks for affiliate cookie → Attributes sale to affiliate
   ↓
9. Commission created (e.g., 20% of sale)
   ↓
10. Affiliate can view commission in dashboard:
    - Total clicks
    - Conversions
    - Pending commissions
    - Paid commissions
    ↓
11. School admin approves commission
    ↓
12. Commission marked as "approved"
    ↓
13. Payout processed (manual or automated)
    ↓
14. Affiliate receives payment (PayPal, bank transfer)
    ↓
15. Commission marked as "paid"
```

---

## UI PAGES & COMPONENTS

### Public Site (School Frontend)

#### 1. Home Page
**Components:**
- Hero section (headline, subtitle, CTA button, background image)
- Featured courses grid (4-6 courses)
- Benefits section (3-column layout with icons)
- Testimonials carousel (optional)
- Stats bar (X courses, Y students, Z reviews)
- Footer (links, social icons, copyright)

#### 2. Course Catalog Page
**Components:**
- Search bar
- Filters sidebar (category, level, price range)
- Sort dropdown (newest, popular, price)
- Course grid (cards with thumbnail, title, instructor, price, rating)
- Pagination

#### 3. Course Detail Page (Sales Page)
**Components:**
- Course header (title, subtitle, instructor info, rating, price, "Enroll Now" CTA)
- Promo video or thumbnail
- Course description (rich text)
- "What You'll Learn" list
- Curriculum accordion (modules → lessons with icons)
- Instructor bio section
- Reviews/testimonials
- FAQ section
- Sticky sidebar with price and CTA

#### 4. Checkout Page
**Components:**
- Order summary (course title, price, discount, total)
- Coupon code input
- Payment form (Stripe Elements)
- Billing address fields
- Terms & conditions checkbox
- "Complete Purchase" button

#### 5. Login/Signup Page
**Components:**
- Login form (email, password, "Forgot password?" link)
- Signup form (email, password, first name, last name)
- Tab switcher (Login / Signup)
- Social login buttons (Phase 2)
- "Back to home" link

#### 6. Forgot Password Page
**Components:**
- Email input
- "Send Reset Link" button
- Success message

#### 7. Reset Password Page
**Components:**
- New password input
- Confirm password input
- "Reset Password" button

---

### Learner Portal

#### 8. Learner Dashboard
**Components:**
- Welcome banner (greeting with user name)
- "Continue Learning" section (in-progress courses with progress bars)
- "My Courses" grid (all enrolled courses)
- "Certificates" section (earned certificates)
- "Upcoming Sessions" (for live courses, Phase 2)
- Recent activity feed
- Sidebar: Profile, Settings, Logout

#### 9. Course Player
**Layout:**
- Left sidebar: Course navigation tree (modules → lessons)
- Main area: Lesson content (video, text, quiz, etc.)
- Right sidebar (collapsible): Notes, Resources, Discussions (Phase 2)
- Top bar: Course title, progress bar, "Mark as complete" button

**Components:**
- **Video Lesson**: Video player (Video.js) with controls, playback speed, fullscreen
- **Text Lesson**: Rich text content with images, code blocks
- **Quiz Lesson**: Question display, answer options, "Submit Quiz" button, results page
- **Notes Panel**: Textarea for taking notes, save button, list of saved notes
- **Resources Panel**: Download links for lesson attachments

#### 10. Quiz Results Page
**Components:**
- Score display (85/100)
- Pass/Fail status
- Questions list with:
  - Question text
  - User's answer
  - Correct answer
  - Explanation (if available)
- "Retake Quiz" button (if attempts remaining)
- "Continue to Next Lesson" button

#### 11. Certificate Page
**Components:**
- Certificate preview (PDF embedded or image)
- Download button
- Share button (social media, email)
- Verification link (copy to clipboard)

#### 12. User Profile Page
**Components:**
- Avatar upload
- Edit profile form (first name, last name, bio, social links)
- Change password section
- Notification preferences
- Delete account option

---

### Instructor Portal

#### 13. Instructor Dashboard
**Components:**
- Welcome message
- Quick stats: Total students, courses, avg rating
- "My Courses" list (with edit/analytics links)
- "Create New Course" button
- Recent enrollments
- Recent reviews

#### 14. Course Builder (Create/Edit Course)
**Tabs:**

**Tab 1: Course Details**
- Title, subtitle, description (rich text editor)
- Thumbnail upload
- Promo video upload/embed
- Category dropdown, tags input
- Level dropdown (beginner/intermediate/advanced)
- Language dropdown

**Tab 2: Curriculum**
- Modules list (drag-to-reorder)
- "Add Module" button
- For each module:
  - Module title, description
  - Lessons list (drag-to-reorder)
  - "Add Lesson" button
- Lesson modal:
  - Lesson type selector
  - Type-specific fields (video URL, text content, quiz config, etc.)
  - Completion rule dropdown
  - "Save Lesson" button

**Tab 3: Pricing**
- Pricing plans list
- "Add Pricing Plan" button
- Plan form:
  - Plan name
  - Price
  - Billing type (one-time, subscription)
  - Trial period (optional)
  - "Save Plan" button

**Tab 4: Settings**
- Certificate template selector
- Discussions on/off toggle
- Sequential progress on/off toggle
- Drip content settings (Phase 2)

**Tab 5: Preview**
- Render course as learner would see it
- "Publish Course" button (if draft)

#### 15. Course Analytics Page
**Components:**
- Date range picker
- Enrollment stats: Total, active, completed, drop rate
- Progress chart (avg completion %)
- Quiz performance chart (avg score, pass rate)
- Drop-off analysis (lessons with highest drop rates)
- Learner list with progress (sortable table)

---

### School Admin Panel

#### 16. Admin Dashboard
**Components:**
- Welcome banner (school name, owner name)
- Key metrics cards:
  - Total revenue (this month)
  - Total enrollments
  - Active users
  - Total courses
- Revenue chart (line chart, last 30 days)
- Enrollment trend chart
- Recent orders table (order #, user, amount, date, status)
- Quick actions: Create course, Invite user, View reports

#### 17. Users Management Page
**Components:**
- Search bar (by name, email)
- Filters: Role, status
- Users table:
  - Columns: Name, Email, Role, Status, Last login, Actions
  - Actions: Edit, Delete, Impersonate (Super Admin only)
- "Invite User" button → Modal with email, role, send invitation email checkbox

#### 18. User Edit Page
**Components:**
- User info form (name, email, avatar)
- Role assignments section:
  - Current roles list
  - "Add Role" button → Select role, scope (if applicable), save
  - Remove role button
- Enrollments section:
  - List of enrolled courses
  - "Enroll in Course" button → Select course, access duration, save
- Tags section:
  - Current tags list
  - Add tag input

#### 19. Courses Management Page
**Components:**
- Search bar, filters (status, instructor, category)
- Courses table:
  - Columns: Thumbnail, Title, Instructor, Status, Enrollments, Revenue, Actions
  - Actions: Edit, Duplicate, Archive, Delete
- "Create Course" button

#### 20. Orders Management Page
**Components:**
- Search bar (by order #, user email)
- Filters: Status, date range
- Orders table:
  - Columns: Order #, User, Items, Total, Payment Status, Date, Actions
  - Actions: View details, Refund, Download invoice
- Order detail modal:
  - Order summary
  - Line items
  - Customer info
  - Payment info
  - "Issue Refund" button

#### 21. Coupons Management Page
**Components:**
- Coupons table:
  - Columns: Code, Discount, Uses, Valid until, Status, Actions
  - Actions: Edit, Deactivate, Delete
- "Create Coupon" button → Modal with:
  - Code input
  - Discount type (percentage/fixed)
  - Discount value
  - Max uses, max uses per user
  - Validity dates
  - Product restrictions (select courses)
  - "Create" button

#### 22. Analytics Page
**Tabs:**

**Tab 1: Overview**
- Date range selector
- Metrics cards (revenue, enrollments, active users, completions)
- Charts: Revenue trend, enrollment trend
- Top courses table (by revenue, enrollments, completion rate)

**Tab 2: Sales**
- Revenue breakdown (by course, by month)
- Conversion rate (visitors → purchases)
- Average order value
- Refund rate

**Tab 3: Learners**
- Total users, new signups, active users
- User retention chart
- Engagement metrics (avg session duration, logins per user)

**Tab 4: Courses**
- Enrollment funnel (views → enrollments)
- Completion rates per course
- Time to complete (avg)
- Drop-off analysis

**Tab 5: Export**
- Select date range, metrics
- "Export CSV" button

#### 23. Site Builder Page
**Tabs:**

**Tab 1: Pages**
- Pages list (Home, Catalog, About, Contact, etc.)
- "Create Page" button
- For each page: Edit button → Simple editor with:
  - Page title, slug
  - Section blocks (hero, features, CTA, etc.)
  - Save button

**Tab 2: Navigation**
- Header menu editor:
  - Menu items list (drag-to-reorder)
  - "Add Menu Item" button → Label, URL, open in new tab checkbox
- Footer menu editor (similar)

**Tab 3: Theme**
- Logo upload
- Favicon upload
- Color pickers (primary, secondary, accent)
- Font selectors (heading, body)
- "Save Theme" button

**Tab 4: Domain**
- Current domain display (subdomain)
- "Set Custom Domain" section:
  - Domain input
  - Verification instructions (CNAME record)
  - Status indicator (pending/verified)

#### 24. Settings Page
**Tabs:**

**Tab 1: General**
- School name, tagline
- Contact email, phone
- Timezone, currency, language

**Tab 2: Branding**
- Logo, favicon, colors, fonts (same as Theme tab in Site Builder)

**Tab 3: Notifications**
- Email templates list (welcome, purchase confirmation, etc.)
- Edit email templates (subject, body with placeholders)
- Email provider settings (SendGrid API key)

**Tab 4: Integrations**
- Stripe: Connected status, "Connect" button (OAuth)
- Zoom: API credentials (Phase 2)
- Google Analytics: Tracking ID (Phase 2)
- Zapier: Webhook URL

**Tab 5: Security**
- Password requirements (min length, complexity)
- Enable/disable MFA (Phase 2)
- Session timeout

**Tab 6: Billing**
- Current plan display (Starter/Pro/Business)
- "Upgrade Plan" button
- Billing history (invoices)
- Payment method (card on file)

---

### Organization Admin Panel (Phase 3)

#### 25. Organization Dashboard
**Components:**
- Org info (name, logo, seat count)
- Seats usage card (allocated/total)
- Enrollments summary
- Progress overview (avg completion rate)
- Learners list (quick view)

#### 26. Organization Learners Page
**Components:**
- Search, filters
- Learners table (name, email, enrollments, progress, last active)
- "Invite Learners" button → Modal with CSV upload or manual entry
- Bulk actions: Assign courses, remove access

#### 27. Organization Courses Page
**Components:**
- Assigned courses list
- "Assign Course" button → Select learners, select course, save

#### 28. Organization Analytics Page
**Components:**
- Date range selector
- Metrics cards (total enrollments, completions, avg time spent)
- Progress chart
- Top performers table
- Export button

---

### Platform Super Admin Panel (Internal)

#### 29. Platform Dashboard
**Components:**
- Total schools, total users, total revenue (all tenants)
- Growth charts
- Recent schools (with trial end dates)
- System health indicators (DB, Redis, workers)

#### 30. Schools Management Page
**Components:**
- Search, filters (plan, status)
- Schools table (name, owner, plan, users count, revenue, status, trial end, actions)
- Actions: View details, Impersonate owner, Suspend, Delete

#### 31. Billing Plans Management Page
**Components:**
- Plans list (Starter, Pro, Business, Enterprise)
- Edit plan: Name, pricing, limits, features
- Create new plan

---

## RISK MANAGEMENT & TRADEOFFS

### Risks

#### 1. Technical Complexity
**Risk**: Multi-tenant architecture with custom domains is complex
**Mitigation**:
- Start with subdomains in MVP
- Defer custom domains to Phase 2
- Use proven libraries (Prisma, NestJS)

#### 2. Video Streaming Costs
**Risk**: High bandwidth costs for video hosting
**Mitigation**:
- Use CloudFlare Stream (pay-per-view model)
- Implement adaptive bitrate streaming
- Cache videos at edge locations

#### 3. Payment Processing Compliance
**Risk**: PCI compliance, fraud detection
**Mitigation**:
- Use Stripe (PCI-compliant)
- Implement Stripe Radar for fraud detection
- Never store card details

#### 4. Scalability
**Risk**: Database performance degrades as data grows
**Mitigation**:
- Use indexes aggressively
- Implement read replicas
- Cache frequently accessed data (Redis)
- Partition analytics tables by month

#### 5. Email Deliverability
**Risk**: Welcome/notification emails go to spam
**Mitigation**:
- Use reputable ESP (SendGrid)
- Implement SPF, DKIM, DMARC
- Monitor bounce/complaint rates
- Warm up sending domain

### Tradeoffs

#### 1. Shared DB vs. DB-per-Tenant
**Decision**: Shared DB with tenant_id
**Tradeoff**:
- ✅ Easier to manage, lower cost
- ❌ Risk of data leakage (mitigated by RLS)
- ❌ Harder to scale individual tenants

#### 2. Monolith vs. Microservices
**Decision**: Modular monolith (NestJS modules)
**Tradeoff**:
- ✅ Faster development, simpler deployment
- ✅ Can extract modules to microservices later
- ❌ Entire app scales together (not granular)

#### 3. Self-hosted Video vs. Third-party
**Decision**: CloudFlare Stream (third-party)
**Tradeoff**:
- ✅ No transcoding infrastructure needed
- ✅ Global CDN, adaptive streaming built-in
- ❌ Vendor lock-in
- ❌ Higher cost at scale (but predictable)

#### 4. Real-time vs. Polling
**Decision**: Polling for notifications (MVP), WebSockets (Phase 2)
**Tradeoff**:
- ✅ Simpler to implement
- ❌ Not truly real-time
- ❌ Higher server load (mitigated by caching)

#### 5. Custom Site Builder vs. Templates
**Decision**: Pre-built templates (MVP), drag-and-drop (Phase 3)
**Tradeoff**:
- ✅ Ship faster
- ❌ Less flexibility for users
- ✅ Easier to maintain (no broken custom layouts)

---

## TESTING STRATEGY

### Unit Tests
- Coverage target: 80%+
- Test critical business logic:
  - Enrollment rules
  - Progress calculation
  - Payment processing
  - Certificate generation

### Integration Tests
- API endpoint tests (NestJS Supertest)
- Database transactions
- External service mocks (Stripe, SendGrid)

### E2E Tests
- Critical user flows:
  - School signup
  - Course purchase
  - Course completion
  - Certificate issuance
- Tool: Playwright or Cypress

### Load Tests
- Simulate 1000 concurrent users
- Test video streaming under load
- Identify bottlenecks
- Tool: k6 or Artillery

### Security Tests
- OWASP Top 10 vulnerabilities
- SQL injection tests
- XSS tests
- CSRF tests
- Tool: OWASP ZAP

---

## SUCCESS METRICS

### Business Metrics
- **Number of Schools**: 100 schools in 6 months
- **Total Enrollments**: 10,000 enrollments in 6 months
- **Revenue**: $50K MRR in 12 months
- **Churn Rate**: < 5% monthly

### Product Metrics
- **Course Completion Rate**: > 40%
- **Average Time to Complete**: < 30 days
- **Quiz Pass Rate**: > 75%
- **User Engagement**: > 3 logins per week (active users)

### Technical Metrics
- **Uptime**: 99.9%
- **API Response Time**: < 500ms (p95)
- **Page Load Time**: < 2s (p95)
- **Video Start Time**: < 3s (p95)
- **Error Rate**: < 1%

---

This MVP roadmap provides a clear path to launching a functional, revenue-generating LMS platform while setting the foundation for future growth and advanced features.
