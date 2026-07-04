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
} from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { getCourseProgress } from '@/lib/progress';
import { markLessonComplete } from '../actions';

function youtubeEmbed(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default async function LessonPlayer({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string; lessonId: string }>;
}) {
  const { slug, courseSlug, lessonId } = await params;
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
  const nextHref = next ? `/learn/${courseSlug}/${next.id}` : `/learn/${courseSlug}`;

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
          (content.url ? (
            <a href={content.url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
              Open PDF
            </a>
          ) : (
            <p className="text-muted">No PDF attached.</p>
          ))}
        {lesson.type === 'quiz' && (
          <p className="text-muted">Quiz playback lands in D4.</p>
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
        ) : (
          <form
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
          </form>
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
