import Link from 'next/link';
import { db, eq, desc, courses } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { setCourseStatus } from './actions';

export default async function CoursesList({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await withTenant();

  const rows = ctx.tenantId
    ? await db
        .select()
        .from(courses)
        .where(eq(courses.tenantId, ctx.tenantId))
        .orderBy(desc(courses.createdAt))
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <Link
          href="/admin/courses/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New course
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-muted">
          No courses yet. Create your first course to get started.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[--radius-card] border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted">/{c.slug}</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{c.status}</td>
                  <td className="px-4 py-3">{c.price ? `${c.currency} ${c.price}` : 'Free'}</td>
                  <td className="px-4 py-3">
                    {c.status !== 'published' ? (
                      <form action={setCourseStatus.bind(null, slug, c.id, 'published')}>
                        <button className="text-brand-600 hover:underline">Publish</button>
                      </form>
                    ) : (
                      <form action={setCourseStatus.bind(null, slug, c.id, 'archived')}>
                        <button className="text-muted hover:underline">Archive</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
