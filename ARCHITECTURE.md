# Outdure Edge - LearnWorlds-Style LMS Platform
## Complete Architecture & Technical Specification

---

## 1. PRODUCT SPECIFICATION

### 1.1 Core Vision
Multi-tenant SaaS LMS enabling creators and organizations to build branded learning sites, publish courses, sell access, manage learners, issue certificates, run communities, and track analytics.

### 1.2 Tenancy Model
- **Multi-tenant architecture**: Each "School" (tenant) operates independently
- **Custom domains**: CNAME + auto-provisioned SSL per school
- **Data isolation**: Tenant_id on all resources
- **Public + Private**: Public marketing site + gated learning portal per school

### 1.3 User Types & Permissions (RBAC)

#### Global Roles

**1. Platform Super Admin**
- Permissions: `*` (all)
- Access: All schools, system configs, billing plans, feature flags
- Actions: Impersonate users, view platform analytics, manage abuse/security

**2. School Owner**
- Permissions: `school.*`
- Access: Full control within their school
- Actions: Manage billing, transfer ownership, all admin functions

**3. School Admin**
- Permissions: `school.manage`, `courses.*`, `users.*`, `commerce.*`, `analytics.view`
- Access: Almost owner-level, except billing/ownership
- Actions: Manage courses, users, site settings, integrations

**4. Instructor**
- Permissions: `courses.create`, `courses.{owned}.manage`, `analytics.courses.{owned}`
- Access: Courses they own or are assigned to
- Actions: Create/edit content, manage enrollments, grade assignments, view course analytics

**5. Teaching Assistant**
- Permissions: `courses.{assigned}.grade`, `community.{assigned}.moderate`
- Access: Assigned courses only
- Actions: Grade assignments, moderate discussions, no publishing

**6. Learner**
- Permissions: `courses.{enrolled}.view`, `progress.own`, `community.participate`
- Access: Enrolled courses, own profile
- Actions: Consume content, submit assignments, participate in community

**7. Organization Manager**
- Permissions: `org.{owned}.manage`, `users.{org}.manage`, `analytics.org.{owned}`
- Access: Their organization's data only
- Actions: Purchase seats, invite learners, assign courses, view org analytics

**8. Organization Learner**
- Permissions: Same as Learner + `org.{member}.view`
- Access: Org-assigned courses
- Actions: Same as Learner

**9. Affiliate**
- Permissions: `affiliate.own.view`, `commissions.own.view`
- Access: Own referral links and earnings
- Actions: Generate links, track conversions, request payouts

**10. Guest/Public**
- Permissions: `site.view`, `catalog.browse`
- Access: Public pages, catalog, checkout
- Actions: Browse, purchase, sign up

#### Custom Roles
Schools can create custom roles with granular permissions grouped by:
- **Site**: branding, pages, navigation, domain
- **Courses**: create, edit, publish, delete, pricing
- **Users**: invite, roles, tags, access overrides
- **Commerce**: products, orders, coupons, refunds, affiliates
- **Community**: spaces, posts, moderate, reports
- **Analytics**: view dashboards, export data
- **Integrations**: connect services, manage API keys, webhooks
- **Support**: impersonate learners, access logs

---

## 2. COURSE TYPES & PRODUCTS

### A. Self-Paced Course
- Structure: Modules → Sections → Lessons
- Features: Progress tracking, drip scheduling, prerequisites
- Access: Lifetime or time-limited

### B. Cohort-Based Course
- Structure: Same as self-paced + cohort metadata
- Features: Start/end dates, weekly releases, live sessions, attendance tracking
- Access: Cohort enrollment period

### C. Micro-Courses
- Structure: Flat lesson list
- Features: Mobile-optimized, quick completion badges
- Access: One-time or subscription

### D. Learning Paths / Bundles
- Structure: Curated sequence of courses
- Features: Prerequisite rules, bundle pricing, completion tracking
- Access: Bundle purchase unlocks all

### E. Membership / Subscription
- Structure: Access to library/categories
- Features: Tiered plans (Basic/Pro/Enterprise), content gating
- Access: Monthly/annual recurring

### F. 1:1 Coaching
- Structure: Session packages
- Features: Booking calendar, private notes, messaging
- Access: By session count

### G. Workshops / Events
- Structure: Single or multi-session live events
- Features: Ticketing, calendar integration, replay
- Access: Ticket purchase

### H. Digital Downloads
- Structure: Files + metadata
- Features: License terms, download tracking
- Access: One-time purchase

### I. Certifications / Exams
- Structure: Exam + certificate template
- Features: Passing criteria, retake rules, expiry
- Access: Exam enrollment

---

## 3. CONTENT & LESSON TYPES

### Supported Lesson Blocks

#### Video Lesson
- Upload + adaptive streaming
- Interactive overlays: hotspots, time-based questions, CTAs
- Features: Transcripts, bookmarks, notes, playback speed, auto-quality

#### Audio Lesson
- Upload + streaming
- Features: Transcripts, bookmarks, notes

#### Text/Article Lesson
- Rich text editor with markdown support
- Embeds: images, videos, code blocks

#### PDF Viewer
- Display PDF inline
- Features: Download control, page tracking

#### Presentation
- Slides with navigation
- Features: Fullscreen mode, progress tracking

#### File Download
- Any file type
- Features: Download tracking, version control

#### Embed
- Supported: YouTube, Vimeo, Wistia, Google Docs, Figma, CodePen, etc.
- Features: Responsive, completion tracking

#### Assignment
- Types: File upload, text submission, URL submission
- Features: Rubric grading, feedback, annotations, peer review (phase 2)

#### Quiz/Exam
- Question types: MCQ, multi-select, true/false, short answer, essay, matching, ordering, fill-in-blank
- Features: Question banks, randomization, timed, attempts limit, pass mark

#### Survey/Form
- Question types: Open-ended, rating scales, NPS
- Features: Anonymous option, export results

#### Live Session
- Calendar event + Zoom/Google Meet integration
- Features: Registration, reminders, attendance tracking, replay

#### Community Embed
- Link to specific discussion thread
- Features: In-lesson context

#### SCORM/xAPI (Phase 2)
- Import SCORM packages
- Features: Standard compliance, progress tracking

---

## 4. ASSESSMENTS & GRADING

### Quiz Engine
- **Question Bank**: Reusable question pools
- **Question Types**: MCQ, multi-select, true/false, short answer, essay, matching, ordering, fill-in-blank, hotspot
- **Configuration**: Timed, randomized, attempts limit, pass percentage, show correct answers
- **Grading**: Auto-grade objective questions, manual grade subjective

### Assignment System
- **Submission Types**: File, text, URL, code
- **Rubric**: Criteria-based scoring
- **Feedback**: Instructor comments, file annotations (phase 2)
- **Plagiarism Detection**: Integration (phase 3)

### Gradebook
- Per-course gradebook
- Grade categories + weighting
- Export grades
- Learner view of own grades

---

## 5. CERTIFICATES & BADGES

### Certificate System
- **Templates**: Visual designer with dynamic fields
- **Fields**: Learner name, course title, completion date, certificate ID, instructor signature, QR code
- **Triggers**: Course completion, exam pass, manual issue
- **Features**: PDF generation, verification URL, expiry dates (optional)

### Badge System
- **Types**: Completion badges, milestone badges, achievement badges
- **Display**: Learner profile, public badge showcase
- **Integration**: Open Badges standard (phase 2)

---

## 6. COMMUNITY PLATFORM

### Structure
- **Spaces**: School-wide or course-specific
- **Channels**: Topics within spaces
- **Posts**: Text, images, videos, polls, links

### Features
- Threaded discussions
- Rich text + mentions + hashtags
- Reactions (emoji)
- Pin, lock, archive posts
- Moderation: Report, remove, ban user
- Notifications: New posts, replies, mentions
- Direct messages (phase 2)

### Roles
- Community Admin
- Moderator (per space/channel)
- Member

---

## 7. SITE BUILDER

### Theme System
- **Presets**: 5-10 professional themes
- **Customization**: Colors (primary, secondary, accent), typography (headings, body), logo, favicon
- **Layout Options**: Header style, footer style, sidebar placement

### Page Builder
- **Drag-and-drop sections**: Hero, features, testimonials, pricing, FAQ, CTA, course grid, blog feed
- **Blocks**: Text, image, video, button, form, spacer, divider, HTML/embed
- **Templates**: Landing page, sales page, about, contact, blog post

### Required Pages
- Home
- Course Catalog
- Course Detail (sales page)
- Checkout
- Login/Signup
- Learner Dashboard
- Course Player
- Community
- Blog (optional)
- Legal (Terms, Privacy, Refund Policy)

### SEO
- Meta titles, descriptions, OG images per page
- Clean URLs (slug-based)
- Auto-generated sitemap.xml
- Robots.txt
- Schema.org markup for courses

### Custom Domain
- CNAME setup instructions
- Auto-provision SSL via Let's Encrypt or Cloudflare
- Domain verification

---

## 8. LEARNER EXPERIENCE

### Learner Dashboard
- **Overview**: Progress summary, recent activity, upcoming deadlines
- **My Courses**: Enrolled courses with progress bars
- **Certificates**: Earned certificates
- **Calendar**: Upcoming live sessions, assignment due dates
- **Messages**: Notifications, announcements
- **Profile**: Edit personal info, avatar, bio, social links

### Course Player
- **Layout**: Sidebar navigation (collapsible) + main content area
- **Navigation**: Previous/Next lesson, jump to any lesson (if unlocked)
- **Progress**: Overall course progress bar, lesson completion checkmarks
- **Features**: 
  - Notes: Take timestamped notes (video) or inline notes (text)
  - Bookmarks: Save favorite lessons
  - Transcript: Search and jump to timestamp (video)
  - Resources: Download lesson attachments
  - Discussions: In-lesson Q&A threads
- **Completion Rules**: Must watch X% of video, pass quiz, submit assignment, etc.

### Mobile Experience
- Responsive design
- Mobile app (phase 3)
- Offline downloads (phase 3)

---

## 9. ENROLLMENT & ACCESS RULES

### Enrollment Types
- **Free**: Open enrollment
- **Paid**: One-time purchase or subscription
- **Invitation**: Admin enrolls specific users
- **Org Assignment**: Org admin assigns courses

### Access Control
- **Drip Content**: 
  - By date (absolute)
  - By enrollment day (relative)
  - By prerequisite completion
- **Prerequisites**: Must complete Course A before B
- **Time-Limited Access**: Access expires after X days/months
- **Device Limits**: Max concurrent devices (phase 2)

### Pricing Models
- One-time payment
- Subscription (monthly/annual)
- Payment plans (pay-in-3, pay-in-6)
- Free trial
- Free with upsells
- Pay-what-you-want

---

## 10. COMMERCE SYSTEM

### Payment Processing
- **Gateway**: Stripe (MVP), PayPal (phase 2)
- **Support**: Credit cards, Apple Pay, Google Pay, SEPA, ACH (via Stripe)
- **Currencies**: Multi-currency support
- **Taxes**: Basic tax rate per region (MVP), Stripe Tax integration (phase 2)

### Products
- Each course/bundle/membership is a "Product"
- Multiple pricing options per product
- SKU management

### Orders
- Order ID, line items, subtotal, taxes, total
- Order status: pending, completed, refunded, failed
- Invoices/receipts (PDF generation)
- Refunds (full or partial)

### Coupons
- **Types**: Percentage, fixed amount, free trial extension
- **Restrictions**: Specific products, minimum purchase, new users only
- **Limits**: Max uses (total and per user), expiry date

### Cart (Optional MVP)
- Single-product checkout (MVP)
- Multi-product cart (phase 2)
- Abandoned cart recovery (phase 2)

### Upsells
- Order bump (add related product at checkout)
- Post-purchase upsell (after successful payment)
- Both phase 2

### Affiliate System
- **Registration**: Affiliates apply, admin approves
- **Links**: Unique referral URLs with tracking codes
- **Attribution**: Last-click, 30-day cookie
- **Commission**: Percentage or fixed per sale
- **Payouts**: Manual (MVP), automated (phase 2)
- **Dashboard**: Clicks, conversions, earnings, payout history

---

## 11. B2B / ORGANIZATIONS

### Organization Model
- **Structure**: School → Organizations → Org Learners
- **Org Admin**: Manages their org, purchases seats, assigns courses
- **Use Case**: Companies buying training for employees

### Seat Management
- **Purchase**: Buy X seats (licenses) for Y duration
- **Allocation**: Assign seats to learners
- **Tracking**: Seats used vs available, seat expiry
- **Auto-assignment**: Invite via email/CSV, auto-enroll in specific courses

### Org Analytics
- **Metrics**: Enrollments, completion rates, time spent, quiz scores
- **Scope**: Limited to org's learners only
- **Export**: CSV/PDF reports

### SSO (Phase 2)
- SAML/OAuth integration for enterprise orgs
- Auto-provision users on first login

---

## 12. MARKETING & CRM-LITE

### Lead Capture
- Forms: Name, email, phone, custom fields
- Embed on landing pages
- Export leads

### Email System
- **Transactional**: Purchase confirmation, enrollment, password reset, refund
- **Learning**: Lesson unlocked, assignment due, certificate earned
- **Marketing**: Announcements, promotions (requires consent)
- **Provider**: SendGrid (MVP) or Amazon SES

### Automations (Rules Engine)
- **Triggers**: 
  - User signed up
  - Course purchased
  - Enrolled in course
  - Lesson completed
  - Course completed
  - Quiz passed/failed
  - Assignment submitted
  - Inactive for X days
  - Certificate issued
- **Conditions**: Has tag, enrolled in course, in org, etc.
- **Actions**: 
  - Send email
  - Add/remove tag
  - Grant course access
  - Notify admin
  - Call webhook

### Tagging & Segmentation
- Add tags to users (manual or automated)
- Segment users by tags, enrollment status, purchase history
- Use segments for targeted emails (phase 2)

### Integrations
- **Zapier**: Connect to 5000+ apps (via webhooks + API)
- **Webhooks**: Send events to external URLs
- **API**: RESTful API with keys for custom integrations

---

## 13. ANALYTICS & REPORTING

### School Dashboard (Owner/Admin)
- **Sales**: Revenue, transactions, refunds, conversion rate, AOV
- **Learners**: Total users, active users, new signups
- **Courses**: Total enrollments, completions, avg time to complete
- **Engagement**: Logins, community posts, video watch time
- **Top Courses**: By revenue, enrollments, completion rate

### Course Analytics (Instructor)
- **Enrollment**: Total, active, completed, dropped
- **Progress**: Avg completion %, lesson drop-off points
- **Engagement**: Avg time per lesson, video heat maps
- **Assessments**: Quiz scores, pass/fail rates, common wrong answers
- **Discussions**: Posts, comments, engagement rate

### Learner Analytics (Org Admin / Instructor)
- Per-learner view: Courses enrolled, progress, time spent, last activity, grades
- Cohort view: Compare learners in a cohort

### Org Analytics (Org Manager)
- Seat utilization
- Course completion rates for org learners
- Time spent learning
- Top performers

### Funnel Analytics (Phase 2)
- Track: Page view → Add to cart → Checkout → Purchase
- Identify drop-off points

---

## 14. ADMIN PANELS

### Platform Super Admin Panel
- All schools list + search
- Impersonate school owner
- Billing plan management
- Feature flags
- Platform analytics (aggregate)
- Abuse reports, security logs

### School Admin Panel
Sections:
1. **Dashboard**: Quick stats, recent activity
2. **Users**: List, search, roles, tags, manual enrollments, access overrides
3. **Courses**: Create, edit, duplicate, archive, pricing, settings
4. **Content Library**: Upload media, organize folders, view usage
5. **Community**: Spaces, moderation queue, reports, banned users
6. **Commerce**: 
   - Products & pricing
   - Orders & invoices
   - Coupons
   - Affiliates & commissions
7. **Organizations**: List, create, seat purchases, analytics
8. **Analytics**: Dashboards, custom reports, export
9. **Site Builder**: 
   - Pages editor
   - Navigation menus
   - Theme customization
   - Domain settings
10. **Integrations**: 
    - Stripe connect
    - Email provider
    - Webhooks
    - API keys
11. **Settings**: 
    - Branding (logo, colors, fonts)
    - Legal pages
    - Notification templates
    - Security (password rules, 2FA)
    - Localization (phase 2)
12. **Support**: Help docs, contact support

### Instructor Panel
Simplified admin with access to:
- My Courses
- Content Library (own uploads)
- Learners (enrolled in my courses)
- Gradebook
- Analytics (my courses)

### Org Admin Panel
- Dashboard: Seat usage, learner progress
- Learners: Invite, assign courses, view progress
- Purchases: Buy more seats, billing history
- Analytics: Org-specific reports

---

## 15. AUTHENTICATION & SECURITY

### Auth Methods
- **Email/Password**: Standard, with password requirements
- **Magic Link**: Passwordless email login
- **Social Login**: Google, Facebook (phase 2)
- **SSO**: SAML/OAuth for orgs (phase 2)

### Security Features
- **Password**: Min 8 chars, complexity rules (optional per school)
- **MFA**: TOTP-based (admin opt-in, phase 2)
- **Rate Limiting**: Login attempts, API calls
- **Session Management**: JWT tokens, refresh tokens, expiry
- **Audit Logs**: Admin actions (user created, course published, etc.)
- **GDPR**: 
  - User data export (JSON)
  - Right to be forgotten (delete user)
  - Consent tracking (phase 2)

---

## 16. NOTIFICATIONS

### Channels
- **In-App**: Notification center in learner dashboard
- **Email**: Transactional + opt-in marketing
- **Push** (Phase 3): Mobile app notifications
- **SMS** (Phase 3): Twilio integration

### Event Types
- New lesson unlocked
- Assignment due soon
- Instructor announcement
- Community reply/mention
- Certificate issued
- Purchase confirmation
- Refund processed
- Inactivity reminder

### User Preferences
- Manage notification settings per channel
- Opt-out of marketing emails

---

## 17. SEARCH

### Global Search (within school)
- Courses by title, description, tags
- Lessons by title, content
- Community posts
- Users (admin only)

### Transcript Search (Phase 2)
- Search within video transcripts
- Jump to exact timestamp

### Filters
- Course: Type, category, price, instructor
- Community: Space, author, date

---

