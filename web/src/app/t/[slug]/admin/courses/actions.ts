'use server';

import { revalidatePath } from 'next/cache';
import {
  db,
  audited,
  eq,
  and,
  count,
  courses,
  lessons,
  sections,
  quizzes,
  quizQuestions,
  sql,
} from '@training-platform/db';
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

export async function updateCourse(tenantSlug: string, courseId: string, formData: FormData) {
  const ctx = await requireAdmin();

  const [before] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!before)
    throw new Error('That course no longer exists. Go back to Courses and reload the list.');

  const title = String(formData.get('title') ?? before.title).trim();
  if (!title) throw new Error('Title is required');
  const description = String(formData.get('description') ?? '').trim();
  const level = String(formData.get('level') ?? before.level);
  const statusRaw = String(formData.get('status') ?? before.status);
  if (!isCourseStatus(statusRaw)) throw new Error('Invalid course status.');
  const status = statusRaw;
  const price = parsePrice(formData.get('price') as string | null);
  const confersRoleCode = parseConfersRoleCode(formData.get('confersRoleCode'));
  // Checkbox: present as 'on' when ticked, absent when not. The editor always
  // renders it (defaultChecked from the row), so a save reflects the box.
  const certificateEnabled = formData.get('certificateEnabled') === 'on';

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(courses)
      .set({
        title,
        description,
        level,
        status,
        price,
        confersRoleCode,
        certificateEnabled,
        updatedAt: new Date(),
      })
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

/**
 * Names one offending lesson and counts the rest.
 *
 * The length matters: these strings are thrown from a Server Action into
 * NavForm, whose friendly() swaps anything 120 characters or longer for a
 * generic apology. Joining every title made the message grow with the data
 * until it silently stopped being shown at all.
 */
function nameFirst(rows: Array<{ title: string }>): string {
  const first = `“${rows[0].title.slice(0, 40)}”`;
  return rows.length === 1 ? first : `${first} and ${rows.length - 1} more`;
}

export async function setCourseStatus(
  tenantSlug: string,
  courseId: string,
  status: 'draft' | 'published' | 'archived',
) {
  const ctx = await requireAdmin();

  // A quiz lesson can only be completed by PASSING it, so a quiz with no
  // questions is a dead end: the learner sees "This quiz has no questions yet"
  // with no way forward, the course can never reach 100%, and the completion
  // certificate is never issued. Refuse to publish rather than let a learner
  // discover it halfway through.
  if (status === 'published') {
    // A course with no lessons can never reach 100%, so it never completes and
    // never issues a certificate — enrolling into it is a dead end with no
    // resume button and no path forward. Refuse to publish, same reasoning as
    // the empty-quiz guard below.
    const [{ lessonCount } = { lessonCount: 0 }] = await db
      .select({ lessonCount: count() })
      .from(lessons)
      .where(and(eq(lessons.courseId, courseId), eq(lessons.tenantId, ctx.tenantId!)));
    if (Number(lessonCount) === 0) {
      throw new Error(
        'Add at least one lesson before publishing — an empty course cannot be completed.',
      );
    }

    const quizLessons = await db
      .select({
        title: lessons.title,
        quizId: quizzes.id,
        questions: sql<string>`(
          select count(*) from ${quizQuestions}
          where ${quizQuestions.quizId} = ${quizzes.id}
        )`,
      })
      .from(lessons)
      .innerJoin(sections, eq(sections.id, lessons.sectionId))
      .leftJoin(quizzes, eq(quizzes.lessonId, lessons.id))
      .where(
        and(
          eq(sections.courseId, courseId),
          eq(lessons.tenantId, ctx.tenantId!),
          eq(lessons.type, 'quiz'),
        ),
      );

    // No quizzes row at all is just as unfinishable as one with no questions.
    const empty = quizLessons.filter((q) => !q.quizId || Number(q.questions) === 0);
    if (empty.length > 0) {
      // Kept short on purpose: NavForm's friendly() replaces anything 120
      // characters or longer with a generic apology, and the previous wording was
      // 143, so the explanation an admin needed never actually reached them.
      throw new Error(`${nameFirst(empty)} has no questions, so it cannot be passed.`);
    }

    /*
     * A question nobody can answer correctly is the same dead end as an empty
     * quiz, and strict parsing on the way in cannot help the rows already
     * written by the parser it replaced — which silently stored an out-of-range
     * index as a dropped answer, and a duplicate as [1,1]. gradeQuiz compares
     * option sets exactly, so both are unpassable.
     */
    const broken = await db
      .select({ title: lessons.title })
      .from(quizQuestions)
      .innerJoin(quizzes, eq(quizzes.id, quizQuestions.quizId))
      .innerJoin(lessons, eq(lessons.id, quizzes.lessonId))
      .innerJoin(sections, eq(sections.id, lessons.sectionId))
      .where(
        and(
          eq(sections.courseId, courseId),
          eq(quizQuestions.tenantId, ctx.tenantId!),
          sql`(
            jsonb_array_length(${quizQuestions.correct}) = 0
            or jsonb_array_length(${quizQuestions.correct}) <> (
                 select count(distinct e.value)
                 from jsonb_array_elements(${quizQuestions.correct}) e)
            or exists (
                 select 1 from jsonb_array_elements_text(${quizQuestions.correct}) c
                 where c ~ '^[0-9]+$'
                   and c::int >= jsonb_array_length(${quizQuestions.options}))
          )`,
        ),
      );
    if (broken.length > 0) {
      throw new Error(`${nameFirst(broken)} has a question no answer can pass.`);
    }
  }

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
