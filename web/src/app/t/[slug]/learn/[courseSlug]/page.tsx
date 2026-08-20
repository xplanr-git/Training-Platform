import Link from 'next/link';
import { BackLink } from '@/components/back-link';
import { CourseComplete } from '@/components/course-complete';
import { EmptyRow } from '@/components/empty-state';
import { EmptyState } from '@/components/empty-state';
import { redirect, notFound } from 'next/navigation';
import {
  Check,
  Video,
  FileText,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';
import { db, eq, and, asc, courses, sections, lessons, certificates } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { effectiveUserId } from '@/lib/view-as';
import { resolveCourseView, previewProgress } from '@/lib/course-access';
import { getCourseProgress, formatMinutes } from '@/lib/progress';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/badge';
import { Callout } from '@/components/ui/callout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { recordCourseConfidence } from './actions';
import { ConfidenceCheck } from '@/components/confidence-check';
import { getConfidenceState } from '@/lib/confidence-state';
import {
  deriveLearningItems,
  itemProgress,
  sectionItemMeta,
  itemsLabel,
  type LessonRow,
  type LearningItem,
} from '@/lib/learning-units';

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
    .select({
      id: courses.id,
      title: courses.title,
      certificateEnabled: courses.certificateEnabled,
    })
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

  // Progress and the certificate both key off enrollmentId alone, so they go
  // together. The certificate is fetched even when the course is not finished —
  // completion is only known once progress resolves, and waiting to find out would
  // cost a serial round trip on exactly the page where the panel matters.
  const [progress, certificate, confidence] = view.enrollmentId
    ? await Promise.all([
        getCourseProgress(view.enrollmentId, course.id),
        db
          .select({
            verificationCode: certificates.verificationCode,
            issuedAt: certificates.issuedAt,
            revokedAt: certificates.revokedAt,
          })
          .from(certificates)
          .where(eq(certificates.enrollmentId, view.enrollmentId))
          .limit(1)
          .then((r) => r[0] ?? null),
        getConfidenceState(view.enrollmentId),
      ])
    : [
        previewProgress(
          lessonRows.map((l) => ({ id: l.id, estimatedMinutes: l.estimatedMinutes })),
        ),
        null,
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
  // The topic the learner is currently in — the one holding the resume lesson.
  // Null once the course is complete (nothing is "current").
  const currentSectionId = progress.isComplete ? null : (resumeLesson?.sectionId ?? null);

  // LEARNER-FACING model: a subject video + its paired check is ONE item; a
  // topic-summary check is its own item. Counts/%/time below are over ITEMS, not
  // storage rows, so the course never looks longer than the real work. The
  // authoritative all-lessons-done completion (progress.isComplete, and the
  // certificate) is unchanged — it still keys off the lesson rows.
  const items = deriveLearningItems(
    lessonRows as unknown as LessonRow[],
    sectionOrder,
    progress.completed,
  );
  const itemProg = itemProgress(items);
  const secMeta = sectionItemMeta(items);
  const itemsBySection = new Map<string, LearningItem[]>();
  for (const it of items) {
    const arr = itemsBySection.get(it.sectionId) ?? [];
    arr.push(it);
    itemsBySection.set(it.sectionId, arr);
  }

  // Topic metadata string (item count + estimated duration) and the completion
  // split: fully-done topics collapse into one disclosure; the rest stay open.
  const topicMeta = (id: string) => {
    const m = secMeta.get(id) ?? { count: 0, minutes: null, partial: false, done: 0 };
    return (
      `${m.count} ${itemsLabel(m.count)}` +
      (m.minutes != null
        ? ` · ${m.partial ? 'at least' : 'about'} ${formatMinutes(m.minutes)}`
        : '')
    );
  };
  const isSectionDone = (id: string) => {
    const m = secMeta.get(id);
    return !!m && m.count > 0 && m.done >= m.count;
  };
  const doneSections = sectionRows.filter((s) => isSectionDone(s.id));
  const activeSections = sectionRows.filter((s) => !isSectionDone(s.id));
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
            revokedAt={certificate?.revokedAt ?? null}
            certificateEnabled={course.certificateEnabled}
            reviewHref={resumeLesson ? `/learn/${courseSlug}/${resumeLesson.id}` : null}
            inviteHref={`/courses/${courseSlug}`}
            confidenceAction={
              confidence?.outcome
                ? null
                : recordCourseConfidence.bind(null, view.enrollmentId, course.id, 'outcome')
            }
          />
        </div>
      ) : (
        <Card className="mt-4">
          <CardContent className="py-5">
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium">{itemProg.percent}% complete</span>
              <span className="text-muted tabular-nums">
                {itemProg.doneItems} of {itemProg.totalItems} {itemsLabel(itemProg.totalItems)}
                {!progress.isComplete && itemProg.itemsLeft > 0
                  ? ` · ${itemProg.itemsLeft} left`
                  : ''}
                {!progress.isComplete && itemProg.minutesLeft != null
                  ? ` · ${itemProg.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(itemProg.minutesLeft)} left`
                  : ''}
              </span>
            </div>
            <Progress value={itemProg.percent} className="mt-2 h-2" />
            {resumeLesson && (
              <Button asChild size="lg" className="mt-4">
                <Link href={`/learn/${courseSlug}/${resumeLesson.id}`}>{resumeLabel}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Course-start confidence BASELINE — the denominator for uplift. Shown once,
          near the beginning, and never after completion (the outcome question takes
          over). Voluntary; captures a starting point, no follow-up, never blocks. */}
      {view.enrollmentId && confidence && !confidence.baseline && !progress.isComplete && (
        <div className="mt-6 rounded-(--radius-card) border border-border px-5 py-4">
          <ConfidenceCheck
            prompt="Before you start — how confident are you installing QwickBuild today?"
            helpText="Optional. There are no wrong answers — this just helps us see how the training helps."
            action={recordCourseConfidence.bind(null, view.enrollmentId, course.id, 'baseline')}
            ackText="Thanks — that gives us a starting point."
          />
        </div>
      )}

      <div className="mt-10 space-y-10">
        {sectionRows.length === 0 && (
          <EmptyState title="No lessons here yet">
            You are enrolled, but this course has no content published yet. Nothing is wrong on your
            end — you will be able to start as soon as lessons are added.
          </EmptyState>
        )}

        {/* Completed topics compress into ONE disclosure so the eye lands on the
            current + remaining work. Free navigation is preserved — each row
            links into that topic. Chevron points right, rotates down when open. */}
        {doneSections.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-1.5">
              <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90" />
              <Check className="text-status-green h-4 w-4 shrink-0" />
              <span className="text-h3">{doneSections.length} topics completed</span>
            </summary>
            <ul className="mt-3 space-y-3 pl-7">
              {doneSections.map((s) => {
                const first = (itemsBySection.get(s.id) ?? [])[0];
                return (
                  <li key={s.id}>
                    <Link
                      href={
                        first
                          ? `/learn/${courseSlug}/${first.openLessonId}`
                          : `/learn/${courseSlug}`
                      }
                      className="flex flex-col gap-0.5 hover:underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                    >
                      <span className="text-sm font-medium">{s.title || 'Section'}</span>
                      <span className="text-foreground-2 shrink-0 text-meta tabular-nums">
                        {topicMeta(s.id)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        )}

        {/* Current topic gets an ink LEFT MARKER (state via marker, square — not
            a card); remaining topics are neutral and scannable. Header stacks on a
            phone so a long title never collides with the count/duration. */}
        {activeSections.map((s) => {
          const sectionItems = itemsBySection.get(s.id) ?? [];
          const isCurrent = s.id === currentSectionId;
          return (
            <section
              key={s.id}
              className={isCurrent ? 'border-l-2 border-foreground pl-4' : undefined}
            >
              <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <h2 className="text-h2">{s.title || 'Section'}</h2>
                  {isCurrent && <p className="text-foreground-2 mt-0.5 text-meta">In progress</p>}
                </div>
                <span className="text-foreground-2 shrink-0 text-meta tabular-nums sm:text-right">
                  {topicMeta(s.id)}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {sectionItems.map((it) => {
                  const Icon = LESSON_ICON[it.contentType] ?? BookOpen;
                  const done = it.state === 'complete';
                  return (
                    <li key={it.key}>
                      <Link
                        href={`/learn/${courseSlug}/${it.openLessonId}`}
                        className="flex items-center gap-3 rounded-sm px-2 py-3 text-sm transition-colors hover:bg-surface-muted"
                      >
                        {done ? (
                          <Check
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-status-green"
                          />
                        ) : (
                          <Icon className="h-4 w-4 shrink-0 text-muted" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{it.title}</span>
                          {/* Content-type parts — the check belongs to the SAME item,
                              not a separate task. Restrained line icons, no colour. */}
                          <span className="text-muted mt-0.5 flex items-center gap-2.5 text-meta">
                            {it.kind === 'lesson' && (
                              <span className="inline-flex items-center gap-1">
                                <Video aria-hidden="true" className="h-3.5 w-3.5" />
                                {it.contentType === 'video'
                                  ? 'Video'
                                  : it.contentType === 'pdf'
                                    ? 'PDF'
                                    : 'Lesson'}
                                {it.minutes != null ? ` · ${it.minutes} min` : ''}
                              </span>
                            )}
                            {it.hasCheck && (
                              <span className="inline-flex items-center gap-1">
                                <ClipboardCheck aria-hidden="true" className="h-3.5 w-3.5" />
                                Knowledge check
                              </span>
                            )}
                          </span>
                        </span>
                        {done ? (
                          <StatusBadge tone="green">Done</StatusBadge>
                        ) : it.state === 'check_remaining' ? (
                          <span className="text-foreground-2 shrink-0 text-meta">Check left</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
                {sectionItems.length === 0 && (
                  <li>
                    <EmptyRow className="py-5" title="No items in this topic yet" />
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
