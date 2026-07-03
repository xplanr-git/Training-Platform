import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, and, eq, tenants, courses } from '@training-platform/db';

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

      <Link
        href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`}
        className="mt-8 inline-block rounded-md bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
      >
        {course.price ? 'Enroll now' : 'Enroll for free'}
      </Link>
    </main>
  );
}
