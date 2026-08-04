import type { Metadata } from 'next';
import { EmptyRow } from '@/components/empty-state';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Video, FileText, HelpCircle, BookOpen } from 'lucide-react';
import {
  db,
  and,
  eq,
  asc,
  tenants,
  courses,
  sections,
  lessons,
  enrollments,
} from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { isTenantAdmin } from '@/lib/course-access';
import { formatMinutes } from '@/lib/progress-derive';
import { enrollFree } from './actions';
import { NavForm } from '@/components/nav-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/** Per-course SEO metadata for the landing page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
}): Promise<Metadata> {
  const { slug, courseSlug } = await params;
  const [row] = await db
    .select({ title: courses.title, description: courses.description, tenant: tenants.name })
    .from(courses)
    .innerJoin(tenants, eq(tenants.id, courses.tenantId))
    .where(
      and(
        eq(tenants.slug, slug),
        eq(courses.slug, courseSlug),
        eq(courses.status, 'published'),
      ),
    )
    .limit(1);
  if (!row) return { title: 'Course not found' };
  const description = (row.description || `Learn ${row.title} with ${row.tenant}.`).slice(0, 160);
  return {
    title: `${row.title} · ${row.tenant}`,
    description,
    openGraph: { title: row.title, description, type: 'website' },
  };
}

const LESSON_ICON: Record<string, typeof Video> = {
  video: Video,
  pdf: FileText,
  quiz: HelpCircle,
  text: BookOpen,
};

/**
 * Course landing page. Shows a published course, its curriculum, and an enrol
 * CTA. Internal scope: enrolment is free (no price/Stripe branch).
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

  // Fetched WITHOUT the status filter so an admin of this academy can preview a
  // draft. Everyone else gets a 404 for anything unpublished, checked below —
  // fetching it and then deciding is what allows a preview at all, so the
  // authorisation must not be skipped.
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.tenantId, tenant.id), eq(courses.slug, courseSlug)))
    .limit(1);
  if (!course) notFound();

  const ctx = await getTenantContext();

  // Admin check, enrolment check and the curriculum are mutually independent, so
  // they run together instead of four sequential round trips. The draft-visibility
  // decision below still gates the render — batching changes the timing, not the
  // authorisation.
  const [isAdmin, enrolledRows, sectionRows, lessonRows] = await Promise.all([
    ctx ? isTenantAdmin(ctx.userId, tenant.id) : Promise.resolve(false),
    ctx
      ? db
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.courseId, course.id)))
          .limit(1)
      : Promise.resolve([] as Array<{ id: string }>),
    db.select().from(sections).where(eq(sections.courseId, course.id)).orderBy(asc(sections.position)),
    db
      .select({
        id: lessons.id,
        sectionId: lessons.sectionId,
        type: lessons.type,
        title: lessons.title,
        estimatedMinutes: lessons.estimatedMinutes,
      })
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(asc(lessons.position)),
  ]);
  const enrolled = enrolledRows.length > 0;

  // A draft is visible to this academy's admins only. 404 rather than 403 so an
  // unpublished course's existence isn't confirmed to anyone else.
  const isPreview = course.status !== 'published';
  if (isPreview && !isAdmin) notFound();

  const lessonsBySection = new Map<string, typeof lessonRows>();
  for (const l of lessonRows) {
    const arr = lessonsBySection.get(l.sectionId) ?? [];
    arr.push(l);
    lessonsBySection.set(l.sectionId, arr);
  }
  const totalLessons = lessonRows.length;
  const totalMinutes = lessonRows.reduce((sum, l) => sum + (l.estimatedMinutes ?? 0), 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {isPreview && (
        <div className="mb-6 rounded-[--radius-card] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <b>Draft preview.</b> This course is not published, so only administrators of
          this academy can see this page. Learners get a 404.
        </div>
      )}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> All courses
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {course.level && <Badge variant="secondary">{course.level}</Badge>}
        <span className="text-sm text-muted">
          {totalLessons} lesson{totalLessons === 1 ? '' : 's'}
          {totalMinutes > 0 ? ` · about ${formatMinutes(totalMinutes)}` : ''}
        </span>
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{course.title}</h1>
      <p className="mt-4 whitespace-pre-line text-neutral-700">
        {course.description || 'No description yet.'}
      </p>

      {sectionRows.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">What&apos;s inside</h2>
          <Accordion
            type="multiple"
            className="rounded-[--radius-card] border border-border bg-surface px-4"
          >
            {sectionRows.map((s) => {
              const items = lessonsBySection.get(s.id) ?? [];
              return (
                <AccordionItem key={s.id} value={s.id}>
                  <AccordionTrigger className="text-sm font-medium">
                    {s.title || 'Section'}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pb-2">
                      {items.length === 0 && (
                        <li>
                          <EmptyRow className="px-0 py-2" title="No lessons in this section yet" />
                        </li>
                      )}
                      {items.map((l) => {
                        const Icon = LESSON_ICON[l.type] ?? BookOpen;
                        return (
                          <li
                            key={l.id}
                            className="flex items-center gap-2.5 text-sm text-neutral-700"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-muted" />
                            <span>{l.title || 'Untitled lesson'}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {enrolled ? (
          <Button asChild size="lg">
            <Link href={`/learn/${courseSlug}`}>Continue learning</Link>
          </Button>
        ) : !ctx ? (
          <Button asChild size="lg">
            <Link href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`}>
              Sign in to enroll
            </Link>
          </Button>
        ) : isAdmin ? (
          <>
            {/* Admins preview rather than enrol: enrolling in your own course
                would count you as a learner and put your own watch time in the
                academy's statistics. A draft cannot be enrolled in at all —
                enrollFree requires a published course. */}
            <Button asChild size="lg">
              <Link href={`/learn/${courseSlug}`}>Preview lessons</Link>
            </Button>
            {!isPreview && (
              <NavForm action={enrollFree.bind(null, slug, course.id, courseSlug)}>
                <Button type="submit" size="lg" variant="outline">
                  Enroll for real
                </Button>
              </NavForm>
            )}
          </>
        ) : (
          <NavForm action={enrollFree.bind(null, slug, course.id, courseSlug)}>
            <Button type="submit" size="lg">
              Enroll for free
            </Button>
          </NavForm>
        )}
      </div>
    </main>
  );
}
