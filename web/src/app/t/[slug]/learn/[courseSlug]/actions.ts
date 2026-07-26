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
  memberships,
  lessons,
  quizzes,
  quizQuestions,
  quizAttempts,
  quizAnswers,
} from '@training-platform/db';
import { getTenantContext, type TenantContext } from '@/lib/tenant';
import { advanceTier } from '@/lib/connect-roles';
import { getCourseProgress } from '@/lib/progress';
import { env } from '@/lib/env';
import { buildCredential } from '@/lib/certificate';
import { gradeQuiz } from '@/lib/quiz';
import { sendCertificateEmail } from '@/lib/email';

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
      ),
    )
    .limit(1);
  if (!enr) throw new Error('Enrollment not found');
  return enr;
}

/**
 * Confirms a lesson belongs to the given course. Guards against a learner
 * passing a lessonId/courseId from a course they aren't enrolled in — Drizzle
 * bypasses RLS, so ownership must be checked in app code.
 */
async function assertLessonInCourse(
  ctx: TenantContext,
  lessonId: string,
  courseId: string,
) {
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
  if (!row) throw new Error('Lesson not found in this course');
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

  const progress = await getCourseProgress(enrollmentId, courseId);
  if (!progress.isComplete || enrollmentStatus === 'completed') return;

  const [meta] = await db
    .select({
      courseTitle: courses.title,
      tenantName: tenants.name,
      learnerName: users.name,
      learnerEmail: users.email,
      confersRoleCode: courses.confersRoleCode,
    })
    .from(courses)
    .innerJoin(tenants, eq(tenants.id, courses.tenantId))
    .innerJoin(users, eq(users.id, ctx.userId))
    .where(eq(courses.id, courseId))
    .limit(1);

  // Connect tier alignment: completing a course that confers a tier advances
  // the learner's membership tier (same group, upward only).
  const [mem] = await db
    .select({ id: memberships.id, code: memberships.connectRoleCode })
    .from(memberships)
    .where(and(eq(memberships.userId, ctx.userId), eq(memberships.tenantId, ctx.tenantId!)))
    .limit(1);
  const nextCode = advanceTier(mem?.code, meta?.confersRoleCode);
  const advancedTier = mem && nextCode && nextCode !== mem.code ? nextCode : null;

  const code = crypto.randomUUID();
  const issuedAt = new Date();
  const verifyUrl = `https://${env.rootDomain()}/verify/${code}`;

  await db.transaction(async (tx) => {
    await tx
      .update(enrollments)
      .set({ status: 'completed', completedAt: issuedAt })
      .where(eq(enrollments.id, enrollmentId));

    if (advancedTier && mem) {
      await tx
        .update(memberships)
        .set({ connectRoleCode: advancedTier })
        .where(eq(memberships.id, mem.id));
      await audited(tx, {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: 'membership.tier_advanced',
        resourceType: 'membership',
        resourceId: mem.id,
        after: { connectRoleCode: advancedTier, courseId },
      });
    }

    const [existingCert] = await tx
      .select({ id: certificates.id })
      .from(certificates)
      .where(eq(certificates.enrollmentId, enrollmentId))
      .limit(1);

    if (!existingCert && meta) {
      await tx.insert(certificates).values({
        tenantId: ctx.tenantId!,
        enrollmentId,
        verificationCode: code,
        issuedAt,
        credential: buildCredential({
          verificationCode: code,
          learnerName: meta.learnerName,
          learnerEmail: meta.learnerEmail,
          courseTitle: meta.courseTitle,
          tenantName: meta.tenantName,
          issuedAt: issuedAt.toISOString(),
          verifyUrl,
        }),
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

  if (meta?.learnerEmail) {
    try {
      await sendCertificateEmail(meta.learnerEmail, meta.courseTitle, verifyUrl);
    } catch (e) {
      console.error('certificate email failed:', e);
    }
  }
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
  const enr = await verifyEnrollment(ctx, enrollmentId);
  // Course is derived from the enrollment, never trusted from the client.
  await assertLessonInCourse(ctx, lessonId, enr.courseId);

  await recordLessonCompleted(ctx, enr.courseId, enrollmentId, enr.status, lessonId);

  revalidatePath(`/t/${tenantSlug}/learn/${courseSlug}`);
  revalidatePath(`/t/${tenantSlug}/dashboard`);
  return { redirectTo: nextHref ?? `/learn/${courseSlug}` };
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
  const enr = await verifyEnrollment(ctx, enrollmentId);
  // Course is derived from the enrollment, never trusted from the client.
  await assertLessonInCourse(ctx, lessonId, enr.courseId);

  const [quiz] = await db
    .select({ settings: quizzes.settings, lessonId: quizzes.lessonId })
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.tenantId, ctx.tenantId)))
    .limit(1);
  // The quiz must be the one attached to this lesson.
  if (!quiz || quiz.lessonId !== lessonId) throw new Error('Quiz not found for this lesson');
  const threshold = (quiz.settings as { passThreshold?: number })?.passThreshold ?? 70;

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId));

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
  });

  if (passed) {
    await recordLessonCompleted(ctx, enr.courseId, enrollmentId, enr.status, lessonId);
  }

  revalidatePath(`/t/${tenantSlug}/learn/${courseSlug}/${lessonId}`);
  revalidatePath(`/t/${tenantSlug}/learn/${courseSlug}`);
  revalidatePath(`/t/${tenantSlug}/dashboard`);
  return {
    redirectTo: `/learn/${courseSlug}/${lessonId}?score=${score}&passed=${passed ? 1 : 0}`,
  };
}
