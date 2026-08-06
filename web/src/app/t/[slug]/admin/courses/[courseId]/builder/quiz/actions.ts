'use server';

import { revalidatePath } from 'next/cache';
import { db, audited, eq, and, quizzes, quizQuestions, lessons } from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { clampInt } from '@/lib/validation';
import { parseCorrectIndices } from '@/lib/quiz';

function revalidateQuiz(slug: string, courseId: string, lessonId: string) {
  revalidatePath(`/t/${slug}/admin/courses/${courseId}/builder/quiz/${lessonId}`);
}

/** Ensures a quiz row exists for a quiz lesson (backfill for older lessons). */
export async function ensureQuiz(slug: string, courseId: string, lessonId: string) {
  const ctx = await requireAdmin();

  // The LESSON has to be confirmed, not just the absence of a quiz. The tenant
  // filter below applies to `quizzes`, and lessonId went straight into the
  // insert unchecked — so a crafted post could create a quiz row in the caller's
  // academy that points at another academy's lesson, and every question added to
  // it afterwards would be attached to that lesson.
  const [lesson] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(
      and(
        eq(lessons.id, lessonId),
        eq(lessons.courseId, courseId),
        eq(lessons.tenantId, ctx.tenantId),
      ),
    )
    .limit(1);
  if (!lesson) throw new Error('That lesson is no longer part of this course. Reload the page.');

  const [existing] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(and(eq(quizzes.lessonId, lessonId), eq(quizzes.tenantId, ctx.tenantId)))
    .limit(1);
  if (!existing) {
    await db.transaction(async (tx) => {
      const [quiz] = await tx
        .insert(quizzes)
        .values({ tenantId: ctx.tenantId, lessonId, settings: { passThreshold: 70 } })
        .returning();
      await audited(tx, {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: 'quiz.create',
        resourceType: 'quiz',
        resourceId: quiz.id,
        after: { lessonId, settings: { passThreshold: 70 } },
      });
    });
  }
  revalidateQuiz(slug, courseId, lessonId);
}

/**
 * Saves the quiz's grading settings: the pass threshold and the attempt cap.
 *
 * Was `setPassThreshold`. Renamed when maxAttempts joined it, rather than
 * leaving a name that described half of what it does.
 */
export async function saveQuizSettings(
  slug: string,
  courseId: string,
  lessonId: string,
  quizId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();
  const threshold = clampInt(formData.get('threshold'), 0, 100, 70);
  // 1..100. There is no "unlimited": unlimited attempts against a server that
  // returns pass/fail each time is a brute-forced certificate, which for
  // accredited training is the failure that matters most.
  const maxAttempts = clampInt(formData.get('maxAttempts'), 1, 100, 10);

  await db.transaction(async (tx) => {
    const [before] = await tx
      .select({ settings: quizzes.settings })
      .from(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.tenantId, ctx.tenantId!)))
      .limit(1);
    if (!before) throw new Error('That quiz no longer exists. Reload the page.');

    // Merged, not replaced. The previous version assigned a fresh object
    // containing only passThreshold, so saving the threshold would have silently
    // discarded maxAttempts — and any setting added later.
    await tx
      .update(quizzes)
      .set({
        settings: { ...(before.settings as object), passThreshold: threshold, maxAttempts },
      })
      .where(and(eq(quizzes.id, quizId), eq(quizzes.tenantId, ctx.tenantId!)));
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'quiz.settings_change',
      resourceType: 'quiz',
      resourceId: quizId,
      before: before.settings,
      after: { passThreshold: threshold, maxAttempts },
    });
  });
  revalidateQuiz(slug, courseId, lessonId);
}

export async function addQuestion(
  slug: string,
  courseId: string,
  lessonId: string,
  quizId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();

  const prompt = String(formData.get('prompt') ?? '').trim();
  if (!prompt) throw new Error('Prompt is required');
  const type = String(formData.get('type') ?? 'mcq') as 'mcq' | 'true_false' | 'multi_select';
  const points = clampInt(formData.get('points'), 1, 100, 1);

  let options: string[];
  let correct: number[];

  if (type === 'true_false') {
    options = ['True', 'False'];
    // Guarded, not trusted: a crafted post used to store [NaN] here, which no
    // answer can ever match.
    const tf = Number(formData.get('correct_tf') ?? 0);
    correct = [tf === 1 ? 1 : 0];
  } else {
    options = String(formData.get('options') ?? '')
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean);
    if (options.length < 2) throw new Error('Provide at least two options');
    // getAll, so the option pickers can submit one value per checked box while a
    // single comma-separated field still works: getAll(['1','3']) joins to '1,3',
    // and get() would have returned only the first.
    const raw = formData
      .getAll('correct')
      .map((v) => String(v))
      .join(',');
    // Throws on anything it cannot represent — see parseCorrectIndices for the
    // three silent-corruption cases this replaces.
    correct = parseCorrectIndices(raw, options.length, type);
  }

  // Verify the quiz belongs to this tenant before writing to it (Drizzle
  // bypasses RLS — otherwise a forged quizId could inject into another
  // tenant's quiz).
  const [owned] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.tenantId, ctx.tenantId)))
    .limit(1);
  if (!owned) throw new Error('That quiz no longer exists. Reload the page.');

  const existing = await db
    .select({ position: quizQuestions.position })
    .from(quizQuestions)
    .where(and(eq(quizQuestions.quizId, quizId), eq(quizQuestions.tenantId, ctx.tenantId)));
  const nextPos = existing.reduce((m, q) => Math.max(m, q.position), -1) + 1;

  await db.transaction(async (tx) => {
    const [question] = await tx
      .insert(quizQuestions)
      .values({
        tenantId: ctx.tenantId,
        quizId,
        position: nextPos,
        type,
        prompt,
        options,
        correct,
        points,
      })
      .returning();
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'quiz_question.create',
      resourceType: 'quiz_question',
      resourceId: question.id,
      // The answer key is recorded deliberately: for an accredited course, "what
      // was the correct answer at the time this learner sat it" is the question
      // an auditor asks, and it is unanswerable from the current row alone.
      after: { quizId, prompt, type, options, correct, points },
    });
  });
  revalidateQuiz(slug, courseId, lessonId);
}

export async function deleteQuestion(
  slug: string,
  courseId: string,
  lessonId: string,
  questionId: string,
) {
  const ctx = await requireAdmin();
  await db.transaction(async (tx) => {
    const [before] = await tx
      .delete(quizQuestions)
      .where(and(eq(quizQuestions.id, questionId), eq(quizQuestions.tenantId, ctx.tenantId!)))
      .returning();
    if (!before) return;
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'quiz_question.delete',
      resourceType: 'quiz_question',
      resourceId: questionId,
      before,
    });
  });
  revalidateQuiz(slug, courseId, lessonId);
}
