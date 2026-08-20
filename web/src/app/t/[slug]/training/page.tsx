import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award } from 'lucide-react';
import {
  db,
  eq,
  and,
  desc,
  inArray,
  enrollments,
  courses,
  certificates,
  progressEvents,
  lessons,
} from '@training-platform/db';
import { getTenantContext, tenantBySlug } from '@/lib/tenant';
import { effectiveUserId } from '@/lib/view-as';
import { deriveProgress, formatMinutes } from '@/lib/progress';
import {
  deriveLearningItems,
  itemProgress,
  itemsLabel,
  type LessonRow,
} from '@/lib/learning-units';
import { formatDateLong } from '@/lib/format-date';
import { LearnerShell } from '@/components/learner-shell';
import { EmptyState } from '@/components/empty-state';
import { GraduationCap } from 'lucide-react';

/**
 * My training — the persistent record. Answers, months later: what have I done,
 * when did I complete it, and where is my certificate. No quiz answers, attempt
 * internals, or admin fields — just the learner's own training and credentials.
 */
export default async function MyTrainingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');
  if (!ctx.tenantId) redirect('/');
  const dataUserId = await effectiveUserId(ctx.userId);
  const tenant = await tenantBySlug(slug);

  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      courseId: courses.id,
      title: courses.title,
      slug: courses.slug,
      completedAt: enrollments.completedAt,
      verificationCode: certificates.verificationCode,
      issuedAt: certificates.issuedAt,
      revokedAt: certificates.revokedAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .leftJoin(certificates, eq(certificates.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.userId, dataUserId), eq(enrollments.tenantId, ctx.tenantId)))
    .orderBy(desc(enrollments.startedAt));

  const enrollmentIds = rows.map((r) => r.enrollmentId);
  const courseIds = [...new Set(rows.map((r) => r.courseId))];
  const [completedRows, lessonRows] = await Promise.all([
    enrollmentIds.length
      ? db
          .select({ enrollmentId: progressEvents.enrollmentId, lessonId: progressEvents.lessonId })
          .from(progressEvents)
          .where(
            and(
              inArray(progressEvents.enrollmentId, enrollmentIds),
              eq(progressEvents.eventType, 'completed'),
            ),
          )
      : Promise.resolve([] as Array<{ enrollmentId: string; lessonId: string | null }>),
    courseIds.length
      ? db
          .select({
            courseId: lessons.courseId,
            id: lessons.id,
            sectionId: lessons.sectionId,
            position: lessons.position,
            type: lessons.type,
            title: lessons.title,
            estimatedMinutes: lessons.estimatedMinutes,
            assessmentForLessonId: lessons.assessmentForLessonId,
          })
          .from(lessons)
          .where(and(inArray(lessons.courseId, courseIds), eq(lessons.active, true)))
      : Promise.resolve([] as Array<{ courseId: string } & LessonRow>),
  ]);

  const completedByEnrollment = new Map<string, string[]>();
  for (const c of completedRows) {
    if (!c.lessonId) continue;
    (
      completedByEnrollment.get(c.enrollmentId) ??
      completedByEnrollment.set(c.enrollmentId, []).get(c.enrollmentId)!
    ).push(c.lessonId);
  }
  const lessonsByCourse = new Map<string, LessonRow[]>();
  for (const l of lessonRows) {
    (lessonsByCourse.get(l.courseId) ?? lessonsByCourse.set(l.courseId, []).get(l.courseId)!).push(
      l,
    );
  }

  const items = rows.map((r) => {
    const courseLessons = lessonsByCourse.get(r.courseId) ?? [];
    const completed = new Set(completedByEnrollment.get(r.enrollmentId) ?? []);
    const p = deriveProgress([...completed], courseLessons);
    const order = new Map(courseLessons.map((l) => [l.sectionId, 0]));
    const ip = itemProgress(deriveLearningItems(courseLessons, order, completed));
    const revoked = Boolean(r.verificationCode && r.revokedAt);
    return {
      ...r,
      isComplete: p.isComplete,
      percent: ip.percent,
      minutesLeft: ip.minutesLeft,
      minutesLeftIsPartial: ip.minutesLeftIsPartial,
      revoked,
    };
  });

  return (
    <>
      <LearnerShell slug={slug} tenantName={tenant?.name ?? 'Outdure Academy'} active="training" />
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-14">
        <h1 className="text-2xl">My training</h1>
        <p className="text-foreground-2 mt-2 max-w-prose text-sm leading-relaxed">
          Everything you’re enrolled in, and the certificates you’ve earned. Your certificate stays
          here — you never need to keep an email or a link to find it again.
        </p>

        {items.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={<GraduationCap />}
            title="No training yet"
            action={{ href: `/t/${slug}/dashboard`, label: 'Go to Home' }}
          >
            When you’re enrolled in training it will appear here.
          </EmptyState>
        ) : (
          <ul className="divide-border mt-6 divide-y">
            {items.map((r) => (
              <li key={r.enrollmentId} className="py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/learn/${r.slug}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {r.title}
                    </Link>
                    <p className="text-foreground-2 mt-0.5 text-meta">
                      {r.isComplete
                        ? r.completedAt
                          ? `Completed ${formatDateLong(r.completedAt)}`
                          : 'Completed'
                        : r.percent > 0
                          ? `In progress · ${r.percent}%${r.minutesLeft != null ? ` · ${r.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(r.minutesLeft)} left` : ''}`
                          : 'Not started'}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {r.verificationCode && !r.revoked ? (
                      <Link
                        href={`/verify/${r.verificationCode}`}
                        className="text-link hover:text-link-hover inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                      >
                        <Award aria-hidden="true" className="h-4 w-4" /> View certificate
                      </Link>
                    ) : r.revoked ? (
                      <Link
                        href={`/verify/${r.verificationCode}`}
                        className="text-foreground-2 hover:text-foreground inline-flex items-center gap-1.5 text-sm"
                      >
                        <Award aria-hidden="true" className="h-4 w-4" /> Certificate withdrawn
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
