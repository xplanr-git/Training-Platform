'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  db,
  audited,
  eq,
  and,
  enrollments,
  progressEvents,
  certificates,
  courses,
  tenants,
  users,
} from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { getCourseProgress } from '@/lib/progress';
import { env } from '@/lib/env';
import { buildCredential } from '@/lib/certificate';

/**
 * Records a lesson completion as an append-only progress_event, then derives
 * course completion. When every lesson is done, marks the enrollment completed
 * (this is the trigger point for certificate issuance in D5).
 */
export async function markLessonComplete(
  tenantSlug: string,
  courseSlug: string,
  courseId: string,
  enrollmentId: string,
  lessonId: string,
  nextHref: string | null,
) {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) redirect('/login');

  // Verify the enrollment belongs to this user (Drizzle bypasses RLS).
  const [enr] = await db
    .select({ id: enrollments.id, status: enrollments.status })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.id, enrollmentId),
        eq(enrollments.userId, ctx.userId),
        eq(enrollments.tenantId, ctx.tenantId),
      ),
    )
    .limit(1);
  if (!enr) throw new Error('Enrollment not found');

  await db.insert(progressEvents).values({
    tenantId: ctx.tenantId,
    enrollmentId,
    lessonId,
    eventType: 'completed',
    payload: {},
  });

  const progress = await getCourseProgress(enrollmentId, courseId);
  if (progress.isComplete && enr.status !== 'completed') {
    // Gather the facts needed to mint a certificate.
    const [meta] = await db
      .select({
        courseTitle: courses.title,
        tenantName: tenants.name,
        learnerName: users.name,
        learnerEmail: users.email,
      })
      .from(courses)
      .innerJoin(tenants, eq(tenants.id, courses.tenantId))
      .innerJoin(users, eq(users.id, ctx.userId))
      .where(eq(courses.id, courseId))
      .limit(1);

    const code = crypto.randomUUID();
    const issuedAt = new Date();
    const verifyUrl = `https://${env.rootDomain()}/verify/${code}`;

    await db.transaction(async (tx) => {
      await tx
        .update(enrollments)
        .set({ status: 'completed', completedAt: issuedAt })
        .where(eq(enrollments.id, enrollmentId));

      // Idempotent: only one certificate per enrollment.
      const [existingCert] = await tx
        .select({ id: certificates.id })
        .from(certificates)
        .where(eq(certificates.enrollmentId, enrollmentId))
        .limit(1);

      if (!existingCert && meta) {
        const credential = buildCredential({
          verificationCode: code,
          learnerName: meta.learnerName,
          learnerEmail: meta.learnerEmail,
          courseTitle: meta.courseTitle,
          tenantName: meta.tenantName,
          issuedAt: issuedAt.toISOString(),
          verifyUrl,
        });
        await tx.insert(certificates).values({
          tenantId: ctx.tenantId!,
          enrollmentId,
          verificationCode: code,
          issuedAt,
          credential,
        });
        await audited(tx, {
          tenantId: ctx.tenantId,
          actorUserId: ctx.userId,
          action: 'certificate.issue',
          resourceType: 'certificate',
          resourceId: code,
          after: { courseId },
        });
      }

      await audited(tx, {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: 'enrollment.completed',
        resourceType: 'enrollment',
        resourceId: enrollmentId,
        after: { courseId },
      });
    });
  }

  revalidatePath(`/t/${tenantSlug}/learn/${courseSlug}`);
  revalidatePath(`/t/${tenantSlug}/dashboard`);
  redirect(nextHref ?? `/learn/${courseSlug}`);
}
