'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, audited, eq, and, courses } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { normalizeSlug } from '@/lib/slug';

/** Ensures a course slug is unique within the tenant by appending -2, -3, … */
async function uniqueCourseSlug(
  tenantId: string,
  base: string,
  ignoreId?: string,
): Promise<string> {
  const root = normalizeSlug(base) || 'course';
  const rows = await db
    .select({ slug: courses.slug, id: courses.id })
    .from(courses)
    .where(eq(courses.tenantId, tenantId));
  const taken = new Set(rows.filter((r) => r.id !== ignoreId).map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function createCourse(tenantSlug: string, formData: FormData) {
  const ctx = await withTenant();
  if (!ctx.tenantId) throw new Error('No tenant context');

  const title = String(formData.get('title') ?? '').trim();
  if (!title) throw new Error('Title is required');

  const description = String(formData.get('description') ?? '').trim();
  const level = String(formData.get('level') ?? 'Beginner');
  const priceRaw = String(formData.get('price') ?? '').trim();
  const price = priceRaw ? priceRaw : null;
  const slug = await uniqueCourseSlug(ctx.tenantId, title);

  const created = await db.transaction(async (tx) => {
    const [course] = await tx
      .insert(courses)
      .values({
        tenantId: ctx.tenantId!,
        title,
        slug,
        description,
        level,
        price,
        status: 'draft',
      })
      .returning();

    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'course.create',
      resourceType: 'course',
      resourceId: course.id,
      after: course,
    });
    return course;
  });

  revalidatePath(`/t/${tenantSlug}/admin/courses`);
  redirect(`/admin/courses/${created.id}`);
}

export async function updateCourse(
  tenantSlug: string,
  courseId: string,
  formData: FormData,
) {
  const ctx = await withTenant();
  if (!ctx.tenantId) throw new Error('No tenant context');

  const [before] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!before) throw new Error('Course not found');

  const title = String(formData.get('title') ?? before.title).trim();
  const description = String(formData.get('description') ?? '').trim();
  const level = String(formData.get('level') ?? before.level);
  const status = String(formData.get('status') ?? before.status) as
    | 'draft'
    | 'published'
    | 'archived';
  const priceRaw = String(formData.get('price') ?? '').trim();
  const price = priceRaw ? priceRaw : null;

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(courses)
      .set({ title, description, level, status, price, updatedAt: new Date() })
      .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId!)))
      .returning();

    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'course.update',
      resourceType: 'course',
      resourceId: courseId,
      before,
      after,
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/courses`);
  revalidatePath(`/t/${tenantSlug}/admin/courses/${courseId}`);
}

export async function setCourseStatus(
  tenantSlug: string,
  courseId: string,
  status: 'draft' | 'published' | 'archived',
) {
  const ctx = await withTenant();
  if (!ctx.tenantId) throw new Error('No tenant context');

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(courses)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId!)))
      .returning();
    if (!after) throw new Error('Course not found');

    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: `course.${status}`,
      resourceType: 'course',
      resourceId: courseId,
      after: { status },
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/courses`);
}

/**
 * Permanently deletes a course. Sections, lessons, quizzes, enrollments, etc.
 * cascade via FK onDelete. Audited. Redirects to the course list.
 */
export async function deleteCourse(tenantSlug: string, courseId: string) {
  const ctx = await withTenant();
  if (ctx.role !== 'company_admin' && ctx.role !== 'platform_admin') {
    throw new Error('Forbidden');
  }
  if (!ctx.tenantId) throw new Error('No tenant context');

  await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId!)))
      .limit(1);
    if (!before) throw new Error('Course not found');

    await tx
      .delete(courses)
      .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId!)));

    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'course.delete',
      resourceType: 'course',
      resourceId: courseId,
      before,
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/courses`);
  redirect(`/admin/courses`);
}
