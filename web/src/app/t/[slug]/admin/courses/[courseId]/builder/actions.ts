'use server';

import { revalidatePath } from 'next/cache';
import {
  db,
  audited,
  eq,
  and,
  asc,
  courses,
  sections,
  lessons,
  quizzes,
} from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { parseOptionalMinutes } from '@/lib/validation';

async function assertCourse(tenantId: string, courseId: string) {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, tenantId)))
    .limit(1);
  if (!course) throw new Error('Course not found');
}

function revalidateBuilder(slug: string, courseId: string) {
  revalidatePath(`/t/${slug}/admin/courses/${courseId}/builder`);
}

/** Builds a lesson's content_jsonb from the submitted type-specific fields. */
function contentFor(type: string, formData: FormData): Record<string, unknown> {
  switch (type) {
    case 'text':
      return { body: String(formData.get('body') ?? '') };
    case 'video':
      return { youtubeUrl: String(formData.get('youtubeUrl') ?? '') };
    case 'pdf':
      return { url: String(formData.get('url') ?? '') };
    default:
      return {};
  }
}

export async function addSection(
  slug: string,
  courseId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();
  await assertCourse(ctx.tenantId, courseId);

  const title = String(formData.get('title') ?? '').trim() || 'Untitled section';
  const existing = await db
    .select({ position: sections.position })
    .from(sections)
    .where(and(eq(sections.courseId, courseId), eq(sections.tenantId, ctx.tenantId)));
  const nextPos = existing.reduce((m, s) => Math.max(m, s.position), -1) + 1;

  await db.insert(sections).values({
    tenantId: ctx.tenantId,
    courseId,
    title,
    position: nextPos,
  });
  revalidateBuilder(slug, courseId);
}

export async function deleteSection(
  slug: string,
  courseId: string,
  sectionId: string,
) {
  const ctx = await requireAdmin();
  await db
    .delete(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.tenantId, ctx.tenantId)));
  revalidateBuilder(slug, courseId);
}

export async function addLesson(
  slug: string,
  courseId: string,
  sectionId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();
  await assertCourse(ctx.tenantId, courseId);

  const title = String(formData.get('title') ?? '').trim() || 'Untitled lesson';
  const type = String(formData.get('type') ?? 'text') as
    | 'text'
    | 'video'
    | 'pdf'
    | 'quiz';

  const existing = await db
    .select({ position: lessons.position })
    .from(lessons)
    .where(and(eq(lessons.sectionId, sectionId), eq(lessons.tenantId, ctx.tenantId)));
  const nextPos = existing.reduce((m, l) => Math.max(m, l.position), -1) + 1;

  await db.transaction(async (tx) => {
    const [lesson] = await tx
      .insert(lessons)
      .values({
        tenantId: ctx.tenantId!,
        courseId,
        sectionId,
        title,
        type,
        position: nextPos,
        estimatedMinutes: parseOptionalMinutes(formData.get('estimatedMinutes')),
        content: contentFor(type, formData),
      })
      .returning();
    // A quiz lesson gets a backing quiz row (default 70% pass threshold).
    if (type === 'quiz') {
      await tx.insert(quizzes).values({
        tenantId: ctx.tenantId!,
        lessonId: lesson.id,
        settings: { passThreshold: 70 },
      });
    }
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'lesson.create',
      resourceType: 'lesson',
      resourceId: lesson.id,
      after: { title, type },
    });
  });
  revalidateBuilder(slug, courseId);
}

export async function updateLesson(
  slug: string,
  courseId: string,
  lessonId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();

  const title = String(formData.get('title') ?? '').trim() || 'Untitled lesson';
  const type = String(formData.get('type') ?? 'text');

  await db
    .update(lessons)
    .set({
      title,
      type: type as 'text' | 'video' | 'pdf' | 'quiz',
      estimatedMinutes: parseOptionalMinutes(formData.get('estimatedMinutes')),
      content: contentFor(type, formData),
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId)));
  revalidateBuilder(slug, courseId);
}

export async function deleteLesson(
  slug: string,
  courseId: string,
  lessonId: string,
) {
  const ctx = await requireAdmin();
  await db
    .delete(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId)));
  revalidateBuilder(slug, courseId);
}

/** Swaps a section (or lesson) with its neighbour to reorder. */
export async function moveSection(
  slug: string,
  courseId: string,
  sectionId: string,
  dir: 'up' | 'down',
) {
  const ctx = await requireAdmin();

  // Tenant-scoped: Drizzle bypasses RLS, so scope by tenantId to prevent a
  // tenant admin reordering another tenant's content via a forged courseId.
  const ordered = await db
    .select({ id: sections.id, position: sections.position })
    .from(sections)
    .where(and(eq(sections.courseId, courseId), eq(sections.tenantId, ctx.tenantId)))
    .orderBy(asc(sections.position));

  const idx = ordered.findIndex((s) => s.id === sectionId);
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;

  const a = ordered[idx];
  const b = ordered[swapIdx];
  await db.transaction(async (tx) => {
    await tx
      .update(sections)
      .set({ position: b.position })
      .where(and(eq(sections.id, a.id), eq(sections.tenantId, ctx.tenantId!)));
    await tx
      .update(sections)
      .set({ position: a.position })
      .where(and(eq(sections.id, b.id), eq(sections.tenantId, ctx.tenantId!)));
  });
  revalidateBuilder(slug, courseId);
}

/** Swaps a lesson with its neighbour within the same section to reorder. */
export async function moveLesson(
  slug: string,
  courseId: string,
  sectionId: string,
  lessonId: string,
  dir: 'up' | 'down',
) {
  const ctx = await requireAdmin();

  // Tenant-scoped (Drizzle bypasses RLS).
  const ordered = await db
    .select({ id: lessons.id, position: lessons.position })
    .from(lessons)
    .where(and(eq(lessons.sectionId, sectionId), eq(lessons.tenantId, ctx.tenantId)))
    .orderBy(asc(lessons.position));

  const idx = ordered.findIndex((l) => l.id === lessonId);
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;

  const a = ordered[idx];
  const b = ordered[swapIdx];
  await db.transaction(async (tx) => {
    await tx
      .update(lessons)
      .set({ position: b.position })
      .where(and(eq(lessons.id, a.id), eq(lessons.tenantId, ctx.tenantId!)));
    await tx
      .update(lessons)
      .set({ position: a.position })
      .where(and(eq(lessons.id, b.id), eq(lessons.tenantId, ctx.tenantId!)));
  });
  revalidateBuilder(slug, courseId);
}
