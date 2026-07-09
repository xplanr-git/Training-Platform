import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import {
  db,
  eq,
  and,
  asc,
  courses,
  sections,
  lessons,
  enrollments,
  quizzes,
  quizQuestions,
} from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { safeHttpUrl } from '@/lib/validation';
import { getCourseProgress } from '@/lib/progress';
import { markLessonComplete, submitQuizAttempt } from '../actions';
import { NavForm } from '@/components/nav-form';

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

  // Ordered lesson list (section position, then lesson position) for nav.
  const sectionRows = await db
    .select({ id: sections.id, position: sections.position })
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
  // Only ever render an absolute http(s) URL as an iframe/link — blocks
  // javascript:/data: URLs stored in a PDF lesson's free-text URL field.
  const pdfUrl = safeHttpUrl(content.url);
  const nextHref = next ? `/learn/${courseSlug}/${next.id}` : `/learn/${courseSlug}`;

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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between text-sm">
        <Link href={`/learn/${courseSlug}`} className="text-muted hover:underline">
          ← {course.title}
        </Link>
        <span className="text-muted">{progress.percent}% complete</span>
      </div>

      <h1 className="mt-3 text-2xl font-semibold">{lesson.title}</h1>

      <div className="mt-6">
        {lesson.type === 'text' && (
          <div className="whitespace-pre-line text-neutral-700">
            {content.body || 'No content.'}
          </div>
        )}
        {lesson.type === 'video' &&
          (youtubeEmbed(content.youtubeUrl ?? '') ? (
            <div className="aspect-video w-full overflow-hidden rounded-[--radius-card]">
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
                className={`mb-4 rounded-md px-3 py-2 text-sm ${
                  passed === '1' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                You scored {score}%. {passed === '1' ? 'Passed!' : 'Not passed — try again.'}
              </p>
            )}
            {done ? (
              <p className="text-sm font-medium text-green-600">
                ✓ You have passed this quiz.
              </p>
            ) : questions.length === 0 ? (
              <p className="text-muted">This quiz has no questions yet.</p>
            ) : (
              <NavForm
                action={submitQuizAttempt.bind(
                  null,
                  slug,
                  courseSlug,
                  course.id,
                  enrollment.id,
                  lesson.id,
                  quiz!.id,
                )}
                className="space-y-5"
              >
                {questions.map((q, qi) => {
                  const opts = q.options as string[];
                  const multi = q.type === 'multi_select';
                  return (
                    <fieldset key={q.id} className="rounded-[--radius-card] border border-border p-4">
                      <legend className="px-1 text-sm font-medium">
                        {qi + 1}. {q.prompt}
                      </legend>
                      <div className="mt-2 space-y-1">
                        {opts.map((o, oi) => (
                          <label key={oi} className="flex items-center gap-2 text-sm">
                            <input
                              type={multi ? 'checkbox' : 'radio'}
                              name={`q_${q.id}`}
                              value={oi}
                            />
                            {o}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
                <button className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Submit quiz
                </button>
              </NavForm>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        {prev ? (
          <Link href={`/learn/${courseSlug}/${prev.id}`} className="text-sm text-muted hover:underline">
            ← Previous
          </Link>
        ) : (
          <span />
        )}

        {done ? (
          <span className="text-sm font-medium text-green-600">✓ Completed</span>
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
            <button className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {next ? 'Complete & continue' : 'Complete course'}
            </button>
          </NavForm>
        )}

        {next && done ? (
          <Link href={`/learn/${courseSlug}/${next.id}`} className="text-sm text-brand-700 hover:underline">
            Next →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}
