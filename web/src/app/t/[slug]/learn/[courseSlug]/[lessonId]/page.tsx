import Link from 'next/link';
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
import { safeHttpUrl } from '@/lib/validation';
import { getCourseProgress } from '@/lib/progress';
import { markLessonComplete, submitQuizAttempt } from '../actions';
import { NavForm } from '@/components/nav-form';
import { QuizForm } from '@/components/quiz-form';
import { BunnyVideoPlayer } from '@/components/bunny-video-player';
import { hostedVideoFromContent } from '@/lib/video';
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
  const { slug, courseSlug, lessonId } = await params;
  const { score, passed } = await searchParams;
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) redirect(`/login?next=${encodeURIComponent(`/learn/${courseSlug}`)}`);

  const [course] = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(and(eq(courses.tenantId, ctx.tenantId), eq(courses.slug, courseSlug)))
    .limit(1);
  if (!course) notFound();

  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.courseId, course.id)))
    .limit(1);
  if (!enrollment) redirect(`/courses/${courseSlug}`);

  // Ordered lesson list (section position, then lesson position) for nav + outline.
  const sectionRows = await db
    .select({ id: sections.id, position: sections.position, title: sections.title })
    .from(sections)
    .where(eq(sections.courseId, course.id))
    .orderBy(asc(sections.position));
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position));

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

  const progress = await getCourseProgress(enrollment.id, course.id);
  const done = progress.completed.has(lesson.id);
  const content = (lesson.content ?? {}) as Record<string, string>;
  const pdfUrl = safeHttpUrl(content.url);
  const nextHref = next ? `/learn/${courseSlug}/${next.id}` : `/learn/${courseSlug}`;

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

  // Quiz lessons load their questions; completion happens via a passing attempt.
  let quiz: { id: string } | null = null;
  let questions: Awaited<ReturnType<typeof loadQuestions>> = [];
  if (lesson.type === 'quiz') {
    const [q] = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.lessonId, lesson.id))
      .limit(1);
    quiz = q ?? null;
    if (quiz) questions = await loadQuestions(quiz.id);
  }
  const isQuiz = lesson.type === 'quiz';
  const HeaderIcon = LESSON_ICON[lesson.type] ?? BookOpen;

  // Hosted video: resume at the furthest position this learner reached, read
  // back from the append-only watch events (so it follows them across devices).
  const hosted = hostedVideoFromContent(content);
  let resumeAtSec = 0;
  if (hosted) {
    const [row] = await db
      .select({
        maxPos: sql<string | null>`max((${progressEvents.payload} ->> 'positionSec')::numeric)`,
      })
      .from(progressEvents)
      .where(
        and(
          eq(progressEvents.enrollmentId, enrollment.id),
          eq(progressEvents.lessonId, lesson.id),
          eq(progressEvents.eventType, 'video_progress'),
        ),
      );
    const pos = row?.maxPos == null ? 0 : Number(row.maxPos);
    if (Number.isFinite(pos) && pos > 0) resumeAtSec = Math.floor(pos);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-8 lg:px-6">
      {/* Course outline (desktop) */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <Link
          href={`/learn/${courseSlug}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {course.title}
        </Link>
        <div className="mb-5">
          <div className="mb-1.5 text-xs text-muted">{progress.percent}% complete</div>
          <Progress value={progress.percent} className="h-2" />
        </div>
        <nav className="space-y-4">
          {outline.map((g) => (
            <div key={g.id}>
              <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {g.title || 'Section'}
              </p>
              <ul className="space-y-0.5">
                {g.items.map((l) => {
                  const Icon = LESSON_ICON[l.type] ?? BookOpen;
                  const isCurrent = l.id === lesson.id;
                  const lDone = progress.completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${courseSlug}/${l.id}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                          isCurrent
                            ? 'bg-brand-50 font-medium text-brand-700'
                            : 'text-foreground hover:bg-surface-muted',
                        )}
                      >
                        {lDone ? (
                          <Check className="h-4 w-4 shrink-0 text-brand-600" />
                        ) : (
                          <Icon className="h-4 w-4 shrink-0 text-muted" />
                        )}
                        <span className="truncate">{l.title || 'Untitled'}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Player */}
      <main className="min-w-0 flex-1">
        {/* Mobile back + progress */}
        <div className="mb-5 lg:hidden">
          <Link
            href={`/learn/${courseSlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> {course.title}
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <Progress value={progress.percent} className="h-2 flex-1" />
            <span className="shrink-0 text-xs text-muted">{progress.percent}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted">
            <HeaderIcon className="h-4 w-4" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">{lesson.title}</h1>
        </div>

        <div className="mt-6">
          {lesson.type === 'text' && (
            <div className="whitespace-pre-line leading-relaxed text-neutral-700">
              {content.body || 'No content.'}
            </div>
          )}
          {lesson.type === 'video' &&
            (hosted?.provider === 'bunny' && env.bunnyLibraryId() ? (
              <BunnyVideoPlayer
                libraryId={env.bunnyLibraryId()!}
                videoId={hosted.videoId}
                enrollmentId={enrollment.id}
                lessonId={lesson.id}
                resumeAtSec={resumeAtSec}
              />
            ) : youtubeEmbed(content.youtubeUrl ?? '') ? (
              <div className="aspect-video w-full overflow-hidden rounded-[--radius-card] bg-black">
                <iframe
                  src={youtubeEmbed(content.youtubeUrl ?? '')!}
                  className="h-full w-full"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            ) : (
              <p className="text-muted">Video unavailable.</p>
            ))}
          {lesson.type === 'pdf' &&
            (pdfUrl ? (
              <div>
                <div className="h-[70vh] w-full overflow-hidden rounded-[--radius-card] border border-border">
                  <iframe src={pdfUrl} className="h-full w-full" title={lesson.title} />
                </div>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-brand-700 hover:underline"
                >
                  Open PDF in new tab
                </a>
              </div>
            ) : (
              <p className="text-muted">No PDF attached.</p>
            ))}
          {isQuiz && (
            <div>
              {score !== undefined && (
                <p
                  className={cn(
                    'mb-5 rounded-[--radius-card] border px-4 py-3 text-sm',
                    passed === '1'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800',
                  )}
                >
                  You scored {score}%. {passed === '1' ? 'Passed!' : 'Not passed — try again.'}
                </p>
              )}
              {done ? (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  <Check className="h-4 w-4" /> You have passed this quiz.
                </p>
              ) : questions.length === 0 ? (
                <p className="text-muted">This quiz has no questions yet.</p>
              ) : (
                <QuizForm
                  action={submitQuizAttempt.bind(
                    null,
                    slug,
                    courseSlug,
                    course.id,
                    enrollment.id,
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

          {done ? (
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
                enrollment.id,
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
