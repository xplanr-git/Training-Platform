import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award } from 'lucide-react';
import { db, eq, and, desc, enrollments, courses, certificates } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { getCourseProgress } from '@/lib/progress';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
      certCode: certificates.verificationCode,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .leftJoin(certificates, eq(certificates.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.tenantId, ctx.tenantId)))
    .orderBy(desc(enrollments.startedAt));

  const withProgress = await Promise.all(
    rows.map(async (r) => {
      const p = await getCourseProgress(r.enrollmentId, r.courseId);
      return { ...r, percent: p.percent, done: p.done, total: p.total, isComplete: p.isComplete };
    }),
  );

  const enrolled = withProgress.length;
  const completed = withProgress.filter((r) => r.completedAt || r.isComplete).length;
  const inProgress = withProgress.filter(
    (r) => !(r.completedAt || r.isComplete) && r.done > 0,
  ).length;
  const certs = withProgress.filter((r) => r.certCode).length;

  const stats = [
    { label: 'Enrolled', value: enrolled },
    { label: 'In progress', value: inProgress },
    { label: 'Completed', value: completed },
    { label: 'Certificates', value: certs },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Your learning</h1>
      <p className="mt-1 text-muted">Pick up where you left off.</p>

      {enrolled > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4">
                <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {enrolled === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-muted">
            You&apos;re not enrolled in any courses yet.{' '}
            <Link href="/" className="font-medium text-brand-700 hover:underline">
              Browse courses
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {withProgress.map((r) => {
            const isDone = !!(r.completedAt || r.isComplete);
            const cta = isDone ? 'Review' : r.done > 0 ? 'Continue' : 'Start course';
            return (
              <Card key={r.courseId}>
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">
                      <Link href={`/learn/${r.slug}`} className="hover:underline">
                        {r.title}
                      </Link>
                    </h2>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={r.percent} className="h-2 max-w-xs flex-1" />
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        {r.done}/{r.total} lessons
                      </span>
                    </div>
                    {r.certCode && (
                      <a
                        href={`/verify/${r.certCode}`}
                        className="mt-2 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
                      >
                        <Award className="h-4 w-4" /> View certificate
                      </a>
                    )}
                  </div>
                  <Button asChild variant={isDone ? 'outline' : 'default'}>
                    <Link href={`/learn/${r.slug}`}>{cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
