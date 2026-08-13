import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { redirect } from 'next/navigation';
import { Award } from 'lucide-react';
import {
  db,
  eq,
  and,
  desc,
  inArray,
  enrollments,
  courses,
  certificates,
  progressEvents,
  lessons,
} from '@training-platform/db';
import { getTenantContext, currentAdminRole } from '@/lib/tenant';
import { effectiveUserId, isViewingAs } from '@/lib/view-as';
import { landAfterSignIn } from '@/app/login/actions';
import { deriveProgress, formatMinutes } from '@/lib/progress';
import { formatDateLong } from '@/lib/format-date';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';

/** Learner dashboard: the courses this user is enrolled in for this tenant. */
export default async function LearnerDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');
  if (!ctx.tenantId) redirect('/');

  /*
   * The same landing step the apex /dashboard runs.
   *
   * On a tenant SUBDOMAIN middleware rewrites `/dashboard` to this route before
   * the apex page can run, so neither the activation nor the routing happened
   * here at all: an admin signing in on a subdomain landed on the LEARNER
   * dashboard, and a new invitee stayed 'invited' however often they signed in.
   * Passing this route's own path is what stops the redirect looping for the
   * learner, for whom this page IS the destination.
   */
  const viewingAs = await isViewingAs();
  // Skip the landing step while viewing-as: landAfterSignIn would route the admin
  // to /admin and bounce them off the learner view they came to see.
  if (!viewingAs) await landAfterSignIn(`/t/${slug}/dashboard`);
  // The data is the viewed learner's; authorization stays the admin's.
  const dataUserId = await effectiveUserId(ctx.userId);
  // From memberships, not the role claim — otherwise a demoted admin keeps being
  // offered an "Admin" link that then bounces them straight back here. Hidden
  // while viewing-as, since this is meant to read as the learner's own view.
  const isAdmin = !viewingAs && !!(await currentAdminRole(ctx.userId, ctx.tenantId));

  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      courseId: courses.id,
      title: courses.title,
      slug: courses.slug,
      status: enrollments.status,
      completedAt: enrollments.completedAt,
      certCode: certificates.verificationCode,
      certRevokedAt: certificates.revokedAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .leftJoin(certificates, eq(certificates.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.userId, dataUserId), eq(enrollments.tenantId, ctx.tenantId)))
    .orderBy(desc(enrollments.startedAt));

  // Progress WITHOUT the N+1. This used to map getCourseProgress over every
  // enrollment — 1 + 2N queries, and the 5-connection pool serialised them into
  // waves, so a learner in ten courses paid ~five round-trip waves before the
  // page rendered. Two set-based reads instead — completed lessons across all the
  // learner's enrollments, and every lesson of the enrolled courses — then derive
  // each in memory with the same pure function getCourseProgress used.
  const enrollmentIds = rows.map((r) => r.enrollmentId);
  const courseIds = [...new Set(rows.map((r) => r.courseId))];

  const [completedRows, lessonRows] = await Promise.all([
    enrollmentIds.length
      ? db
          .select({ enrollmentId: progressEvents.enrollmentId, lessonId: progressEvents.lessonId })
          .from(progressEvents)
          .where(
            and(
              inArray(progressEvents.enrollmentId, enrollmentIds),
              eq(progressEvents.eventType, 'completed'),
            ),
          )
      : Promise.resolve([] as Array<{ enrollmentId: string; lessonId: string | null }>),
    courseIds.length
      ? db
          .select({
            courseId: lessons.courseId,
            id: lessons.id,
            estimatedMinutes: lessons.estimatedMinutes,
          })
          .from(lessons)
          .where(inArray(lessons.courseId, courseIds))
      : Promise.resolve(
          [] as Array<{ courseId: string; id: string; estimatedMinutes: number | null }>,
        ),
  ]);

  const completedByEnrollment = new Map<string, string[]>();
  for (const c of completedRows) {
    if (!c.lessonId) continue;
    const arr = completedByEnrollment.get(c.enrollmentId);
    if (arr) arr.push(c.lessonId);
    else completedByEnrollment.set(c.enrollmentId, [c.lessonId]);
  }
  const lessonsByCourse = new Map<string, Array<{ id: string; estimatedMinutes: number | null }>>();
  for (const l of lessonRows) {
    const item = { id: l.id, estimatedMinutes: l.estimatedMinutes };
    const arr = lessonsByCourse.get(l.courseId);
    if (arr) arr.push(item);
    else lessonsByCourse.set(l.courseId, [item]);
  }

  const withProgress = rows.map((r) => {
    const p = deriveProgress(
      completedByEnrollment.get(r.enrollmentId) ?? [],
      lessonsByCourse.get(r.courseId) ?? [],
    );
    return {
      ...r,
      percent: p.percent,
      done: p.done,
      total: p.total,
      isComplete: p.isComplete,
      minutesLeft: p.minutesLeft,
      minutesLeftIsPartial: p.minutesLeftIsPartial,
    };
  });

  // "Done" is derived from the append-only log, not enrollment.completedAt: if
  // an author adds a lesson to a course a learner already finished, there is
  // genuinely new work to do. The certificate they already earned still stands.
  const enrolled = withProgress.length;
  const completed = withProgress.filter((r) => r.isComplete).length;
  const inProgress = withProgress.filter((r) => !r.isComplete && r.done > 0).length;
  // Revoked certificates do not count as held. Revocation is the deliberate act of
  // withdrawing a credential, and this tile counting it kept telling the learner
  // they had something they no longer have.
  const certs = withProgress.filter((r) => r.certCode && !r.certRevokedAt).length;

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
          <h1 className="text-2xl">Your learning</h1>
          <p className="mt-1 text-muted">Pick up where you left off.</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <ThemeToggle />
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
                {/* core.css `.sb-kpi`: label 13/500 ABOVE a 28/800 value — the
                    label names the number before the eye lands on it, and the
                    admin Insights tiles already read this way; the two stat
                    surfaces were label-under vs label-over of each other. */}
                <div className="text-control font-medium text-foreground-2">{s.label}</div>
                <div className="mt-1 text-kpi font-extrabold tabular-nums">{s.value}</div>
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
                    <h2 className="text-h2">
                      <Link href={`/learn/${r.slug}`} className="hover:underline">
                        {r.title}
                      </Link>
                    </h2>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={r.percent} className="h-2 max-w-xs flex-1" />
                      <span className="shrink-0 text-meta text-muted tabular-nums">
                        {r.done}/{r.total} lessons
                        {!isDone && r.minutesLeft != null
                          ? ` · ${r.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(r.minutesLeft)} left`
                          : ''}
                      </span>
                    </div>
                    {/*
                      A revoked certificate still links to /verify — the reader is
                      entitled to see the withdrawal and its date, and that page
                      states both. What it must not do is keep offering "View
                      certificate", which asserts they hold something they do not.
                      The label carries the state in a word, not by colour alone.
                    */}
                    {r.certCode &&
                      (r.certRevokedAt ? (
                        <a
                          href={`/verify/${r.certCode}`}
                          className="-my-1.5 mt-2 inline-flex items-center gap-1 py-3 text-sm text-foreground-2 hover:text-foreground"
                        >
                          <Award className="h-4 w-4" /> Certificate revoked —{' '}
                          {formatDateLong(r.certRevokedAt)}
                        </a>
                      ) : (
                        <a
                          href={`/verify/${r.certCode}`}
                          className="-my-1.5 mt-2 inline-flex items-center gap-1 py-3 text-sm text-link hover:text-link-hover hover:underline"
                        >
                          <Award className="h-4 w-4" /> View certificate
                        </a>
                      ))}
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
