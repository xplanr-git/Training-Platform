'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, audited, eq, and, courses, enrollments } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';

/**
 * Enrolls the current user in a published course (free path). Idempotent — a
 * repeat enroll is a no-op. Stripe checkout for priced courses is Phase E2.
 */
export async function enrollFree(
  tenantSlug: string,
  courseId: string,
  courseSlug: string,
) {
  const ctx = await getTenantContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
  if (!ctx.tenantId) throw new Error('No tenant context');

  const [course] = await db
    .select({ id: courses.id, status: courses.status })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!course || course.status !== 'published') throw new Error('Course not available');

  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  if (!existing) {
    await db.transaction(async (tx) => {
      const [enrollment] = await tx
        .insert(enrollments)
        .values({
          tenantId: ctx.tenantId!,
          userId: ctx.userId,
          courseId,
          status: 'active',
          source: 'free',
        })
        .returning();
      await audited(tx, {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: 'enrollment.create',
        resourceType: 'enrollment',
        resourceId: enrollment.id,
        after: { courseId, source: 'free' },
      });
    });
    revalidatePath(`/t/${tenantSlug}/dashboard`);
  }

  redirect(`/learn/${courseSlug}`);
}
