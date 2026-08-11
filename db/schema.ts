/**
 * v2 data model — the single source of truth for the Training Platform schema.
 *
 * Follows CLAUDE.md §5. Every domain table carries `tenantId` (rule §7.5) so RLS
 * policies can tenant-scope without joins. `progress_events` and `audit_log` are
 * append-only (never UPDATE); state is derived by query. `audit_log` is
 * hash-chained for tamper-evidence.
 *
 * RLS policies, the JWT tenant/role helpers, seed system roles, and the
 * append-only / hash-chain enforcement triggers live in
 * migrations/0001_rls_and_policies.sql (drizzle-kit only emits table DDL).
 */
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  bigint,
  bigserial,
  boolean,
  numeric,
  unique,
  index,
} from 'drizzle-orm/pg-core';

/* ── Enums ─────────────────────────────────────────────────────────────── */

export const tenantStatus = pgEnum('tenant_status', [
  'trial',
  'active',
  'past_due',
  'suspended',
  'cancelled',
]);

export const membershipRole = pgEnum('membership_role', [
  'platform_admin',
  'company_admin',
  'instructor',
  'learner',
]);

/**
 * `pending` is a REQUEST, not a membership: someone asked to join through /join
 * and no admin has decided yet.
 *
 * It deliberately grants nothing, and does so by construction rather than by a
 * check someone has to remember. The access-token hook (migration 0010) and
 * primaryMembership both select `status in ('active','invited')`, so a pending
 * row yields no tenant claim and resolves to no academy. Adding it to either
 * list would silently open the door.
 */
export const membershipStatus = pgEnum('membership_status', [
  'invited',
  'active',
  'deactivated',
  'pending',
]);

export const courseStatus = pgEnum('course_status', ['draft', 'published', 'archived']);

export const lessonType = pgEnum('lesson_type', ['video', 'pdf', 'scorm', 'quiz', 'text', 'live']);

export const assetKind = pgEnum('asset_kind', [
  'mux_video',
  'youtube',
  'pdf',
  'scorm_package',
  'image',
  'file',
]);

export const enrollmentStatus = pgEnum('enrollment_status', [
  'active',
  'completed',
  'cancelled',
  'expired',
]);

export const enrollmentSource = pgEnum('enrollment_source', [
  'free',
  'purchase',
  'admin',
  'invite',
  'import',
]);

export const quizQuestionType = pgEnum('quiz_question_type', [
  'mcq',
  'true_false',
  'multi_select',
  'short_text',
]);

export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'unpaid',
]);

export const orderStatus = pgEnum('order_status', ['pending', 'paid', 'failed', 'refunded']);

/* ── Tenancy & identity ────────────────────────────────────────────────── */

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  planId: text('plan_id').notNull().default('trial'),
  customDomain: text('custom_domain').unique(),
  status: tenantStatus('status').notNull().default('trial'),
  // Storefront branding: { tagline, logoUrl, primaryColor }.
  branding: jsonb('branding').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Mirrors auth.users; id equals the Supabase Auth user id.
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull().default(''),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRole('role').notNull().default('learner'),
    // Connect user-type/tier alignment (e.g. CON_REGISTERED). See web lib/connect-roles.
    connectRoleCode: text('connect_role_code'),
    status: membershipStatus('status').notNull().default('invited'),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantUserUnique: unique('memberships_tenant_user_unique').on(t.tenantId, t.userId),
    tenantIdx: index('memberships_tenant_idx').on(t.tenantId),
    userIdx: index('memberships_user_idx').on(t.userId),
  }),
);

// System roles have tenantId NULL; custom per-tenant roles carry a tenantId.
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  scope: text('scope').notNull().default('tenant'),
});

/* ── Courses & content ─────────────────────────────────────────────────── */

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull().default(''),
    status: courseStatus('status').notNull().default('draft'),
    price: numeric('price', { precision: 10, scale: 2 }),
    currency: text('currency').notNull().default('USD'),
    imageUrl: text('image_url'),
    instructor: text('instructor').notNull().default(''),
    level: text('level').notNull().default('Beginner'),
    category: text('category'),
    // Connect tier this course confers on completion (e.g. CON_TRAINED).
    confersRoleCode: text('confers_role_code'),
    // Default ON (opt-out per course). The column shipped in the v2 schema but was
    // never read — every completion issued a certificate regardless. Migration
    // 0017 gates issuance on it and backfills existing courses to true so nothing
    // stops issuing; admins can now turn it off per course.
    certificateEnabled: boolean('certificate_enabled').notNull().default(true),
    certificateTemplateId: uuid('certificate_template_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantSlugUnique: unique('courses_tenant_slug_unique').on(t.tenantId, t.slug),
    tenantIdx: index('courses_tenant_idx').on(t.tenantId),
  }),
);

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    title: text('title').notNull().default(''),
    isFree: boolean('is_free').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ courseIdx: index('sections_course_idx').on(t.courseId) }),
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    type: lessonType('type').notNull().default('text'),
    position: integer('position').notNull().default(0),
    title: text('title').notNull().default(''),
    // Optional author-set estimate, minutes. Powers "about N min left" on the
    // learner dashboard/outline. Null = unknown (falls back to lessons-left).
    estimatedMinutes: integer('estimated_minutes'),
    // Normalises the old 12-URL-column shape: type-specific data lives here.
    content: jsonb('content').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    courseIdx: index('lessons_course_idx').on(t.courseId),
    sectionIdx: index('lessons_section_idx').on(t.sectionId),
  }),
);

export const lessonAssets = pgTable(
  'lesson_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    kind: assetKind('kind').notNull(),
    muxAssetId: text('mux_asset_id'),
    muxPlaybackId: text('mux_playback_id'),
    storagePath: text('storage_path'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ lessonIdx: index('lesson_assets_lesson_idx').on(t.lessonId) }),
);

/* ── Enrollment & progress (event-sourced) ─────────────────────────────── */

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    status: enrollmentStatus('status').notNull().default('active'),
    source: enrollmentSource('source').notNull().default('free'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => ({
    userCourseUnique: unique('enrollments_user_course_unique').on(t.userId, t.courseId),
    tenantIdx: index('enrollments_tenant_idx').on(t.tenantId),
    courseIdx: index('enrollments_course_idx').on(t.courseId),
  }),
);

// APPEND-ONLY. Never UPDATE — derive completion/time-on-task/last-position by query.
export const progressEvents = pgTable(
  'progress_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /**
     * NOT foreign keys, for the same reason lessonId below is not — and
     * resolved the same way (migration 0016; see also 0009 and 0012).
     *
     * progress_events is append-only: forbid_mutation rejects UPDATE and
     * DELETE. Any referential action is therefore blocked by construction —
     * CASCADE issues a DELETE, SET NULL issues an UPDATE, and both trip the
     * trigger and abort the whole transaction. So while these cascaded from
     * tenants and enrollments, deleting a tenant, a course or an enrollment
     * FAILED for any learner who had generated a single event: verified on
     * 2026-08-06, 59 of 73 junk courses could not be deleted.
     *
     * The ids stay as plain historical references. That is the right shape for
     * an append-only event log — the event records what happened, and must stay
     * truthful after its subject is gone.
     *
     * Consequence: readers must tolerate an enrollment_id or tenant_id with no
     * matching row, and LEFT JOIN accordingly.
     *
     * NOT settled by this: whether learner progress may ever be DELETED (GDPR
     * Article 17). Dropping the constraints unblocks deleting the parent while
     * deleting no events. See docs/POLISH_BACKLOG.md §5 — owner decision.
     */
    tenantId: uuid('tenant_id').notNull(),
    enrollmentId: uuid('enrollment_id').notNull(),
    lessonId: uuid('lesson_id'),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    durationMs: bigint('duration_ms', { mode: 'number' }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    enrollmentIdx: index('progress_events_enrollment_idx').on(t.enrollmentId),
    lessonIdx: index('progress_events_lesson_idx').on(t.lessonId),
    // Analytics scans this, the fastest-growing table. tenant_id alone is not
    // selective on a single-tenant deployment, so the selective columns lead:
    // event_type + lesson_id for the per-lesson watch rollup, occurred_at for
    // the "active in last 30 days" count.
    analyticsWatchIdx: index('progress_events_tenant_event_lesson_idx').on(
      t.tenantId,
      t.eventType,
      t.lessonId,
    ),
    analyticsActiveIdx: index('progress_events_tenant_occurred_idx').on(t.tenantId, t.occurredAt),
  }),
);

/* ── Quizzes ───────────────────────────────────────────────────────────── */

export const quizzes = pgTable('quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    type: quizQuestionType('type').notNull().default('mcq'),
    prompt: text('prompt').notNull(),
    options: jsonb('options').notNull().default([]),
    correct: jsonb('correct').notNull().default([]),
    points: integer('points').notNull().default(1),
  },
  (t) => ({ quizIdx: index('quiz_questions_quiz_idx').on(t.quizId) }),
);

export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    score: numeric('score', { precision: 5, scale: 2 }),
    passed: boolean('passed'),
  },
  (t) => ({
    enrollmentIdx: index('quiz_attempts_enrollment_idx').on(t.enrollmentId),
    // Analytics counts attempts (and passes) per tenant.
    tenantPassedIdx: index('quiz_attempts_tenant_passed_idx').on(t.tenantId, t.passed),
  }),
);

export const quizAnswers = pgTable(
  'quiz_answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => quizAttempts.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => quizQuestions.id, { onDelete: 'cascade' }),
    response: jsonb('response').notNull().default({}),
    isCorrect: boolean('is_correct'),
    pointsAwarded: integer('points_awarded').notNull().default(0),
    // Per-question time spent, ms (friction insight). Nullable — legacy answers
    // and clients that don't report timing leave it null.
    durationMs: integer('duration_ms'),
  },
  // Analytics friction ranking scans this: WHERE tenant_id GROUP BY question_id.
  (t) => ({
    tenantQuestionIdx: index('quiz_answers_tenant_question_idx').on(t.tenantId, t.questionId),
  }),
);

/* ── Certificates ──────────────────────────────────────────────────────── */

export const certificateTemplates = pgTable('certificate_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Default'),
  design: jsonb('design').notNull().default({}),
  accreditationBody: text('accreditation_body'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').references(() => certificateTemplates.id, {
      onDelete: 'set null',
    }),
    verificationCode: text('verification_code').notNull().unique(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    credential: jsonb('credential').notNull().default({}),
  },
  (t) => ({
    enrollmentIdx: index('certificates_enrollment_idx').on(t.enrollmentId),
    // The certificates admin page counts + lists by tenant.
    tenantIdx: index('certificates_tenant_idx').on(t.tenantId),
  }),
);

/* ── xAPI (schema-only at MVP) ─────────────────────────────────────────── */

export const xapiStatements = pgTable('xapi_statements', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  actor: jsonb('actor').notNull(),
  verb: jsonb('verb').notNull(),
  object: jsonb('object').notNull(),
  result: jsonb('result'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
});

/* ── Billing ───────────────────────────────────────────────────────────── */

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  planId: text('plan_id').notNull(),
  status: subscriptionStatus('status').notNull().default('trialing'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  stripePaymentIntent: text('stripe_payment_intent').unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: orderStatus('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payouts = pgTable('payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  stripePayoutId: text('stripe_payout_id').unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ── Audit log (append-only, hash-chained) ─────────────────────────────── */

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /**
     * Monotonic chain position. The chain USED to be ordered by `occurred_at`,
     * which defaults to now() = TRANSACTION START — so under concurrency the
     * chain order did not match the commit order and no verifier could
     * linearise it. The hash trigger takes a per-tenant advisory lock held to
     * commit, so within a tenant this sequence is commit order exactly.
     */
    seq: bigserial('seq', { mode: 'number' }).notNull(),
    /**
     * Which canonicalisation produced `hash`. 1 = the pre-0015 algorithm, which
     * concatenated fields with no delimiter and omitted id/ip/user_agent;
     * 2 = canonical jsonb over every field. verify_audit_chain() can check the
     * LINK on a v1 row (its successor's prev_hash) but cannot recompute its
     * content hash, and says so rather than reporting it as tampered.
     */
    hashVersion: integer('hash_version').notNull().default(2),
    // NO foreign key, deliberately. audit_log is append-only, and its trigger
    // rejects both UPDATE and DELETE — so ANY referential action (cascade or
    // set null) aborts a tenant delete. The id is retained as a historical
    // reference that must outlive the tenant. See migrations 0011/0012, and
    // 0009 for the identical fix on progress_events.lessonId.
    tenantId: uuid('tenant_id'),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    hash: text('hash').notNull(),
    prevHash: text('prev_hash'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('audit_log_tenant_idx').on(t.tenantId),
    // The chain is walked per tenant in seq order, by both the hash trigger's
    // predecessor lookup and verify_audit_chain().
    tenantSeqIdx: index('audit_log_tenant_seq_idx').on(t.tenantId, t.seq),
    seqUnique: unique('audit_log_seq_unique').on(t.seq),
  }),
);
