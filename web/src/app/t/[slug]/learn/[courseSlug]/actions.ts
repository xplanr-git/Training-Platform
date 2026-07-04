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
} from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { getCourseProgress } from '@/lib/progress';

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
    await db.transaction(async (tx) => {
      await tx
        .update(enrollments)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(enrollments.id, enrollmentId));
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
