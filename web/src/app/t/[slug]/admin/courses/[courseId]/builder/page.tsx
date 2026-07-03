import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, eq, and, asc, courses, sections, lessons } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import {
  addSection,
  deleteSection,
  moveSection,
  addLesson,
  deleteLesson,
} from './actions';

const TYPE_LABEL: Record<string, string> = {
  text: 'Text',
  video: 'Video',
  pdf: 'PDF',
  quiz: 'Quiz',
};

export default async function CourseBuilder({
  params,
}: {
  params: Promise<{ slug: string; courseId: string }>;
}) {
  const { slug, courseId } = await params;
  const ctx = await withTenant();
  if (!ctx.tenantId) notFound();

  const [course] = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!course) notFound();

  const sectionRows = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, courseId))
    .orderBy(asc(sections.position));

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.position));

  const lessonsBySection = new Map<string, typeof lessonRows>();
  for (const l of lessonRows) {
    const arr = lessonsBySection.get(l.sectionId) ?? [];
    arr.push(l);
    lessonsBySection.set(l.sectionId, arr);
  }

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/courses/${courseId}`} className="text-sm text-muted hover:underline">
        ← Course
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{course.title} · Content</h1>

      <div className="mt-6 space-y-6">
        {sectionRows.map((s, i) => (
          <section key={s.id} className="rounded-[--radius-card] border border-border bg-surface">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-medium">{s.title}</h2>
              <div className="flex items-center gap-2 text-xs text-muted">
                <form action={moveSection.bind(null, slug, courseId, s.id, 'up')}>
                  <button disabled={i === 0} className="disabled:opacity-30 hover:text-foreground">↑</button>
                </form>
                <form action={moveSection.bind(null, slug, courseId, s.id, 'down')}>
                  <button disabled={i === sectionRows.length - 1} className="disabled:opacity-30 hover:text-foreground">↓</button>
                </form>
                <form action={deleteSection.bind(null, slug, courseId, s.id)}>
                  <button className="text-red-600 hover:underline">Delete</button>
                </form>
              </div>
            </header>

            <ul className="divide-y divide-border">
              {(lessonsBySection.get(s.id) ?? []).map((l) => (
                <li key={l.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>
                    <span className="mr-2 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-muted">
                      {TYPE_LABEL[l.type] ?? l.type}
                    </span>
                    {l.title}
                  </span>
                  <form action={deleteLesson.bind(null, slug, courseId, l.id)}>
                    <button className="text-xs text-red-600 hover:underline">Remove</button>
                  </form>
                </li>
              ))}
              {(lessonsBySection.get(s.id) ?? []).length === 0 && (
                <li className="px-4 py-2 text-sm text-muted">No lessons yet.</li>
              )}
            </ul>

            <form
              action={addLesson.bind(null, slug, courseId, s.id)}
              className="flex flex-wrap items-end gap-2 border-t border-border bg-surface-muted px-4 py-3"
            >
              <input
                name="title"
                required
                placeholder="Lesson title"
                className="rounded-md border border-border px-2 py-1 text-sm"
              />
              <select name="type" className="rounded-md border border-border px-2 py-1 text-sm">
                <option value="text">Text</option>
                <option value="video">Video (YouTube)</option>
                <option value="pdf">PDF</option>
                <option value="quiz">Quiz</option>
              </select>
              <input
                name="youtubeUrl"
                placeholder="YouTube URL (video)"
                className="rounded-md border border-border px-2 py-1 text-sm"
              />
              <input
                name="url"
                placeholder="PDF URL (pdf)"
                className="rounded-md border border-border px-2 py-1 text-sm"
              />
              <button className="rounded-md bg-brand-600 px-3 py-1 text-sm font-medium text-white hover:bg-brand-700">
                Add lesson
              </button>
            </form>
          </section>
        ))}
      </div>

      <form
        action={addSection.bind(null, slug, courseId)}
        className="mt-6 flex items-end gap-2"
      >
        <input
          name="title"
          required
          placeholder="New section title"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <button className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted">
          Add section
        </button>
      </form>
    </div>
  );
}
