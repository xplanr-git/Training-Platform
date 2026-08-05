import Link from 'next/link';
import { LessonNav } from '@/components/lesson-nav';
import { BackLink } from '@/components/back-link';
import { VideoUnavailable } from '@/components/video-unavailable';
import { EmptyState } from '@/components/empty-state';
import { redirect, notFound } from 'next/navigation';
import {
  Video,
  FileText,
  HelpCircle,
  BookOpen,
  Check,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  db,
  eq,
  and,
  asc,
  sql,
  courses,
  sections,
  lessons,
  enrollments,
  progressEvents,
  quizzes,
  quizQuestions,
} from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { resolveCourseView, previewProgress } from '@/lib/course-access';
import { safeHttpUrl } from '@/lib/validation';
import { getCourseProgress } from '@/lib/progress';
import { markLessonComplete, submitQuizAttempt } from '../actions';
import { NavForm } from '@/components/nav-form';
import { QuizForm } from '@/components/quiz-form';
import { BunnyVideoPlayer } from '@/components/bunny-video-player';
import { hostedVideoFromContent } from '@/lib/video';
import { videoUnavailableReason, isVideoFault } from '@/lib/video-availability';
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

/**
 * LEGACY playback only. Video lessons are authored through Bunny; the builder
 * has no YouTube field. This exists so already-published YouTube lessons keep
 * playing until they are migrated. Such lessons emit NO progress events, so they
 * have no resume position and never appear in Insights' watch-time table.
 * Remove this once no lesson content holds a youtubeUrl.
 */
function youtubeEmbed(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

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
  searchParams: Promise<{ score?: string; passed?: string }>;
}) {
  // Independent promises — awaiting them in sequence serialises two ticks for
  // no reason. Same pattern applies to the query batches below.
  const [{ slug, courseSlug, lessonId }, { score, passed }] = await Promise.all([
    params,
    searchParams,
  ]);
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
  const [view, sectionRows, lessonRows] = await Promise.all([
    resolveCourseView(ctx.userId, ctx.tenantId, course.id),
    db
      .select({ id: sections.id, position: sections.position, title: sections.title })
      .from(sections)
      .where(eq(sections.courseId, course.id))
      .orderBy(asc(sections.position)),
    db.select().from(lessons).where(eq(lessons.courseId, course.id)).orderBy(asc(lessons.position)),
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

  const content = (lesson.content ?? {}) as Record<string, string>;
  const pdfUrl = safeHttpUrl(content.url);
  const nextHref = next ? `/learn/${courseSlug}/${next.id}` : `/learn/${courseSlug}`;
  const isQuiz = lesson.type === 'quiz';
  const HeaderIcon = LESSON_ICON[lesson.type] ?? BookOpen;
  const hosted = hostedVideoFromContent(content);

  // Why a video lesson has nothing to play. Computed for every video lesson so the
  // fallback can say something specific, and logged when it is a deployment or data
  // fault rather than the author simply not having attached a video yet — that
  // distinction is the whole point, and previously nothing was logged at all, so a
  // missing BUNNY_LIBRARY_ID was invisible in production.
  //
  // Computed for EVERY video lesson, not just unplayable ones, so the fallback
  // branch below always has something to render. Gating it on a second copy of the
  // playability conditions would mean the JSX and this could drift, and the failure
  // mode of that drift is rendering nothing at all — worse than the bare line this
  // replaces. Logging is what gets gated instead.
  const unavailable =
    lesson.type === 'video'
      ? videoUnavailableReason(content, { hostConfigured: !!env.bunnyLibraryId() })
      : null;
  const playable =
    (hosted?.provider === 'bunny' && env.bunnyLibraryId()) ||
    youtubeEmbed(content.youtubeUrl ?? '');
  if (unavailable && !playable && isVideoFault(unavailable)) {
    console.error('[video unavailable]', {
      reason: unavailable.reason,
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

  // Questions need the quiz id, so they are the one genuinely serial follow-up.
  const quiz = quizRows[0] ?? null;
  const questions = quiz ? await loadQuestions(quiz.id) : [];

  // Resume at the furthest point this learner reached, from the append-only watch
  // events — so it follows them across devices.
  let resumeAtSec = 0;
  const maxPos = resumeRows[0]?.maxPos;
  if (maxPos != null) {
    const pos = Number(maxPos);
    if (Number.isFinite(pos) && pos > 0) resumeAtSec = Math.floor(pos);
  }

  // Outline grouped by section (in order) for the sidebar.
  const bySection = new Map<string, typeof ordered>();
  for (const l of ordered) {
    const arr = bySection.get(l.sectionId) ?? [];
    arr.push(l);
    bySection.set(l.sectionId, arr);
  }
  const outline = sectionRows.map((s) => ({
    id: s.id,
    title: s.title,
    items: bySection.get(s.id) ?? [],
  }));


  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-8 lg:px-6">
      {/* Course outline (desktop) */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <BackLink href={`/learn/${courseSlug}`} className="mb-4 max-w-full">
          {course.title}
        </BackLink>
        <div className="mb-5">
          <div className="mb-1.5 text-xs text-muted">{progress.percent}% complete</div>
          <Progress value={progress.percent} className="h-2" />
        </div>
        <LessonNav
          sections={outline}
          courseSlug={courseSlug}
          currentLessonId={lesson.id}
          completed={progress.completed}
        />
      </aside>

      {/* Player */}
      <main className="min-w-0 flex-1">
        {/* Mobile back + progress */}
        <div className="mb-5 lg:hidden">
          <BackLink href={`/learn/${courseSlug}`} className="max-w-full">
            {course.title}
          </BackLink>
          <div className="mt-2 flex items-center gap-3">
            <Progress value={progress.percent} className="h-2 flex-1" />
            <span className="shrink-0 text-xs text-muted">{progress.percent}%</span>
          </div>
          {/*
            On a phone the sidebar is hidden, and until now nothing replaced it — no
            lesson list, no sense of where you are in the course. Collapsed by
            default because the video is what the learner came for; <details> needs
            no JavaScript, which suits a server component and a poor site signal.
          */}
          <details className="mt-3 rounded-(--radius-card) border border-border bg-surface">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-3 text-sm font-medium">
              All lessons
              <span className="text-xs font-normal text-muted tabular-nums">
                {progress.done} of {progress.total}
              </span>
            </summary>
            <div className="border-t border-border px-2 pb-2 pt-2">
              <LessonNav
                sections={outline}
                courseSlug={courseSlug}
                currentLessonId={lesson.id}
                completed={progress.completed}
              />
            </div>
          </details>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted">
            <HeaderIcon className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">{lesson.title}</h1>
          {isPreview && (
            <p className="mt-2 rounded-(--radius-card) border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Preview — nothing on this page is recorded.
            </p>
          )}
        </div>

        <div className="mt-6">
          {lesson.type === 'text' && (
            <div className="whitespace-pre-line leading-relaxed text-neutral-700">
              {content.body || 'Nothing has been written into this lesson yet. Carry on to the next one — it will not hold up your certificate.'}
            </div>
          )}
          {lesson.type === 'video' &&
            (hosted?.provider === 'bunny' && env.bunnyLibraryId() ? (
              enrollmentId ? (
                <BunnyVideoPlayer
                  libraryId={env.bunnyLibraryId()!}
                  videoId={hosted.videoId}
                  enrollmentId={enrollmentId}
                  lessonId={lesson.id}
                  resumeAtSec={resumeAtSec}
                />
              ) : (
                /* Preview: the bare embed, deliberately NOT the tracking player.
                   recordVideoProgress needs an enrolment, and a preview must not
                   write watch time into the academy's analytics. */
                <div className="aspect-video w-full overflow-hidden rounded-(--radius-card) bg-black">
                  <iframe
                    src={`https://iframe.mediadelivery.net/embed/${env.bunnyLibraryId()}/${hosted.videoId}`}
                    className="h-full w-full"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    title={lesson.title}
                  />
                </div>
              )
            ) : youtubeEmbed(content.youtubeUrl ?? '') ? (
              <div className="aspect-video w-full overflow-hidden rounded-(--radius-card) bg-black">
                <iframe
                  src={youtubeEmbed(content.youtubeUrl ?? '')!}
                  className="h-full w-full"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            ) : unavailable ? (
              <VideoUnavailable
                unavailable={unavailable}
                isPreview={isPreview}
                builderHref={`/admin/courses/${course.id}/builder`}
              />
            ) : null)}
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
                  className="mt-3 inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm text-brand-700 transition-colors hover:bg-surface-muted"
                >
                  Open PDF in new tab
                </a>
              </div>
            ) : (
              <p className="text-muted">There is no PDF on this lesson yet. Carry on to the next one — it will not hold up your certificate.</p>
            ))}
          {isQuiz && (
            <div>
              {score !== undefined && (
                <p
                  className={cn(
                    'mb-5 rounded-(--radius-card) border px-4 py-3 text-sm',
                    passed === '1'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800',
                  )}
                >
                  You scored {score}%. {passed === '1' ? 'Passed.' : 'Not passed — try again.'}
                </p>
              )}
              {done ? (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  <Check className="h-4 w-4" /> You have passed this quiz.
                </p>
              ) : questions.length === 0 ? (
                <EmptyState title="This quiz has no questions yet">
                  Nothing to answer here for now — it has not been written yet. Carry on to the
                  next lesson; this one will not hold up your certificate.
                </EmptyState>
              ) : !enrollmentId ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted">
                    These are the questions as a learner sees them. Answers
                    can&apos;t be submitted in a preview — an attempt needs an enrolment to
                    record against.
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
              ) : (
                <QuizForm
                  action={submitQuizAttempt.bind(
                    null,
                    slug,
                    courseSlug,
                    course.id,
                    enrollmentId,
                    lesson.id,
                    quiz!.id,
                  )}
                  questions={questions.map((q) => ({
                    id: q.id,
                    prompt: q.prompt,
                    type: q.type,
                    options: q.options as string[],
                  }))}
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
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
              <Check className="h-4 w-4" /> Completed
            </span>
          ) : isQuiz ? (
            <span className="text-sm text-muted">Pass the quiz to complete</span>
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
      </main>
    </div>
  );
}
