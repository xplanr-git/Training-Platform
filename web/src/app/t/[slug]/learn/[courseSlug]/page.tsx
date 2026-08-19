import Link from 'next/link';
import { BackLink } from '@/components/back-link';
import { CourseComplete } from '@/components/course-complete';
import { EmptyRow } from '@/components/empty-state';
import { EmptyState } from '@/components/empty-state';
import { redirect, notFound } from 'next/navigation';
import { Check, Video, FileText, HelpCircle, BookOpen } from 'lucide-react';
import { db, eq, and, asc, courses, sections, lessons, certificates } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { effectiveUserId } from '@/lib/view-as';
import { resolveCourseView, previewProgress } from '@/lib/course-access';
import { getCourseProgress, formatMinutes } from '@/lib/progress';
import { Progress } from '@/components/ui/progress';
import { Callout } from '@/components/ui/callout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LESSON_ICON: Record<string, typeof Video> = {
  video: Video,
  pdf: FileText,
  quiz: HelpCircle,
  text: BookOpen,
};

/** Enrollment-gated course outline with resume + per-lesson progress. */
export default async function Learn({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const ctx = await getTenantContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(`/learn/${courseSlug}`)}`);
  if (!ctx.tenantId) redirect('/');

  const [course] = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(and(eq(courses.tenantId, ctx.tenantId), eq(courses.slug, courseSlug)))
    .limit(1);
  if (!course) notFound();

  // While viewing-as, read the target learner's course state (progress,
  // certificate); the page has no write affordances, so nothing else changes.
  const dataUserId = await effectiveUserId(ctx.userId);

  // An admin of this academy may PREVIEW without enrolling — read-only, so
  // nothing is recorded and they never appear in their own statistics.
  // All three key off course.id alone, so they go in one batch rather than three
  // sequential round trips.
  const [view, sectionRows, lessonRows] = await Promise.all([
    resolveCourseView(dataUserId, ctx.tenantId, course.id),
    db
      .select()
      .from(sections)
      .where(eq(sections.courseId, course.id))
      .orderBy(asc(sections.position)),
    db.select().from(lessons).where(eq(lessons.courseId, course.id)).orderBy(asc(lessons.position)),
  ]);
  if (view.mode === 'denied') redirect(`/courses/${courseSlug}`);
  const isPreview = view.mode === 'preview';

  const bySection = new Map<string, typeof lessonRows>();
  for (const l of lessonRows) {
    const arr = bySection.get(l.sectionId) ?? [];
    arr.push(l);
    bySection.set(l.sectionId, arr);
  }

  // Per-topic timing for the map header: lesson count + estimated duration.
  // Mirrors the course-level partial rule — some lessons carry no estimate, so
  // the figure is "at least" rather than "about" when only some are estimated.
  const sectionMeta = new Map<
    string,
    { count: number; minutes: number | null; partial: boolean }
  >();
  for (const s of sectionRows) {
    const items = bySection.get(s.id) ?? [];
    const est = items
      .map((l) => l.estimatedMinutes)
      .filter((m): m is number => typeof m === 'number' && Number.isFinite(m) && m > 0);
    sectionMeta.set(s.id, {
      count: items.length,
      minutes: est.length ? est.reduce((a, b) => a + b, 0) : null,
      partial: est.length > 0 && est.length < items.length,
    });
  }

  // Progress and the certificate both key off enrollmentId alone, so they go
  // together. The certificate is fetched even when the course is not finished —
  // completion is only known once progress resolves, and waiting to find out would
  // cost a serial round trip on exactly the page where the panel matters.
  const [progress, certificate] = view.enrollmentId
    ? await Promise.all([
        getCourseProgress(view.enrollmentId, course.id),
        db
          .select({
            verificationCode: certificates.verificationCode,
            issuedAt: certificates.issuedAt,
          })
          .from(certificates)
          .where(eq(certificates.enrollmentId, view.enrollmentId))
          .limit(1)
          .then((r) => r[0] ?? null),
      ])
    : [
        previewProgress(
          lessonRows.map((l) => ({ id: l.id, estimatedMinutes: l.estimatedMinutes })),
        ),
        null,
      ];

  // Ordered flat lesson list → first incomplete lesson to resume at.
  const sectionOrder = new Map(sectionRows.map((s, i) => [s.id, i]));
  const orderedLessons = [...lessonRows].sort((a, b) => {
    const sa = sectionOrder.get(a.sectionId) ?? 0;
    const sb = sectionOrder.get(b.sectionId) ?? 0;
    return sa - sb || a.position - b.position;
  });
  const resumeLesson =
    orderedLessons.find((l) => !progress.completed.has(l.id)) ?? orderedLessons[0];

  const lessonsLeft = progress.total - progress.done;
  const resumeLabel =
    progress.done === 0
      ? 'Start course'
      : progress.isComplete
        ? 'Review course'
        : 'Continue where you left off';

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-14">
      <BackLink href="/dashboard">Your learning</BackLink>
      <h1 className="mt-3 text-2xl">{course.title}</h1>
      {isPreview && (
        <Callout tone="amber" className="mt-3">
          <b>Preview.</b> You are not enrolled, so nothing here is recorded — no progress, no watch
          time, no certificate. This is how a learner will see it.
        </Callout>
      )}

      {/*
        Once finished, the progress card has nothing left to say — it read "100%
        complete" and offered "Review course", which is exactly what made the one
        moment worth marking look like any other visit. The panel replacing it
        carries the review action, so nothing is lost.
        Preview mode is excluded by enrollmentId: an admin previewing their own
        course has no enrolment and must not be shown a certificate.
      */}
      {progress.isComplete && view.enrollmentId ? (
        <div className="mt-4">
          <CourseComplete
            courseTitle={course.title}
            verificationCode={certificate?.verificationCode ?? null}
            issuedAt={certificate?.issuedAt ?? null}
            reviewHref={resumeLesson ? `/learn/${courseSlug}/${resumeLesson.id}` : null}
          />
        </div>
      ) : (
        <Card className="mt-4">
          <CardContent className="py-5">
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium">{progress.percent}% complete</span>
              <span className="text-muted tabular-nums">
                {progress.done} of {progress.total} lessons
                {!progress.isComplete && lessonsLeft > 0 ? ` · ${lessonsLeft} left` : ''}
                {!progress.isComplete && progress.minutesLeft != null
                  ? ` · ${progress.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(progress.minutesLeft)} left`
                  : ''}
              </span>
            </div>
            <Progress value={progress.percent} className="mt-2 h-2" />
            {resumeLesson && (
              <Button asChild size="lg" className="mt-4">
                <Link href={`/learn/${courseSlug}/${resumeLesson.id}`}>{resumeLabel}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-10 space-y-10">
        {sectionRows.length === 0 && (
          <EmptyState title="No lessons here yet">
            You are enrolled, but this course has no content published yet. Nothing is wrong on your
            end — you will be able to start as soon as lessons are added.
          </EmptyState>
        )}
        {sectionRows.map((s) => {
          const meta = sectionMeta.get(s.id) ?? { count: 0, minutes: null, partial: false };
          const items = bySection.get(s.id) ?? [];
          return (
            <section key={s.id}>
              {/* Topic header: title + count/duration. Borderless on the shell
                  (a white card on #FCFCFB is noise — DS §4b); the light row
                  dividers do the separating, section whitespace does the grouping. */}
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="text-h2">{s.title || 'Section'}</h2>
                <span className="text-foreground-2 shrink-0 text-meta tabular-nums">
                  {meta.count} {meta.count === 1 ? 'lesson' : 'lessons'}
                  {meta.minutes != null
                    ? ` · ${meta.partial ? 'at least' : 'about'} ${formatMinutes(meta.minutes)}`
                    : ''}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {items.map((l) => {
                  const Icon = LESSON_ICON[l.type] ?? BookOpen;
                  const lDone = progress.completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${courseSlug}/${l.id}`}
                        className="flex items-center gap-3 rounded-sm px-2 py-3 text-sm transition-colors hover:bg-surface-muted"
                      >
                        {lDone ? (
                          <Check className="text-status-green h-4 w-4 shrink-0" />
                        ) : (
                          <Icon className="h-4 w-4 shrink-0 text-muted" />
                        )}
                        <span className="flex-1 truncate">{l.title || 'Untitled lesson'}</span>
                        {l.estimatedMinutes != null && (
                          <span className="text-foreground-2 shrink-0 text-xs tabular-nums">
                            {l.estimatedMinutes} min
                          </span>
                        )}
                        {lDone && <span className="text-status-green text-xs">Done</span>}
                      </Link>
                    </li>
                  );
                })}
                {items.length === 0 && (
                  <li>
                    <EmptyRow className="py-5" title="No lessons in this section yet" />
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
