# Database Schema Design - Multi-Tenant LMS Platform

## Multi-Tenancy Strategy

**Approach:** Single database with `tenant_id` (school_id) column isolation
- Simpler operations, backups, migrations
- Row-level security policies
- Connection pooling efficiency
- Trade-off: Less isolation than database-per-tenant, but suitable for SaaS at scale

---

## Core Tables

### 1. TENANCY & IDENTITY

#### `schools` (tenants)
```sql
id                    UUID PRIMARY KEY
name                  VARCHAR(255) NOT NULL
slug                  VARCHAR(100) UNIQUE NOT NULL
domain                VARCHAR(255) UNIQUE  -- custom domain
subdomain             VARCHAR(100) UNIQUE NOT NULL -- e.g., acme.outdure-edge.com
plan_tier             VARCHAR(50) -- starter, professional, business, enterprise
plan_status           VARCHAR(50) -- trial, active, suspended, cancelled
trial_ends_at         TIMESTAMP
billing_email         VARCHAR(255)
stripe_customer_id    VARCHAR(255)
logo_url              TEXT
favicon_url           TEXT
primary_color         VARCHAR(7) -- hex
secondary_color       VARCHAR(7)
font_family           VARCHAR(100)
timezone              VARCHAR(50)
locale                VARCHAR(10) DEFAULT 'en'
ssl_enabled           BOOLEAN DEFAULT false
ssl_cert_status       VARCHAR(50)
seo_title             VARCHAR(255)
seo_description       TEXT
ga_tracking_id        VARCHAR(50)
facebook_pixel_id     VARCHAR(50)
settings              JSONB -- theme, features, limits
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
deleted_at            TIMESTAMP
```

#### `users`
```sql
id                    UUID PRIMARY KEY
email                 VARCHAR(255) UNIQUE NOT NULL
password_hash         VARCHAR(255)
first_name            VARCHAR(100)
last_name             VARCHAR(100)
avatar_url            TEXT
phone                 VARCHAR(50)
timezone              VARCHAR(50)
locale                VARCHAR(10)
email_verified        BOOLEAN DEFAULT false
email_verified_at     TIMESTAMP
last_login_at         TIMESTAMP
mfa_enabled           BOOLEAN DEFAULT false
mfa_secret            VARCHAR(255)
status                VARCHAR(50) DEFAULT 'active' -- active, suspended, deleted
metadata              JSONB
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
deleted_at            TIMESTAMP

INDEX idx_users_email ON users(email)
```

#### `school_memberships`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
status                VARCHAR(50) DEFAULT 'active'
joined_at             TIMESTAMP DEFAULT NOW()
left_at               TIMESTAMP

UNIQUE(school_id, user_id)
INDEX idx_school_memberships_school ON school_memberships(school_id)
INDEX idx_school_memberships_user ON school_memberships(user_id)
```

---

### 2. ROLES & PERMISSIONS (RBAC)

#### `roles`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE -- NULL for system roles
name                  VARCHAR(100) NOT NULL
slug                  VARCHAR(100) NOT NULL
description           TEXT
is_system_role        BOOLEAN DEFAULT false
is_custom             BOOLEAN DEFAULT false
priority              INTEGER DEFAULT 0
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

UNIQUE(school_id, slug)
INDEX idx_roles_school ON roles(school_id)
```

**System roles:** `super_admin`, `school_owner`, `school_admin`, `instructor`, `teaching_assistant`, `learner`, `org_manager`, `org_learner`, `affiliate`

#### `permissions`
```sql
id                    UUID PRIMARY KEY
domain                VARCHAR(50) NOT NULL -- site, courses, users, commerce, community, analytics, integrations
action                VARCHAR(100) NOT NULL -- create, read, update, delete, publish, manage, view
resource              VARCHAR(100) -- specific resource type if applicable
description           TEXT
created_at            TIMESTAMP DEFAULT NOW()

UNIQUE(domain, action, resource)
```

**Permission examples:**
- `courses.create.*`
- `courses.update.own`
- `courses.update.all`
- `users.manage.all`
- `analytics.view.school`
- `commerce.manage.orders`

#### `role_permissions`
```sql
id                    UUID PRIMARY KEY
role_id               UUID REFERENCES roles(id) ON DELETE CASCADE
permission_id         UUID REFERENCES permissions(id) ON DELETE CASCADE
granted               BOOLEAN DEFAULT true

UNIQUE(role_id, permission_id)
```

#### `user_roles`
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
role_id               UUID REFERENCES roles(id) ON DELETE CASCADE
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
scope                 VARCHAR(50) -- global, school, course, organization
scope_id              UUID -- course_id, organization_id if scoped
granted_by            UUID REFERENCES users(id)
granted_at            TIMESTAMP DEFAULT NOW()
expires_at            TIMESTAMP

INDEX idx_user_roles_user ON user_roles(user_id)
INDEX idx_user_roles_school ON user_roles(school_id)
```

---

### 3. ORGANIZATIONS (B2B)

#### `organizations`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
slug                  VARCHAR(100) NOT NULL
logo_url              TEXT
industry              VARCHAR(100)
size                  VARCHAR(50)
contact_email         VARCHAR(255)
contact_phone         VARCHAR(50)
billing_email         VARCHAR(255)
status                VARCHAR(50) DEFAULT 'active'
settings              JSONB
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

UNIQUE(school_id, slug)
INDEX idx_organizations_school ON organizations(school_id)
```

#### `organization_memberships`
```sql
id                    UUID PRIMARY KEY
organization_id       UUID REFERENCES organizations(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
role                  VARCHAR(50) -- manager, member
joined_at             TIMESTAMP DEFAULT NOW()
left_at               TIMESTAMP

UNIQUE(organization_id, user_id)
```

#### `organization_seat_purchases`
```sql
id                    UUID PRIMARY KEY
organization_id       UUID REFERENCES organizations(id) ON DELETE CASCADE
product_id            UUID REFERENCES products(id)
seats_purchased       INTEGER NOT NULL
seats_used            INTEGER DEFAULT 0
price_per_seat        DECIMAL(10,2)
total_amount          DECIMAL(10,2)
currency              VARCHAR(3) DEFAULT 'USD'
purchased_at          TIMESTAMP DEFAULT NOW()
expires_at            TIMESTAMP
status                VARCHAR(50) -- active, expired, cancelled
```

#### `organization_seat_assignments`
```sql
id                    UUID PRIMARY KEY
seat_purchase_id      UUID REFERENCES organization_seat_purchases(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
assigned_by           UUID REFERENCES users(id)
assigned_at           TIMESTAMP DEFAULT NOW()
revoked_at            TIMESTAMP

UNIQUE(seat_purchase_id, user_id)
```

---

### 4. PRODUCTS & COURSES

#### `products`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
type                  VARCHAR(50) NOT NULL -- course, bundle, membership, coaching, event, download, certification
name                  VARCHAR(255) NOT NULL
slug                  VARCHAR(255) NOT NULL
tagline               VARCHAR(255)
description           TEXT
thumbnail_url         TEXT
video_preview_url     TEXT
status                VARCHAR(50) DEFAULT 'draft' -- draft, published, archived
is_featured           BOOLEAN DEFAULT false
visibility            VARCHAR(50) DEFAULT 'public' -- public, private, unlisted
seo_title             VARCHAR(255)
seo_description       TEXT
seo_image_url         TEXT
settings              JSONB -- drip, prerequisites, completion rules
created_by            UUID REFERENCES users(id)
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
published_at          TIMESTAMP
archived_at           TIMESTAMP

UNIQUE(school_id, slug)
INDEX idx_products_school ON products(school_id)
INDEX idx_products_status ON products(status)
```

#### `courses` (extends products where type='course')
```sql
id                    UUID PRIMARY KEY
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
course_type           VARCHAR(50) -- self_paced, cohort_based, micro
level                 VARCHAR(50) -- beginner, intermediate, advanced
duration_hours        DECIMAL(5,2)
language              VARCHAR(10)
has_certificate       BOOLEAN DEFAULT true
certificate_template_id UUID REFERENCES certificate_templates(id)
completion_criteria   JSONB -- {video_watch_percentage: 80, quiz_pass_required: true}
drip_settings         JSONB
version               INTEGER DEFAULT 1
```

#### `course_categories`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(100) NOT NULL
slug                  VARCHAR(100) NOT NULL
parent_id             UUID REFERENCES course_categories(id)
sort_order            INTEGER DEFAULT 0

UNIQUE(school_id, slug)
```

#### `product_categories`
```sql
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
category_id           UUID REFERENCES course_categories(id) ON DELETE CASCADE
PRIMARY KEY (product_id, category_id)
```

#### `course_instructors`
```sql
id                    UUID PRIMARY KEY
course_id             UUID REFERENCES courses(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
role                  VARCHAR(50) DEFAULT 'instructor' -- instructor, teaching_assistant
joined_at             TIMESTAMP DEFAULT NOW()

UNIQUE(course_id, user_id)
```

#### `modules`
```sql
id                    UUID PRIMARY KEY
course_id             UUID REFERENCES courses(id) ON DELETE CASCADE
title                 VARCHAR(255) NOT NULL
description           TEXT
sort_order            INTEGER NOT NULL
is_published          BOOLEAN DEFAULT false
settings              JSONB
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

INDEX idx_modules_course ON modules(course_id)
```

#### `lessons`
```sql
id                    UUID PRIMARY KEY
module_id             UUID REFERENCES modules(id) ON DELETE CASCADE
title                 VARCHAR(255) NOT NULL
description           TEXT
type                  VARCHAR(50) NOT NULL -- video, audio, text, pdf, assignment, quiz, live_session, embed, download
content               JSONB -- type-specific content data
duration_seconds      INTEGER
is_free_preview       BOOLEAN DEFAULT false
is_published          BOOLEAN DEFAULT false
sort_order            INTEGER NOT NULL
settings              JSONB
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

INDEX idx_lessons_module ON lessons(module_id)
```

#### `lesson_video_content`
```sql
id                    UUID PRIMARY KEY
lesson_id             UUID REFERENCES lessons(id) ON DELETE CASCADE
video_url             TEXT NOT NULL
video_provider        VARCHAR(50) -- self_hosted, youtube, vimeo, wistia
video_id              VARCHAR(255)
thumbnail_url         TEXT
duration_seconds      INTEGER
has_transcript        BOOLEAN DEFAULT false
transcript_url        TEXT
transcript_text       TEXT
interactive_data      JSONB -- hotspots, questions, bookmarks
processing_status     VARCHAR(50) DEFAULT 'pending'
```

#### `lesson_prerequisites`
```sql
id                    UUID PRIMARY KEY
lesson_id             UUID REFERENCES lessons(id) ON DELETE CASCADE
prerequisite_lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE
required              BOOLEAN DEFAULT true

UNIQUE(lesson_id, prerequisite_lesson_id)
```

#### `bundles`
```sql
id                    UUID PRIMARY KEY
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
bundle_type           VARCHAR(50) -- learning_path, package
enforce_order         BOOLEAN DEFAULT false
```

#### `bundle_items`
```sql
id                    UUID PRIMARY KEY
bundle_id             UUID REFERENCES bundles(id) ON DELETE CASCADE
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
sort_order            INTEGER NOT NULL
is_required           BOOLEAN DEFAULT true
```

---

### 5. ASSESSMENTS

#### `quizzes`
```sql
id                    UUID PRIMARY KEY
lesson_id             UUID REFERENCES lessons(id) ON DELETE CASCADE
title                 VARCHAR(255) NOT NULL
description           TEXT
time_limit_minutes    INTEGER
attempts_allowed      INTEGER -- NULL = unlimited
passing_score         DECIMAL(5,2) -- percentage
randomize_questions   BOOLEAN DEFAULT false
show_correct_answers  VARCHAR(50) -- never, after_attempt, after_passing
settings              JSONB
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

#### `question_banks`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
description           TEXT
created_by            UUID REFERENCES users(id)
created_at            TIMESTAMP DEFAULT NOW()
```

#### `questions`
```sql
id                    UUID PRIMARY KEY
question_bank_id      UUID REFERENCES question_banks(id) ON DELETE CASCADE
quiz_id               UUID REFERENCES quizzes(id) ON DELETE SET NULL
type                  VARCHAR(50) NOT NULL -- mcq, multi_select, true_false, short_answer, long_answer, matching, ordering, fill_blank
question_text         TEXT NOT NULL
explanation           TEXT
points                DECIMAL(5,2) DEFAULT 1
difficulty            VARCHAR(50) -- easy, medium, hard
options               JSONB -- for MCQ, multi-select, matching, etc.
correct_answer        JSONB
sort_order            INTEGER
settings              JSONB
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

#### `quiz_attempts`
```sql
id                    UUID PRIMARY KEY
quiz_id               UUID REFERENCES quizzes(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
enrollment_id         UUID REFERENCES enrollments(id) ON DELETE CASCADE
attempt_number        INTEGER NOT NULL
score                 DECIMAL(5,2)
max_score             DECIMAL(5,2)
percentage            DECIMAL(5,2)
passed                BOOLEAN
answers               JSONB
started_at            TIMESTAMP NOT NULL
submitted_at          TIMESTAMP
time_spent_seconds    INTEGER

INDEX idx_quiz_attempts_user ON quiz_attempts(user_id)
INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id)
```

#### `assignments`
```sql
id                    UUID PRIMARY KEY
lesson_id             UUID REFERENCES lessons(id) ON DELETE CASCADE
title                 VARCHAR(255) NOT NULL
description           TEXT
max_points            DECIMAL(5,2)
due_date              TIMESTAMP
submission_types      JSONB -- [file, text, url]
max_file_size_mb      INTEGER
allowed_file_types    JSONB
rubric                JSONB
settings              JSONB
created_at            TIMESTAMP DEFAULT NOW()
```

#### `assignment_submissions`
```sql
id                    UUID PRIMARY KEY
assignment_id         UUID REFERENCES assignments(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
enrollment_id         UUID REFERENCES enrollments(id) ON DELETE CASCADE
submission_type       VARCHAR(50) -- file, text, url
submission_data       JSONB -- {files: [], text: "", url: ""}
submitted_at          TIMESTAMP NOT NULL
score                 DECIMAL(5,2)
feedback              TEXT
graded_by             UUID REFERENCES users(id)
graded_at             TIMESTAMP
status                VARCHAR(50) DEFAULT 'submitted' -- submitted, graded, returned

INDEX idx_submissions_assignment ON assignment_submissions(assignment_id)
INDEX idx_submissions_user ON assignment_submissions(user_id)
```

---

### 6. ENROLLMENTS & PROGRESS

#### `enrollments`
```sql
id                    UUID PRIMARY KEY
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
organization_id       UUID REFERENCES organizations(id) -- if org enrollment
enrollment_type       VARCHAR(50) -- purchase, free, admin_grant, org_assignment
status                VARCHAR(50) DEFAULT 'active' -- active, completed, suspended, expired
progress_percentage   DECIMAL(5,2) DEFAULT 0
started_at            TIMESTAMP
completed_at          TIMESTAMP
expires_at            TIMESTAMP
last_accessed_at      TIMESTAMP
certificate_issued_at TIMESTAMP
certificate_id        UUID
enrolled_at           TIMESTAMP DEFAULT NOW()

UNIQUE(product_id, user_id)
INDEX idx_enrollments_user ON enrollments(user_id)
INDEX idx_enrollments_product ON enrollments(product_id)
INDEX idx_enrollments_school ON enrollments(school_id)
```

#### `lesson_completions`
```sql
id                    UUID PRIMARY KEY
enrollment_id         UUID REFERENCES enrollments(id) ON DELETE CASCADE
lesson_id             UUID REFERENCES lessons(id) ON DELETE CASCADE
completed_at          TIMESTAMP NOT NULL
completion_data       JSONB -- watch percentage, quiz score, etc.

UNIQUE(enrollment_id, lesson_id)
INDEX idx_lesson_completions_enrollment ON lesson_completions(enrollment_id)
```

#### `video_watch_events`
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
lesson_id             UUID REFERENCES lessons(id) ON DELETE CASCADE
enrollment_id         UUID REFERENCES enrollments(id) ON DELETE CASCADE
watch_percentage      DECIMAL(5,2)
watch_duration_seconds INTEGER
last_position_seconds INTEGER
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_video_events_user_lesson ON video_watch_events(user_id, lesson_id)
```

#### `user_notes`
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
lesson_id             UUID REFERENCES lessons(id) ON DELETE CASCADE
timestamp_seconds     INTEGER -- for video notes
note_text             TEXT NOT NULL
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

#### `user_bookmarks`
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
lesson_id             UUID REFERENCES lessons(id) ON DELETE CASCADE
timestamp_seconds     INTEGER
title                 VARCHAR(255)
created_at            TIMESTAMP DEFAULT NOW()
```

---

### 7. CERTIFICATES & BADGES

#### `certificate_templates`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
design_data           JSONB -- layout, fonts, colors, images, dynamic fields
preview_url           TEXT
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

#### `certificates`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
enrollment_id         UUID REFERENCES enrollments(id) ON DELETE CASCADE
template_id           UUID REFERENCES certificate_templates(id)
certificate_number    VARCHAR(100) UNIQUE NOT NULL
issued_at             TIMESTAMP NOT NULL
expires_at            TIMESTAMP
verification_url      TEXT
pdf_url               TEXT
data                  JSONB -- rendered dynamic fields
status                VARCHAR(50) DEFAULT 'valid' -- valid, revoked, expired

INDEX idx_certificates_user ON certificates(user_id)
INDEX idx_certificates_number ON certificates(certificate_number)
```

#### `badges`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
description           TEXT
icon_url              TEXT
criteria              JSONB
created_at            TIMESTAMP DEFAULT NOW()
```

#### `user_badges`
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
badge_id              UUID REFERENCES badges(id) ON DELETE CASCADE
earned_at             TIMESTAMP NOT NULL
metadata              JSONB

UNIQUE(user_id, badge_id)
```

---

### 8. COMMERCE

#### `pricing_plans`
```sql
id                    UUID PRIMARY KEY
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
pricing_type          VARCHAR(50) NOT NULL -- one_time, subscription, pay_plan
price                 DECIMAL(10,2) NOT NULL
currency              VARCHAR(3) DEFAULT 'USD'
billing_interval      VARCHAR(50) -- monthly, yearly, quarterly (for subscriptions)
billing_interval_count INTEGER DEFAULT 1
trial_days            INTEGER DEFAULT 0
access_duration_days  INTEGER -- NULL = lifetime
is_default            BOOLEAN DEFAULT false
status                VARCHAR(50) DEFAULT 'active'
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_pricing_plans_product ON pricing_plans(product_id)
```

#### `coupons`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
code                  VARCHAR(100) UNIQUE NOT NULL
discount_type         VARCHAR(50) NOT NULL -- percentage, fixed_amount
discount_value        DECIMAL(10,2) NOT NULL
currency              VARCHAR(3) DEFAULT 'USD'
applies_to            VARCHAR(50) DEFAULT 'all' -- all, specific_products
max_uses              INTEGER -- NULL = unlimited
max_uses_per_user     INTEGER DEFAULT 1
times_used            INTEGER DEFAULT 0
valid_from            TIMESTAMP
valid_until           TIMESTAMP
status                VARCHAR(50) DEFAULT 'active'
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_coupons_code ON coupons(code)
```

#### `coupon_products`
```sql
coupon_id             UUID REFERENCES coupons(id) ON DELETE CASCADE
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
PRIMARY KEY (coupon_id, product_id)
```

#### `orders`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
organization_id       UUID REFERENCES organizations(id) -- if org purchase
order_number          VARCHAR(100) UNIQUE NOT NULL
status                VARCHAR(50) DEFAULT 'pending' -- pending, completed, failed, refunded
subtotal              DECIMAL(10,2) NOT NULL
discount_amount       DECIMAL(10,2) DEFAULT 0
tax_amount            DECIMAL(10,2) DEFAULT 0
total_amount          DECIMAL(10,2) NOT NULL
currency              VARCHAR(3) DEFAULT 'USD'
coupon_id             UUID REFERENCES coupons(id)
payment_provider      VARCHAR(50) DEFAULT 'stripe'
payment_intent_id     VARCHAR(255)
payment_status        VARCHAR(50)
billing_email         VARCHAR(255)
billing_address       JSONB
invoice_url           TEXT
receipt_url           TEXT
affiliate_id          UUID REFERENCES affiliates(id)
created_at            TIMESTAMP DEFAULT NOW()
completed_at          TIMESTAMP

INDEX idx_orders_user ON orders(user_id)
INDEX idx_orders_school ON orders(school_id)
INDEX idx_orders_number ON orders(order_number)
```

#### `order_items`
```sql
id                    UUID PRIMARY KEY
order_id              UUID REFERENCES orders(id) ON DELETE CASCADE
product_id            UUID REFERENCES products(id) ON DELETE CASCADE
pricing_plan_id       UUID REFERENCES pricing_plans(id)
quantity              INTEGER DEFAULT 1
price                 DECIMAL(10,2) NOT NULL
discount              DECIMAL(10,2) DEFAULT 0
total                 DECIMAL(10,2) NOT NULL
```

#### `refunds`
```sql
id                    UUID PRIMARY KEY
order_id              UUID REFERENCES orders(id) ON DELETE CASCADE
amount                DECIMAL(10,2) NOT NULL
currency              VARCHAR(3) DEFAULT 'USD'
reason                TEXT
status                VARCHAR(50) DEFAULT 'pending'
refund_id             VARCHAR(255) -- Stripe refund ID
processed_by          UUID REFERENCES users(id)
created_at            TIMESTAMP DEFAULT NOW()
processed_at          TIMESTAMP
```

---

### 9. AFFILIATES

#### `affiliates`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
affiliate_code        VARCHAR(100) UNIQUE NOT NULL
commission_rate       DECIMAL(5,2) DEFAULT 10.00 -- percentage
status                VARCHAR(50) DEFAULT 'active'
payment_method        VARCHAR(50) -- paypal, bank_transfer
payment_details       JSONB
total_clicks          INTEGER DEFAULT 0
total_conversions     INTEGER DEFAULT 0
total_revenue         DECIMAL(10,2) DEFAULT 0
total_commission      DECIMAL(10,2) DEFAULT 0
joined_at             TIMESTAMP DEFAULT NOW()

INDEX idx_affiliates_code ON affiliates(affiliate_code)
```

#### `affiliate_clicks`
```sql
id                    UUID PRIMARY KEY
affiliate_id          UUID REFERENCES affiliates(id) ON DELETE CASCADE
visitor_id            VARCHAR(255) -- cookie/session ID
ip_address            VARCHAR(50)
referrer              TEXT
landing_page          TEXT
clicked_at            TIMESTAMP DEFAULT NOW()
```

#### `affiliate_commissions`
```sql
id                    UUID PRIMARY KEY
affiliate_id          UUID REFERENCES affiliates(id) ON DELETE CASCADE
order_id              UUID REFERENCES orders(id) ON DELETE CASCADE
amount                DECIMAL(10,2) NOT NULL
commission_rate       DECIMAL(5,2) NOT NULL
status                VARCHAR(50) DEFAULT 'pending' -- pending, approved, paid
approved_at           TIMESTAMP
paid_at               TIMESTAMP
payout_id             UUID REFERENCES affiliate_payouts(id)
created_at            TIMESTAMP DEFAULT NOW()
```

#### `affiliate_payouts`
```sql
id                    UUID PRIMARY KEY
affiliate_id          UUID REFERENCES affiliates(id) ON DELETE CASCADE
amount                DECIMAL(10,2) NOT NULL
currency              VARCHAR(3) DEFAULT 'USD'
method                VARCHAR(50)
status                VARCHAR(50) DEFAULT 'pending'
transaction_id        VARCHAR(255)
processed_by          UUID REFERENCES users(id)
created_at            TIMESTAMP DEFAULT NOW()
processed_at          TIMESTAMP
```

---

### 10. COMMUNITY

#### `community_spaces`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
course_id             UUID REFERENCES courses(id) ON DELETE CASCADE -- NULL for school-wide
name                  VARCHAR(255) NOT NULL
slug                  VARCHAR(255) NOT NULL
description           TEXT
is_private            BOOLEAN DEFAULT false
settings              JSONB
created_at            TIMESTAMP DEFAULT NOW()

UNIQUE(school_id, slug)
```

#### `community_channels`
```sql
id                    UUID PRIMARY KEY
space_id              UUID REFERENCES community_spaces(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
slug                  VARCHAR(255) NOT NULL
description           TEXT
sort_order            INTEGER DEFAULT 0
is_private            BOOLEAN DEFAULT false
created_at            TIMESTAMP DEFAULT NOW()

UNIQUE(space_id, slug)
```

#### `community_posts`
```sql
id                    UUID PRIMARY KEY
channel_id            UUID REFERENCES community_channels(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
parent_post_id        UUID REFERENCES community_posts(id) -- for replies
post_type             VARCHAR(50) DEFAULT 'text' -- text, poll, announcement
title                 VARCHAR(255)
content               TEXT
media_urls            JSONB
poll_data             JSONB
is_pinned             BOOLEAN DEFAULT false
is_locked             BOOLEAN DEFAULT false
views_count           INTEGER DEFAULT 0
likes_count           INTEGER DEFAULT 0
comments_count        INTEGER DEFAULT 0
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
edited_at             TIMESTAMP

INDEX idx_posts_channel ON community_posts(channel_id)
INDEX idx_posts_user ON community_posts(user_id)
```

#### `community_reactions`
```sql
id                    UUID PRIMARY KEY
post_id               UUID REFERENCES community_posts(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
reaction_type         VARCHAR(50) DEFAULT 'like' -- like, love, helpful
created_at            TIMESTAMP DEFAULT NOW()

UNIQUE(post_id, user_id, reaction_type)
```

#### `community_moderation_actions`
```sql
id                    UUID PRIMARY KEY
post_id               UUID REFERENCES community_posts(id) ON DELETE CASCADE
moderator_id          UUID REFERENCES users(id) ON DELETE CASCADE
action                VARCHAR(50) NOT NULL -- pin, unpin, lock, unlock, delete, restore
reason                TEXT
created_at            TIMESTAMP DEFAULT NOW()
```

#### `community_reports`
```sql
id                    UUID PRIMARY KEY
post_id               UUID REFERENCES community_posts(id) ON DELETE CASCADE
reported_by           UUID REFERENCES users(id) ON DELETE CASCADE
reason                VARCHAR(100) NOT NULL
details               TEXT
status                VARCHAR(50) DEFAULT 'pending' -- pending, reviewed, actioned, dismissed
reviewed_by           UUID REFERENCES users(id)
reviewed_at           TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()
```

---

### 11. SITE BUILDER

#### `themes`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
is_active             BOOLEAN DEFAULT false
primary_color         VARCHAR(7)
secondary_color       VARCHAR(7)
accent_color          VARCHAR(7)
background_color      VARCHAR(7)
text_color            VARCHAR(7)
font_heading          VARCHAR(100)
font_body             VARCHAR(100)
border_radius         VARCHAR(50) -- none, small, medium, large
custom_css            TEXT
settings              JSONB
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

#### `pages`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
title                 VARCHAR(255) NOT NULL
slug                  VARCHAR(255) NOT NULL
page_type             VARCHAR(50) -- home, course_catalog, course_detail, custom, legal
content               JSONB -- page builder blocks
is_published          BOOLEAN DEFAULT false
seo_title             VARCHAR(255)
seo_description       TEXT
seo_image_url         TEXT
custom_head           TEXT -- custom scripts
custom_footer         TEXT
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
published_at          TIMESTAMP

UNIQUE(school_id, slug)
INDEX idx_pages_school ON pages(school_id)
```

#### `navigation_menus`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(100) NOT NULL -- header, footer, sidebar
items                 JSONB -- nested menu structure
sort_order            INTEGER DEFAULT 0
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

UNIQUE(school_id, name)
```

---

### 12. MARKETING & AUTOMATIONS

#### `email_templates`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
slug                  VARCHAR(255) NOT NULL
category              VARCHAR(50) -- transactional, marketing, learning
subject               VARCHAR(255) NOT NULL
body_html             TEXT NOT NULL
body_text             TEXT
variables             JSONB -- available merge fields
is_system             BOOLEAN DEFAULT false
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

UNIQUE(school_id, slug)
```

#### `automation_rules`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
description           TEXT
trigger_type          VARCHAR(100) NOT NULL -- purchase, enrollment, completion, inactivity, quiz_failed
trigger_config        JSONB
conditions            JSONB -- additional filters
actions               JSONB -- [{type: 'send_email', config: {...}}, {type: 'add_tag'}, ...]
is_active             BOOLEAN DEFAULT true
priority              INTEGER DEFAULT 0
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

#### `automation_executions`
```sql
id                    UUID PRIMARY KEY
rule_id               UUID REFERENCES automation_rules(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
trigger_data          JSONB
status                VARCHAR(50) DEFAULT 'pending' -- pending, running, completed, failed
error                 TEXT
executed_at           TIMESTAMP
completed_at          TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()
```

#### `user_tags`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(100) NOT NULL
color                 VARCHAR(7)
created_at            TIMESTAMP DEFAULT NOW()

UNIQUE(school_id, name)
```

#### `user_tag_assignments`
```sql
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
tag_id                UUID REFERENCES user_tags(id) ON DELETE CASCADE
assigned_at           TIMESTAMP DEFAULT NOW()
PRIMARY KEY (user_id, tag_id)
```

---

### 13. NOTIFICATIONS

#### `notifications`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
type                  VARCHAR(100) NOT NULL -- lesson_unlocked, announcement, community_reply, certificate_issued
title                 VARCHAR(255) NOT NULL
message               TEXT
action_url            TEXT
icon                  VARCHAR(100)
is_read               BOOLEAN DEFAULT false
read_at               TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_notifications_user ON notifications(user_id)
INDEX idx_notifications_unread ON notifications(user_id, is_read)
```

#### `notification_preferences`
```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES users(id) ON DELETE CASCADE
notification_type     VARCHAR(100) NOT NULL
channel_email         BOOLEAN DEFAULT true
channel_in_app        BOOLEAN DEFAULT true
channel_push          BOOLEAN DEFAULT false
updated_at            TIMESTAMP DEFAULT NOW()

UNIQUE(user_id, notification_type)
```

---

### 14. INTEGRATIONS

#### `integrations`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
provider              VARCHAR(100) NOT NULL -- stripe, zapier, mailchimp, zoom, google_analytics
status                VARCHAR(50) DEFAULT 'inactive' -- active, inactive, error
credentials           JSONB -- encrypted
settings              JSONB
last_synced_at        TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

UNIQUE(school_id, provider)
```

#### `webhooks`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
url                   TEXT NOT NULL
events                JSONB -- [enrollment_created, purchase_completed, ...]
secret                VARCHAR(255) -- for signature verification
is_active             BOOLEAN DEFAULT true
created_at            TIMESTAMP DEFAULT NOW()
```

#### `webhook_deliveries`
```sql
id                    UUID PRIMARY KEY
webhook_id            UUID REFERENCES webhooks(id) ON DELETE CASCADE
event_type            VARCHAR(100) NOT NULL
payload               JSONB
response_status       INTEGER
response_body         TEXT
delivered_at          TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()
```

#### `api_keys`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
name                  VARCHAR(255) NOT NULL
key_hash              VARCHAR(255) NOT NULL
key_prefix            VARCHAR(20) NOT NULL
permissions           JSONB
last_used_at          TIMESTAMP
expires_at            TIMESTAMP
created_by            UUID REFERENCES users(id)
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_api_keys_prefix ON api_keys(key_prefix)
```

---

### 15. ANALYTICS & REPORTING

#### `analytics_events`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id)
event_type            VARCHAR(100) NOT NULL -- page_view, video_play, quiz_start, purchase, etc.
event_data            JSONB
session_id            VARCHAR(255)
ip_address            VARCHAR(50)
user_agent            TEXT
referrer              TEXT
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_analytics_events_school ON analytics_events(school_id, created_at)
INDEX idx_analytics_events_type ON analytics_events(event_type, created_at)
```

#### `daily_metrics`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
metric_date           DATE NOT NULL
metric_type           VARCHAR(100) NOT NULL -- revenue, enrollments, completions, active_users
dimension             VARCHAR(100) -- product_id, course_id, user_id
dimension_value       VARCHAR(255)
value                 DECIMAL(15,2)
count                 INTEGER

UNIQUE(school_id, metric_date, metric_type, dimension, dimension_value)
INDEX idx_daily_metrics_school_date ON daily_metrics(school_id, metric_date)
```

---

### 16. MEDIA LIBRARY

#### `media_files`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
uploaded_by           UUID REFERENCES users(id) ON DELETE SET NULL
file_name             VARCHAR(255) NOT NULL
file_type             VARCHAR(50) NOT NULL -- image, video, audio, document
mime_type             VARCHAR(100)
file_size_bytes       BIGINT
storage_provider      VARCHAR(50) DEFAULT 's3'
storage_key           TEXT NOT NULL
storage_url           TEXT NOT NULL
cdn_url               TEXT
thumbnail_url         TEXT
width                 INTEGER
height                INTEGER
duration_seconds      INTEGER
metadata              JSONB
uploaded_at           TIMESTAMP DEFAULT NOW()

INDEX idx_media_school ON media_files(school_id)
```

---

### 17. SYSTEM & AUDIT

#### `audit_logs`
```sql
id                    UUID PRIMARY KEY
school_id             UUID REFERENCES schools(id) ON DELETE CASCADE
user_id               UUID REFERENCES users(id) ON DELETE SET NULL
action                VARCHAR(100) NOT NULL
resource_type         VARCHAR(100)
resource_id           UUID
changes               JSONB -- before/after snapshot
ip_address            VARCHAR(50)
user_agent            TEXT
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_audit_logs_school ON audit_logs(school_id, created_at)
INDEX idx_audit_logs_user ON audit_logs(user_id, created_at)
```

#### `system_jobs`
```sql
id                    UUID PRIMARY KEY
job_type              VARCHAR(100) NOT NULL -- email_send, video_transcode, analytics_aggregate
status                VARCHAR(50) DEFAULT 'pending' -- pending, running, completed, failed
payload               JSONB
result                JSONB
error                 TEXT
attempts              INTEGER DEFAULT 0
max_attempts          INTEGER DEFAULT 3
scheduled_at          TIMESTAMP
started_at            TIMESTAMP
completed_at          TIMESTAMP
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_system_jobs_status ON system_jobs(status, scheduled_at)
```

---

## Indexes Summary

**Critical indexes for performance:**
- Multi-column indexes on foreign keys + timestamps for analytics queries
- Partial indexes on active/published records
- Full-text search indexes on course titles, descriptions
- Composite indexes for enrollment lookups (user_id + product_id + status)

---

## Data Retention & Archiving

- Soft deletes (deleted_at) for users, schools, courses
- Archive old analytics_events after 90 days to cold storage
- Keep audit_logs for 1 year minimum (compliance)
- Webhook deliveries: keep 30 days

---

## Security Considerations

- Encrypt sensitive fields: password_hash, mfa_secret, payment credentials
- Row-level security policies by school_id
- API rate limiting by user/IP
- GDPR compliance: user data export/deletion flows

---

This schema supports:
✅ Multi-tenancy with school isolation
✅ Complex RBAC with scoped permissions
✅ All course types (self-paced, cohort, bundles, memberships)
✅ Rich assessments (quizzes, assignments, grading)
✅ B2B organizations with seat management
✅ Full commerce (products, pricing, coupons, affiliates)
✅ Built-in community
✅ Site builder
✅ Marketing automations
✅ Analytics & reporting
✅ Certificates & badges
✅ Video progress tracking
✅ Webhooks & integrations
