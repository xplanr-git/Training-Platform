'use server';

import { revalidatePath } from 'next/cache';
import {
  db,
  eq,
  and,
  quizzes,
  quizQuestions,
} from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { clampInt } from '@/lib/validation';

function revalidateQuiz(slug: string, courseId: string, lessonId: string) {
  revalidatePath(`/t/${slug}/admin/courses/${courseId}/builder/quiz/${lessonId}`);
}

/** Ensures a quiz row exists for a quiz lesson (backfill for older lessons). */
export async function ensureQuiz(
  slug: string,
  courseId: string,
  lessonId: string,
) {
  const ctx = await requireAdmin();
  const [existing] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(and(eq(quizzes.lessonId, lessonId), eq(quizzes.tenantId, ctx.tenantId)))
    .limit(1);
  if (!existing) {
    await db
      .insert(quizzes)
      .values({ tenantId: ctx.tenantId, lessonId, settings: { passThreshold: 70 } });
  }
  revalidateQuiz(slug, courseId, lessonId);
}

export async function setPassThreshold(
  slug: string,
  courseId: string,
  lessonId: string,
  quizId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();
  const threshold = clampInt(formData.get('threshold'), 0, 100, 70);
  await db
    .update(quizzes)
    .set({ settings: { passThreshold: threshold } })
    .where(and(eq(quizzes.id, quizId), eq(quizzes.tenantId, ctx.tenantId)));
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
  const type = String(formData.get('type') ?? 'mcq') as
    | 'mcq'
    | 'true_false'
    | 'multi_select';
  const points = clampInt(formData.get('points'), 1, 100, 1);

  let options: string[];
  let correct: number[];

  if (type === 'true_false') {
    options = ['True', 'False'];
    correct = [Number(formData.get('correct_tf') ?? 0)];
  } else {
    options = String(formData.get('options') ?? '')
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean);
    // correct = comma-separated 1-based indices → 0-based, in range
    correct = String(formData.get('correct') ?? '')
      .split(',')
      .map((n) => Number(n.trim()) - 1)
      .filter((n) => Number.isInteger(n) && n >= 0 && n < options.length);
    if (type === 'mcq' && correct.length > 1) correct = [correct[0]];
  }

  if (options.length < 2) throw new Error('Provide at least two options');
  if (correct.length < 1) throw new Error('Enter the number of the correct option — 2 for the second one, or 1,3 for two of them.');

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

  await db.insert(quizQuestions).values({
    tenantId: ctx.tenantId,
    quizId,
    position: nextPos,
    type,
    prompt,
    options,
    correct,
    points,
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
  await db
    .delete(quizQuestions)
    .where(and(eq(quizQuestions.id, questionId), eq(quizQuestions.tenantId, ctx.tenantId)));
  revalidateQuiz(slug, courseId, lessonId);
}
