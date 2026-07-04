import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, and, eq, tenants, courses, enrollments } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { enrollFree, startCoursePurchase } from './actions';

/**
 * Public course landing page. Shows a published course and an enroll CTA.
 * Enrollment (free) and Stripe checkout are wired in Phases D1 / E2.
 */
export default async function CourseLanding({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
}) {
  const { slug, courseSlug } = await params;

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  if (!tenant) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.tenantId, tenant.id),
        eq(courses.slug, courseSlug),
        eq(courses.status, 'published'),
      ),
    )
    .limit(1);
  if (!course) notFound();

  const ctx = await getTenantContext();
  let enrolled = false;
  if (ctx) {
    const [row] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.courseId, course.id)))
      .limit(1);
    enrolled = !!row;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/" className="text-sm text-muted hover:underline">
        ← All courses
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {course.level} · {course.price ? `${course.currency} ${course.price}` : 'Free'}
      </p>
      <p className="mt-6 whitespace-pre-line text-neutral-700">
        {course.description || 'No description yet.'}
      </p>

      <div className="mt-8">
        {enrolled ? (
          <Link
            href={`/learn/${courseSlug}`}
            className="inline-block rounded-md bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Continue learning
          </Link>
        ) : !ctx ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`}
            className="inline-block rounded-md bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Sign in to enroll
          </Link>
        ) : course.price ? (
          <form action={startCoursePurchase.bind(null, slug, course.id, courseSlug)}>
            <button className="rounded-md bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700">
              Buy — {course.currency} {course.price}
            </button>
          </form>
        ) : (
          <form action={enrollFree.bind(null, slug, course.id, courseSlug)}>
            <button className="rounded-md bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700">
              Enroll for free
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
