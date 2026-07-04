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

const TYPE_LABEL: Record<string, string> = {
  text: 'Text',
  video: 'Video',
  pdf: 'PDF',
  quiz: 'Quiz',
};

/**
 * Learn shell — enrollment-gated course outline. The lesson player and
 * progress_events writes land in D3.
 */
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

  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.courseId, course.id)))
    .limit(1);
  if (!enrollment) redirect(`/courses/${courseSlug}`);

  const sectionRows = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, course.id))
    .orderBy(asc(sections.position));
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position));

  const bySection = new Map<string, typeof lessonRows>();
  for (const l of lessonRows) {
    const arr = bySection.get(l.sectionId) ?? [];
    arr.push(l);
    bySection.set(l.sectionId, arr);
  }

  const progress = await getCourseProgress(enrollment.id, course.id);

  // Ordered flat lesson list (section, then lesson position) → first incomplete
  // lesson to resume at (falls back to the first lesson, or review if done).
  const sectionOrder = new Map(sectionRows.map((s, i) => [s.id, i]));
  const orderedLessons = [...lessonRows].sort((a, b) => {
    const sa = sectionOrder.get(a.sectionId) ?? 0;
    const sb = sectionOrder.get(b.sectionId) ?? 0;
    return sa - sb || a.position - b.position;
  });
  const resumeLesson =
    orderedLessons.find((l) => !progress.completed.has(l.id)) ?? orderedLessons[0];

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/dashboard" className="text-sm text-muted hover:underline">
        ← Your learning
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <span className="text-sm text-muted">{progress.percent}% complete</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full bg-brand-600" style={{ width: `${progress.percent}%` }} />
      </div>

      {resumeLesson && (
        <Link
          href={`/learn/${courseSlug}/${resumeLesson.id}`}
          className="mt-4 inline-block rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {progress.done === 0
            ? 'Start course'
            : progress.isComplete
              ? 'Review course'
              : 'Continue where you left off'}
        </Link>
      )}

      <div className="mt-6 space-y-5">
        {sectionRows.map((s) => (
          <section key={s.id}>
            <h2 className="font-medium">{s.title}</h2>
            <ul className="mt-2 divide-y divide-border rounded-[--radius-card] border border-border">
              {(bySection.get(s.id) ?? []).map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/learn/${courseSlug}/${l.id}`}
                    className="flex items-center justify-between px-4 py-2 text-sm hover:bg-surface-muted"
                  >
                    <span>
                      <span className="mr-2 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-muted">
                        {TYPE_LABEL[l.type] ?? l.type}
                      </span>
                      {l.title}
                    </span>
                    {progress.completed.has(l.id) && (
                      <span className="text-green-600" aria-label="completed">✓</span>
                    )}
                  </Link>
                </li>
              ))}
              {(bySection.get(s.id) ?? []).length === 0 && (
                <li className="px-4 py-2 text-sm text-muted">No lessons yet.</li>
              )}
            </ul>
          </section>
        ))}
        {sectionRows.length === 0 && (
          <p className="text-muted">This course has no content yet.</p>
        )}
      </div>
    </main>
  );
}
