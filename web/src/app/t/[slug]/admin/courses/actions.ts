'use server';

import { revalidatePath } from 'next/cache';
import { db, audited, eq, and, courses } from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { normalizeSlug } from '@/lib/slug';
import { parsePrice, isCourseStatus } from '@/lib/validation';
import { CONFERRABLE_TIERS } from '@/lib/connect-roles';

/** Validates a course's conferred-tier code against the Connect tier list. */
function parseConfersRoleCode(raw: FormDataEntryValue | null): string | null {
  const code = String(raw ?? '').trim();
  return CONFERRABLE_TIERS.some((t) => t.code === code) ? code : null;
}

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
  const ctx = await requireAdmin();

  const title = String(formData.get('title') ?? '').trim();
  if (!title) throw new Error('Title is required');

  const description = String(formData.get('description') ?? '').trim();
  const level = String(formData.get('level') ?? 'Beginner');
  const price = parsePrice(formData.get('price') as string | null);
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
  return { redirectTo: `/admin/courses/${created.id}` };
}

export async function updateCourse(
  tenantSlug: string,
  courseId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();

  const [before] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!before) throw new Error('Course not found');

  const title = String(formData.get('title') ?? before.title).trim();
  if (!title) throw new Error('Title is required');
  const description = String(formData.get('description') ?? '').trim();
  const level = String(formData.get('level') ?? before.level);
  const statusRaw = String(formData.get('status') ?? before.status);
  if (!isCourseStatus(statusRaw)) throw new Error('Invalid course status.');
  const status = statusRaw;
  const price = parsePrice(formData.get('price') as string | null);
  const confersRoleCode = parseConfersRoleCode(formData.get('confersRoleCode'));

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(courses)
      .set({ title, description, level, status, price, confersRoleCode, updatedAt: new Date() })
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
  const ctx = await requireAdmin();

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
  const ctx = await requireAdmin();

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
  return { redirectTo: `/admin/courses` };
}
