import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { Check, Video, FileText, HelpCircle, BookOpen, ArrowLeft } from 'lucide-react';
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
import { getCourseProgress, formatMinutes } from '@/lib/progress';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LESSON_ICON: Record<string, typeof Video> = {
  video: Video,
  pdf: FileText,
  quiz: HelpCircle,
  text: BookOpen,
};

/** Enrollment-gated course outline with resume + per-lesson progress. */
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

  // Ordered flat lesson list → first incomplete lesson to resume at.
  const sectionOrder = new Map(sectionRows.map((s, i) => [s.id, i]));
  const orderedLessons = [...lessonRows].sort((a, b) => {
    const sa = sectionOrder.get(a.sectionId) ?? 0;
    const sb = sectionOrder.get(b.sectionId) ?? 0;
    return sa - sb || a.position - b.position;
  });
  const resumeLesson =
    orderedLessons.find((l) => !progress.completed.has(l.id)) ?? orderedLessons[0];

  const lessonsLeft = progress.total - progress.done;
  const resumeLabel =
    progress.done === 0
      ? 'Start course'
      : progress.isComplete
        ? 'Review course'
        : 'Continue where you left off';

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Your learning
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{course.title}</h1>

      <Card className="mt-4">
        <CardContent className="py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{progress.percent}% complete</span>
            <span className="text-muted tabular-nums">
              {progress.done} of {progress.total} lessons
              {!progress.isComplete && lessonsLeft > 0 ? ` · ${lessonsLeft} left` : ''}
              {!progress.isComplete && progress.minutesLeft != null
                ? ` · about ${formatMinutes(progress.minutesLeft)} left`
                : ''}
            </span>
          </div>
          <Progress value={progress.percent} className="mt-2 h-2" />
          {resumeLesson && (
            <Button asChild size="lg" className="mt-4">
              <Link href={`/learn/${courseSlug}/${resumeLesson.id}`}>{resumeLabel}</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 space-y-5">
        {sectionRows.map((s) => (
          <section key={s.id}>
            <h2 className="mb-2 text-sm font-semibold">{s.title || 'Section'}</h2>
            <Card className="overflow-hidden p-0">
              <ul className="divide-y divide-border">
                {(bySection.get(s.id) ?? []).map((l) => {
                  const Icon = LESSON_ICON[l.type] ?? BookOpen;
                  const lDone = progress.completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${courseSlug}/${l.id}`}
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-muted"
                      >
                        {lDone ? (
                          <Check className="h-4 w-4 shrink-0 text-brand-600" />
                        ) : (
                          <Icon className="h-4 w-4 shrink-0 text-muted" />
                        )}
                        <span className="flex-1 truncate">{l.title || 'Untitled lesson'}</span>
                        {l.estimatedMinutes != null && (
                          <span className="shrink-0 text-xs text-muted tabular-nums">
                            {l.estimatedMinutes} min
                          </span>
                        )}
                        {lDone && <span className="text-xs text-brand-600">Done</span>}
                      </Link>
                    </li>
                  );
                })}
                {(bySection.get(s.id) ?? []).length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted">No lessons yet.</li>
                )}
              </ul>
            </Card>
          </section>
        ))}
        {sectionRows.length === 0 && (
          <p className="text-muted">This course has no content yet.</p>
        )}
      </div>
    </main>
  );
}
