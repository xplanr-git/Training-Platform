import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, eq, and, courses } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { updateCourse, deleteCourse } from '../actions';
import { NavForm } from '@/components/nav-form';

export default async function EditCourse({
  params,
}: {
  params: Promise<{ slug: string; courseId: string }>;
}) {
  const { slug, courseId } = await params;
  const ctx = await withTenant();
  if (!ctx.tenantId) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!course) notFound();

  const action = updateCourse.bind(null, slug, courseId);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/courses" className="text-sm text-muted hover:underline">
        ← Courses
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <Link
          href={`/admin/courses/${courseId}/builder`}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
        >
          Manage content
        </Link>
      </div>

      <form action={action} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Title</span>
          <input
            name="title"
            required
            defaultValue={course.title}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={course.description}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Level</span>
            <select
              name="level"
              defaultValue={course.level}
              className="rounded-md border border-border px-3 py-2"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Status</span>
            <select
              name="status"
              defaultValue={course.status}
              className="rounded-md border border-border px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Price</span>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={course.price ?? ''}
              className="rounded-md border border-border px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Save changes
        </button>
      </form>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-medium text-red-700">Danger zone</h2>
        <p className="mt-1 text-sm text-muted">
          Permanently delete this course and all its sections, lessons, quizzes,
          and enrollments. This cannot be undone.
        </p>
        <NavForm
          action={deleteCourse.bind(null, slug, courseId)}
          className="mt-3"
          confirm="Delete this course and all its content? This cannot be undone."
        >
          <button className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
            Delete course
          </button>
        </NavForm>
      </div>
    </div>
  );
}
