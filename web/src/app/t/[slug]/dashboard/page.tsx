import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { redirect } from 'next/navigation';
import { Award } from 'lucide-react';
import { db, eq, and, desc, enrollments, courses, certificates } from '@training-platform/db';
import { getTenantContext, currentAdminRole } from '@/lib/tenant';
import { getCourseProgress, formatMinutes } from '@/lib/progress';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignOutButton } from '@/components/sign-out-button';

/** Learner dashboard: the courses this user is enrolled in for this tenant. */
export default async function LearnerDashboard() {
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');
  if (!ctx.tenantId) redirect('/');
  // From memberships, not the role claim — otherwise a demoted admin keeps being
  // offered an "Admin" link that then bounces them straight back here.
  const isAdmin = !!(await currentAdminRole(ctx.userId, ctx.tenantId));

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
      return {
        ...r,
        percent: p.percent,
        done: p.done,
        total: p.total,
        isComplete: p.isComplete,
        minutesLeft: p.minutesLeft,
        minutesLeftIsPartial: p.minutesLeftIsPartial,
      };
    }),
  );

  // "Done" is derived from the append-only log, not enrollment.completedAt: if
  // an author adds a lesson to a course a learner already finished, there is
  // genuinely new work to do. The certificate they already earned still stands.
  const enrolled = withProgress.length;
  const completed = withProgress.filter((r) => r.isComplete).length;
  const inProgress = withProgress.filter((r) => !r.isComplete && r.done > 0).length;
  const certs = withProgress.filter((r) => r.certCode).length;

  const stats = [
    { label: 'Enrolled', value: enrolled },
    { label: 'In progress', value: inProgress },
    { label: 'Completed', value: completed },
    { label: 'Certificates', value: certs },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your learning</h1>
          <p className="mt-1 text-muted">Pick up where you left off.</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {isAdmin && (
            <Button asChild variant="outline">
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          <SignOutButton />
        </div>
      </div>

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
        <EmptyState
          className="mt-6"
          icon={<GraduationCap />}
          title="You have not started a course yet"
          action={{ href: '/', label: 'Browse courses' }}
        >
          Pick a course to enrol. Your place is saved as you go, so you can stop after a lesson and
          pick up where you left off — on a phone on site, or at a desk later.
        </EmptyState>
      ) : (
        <div className="mt-6 space-y-3">
          {withProgress.map((r) => {
            const isDone = r.isComplete;
            const cta = isDone ? 'Review' : r.done > 0 ? 'Continue' : 'Start course';
            return (
              <Card key={r.courseId}>
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold">
                      <Link href={`/learn/${r.slug}`} className="hover:underline">
                        {r.title}
                      </Link>
                    </h2>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={r.percent} className="h-2 max-w-xs flex-1" />
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        {r.done}/{r.total} lessons
                        {!isDone && r.minutesLeft != null
                          ? ` · ${r.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(r.minutesLeft)} left`
                          : ''}
                      </span>
                    </div>
                    {r.certCode && (
                      <a
                        href={`/verify/${r.certCode}`}
                        className="-my-1.5 mt-2 inline-flex items-center gap-1 py-3 text-sm text-brand-700 hover:underline"
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
