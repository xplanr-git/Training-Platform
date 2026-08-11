'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  db,
  audited,
  eq,
  and,
  inArray,
  count,
  isNotNull,
  enrollments,
  progressEvents,
  lessons,
  quizzes,
  quizQuestions,
  quizAttempts,
  quizAnswers,
} from '@training-platform/db';
import { getTenantContext, type TenantContext } from '@/lib/tenant';
import { ENROLLED_STATUSES } from '@/lib/course-access';
import { assertNotViewingAs, isViewingAs } from '@/lib/view-as';
import { ActionError } from '@/lib/action-errors';
import { finalizeCourseCompletion } from '@/lib/completion';
import { env } from '@/lib/env';
import { gradeQuiz } from '@/lib/quiz';
import { rateLimit, RULES } from '@/lib/rate-limit';
import { safeRedirect } from '@/lib/safe-redirect';

/**
 * Attempts allowed at a quiz when its author has set no explicit
 * `settings.maxAttempts` — which is every quiz created before this cap existed.
 */
const DEFAULT_MAX_ATTEMPTS = 10;

/** Rate-limit bucket name for quiz submissions. */
const RULES_QUIZ_ACTION = 'quizAttempt';

async function verifyEnrollment(ctx: TenantContext, enrollmentId: string) {
  const [enr] = await db
    .select({
      id: enrollments.id,
      status: enrollments.status,
      courseId: enrollments.courseId,
    })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.id, enrollmentId),
        eq(enrollments.userId, ctx.userId),
        eq(enrollments.tenantId, ctx.tenantId!),
        // A cancelled/expired enrollment is not access: no progress writes, no
        // completion, no certificate. Matches resolveCourseView's ENROLLED_STATUSES.
        inArray(enrollments.status, [...ENROLLED_STATUSES]),
      ),
    )
    .limit(1);
  if (!enr) throw new Error(ActionError.ENROLLMENT_NOT_FOUND);
  return enr;
}

/**
 * Confirms a lesson belongs to the given course. Guards against a learner
 * passing a lessonId/courseId from a course they aren't enrolled in — Drizzle
 * bypasses RLS, so ownership must be checked in app code.
 */
async function assertLessonInCourse(ctx: TenantContext, lessonId: string, courseId: string) {
  const [row] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(
      and(
        eq(lessons.id, lessonId),
        eq(lessons.courseId, courseId),
        eq(lessons.tenantId, ctx.tenantId!),
      ),
    )
    .limit(1);
  if (!row) throw new Error(`${ActionError.LESSON_NOT_FOUND} in this course`);
}

/**
 * Records a lesson as completed (append-only event) and, if that finishes the
 * course, marks the enrollment completed and issues the certificate. Shared by
 * manual completion and quiz-pass completion.
 */
async function recordLessonCompleted(
  ctx: TenantContext,
  courseId: string,
  enrollmentId: string,
  enrollmentStatus: string,
  lessonId: string,
) {
  await db.insert(progressEvents).values({
    tenantId: ctx.tenantId!,
    enrollmentId,
    lessonId,
    eventType: 'completed',
    payload: {},
  });

  // If that finished the course, mark it complete and issue the certificate.
  // The learner here is the current caller; the same helper reconciles a course
  // finished by lesson deletion for a different learner (see builder deleteLesson).
  await finalizeCourseCompletion({
    tenantId: ctx.tenantId!,
    learnerUserId: ctx.userId,
    courseId,
    enrollmentId,
    enrollmentStatus,
  });
}

/**
 * Records a video watch heartbeat as an append-only progress event.
 *
 * Called from the player every ~15s while playing and on pause/end. Authorized
 * exactly like completion: the course is derived from the enrollment (never
 * trusted from the client) and the lesson must belong to that course.
 *
 * `positionSec` is the furthest point reached (drives resume); `watchedSec` is
 * time actually played since the last beat (summed for real watch time, so
 * seeking ahead can't inflate it).
 */
export async function recordVideoProgress(
  enrollmentId: string,
  lessonId: string,
  positionSec: number,
  watchedSec: number,
) {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) return;
  // A viewing-as admin is read-only. Silent (not a throw): heartbeats are
  // fire-and-forget, and the read-only player shouldn't be beating anyway.
  if (await isViewingAs()) return;
  const enr = await verifyEnrollment(ctx, enrollmentId);
  await assertLessonInCourse(ctx, lessonId, enr.courseId);

  const position = Math.max(0, Math.round(Number(positionSec) || 0));
  // Clamp a single beat to 10 minutes so a stalled tab can't log absurd time.
  const watched = Math.min(600, Math.max(0, Math.round(Number(watchedSec) || 0)));
  if (watched <= 0 && position <= 0) return;

  /*
   * Bound the append rate.
   *
   * The player beats every ~15s, so ~4/minute is normal and the 240/minute
   * ceiling is far above any real viewer. But this action is callable directly,
   * it INSERTS on every call, and progress_events is append-only — so nothing
   * could ever remove what a loop wrote. That is a storage-cost denial of
   * service with no cleanup path, which makes it worth bounding even though the
   * rows are individually harmless.
   *
   * Silent return rather than a throw: a heartbeat is fire-and-forget from the
   * player, and surfacing "too many requests" over a video would be noise the
   * viewer can neither understand nor act on.
   */
  const beat = await rateLimit('videoProgress', enrollmentId, RULES.videoProgress);
  if (!beat.ok) return;

  await db.insert(progressEvents).values({
    tenantId: ctx.tenantId,
    enrollmentId,
    lessonId,
    eventType: 'video_progress',
    payload: { positionSec: position },
    durationMs: watched * 1000,
  });
}

export async function markLessonComplete(
  tenantSlug: string,
  courseSlug: string,
  _courseId: string,
  enrollmentId: string,
  lessonId: string,
  nextHref: string | null,
) {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) redirect('/login');
  await assertNotViewingAs();
  const enr = await verifyEnrollment(ctx, enrollmentId);
  // Course is derived from the enrollment, never trusted from the client.
  await assertLessonInCourse(ctx, lessonId, enr.courseId);

  await recordLessonCompleted(ctx, enr.courseId, enrollmentId, enr.status, lessonId);

  revalidatePath(`/t/${tenantSlug}/learn/${courseSlug}`);
  revalidatePath(`/t/${tenantSlug}/dashboard`);
  /*
   * nextHref arrives from the CALLER and is handed straight to router.push by
   * nav-form.tsx, so it has to be validated like any other `?next=`. It was
   * returned verbatim — an open redirect reachable by anyone who can invoke this
   * action, which is any enrolled learner.
   *
   * safeRedirect validates by RESOLUTION rather than pattern, which is why it
   * catches '//evil.com', '/\evil.com' and '/%09evil.com' alike. env.appOrigin()
   * is the origin to resolve against; the fallback is where the button meant to go.
   */
  return {
    redirectTo: safeRedirect(nextHref, env.appOrigin(), `/learn/${courseSlug}`),
  };
}

/**
 * Grades a quiz submission server-side, stores the attempt + per-question
 * answers, and — if the score meets the pass threshold — records the quiz
 * lesson as completed (which can complete the course). A failing attempt is
 * recorded but does not complete the lesson; the learner can retry.
 */
export async function submitQuizAttempt(
  tenantSlug: string,
  courseSlug: string,
  _courseId: string,
  enrollmentId: string,
  lessonId: string,
  quizId: string,
  formData: FormData,
) {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) redirect('/login');
  await assertNotViewingAs();
  const enr = await verifyEnrollment(ctx, enrollmentId);
  // Course is derived from the enrollment, never trusted from the client.
  await assertLessonInCourse(ctx, lessonId, enr.courseId);

  const [quiz] = await db
    .select({ settings: quizzes.settings, lessonId: quizzes.lessonId })
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.tenantId, ctx.tenantId)))
    .limit(1);
  // The quiz must be the one attached to this lesson.
  if (!quiz || quiz.lessonId !== lessonId)
    throw new Error(
      'This quiz has changed since you opened it. Reload the page and answer it again — your progress is safe.',
    );
  const settings = quiz.settings as { passThreshold?: number; maxAttempts?: number };
  const threshold = settings.passThreshold ?? 70;

  /*
   * Bound the number of attempts BEFORE grading.
   *
   * Submissions were unlimited and each one returned `?score=&passed=`, so a
   * handful of multiple-choice questions could be brute-forced to a pass in
   * seconds — and a pass auto-issues a certificate. For a platform selling
   * audit-grade evidence of accredited training, "the learner guessed until it
   * said yes" is the failure that matters most.
   *
   * Two independent bounds, because they stop different things. The rate limit
   * makes rapid guessing impractical; this cap makes patient guessing
   * impractical too. A rate limit alone just spreads the same attack over an
   * afternoon.
   *
   * DEFAULT_MAX_ATTEMPTS applies where an author has set nothing, which today is
   * every existing quiz. 10 is deliberately generous — a learner genuinely
   * struggling with a hard quiz should not be locked out — while still bounding
   * the guess count far below what brute force needs.
   */
  const maxAttempts =
    Number.isInteger(settings.maxAttempts) && settings.maxAttempts! > 0
      ? settings.maxAttempts!
      : DEFAULT_MAX_ATTEMPTS;

  const [{ used } = { used: 0 }] = await db
    .select({ used: count() })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.enrollmentId, enrollmentId),
        eq(quizAttempts.quizId, quizId),
        isNotNull(quizAttempts.submittedAt),
      ),
    );
  if (used >= maxAttempts) {
    throw new Error(
      `You have used all ${maxAttempts} attempts at this quiz. Ask your administrator to reset it.`,
    );
  }

  // Keyed on the enrolment, not the address: an IP key would punish a whole
  // training room sharing one connection, and be sidestepped by a phone.
  const limited = await rateLimit(RULES_QUIZ_ACTION, enrollmentId, RULES.quizAttempt);
  if (!limited.ok) {
    throw new Error(
      `Too many attempts in a short time. Try again in ${limited.retryAfterSeconds} seconds.`,
    );
  }

  const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));

  const responses: Record<string, number[]> = {};
  const durations: Record<string, number> = {};
  for (const q of questions) {
    responses[q.id] = formData
      .getAll(`q_${q.id}`)
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n));
    // Per-question time proxy from the client timer (friction insight).
    const t = Number(formData.get(`t_${q.id}`));
    if (Number.isFinite(t) && t > 0) durations[q.id] = Math.min(Math.round(t), 86_400_000);
  }
  const result = gradeQuiz(
    questions.map((q) => ({ id: q.id, correct: q.correct as number[], points: q.points })),
    responses,
    threshold,
  );
  const { score, passed } = result;

  await db.transaction(async (tx) => {
    const [attempt] = await tx
      .insert(quizAttempts)
      .values({
        tenantId: ctx.tenantId!,
        enrollmentId,
        quizId,
        submittedAt: new Date(),
        score: String(score),
        passed,
      })
      .returning();
    if (result.perQuestion.length > 0) {
      await tx.insert(quizAnswers).values(
        result.perQuestion.map((g) => ({
          tenantId: ctx.tenantId!,
          attemptId: attempt.id,
          questionId: g.questionId,
          response: { selected: g.selected },
          isCorrect: g.isCorrect,
          pointsAwarded: g.pointsAwarded,
          durationMs: durations[g.questionId] ?? null,
        })),
      );
    }
    // A quiz attempt is the evidence a certificate rests on: for an accredited
    // course, "when did this learner sit it, what did they score, was the
    // threshold met" is the question an auditor asks. Recording the threshold
    // and attempt number alongside the score matters because an admin can change
    // the threshold afterwards (quiz.pass_threshold_change), and the log has to
    // show what it was at the time.
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: passed ? 'quiz_attempt.passed' : 'quiz_attempt.failed',
      resourceType: 'quiz_attempt',
      resourceId: attempt.id,
      after: {
        quizId,
        lessonId,
        enrollmentId,
        score,
        passed,
        threshold,
        attemptNumber: used + 1,
        maxAttempts,
      },
    });
  });

  if (passed) {
    await recordLessonCompleted(ctx, enr.courseId, enrollmentId, enr.status, lessonId);
  }

  revalidatePath(`/t/${tenantSlug}/learn/${courseSlug}/${lessonId}`);
  revalidatePath(`/t/${tenantSlug}/learn/${courseSlug}`);
  revalidatePath(`/t/${tenantSlug}/dashboard`);
  // No score/passed in the URL: the lesson page reads the result from the
  // recorded attempt, so grade state is never echoed through the address bar
  // where it could be edited into a fake "Passed".
  return {
    redirectTo: `/learn/${courseSlug}/${lessonId}`,
  };
}
