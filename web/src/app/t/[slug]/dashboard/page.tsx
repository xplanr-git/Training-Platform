import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db, eq, and, desc, enrollments, courses } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { getCourseProgress } from '@/lib/progress';

/** Learner dashboard: the courses this user is enrolled in for this tenant. */
export default async function LearnerDashboard() {
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');
  if (!ctx.tenantId) redirect('/');

  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      courseId: courses.id,
      title: courses.title,
      slug: courses.slug,
      status: enrollments.status,
      completedAt: enrollments.completedAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.tenantId, ctx.tenantId)))
    .orderBy(desc(enrollments.startedAt));

  const withProgress = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      percent: (await getCourseProgress(r.enrollmentId, r.courseId)).percent,
    })),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-2xl font-semibold">Your learning</h1>

      {withProgress.length === 0 ? (
        <p className="mt-6 text-muted">
          You&apos;re not enrolled in any courses yet.{' '}
          <Link href="/" className="text-brand-700 hover:underline">
            Browse courses
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {withProgress.map((r) => (
            <Link
              key={r.courseId}
              href={`/learn/${r.slug}`}
              className="rounded-[--radius-card] border border-border bg-surface p-5 hover:shadow-md"
            >
              <h2 className="font-semibold">{r.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {r.completedAt ? 'Completed' : `${r.percent}% complete`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
