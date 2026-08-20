import Link from 'next/link';
import { LessonNav } from '@/components/lesson-nav';
import { BackLink } from '@/components/back-link';
import { SkipLink } from '@/components/skip-link';
import { VideoUnavailable } from '@/components/video-unavailable';
import { EmptyState } from '@/components/empty-state';
import { Callout } from '@/components/ui/callout';
import { redirect, notFound } from 'next/navigation';
import {
  Video,
  FileText,
  HelpCircle,
  BookOpen,
  Check,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  db,
  eq,
  and,
  asc,
  desc,
  sql,
  count,
  gte,
  isNotNull,
  courses,
  sections,
  lessons,
  enrollments,
  progressEvents,
  quizzes,
  quizQuestions,
  quizAttempts,
} from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { effectiveUserId, isViewingAs } from '@/lib/view-as';
import { resolveCourseView, previewProgress } from '@/lib/course-access';
import { safeHttpUrl } from '@/lib/validation';
import { getCourseProgress } from '@/lib/progress';
import { isCriticalCheck } from '@/lib/competency';
import {
  markLessonComplete,
  submitQuizAttempt,
  markSectionReviewed,
  recordLessonFeedback,
  recordInstallerIdea,
  recordTopicConfidence,
} from '../actions';
import { NavForm } from '@/components/nav-form';
import { QuizForm } from '@/components/quiz-form';
import { BunnyVideoPlayer } from '@/components/bunny-video-player';
import { LessonFeedback } from '@/components/lesson-feedback';
import { InstallerIdea } from '@/components/installer-idea';
import { ConfidenceCheck } from '@/components/confidence-check';
import { ShareButton } from '@/components/share-button';
import { capabilityTriggers } from '@/lib/confidence';
import { FOLLOWUP_REASONS } from '@/lib/confidence';
import { getConfidenceState } from '@/lib/confidence-state';
import {
  deriveLearningItems,
  checkLessonHeading,
  topicHeading,
  type LessonRow,
  type LearningItem,
} from '@/lib/learning-units';
import { hostedVideoFromContent } from '@/lib/video';
import { isVideoFault } from '@/lib/video-availability';
import { resolveVideoSource } from '@/lib/video-source';
import { env } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/components/ui/utils';

const LESSON_ICON: Record<string, typeof Video> = {
  video: Video,
  pdf: FileText,
  quiz: HelpCircle,
  text: BookOpen,
};

function loadQuestions(quizId: string) {
  return db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(asc(quizQuestions.position));
}

export default async function LessonPlayer({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; courseSlug: string; lessonId: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const { slug, courseSlug, lessonId } = await params;
  const { review: reviewForLessonId } = await searchParams;
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) redirect(`/login?next=${encodeURIComponent(`/learn/${courseSlug}`)}`);

  const [course] = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(and(eq(courses.tenantId, ctx.tenantId), eq(courses.slug, courseSlug)))
    .limit(1);
  if (!course) notFound();

  // Admins of this academy may PREVIEW an unenrolled course, including a draft.
  // Read-only: no progress, no watch time, no completion, no certificate — so a
  // preview never contaminates the academy's own evidence.
  // These three depend only on course.id, so they go together. Each round trip is
  // to Sydney; run serially they stack into the page's time-to-first-byte.
  // While viewing-as, read the target learner's course state; authorization and
  // writes stay the admin's, and `readOnly` renders the player without any write
  // affordance (see below). Otherwise both are the caller's own id.
  const viewingAs = await isViewingAs();
  const readOnly = viewingAs;
  const dataUserId = await effectiveUserId(ctx.userId);

  const [view, sectionRows, lessonRows, currentRows] = await Promise.all([
    resolveCourseView(dataUserId, ctx.tenantId, course.id),
    db
      .select({ id: sections.id, position: sections.position, title: sections.title })
      .from(sections)
      .where(eq(sections.courseId, course.id))
      .orderBy(asc(sections.position)),
    // Outline fields only — NOT content. This used to pull every lesson's
    // `content` jsonb (text bodies can be large) just to render the nav, when
    // only the CURRENT lesson's content is read — fetched on its own below.
    db
      .select({
        id: lessons.id,
        sectionId: lessons.sectionId,
        position: lessons.position,
        type: lessons.type,
        title: lessons.title,
        estimatedMinutes: lessons.estimatedMinutes,
        assessmentForLessonId: lessons.assessmentForLessonId,
      })
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(asc(lessons.position)),
    db
      .select({ content: lessons.content })
      .from(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, course.id)))
      .limit(1),
  ]);
  if (view.mode === 'denied') redirect(`/courses/${courseSlug}`);
  const isPreview = view.mode === 'preview';
  const enrollmentId = view.enrollmentId;

  // Ordered lesson list (section position, then lesson position) for nav + outline.
  const sectionOrder = new Map(sectionRows.map((s, i) => [s.id, i]));
  const ordered = [...lessonRows].sort((a, b) => {
    const sa = sectionOrder.get(a.sectionId) ?? 0;
    const sb = sectionOrder.get(b.sectionId) ?? 0;
    return sa - sb || a.position - b.position;
  });

  const idx = ordered.findIndex((l) => l.id === lessonId);
  if (idx < 0) notFound();
  const lesson = ordered[idx];
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null;

  const content = (currentRows[0]?.content ?? {}) as Record<string, string>;
  const pdfUrl = safeHttpUrl(content.url);
  const nextHref = next ? `/learn/${courseSlug}/${next.id}` : `/learn/${courseSlug}`;
  const isQuiz = lesson.type === 'quiz';

  // Does this lesson end a practical capability (structural, fasteners, …)? The
  // trigger is the capability's LAST lesson — usually its terminal knowledge
  // check — so confidence is asked only after the learner has learned AND been
  // tested. Skip in read-only/preview. Pure computation; the answered-state DB
  // read is deferred until we know this and that the lesson is complete.
  const capabilityHere =
    enrollmentId && !readOnly
      ? (capabilityTriggers(sectionRows, ordered).find((c) => c.lessonId === lesson.id) ?? null)
      : null;
  const HeaderIcon = LESSON_ICON[lesson.type] ?? BookOpen;
  const hosted = hostedVideoFromContent(content);

  // ONE decision about what this lesson plays. It used to be made twice — a JSX
  // ternary testing the Bunny id and library, and a `playable` const beside it
  // repeating the same conditions for the logging gate. The branches below switch on
  // `kind`, so they are exhaustive by construction and there is no path that renders
  // nothing.
  const source =
    lesson.type === 'video'
      ? resolveVideoSource(content, { libraryId: env.bunnyLibraryId() ?? null })
      : null;

  // Logged when it is a deployment or data fault rather than the author simply not
  // having attached a video yet. That distinction is the point: previously nothing was
  // logged at all, so a missing BUNNY_LIBRARY_ID was invisible in production.
  if (source?.kind === 'unavailable' && isVideoFault(source.unavailable)) {
    console.error('[video unavailable]', {
      reason: source.unavailable.reason,
      lessonId: lesson.id,
      courseId: course.id,
      tenantId: ctx.tenantId,
    });
  }

  // Final batch: course progress, the quiz row, and the furthest watched position
  // are mutually independent once the lesson is known. Each is conditional, so the
  // unused ones resolve immediately rather than costing a round trip.
  const [progress, quizRows, resumeRows] = await Promise.all([
    enrollmentId
      ? getCourseProgress(enrollmentId, course.id)
      : Promise.resolve(
          previewProgress(ordered.map((l) => ({ id: l.id, estimatedMinutes: l.estimatedMinutes }))),
        ),
    isQuiz
      ? db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.lessonId, lesson.id)).limit(1)
      : Promise.resolve([] as Array<{ id: string }>),
    hosted && enrollmentId
      ? db
          .select({
            maxPos: sql<string | null>`max((${progressEvents.payload} ->> 'positionSec')::numeric)`,
          })
          .from(progressEvents)
          .where(
            and(
              eq(progressEvents.enrollmentId, enrollmentId),
              eq(progressEvents.lessonId, lesson.id),
              eq(progressEvents.eventType, 'video_progress'),
            ),
          )
      : Promise.resolve([] as Array<{ maxPos: string | null }>),
  ]);
  const done = progress.completed.has(lesson.id);

  // Show the capability confidence checkpoint only once this lesson is COMPLETE
  // (a quiz passed / the last video finished) — never mid-check — and never twice.
  const capabilityAnswered =
    capabilityHere && enrollmentId && done
      ? (await getConfidenceState(enrollmentId)).topics.has(capabilityHere.key)
      : false;
  const showTopicConfidence = !!capabilityHere && done && !capabilityAnswered;

  // Questions need the quiz id, so they are the one genuinely serial follow-up.
  const quiz = quizRows[0] ?? null;
  // The result banner is read from the LAST recorded attempt, never from the URL.
  // It used to render `?score=&passed=` straight off searchParams, so any learner
  // could show a green "You scored 100%. Passed." by editing the address bar — a
  // credibility problem for an audit-grade-evidence product. Grading and the real
  // pass state (`done`) were always server-authoritative; this makes the banner
  // agree with them.
  const [questions, attemptRows] = await Promise.all([
    quiz ? loadQuestions(quiz.id) : Promise.resolve([]),
    quiz && enrollmentId
      ? db
          .select({
            score: quizAttempts.score,
            passed: quizAttempts.passed,
            submittedAt: quizAttempts.submittedAt,
          })
          .from(quizAttempts)
          .where(
            and(
              eq(quizAttempts.enrollmentId, enrollmentId),
              eq(quizAttempts.quizId, quiz.id),
              isNotNull(quizAttempts.submittedAt),
            ),
          )
          .orderBy(desc(quizAttempts.submittedAt))
          .limit(1)
      : Promise.resolve(
          [] as Array<{ score: string | null; passed: boolean | null; submittedAt: Date | null }>,
        ),
  ]);
  const lastAttempt = attemptRows[0] ?? null;

  // Resume at the furthest point this learner reached, from the append-only watch
  // events — so it follows them across devices.
  let resumeAtSec = 0;
  const maxPos = resumeRows[0]?.maxPos;
  if (maxPos != null) {
    const pos = Number(maxPos);
    if (Number.isFinite(pos) && pos > 0) resumeAtSec = Math.floor(pos);
  }

  const bySection = new Map<string, typeof ordered>();
  for (const l of ordered) {
    const arr = bySection.get(l.sectionId) ?? [];
    arr.push(l);
    bySection.set(l.sectionId, arr);
  }

  // "In this topic" outline uses the LEARNER-FACING model: a subject video + its
  // paired check is ONE row (the check is folded in, not a separate task); a
  // topic-summary check is its own row. Rows are keyed by the lesson the learner
  // opens; "done" is item-complete (content AND check), and the current lesson —
  // even if it's a paired check — highlights its parent item's row.
  const learningItems = deriveLearningItems(
    ordered as unknown as LessonRow[],
    sectionOrder,
    progress.completed,
  );
  const itemsBySection = new Map<string, LearningItem[]>();
  for (const it of learningItems) {
    const arr = itemsBySection.get(it.sectionId) ?? [];
    arr.push(it);
    itemsBySection.set(it.sectionId, arr);
  }
  const outline = sectionRows.map((s) => ({
    id: s.id,
    title: s.title,
    items: (itemsBySection.get(s.id) ?? []).map((it) => ({
      id: it.openLessonId,
      title: it.title,
      type: it.contentType,
    })),
  }));
  const itemCompleted = new Set(
    learningItems.filter((it) => it.state === 'complete').map((it) => it.openLessonId),
  );
  const currentItemOpenId =
    learningItems.find((it) => it.contentLessonId === lesson.id || it.checkLessonId === lesson.id)
      ?.openLessonId ?? lesson.id;

  // Warranty-critical remediation state. A critical check with a failed prior
  // attempt blocks the next attempt until the learner reviews the section (via
  // markSectionReviewed) — so guess/retry is not a path to Trained. Only computed
  // for a critical check the learner can actually attempt.
  const isCriticalQuiz = isQuiz && isCriticalCheck(questions);
  const sectionFirstLessonId = bySection.get(lesson.sectionId)?.[0]?.id ?? lesson.id;
  let reviewNeeded = false;
  if (isCriticalQuiz && enrollmentId && !readOnly && !done && lastAttempt?.submittedAt) {
    const [{ reviews } = { reviews: 0 }] = await db
      .select({ reviews: count() })
      .from(progressEvents)
      .where(
        and(
          eq(progressEvents.enrollmentId, enrollmentId),
          eq(progressEvents.eventType, 'reviewed'),
          sql`${progressEvents.payload}->>'sectionId' = ${lesson.sectionId}`,
          gte(progressEvents.occurredAt, lastAttempt.submittedAt),
        ),
      );
    reviewNeeded = reviews === 0;
  }

  // One responsive layout — NO desktop side rail. The current topic's items and
  // the whole-course route both live BELOW the content. `currentSection` is the
  // topic the lesson belongs to; its title is the orientation line above the
  // lesson title (course context -> topic -> lesson).
  const currentSection = outline.find((s) => s.id === lesson.sectionId) ?? null;
  const topicTitle = currentSection?.title ? topicHeading(currentSection.title) : null;

  // Review-control (§0): the learner reaches this lesson from a Needs-Review
  // screen (?review=<quizLessonId>). The "back to the check" acknowledgment lives
  // HERE, on the review content — not on the Needs-Review screen — so a review
  // can't be self-asserted without actually opening the relevant section. Valid
  // only when the review target is the quiz in THIS lesson's section.
  const reviewTarget =
    reviewForLessonId && enrollmentId && !readOnly
      ? (ordered.find(
          (l) =>
            l.id === reviewForLessonId && l.sectionId === lesson.sectionId && l.type === 'quiz',
        ) ?? null)
      : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-12">
      {/*
        Keyboard learners land on back-nav, progress, and the title group before
        the lesson content — on every lesson advance. The skip link jumps them
        straight to the content block (#main-content below).
      */}
      <SkipLink />
      {/* Review-control bar (§0): only reachable by opening the review lesson from
          the Needs-Review screen. Marking reviewed lives here, on the content —
          not a self-assert on the previous screen. */}
      {reviewTarget && (
        <div className="bg-sunken mb-6 flex flex-col gap-3 rounded-sm px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground-2 text-sm">
            <b className="text-foreground">Reviewing {topicTitle ?? 'this section'}</b> for the
            knowledge check. Take a look, then head back.
          </p>
          <NavForm
            action={markSectionReviewed.bind(
              null,
              slug,
              courseSlug,
              enrollmentId!,
              lesson.sectionId,
              reviewTarget.id,
            )}
          >
            <Button type="submit" size="sm" className="shrink-0">
              Back to the knowledge check
            </Button>
          </NavForm>
        </div>
      )}
      {/* Course context — back navigation is its own group */}
      <BackLink href={`/learn/${courseSlug}`} className="max-w-full">
        {course.title}
      </BackLink>
      <div className="mt-3 flex items-center gap-3">
        <Progress value={progress.percent} className="h-2 max-w-xs flex-1" />
        <span className="text-foreground-2 shrink-0 text-meta tabular-nums">
          {progress.percent}%
        </span>
      </div>

      {/* Topic + lesson title — one tight group, set apart from the back nav */}
      <div className="mt-6">
        {topicTitle && <p className="text-foreground-2 text-sm">{topicTitle}</p>}
        <div className="mt-1 flex items-center gap-3">
          <span className="bg-surface-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-muted">
            <HeaderIcon className="h-4 w-4" />
          </span>
          <h1 className="text-2xl">{isQuiz ? checkLessonHeading(lesson.title) : lesson.title}</h1>
        </div>
        {(isPreview || readOnly) && (
          <Callout tone="amber" className="mt-2 px-3 py-2 text-meta">
            Read-only — nothing on this page is recorded.
          </Callout>
        )}
      </div>

      <div id="main-content" className="mt-6">
        {lesson.type === 'text' && (
          <div className="whitespace-pre-line leading-relaxed text-foreground-2">
            {content.body ||
              'Nothing has been written into this lesson yet. Carry on to the next one — it will not hold up your certificate.'}
          </div>
        )}
        {lesson.type === 'video' &&
          source &&
          (source.kind === 'bunny' ? (
            enrollmentId && !readOnly ? (
              <BunnyVideoPlayer
                libraryId={source.libraryId}
                videoId={source.videoId}
                enrollmentId={enrollmentId}
                lessonId={lesson.id}
                resumeAtSec={resumeAtSec}
              />
            ) : (
              /* Preview OR view-as: the bare embed, deliberately NOT the
                   tracking player. recordVideoProgress needs an enrolment and
                   refuses while viewing-as; a look must not write watch time. */
              <div className="aspect-video w-full overflow-hidden rounded-(--radius-card) bg-black">
                <iframe
                  src={`https://iframe.mediadelivery.net/embed/${source.libraryId}/${source.videoId}`}
                  className="h-full w-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            )
          ) : source.kind === 'youtube' ? (
            <div className="aspect-video w-full overflow-hidden rounded-(--radius-card) bg-black">
              <iframe
                src={source.embedUrl}
                className="h-full w-full"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          ) : (
            <VideoUnavailable
              unavailable={source.unavailable}
              isPreview={isPreview}
              builderHref={`/admin/courses/${course.id}/builder`}
            />
          ))}
        {lesson.type === 'pdf' &&
          (pdfUrl ? (
            <div>
              <div className="h-[70vh] w-full overflow-hidden rounded-(--radius-card) border border-border">
                <iframe src={pdfUrl} className="h-full w-full" title={lesson.title} />
              </div>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 items-center rounded-md border border-input px-3 text-sm font-semibold text-foreground-2 transition-colors hover:border-foreground hover:text-foreground"
              >
                Open PDF in new tab
              </a>
            </div>
          ) : (
            <p className="text-muted">
              There is no PDF on this lesson yet. Carry on to the next one — it will not hold up
              your certificate.
            </p>
          ))}
        {isQuiz && (
          <div>
            {/* A non-critical retry: a plain, neutral nudge — no coloured banner,
                no score exposure. The passed state and the needs-review path have
                their own treatments below. */}
            {lastAttempt && !lastAttempt.passed && !done && !reviewNeeded && (
              <p className="text-foreground-2 mb-5 text-sm">
                That attempt didn’t pass — have another go.
              </p>
            )}
            {done ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-status-green">
                <Check className="h-4 w-4" /> You have passed this knowledge check.
              </p>
            ) : questions.length === 0 ? (
              <EmptyState title="This knowledge check has no questions yet">
                Nothing to answer here for now — it has not been written yet. Carry on to the next
                lesson; this one will not hold up your certificate.
              </EmptyState>
            ) : !enrollmentId || readOnly ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  These are the questions as a learner sees them. Answers can&apos;t be submitted
                  from a preview or a view-as — an attempt records against the learner&apos;s own
                  enrolment.
                </p>
                <ol className="list-decimal space-y-3 pl-5">
                  {questions.map((q) => (
                    <li key={q.id} className="text-sm">
                      <span className="font-medium">{q.prompt}</span>
                      <ul className="mt-1 space-y-0.5 text-muted">
                        {(q.options as string[]).map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            ) : reviewNeeded ? (
              // NEUTRAL — a normal controlled learning path, not an error/warning.
              // Plain language (no "warranty-critical"/remediation); Review is the
              // primary action; the retry only unlocks once the section is reviewed.
              <div className="flex items-start gap-3">
                <RotateCcw aria-hidden="true" className="text-foreground mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-h3">Review this section before trying again</h3>
                  <p className="text-foreground-2 mt-1.5 text-sm">
                    One of your answers about {topicTitle ?? 'this section'} wasn’t correct. Review
                    this short section, then try the knowledge check again.
                  </p>
                  <div className="mt-4">
                    {/* Review is the only path — the "reviewed" acknowledgment now
                        lives on the review lesson itself (?review carries the check
                        to return to), so it can't be self-asserted from here. */}
                    <Button asChild>
                      <Link
                        href={`/learn/${courseSlug}/${sectionFirstLessonId}?review=${lesson.id}`}
                      >
                        Review {topicTitle ?? 'this section'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <QuizForm
                questions={questions.map((q) => ({
                  id: q.id,
                  prompt: q.prompt,
                  type: q.type,
                  options: q.options as string[],
                }))}
                submitAction={submitQuizAttempt.bind(
                  null,
                  slug,
                  courseSlug,
                  course.id,
                  enrollmentId,
                  lesson.id,
                  quiz!.id,
                )}
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
        {prev ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/learn/${courseSlug}/${prev.id}`}>
              <ArrowLeft className="h-4 w-4" /> Previous
            </Link>
          </Button>
        ) : (
          <span />
        )}

        {!enrollmentId ? (
          // No completion in a preview: markLessonComplete would need an
          // enrolment, and completing your own course would issue you a real
          // certificate and advance your Connect tier.
          next ? (
            <Button asChild>
              <Link href={`/learn/${courseSlug}/${next.id}`}>
                Next lesson <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <span className="text-sm text-muted">End of course</span>
          )
        ) : done ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-status-green">
            <Check className="h-4 w-4" /> Completed
          </span>
        ) : readOnly ? (
          // Viewing-as is read-only: navigate, but no "Complete" (which would
          // issue a certificate) — and markLessonComplete refuses it anyway.
          next ? (
            <Button asChild>
              <Link href={`/learn/${courseSlug}/${next.id}`}>
                Next lesson <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <span className="text-sm text-muted">End of course</span>
          )
        ) : isQuiz ? (
          <span className="text-sm text-muted">Pass the knowledge check to complete</span>
        ) : (
          <NavForm
            action={markLessonComplete.bind(
              null,
              slug,
              courseSlug,
              course.id,
              enrollmentId,
              lesson.id,
              nextHref,
            )}
          >
            <Button type="submit">{next ? 'Complete & continue' : 'Complete course'}</Button>
          </NavForm>
        )}

        {next && done ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/learn/${courseSlug}/${next.id}`}>
              Next <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <span />
        )}
      </div>

      {/* Topic confidence checkpoint — a core outcome signal at the end of a
          practical capability. Voluntary; never gates progress or status. */}
      {showTopicConfidence && capabilityHere && enrollmentId && (
        <section className="border-keyline mt-10 border-t-[1.75px] pt-4">
          <ConfidenceCheck
            prompt={capabilityHere.prompt}
            helpText="Optional — this helps us improve the training. It doesn’t change your result."
            action={recordTopicConfidence.bind(
              null,
              enrollmentId,
              course.id,
              capabilityHere.key,
              lesson.sectionId,
              lesson.id,
            )}
            followup={{
              prompt: 'What would help you feel more confident?',
              reasons: FOLLOWUP_REASONS,
            }}
            ackText="Thanks — that’s really useful."
          />
        </section>
      )}

      {/* In this topic — BELOW the content (no side rail). One 1.75px structural
            keyline marks the content -> navigation boundary; the list itself uses
            light row dividers. Scoped to the current topic; the whole course is one
            tap away via View all topics. Same layout on desktop and mobile. */}
      {currentSection && (
        <section className="border-keyline mt-10 border-t-[1.75px] pt-4">
          <h2 className="text-h3">In this topic</h2>
          <div className="mt-3">
            <LessonNav
              sections={[currentSection]}
              courseSlug={courseSlug}
              currentLessonId={currentItemOpenId}
              completed={itemCompleted}
              showSectionTitles={false}
            />
          </div>
        </section>
      )}

      {/* Wider navigation + quiet utilities. Share is a tertiary text control —
          never competing with Next / Complete / Back to check. Feedback is not
          shown on the check itself (§10). */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/learn/${courseSlug}`}
          className="text-foreground-2 hover:text-foreground inline-flex items-center gap-1 text-sm font-semibold transition-colors"
        >
          View all topics →
        </Link>
        <div className="flex items-center gap-4">
          {/* Help is reachable from the learning flow too — carrying where the
              learner was, so support (and later BART) has the context. */}
          <Link
            href={`/t/${slug}/help?from=${encodeURIComponent(`/learn/${courseSlug}/${lesson.id}`)}&course=${encodeURIComponent(courseSlug)}&courseTitle=${encodeURIComponent(course.title)}${topicTitle ? `&topic=${encodeURIComponent(topicTitle)}` : ''}&item=${encodeURIComponent(lesson.title)}`}
            className="text-foreground-2 hover:text-foreground inline-flex items-center gap-1 text-sm font-semibold transition-colors"
          >
            Get help
          </Link>
          {!isQuiz && (
            <ShareButton
              path={`/learn/${courseSlug}/${lesson.id}`}
              title="Outdure Installer Training"
              text="This Outdure Installer Training lesson might be useful."
              label="Share lesson"
            />
          )}
        </div>
      </div>

      {/* Private lesson feedback — quiet and voluntary: always the collapsed
          "Give feedback" affordance, never auto-opened. Auto-expanding on every
          longer video turned an optional diagnostic into a repeated prompt across
          the course (survey fatigue); the learner opens it when they have
          something to say. Never on the check or in a preview / view-as. */}
      {enrollmentId && !readOnly && !isQuiz && (
        <div className="mt-8 space-y-6 border-t border-border pt-6">
          <LessonFeedback
            action={recordLessonFeedback.bind(null, enrollmentId, course.id, lesson.id)}
          />
          {/* Innovation capture — a separate, quieter affordance. Kept apart from
              the lesson diagnostic so a real-world idea is never mistaken for a
              rating, and vice versa. */}
          <InstallerIdea
            action={recordInstallerIdea.bind(null, enrollmentId, course.id, lesson.id)}
          />
        </div>
      )}
    </main>
  );
}
