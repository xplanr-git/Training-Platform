import 'server-only';
import {
  db,
  audited,
  eq,
  and,
  enrollments,
  certificates,
  courses,
  tenants,
  users,
  memberships,
} from '@training-platform/db';
import { advanceTier } from '@/lib/connect-roles';
import { getCourseProgress } from '@/lib/progress';
import { absoluteUrl } from '@/lib/absolute-url';
import { buildCredential } from '@/lib/certificate';
import { sendCertificateEmail } from '@/lib/email';

/**
 * Finalizes a fully-progressed enrollment: marks it completed, advances the
 * Connect tier, issues the completion certificate (once) and emails it.
 *
 * Idempotent and safe to call speculatively — it no-ops unless the enrollment is
 * genuinely at 100% and not already completed, and it skips the certificate if
 * one already exists (so it never double-issues or re-emails).
 *
 * Parameterised by the LEARNER (the enrollment's owner), NOT "the current user".
 * That is what lets it serve two callers: the learner finishing their own lesson
 * (recordLessonCompleted), AND an admin action that incidentally finishes a
 * course for someone else — deleting the last incomplete lesson. Before this,
 * that deletion pushed the course to 100% by derivation while the enrollment
 * stayed 'active' with no certificate ever issued: the learner saw "complete"
 * next to a missing certificate, with no way to trigger it. Reconciling on the
 * deletion closes that gap.
 *
 * Extracted from recordLessonCompleted, which had grown to do event-append,
 * progress derivation, meta lookup, tier advancement, a multi-write transaction
 * and email in one ~120-line function coupled to "the caller is the learner".
 */
/**
 * Re-checks every active enrollment on a course after its lesson total has been
 * REDUCED, and finalizes any that this pushed to 100%.
 *
 * Removing content lowers the denominator progress is derived from, so a deletion
 * can complete a course for a learner who did nothing. Completion is otherwise
 * materialised only by a learner completion event, so without this pass the course
 * reads "100% complete" while the enrollment stays `active` and no certificate is
 * ever issued — and the learner has no way to trigger it.
 *
 * This lived inline in deleteLesson, which meant deleteSection did not do it.
 * Deleting a section cascades to every lesson in it (`lessons.section_id ->
 * sections.id ON DELETE CASCADE`), so the more content an author removed in one
 * click, the more learners it stranded — the bug scaled with the size of the tidy-up
 * while the one guarded path handled the smallest case. Any future action that
 * removes lessons must call this too.
 *
 * finalizeCourseCompletion is idempotent and no-ops below 100%, so calling it for
 * every active enrollment is safe. Admin-only and infrequent; a set-based pass is
 * the scale fix if a course ever has enough learners for this loop to matter.
 */
export async function reconcileCourseCompletions(opts: {
  tenantId: string;
  courseId: string;
}): Promise<void> {
  const { tenantId, courseId } = opts;
  const active = await db
    .select({ id: enrollments.id, userId: enrollments.userId, status: enrollments.status })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.tenantId, tenantId),
        eq(enrollments.status, 'active'),
      ),
    );

  for (const e of active) {
    await finalizeCourseCompletion({
      tenantId,
      learnerUserId: e.userId,
      courseId,
      enrollmentId: e.id,
      enrollmentStatus: e.status,
    });
  }
}

export async function finalizeCourseCompletion(opts: {
  tenantId: string;
  learnerUserId: string;
  courseId: string;
  enrollmentId: string;
  enrollmentStatus: string;
}): Promise<void> {
  const { tenantId, learnerUserId, courseId, enrollmentId, enrollmentStatus } = opts;

  if (enrollmentStatus === 'completed') return;
  const progress = await getCourseProgress(enrollmentId, courseId);
  if (!progress.isComplete) return;

  const [meta] = await db
    .select({
      courseTitle: courses.title,
      tenantName: tenants.name,
      learnerName: users.name,
      learnerEmail: users.email,
      confersRoleCode: courses.confersRoleCode,
      certificateEnabled: courses.certificateEnabled,
      certificateTemplateId: courses.certificateTemplateId,
    })
    .from(courses)
    .innerJoin(tenants, eq(tenants.id, courses.tenantId))
    .innerJoin(users, eq(users.id, learnerUserId))
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!meta) return;

  // Connect tier alignment: completing a course that confers a tier advances the
  // learner's membership tier (same group, upward only).
  const [mem] = await db
    .select({ id: memberships.id, code: memberships.connectRoleCode })
    .from(memberships)
    .where(and(eq(memberships.userId, learnerUserId), eq(memberships.tenantId, tenantId)))
    .limit(1);
  const nextCode = advanceTier(mem?.code, meta.confersRoleCode);
  const advancedTier = mem && nextCode && nextCode !== mem.code ? nextCode : null;

  const code = crypto.randomUUID();
  const issuedAt = new Date();
  // absoluteUrl() REFUSES a localhost link in production: this https:// is
  // persisted into the credential JSON as its `id`, so a dev-issued certificate
  // would otherwise carry a permanently unreachable identifier.
  const verifyUrl = absoluteUrl(`/verify/${code}`);

  let certIssued = false;

  await db.transaction(async (tx) => {
    await tx
      .update(enrollments)
      .set({ status: 'completed', completedAt: issuedAt })
      .where(eq(enrollments.id, enrollmentId));

    if (advancedTier && mem) {
      await tx
        .update(memberships)
        .set({ connectRoleCode: advancedTier })
        .where(eq(memberships.id, mem.id));
      await audited(tx, {
        tenantId,
        actorUserId: learnerUserId,
        action: 'membership.tier_advanced',
        resourceType: 'membership',
        resourceId: mem.id,
        after: { connectRoleCode: advancedTier, courseId },
      });
    }

    // Certificates only when the course opts in. certificateEnabled defaults
    // true (migration 0017 backfilled existing courses), so this changes nothing
    // for courses that issue today; an admin can now turn it off per course.
    if (meta.certificateEnabled) {
      const [existingCert] = await tx
        .select({ id: certificates.id })
        .from(certificates)
        .where(eq(certificates.enrollmentId, enrollmentId))
        .limit(1);

      if (!existingCert) {
        await tx.insert(certificates).values({
          tenantId,
          enrollmentId,
          templateId: meta.certificateTemplateId ?? null,
          verificationCode: code,
          issuedAt,
          credential: buildCredential({
            verificationCode: code,
            learnerName: meta.learnerName,
            learnerEmail: meta.learnerEmail,
            courseTitle: meta.courseTitle,
            tenantName: meta.tenantName,
            issuedAt: issuedAt.toISOString(),
            verifyUrl,
          }),
        });
        certIssued = true;
        await audited(tx, {
          tenantId,
          actorUserId: learnerUserId,
          action: 'certificate.issue',
          resourceType: 'certificate',
          resourceId: code,
          after: { courseId },
        });
      }
    }

    await audited(tx, {
      tenantId,
      actorUserId: learnerUserId,
      action: 'enrollment.completed',
      resourceType: 'enrollment',
      resourceId: enrollmentId,
      after: { courseId },
    });
  });

  // Only when a certificate was newly issued: reconciliation of an
  // already-certified enrollment must not re-send the email.
  if (certIssued && meta.learnerEmail) {
    try {
      await sendCertificateEmail(meta.learnerEmail, meta.courseTitle, verifyUrl);
    } catch (e) {
      console.error('certificate email failed:', e);
    }
  }
}
