import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { redirect } from 'next/navigation';
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
  memberships,
} from '@training-platform/db';
import { getTenantContext, currentAdminRole } from '@/lib/tenant';
import { effectiveUserId, isViewingAs } from '@/lib/view-as';
import { landAfterSignIn } from '@/app/login/actions';
import { deriveProgress, formatMinutes } from '@/lib/progress';
import {
  deriveLearningItems,
  itemProgress,
  itemsLabel,
  type LessonRow,
} from '@/lib/learning-units';
import {
  CONTRACTOR_REQUIRED_COURSE_SLUG,
  showsContractorRequirement,
  requirementState,
  requirementAction,
} from '@/lib/contractor-requirement';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Learner home — requirements-led.
 *
 * Answers, in order: what do I need to do → where am I up to → what next. The
 * Contractor requirement (complete the required installer training, user-facing
 * "Outdure Installer Training") is the primary frame; other enrolments sit calmly
 * beneath it. Job-language only — the STATUS "Trained" is not shown here. This
 * deliberately
 * replaces the old Enrolled/In-progress/Completed/Certificates metric-tile
 * dashboard, whose four tiles filled the whole first mobile viewport before the
 * learner reached a useful action.
 *
 * Slice 1 scope: the Trained state is kept NEUTRAL — no warranty-bearing
 * certification is celebrated, and nothing infers Verified, listing eligibility,
 * or Strategic Partner. The competency/completion model that gates real
 * certification is Slice 2.
 */
export default async function LearnerDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');
  if (!ctx.tenantId) redirect('/');

  const viewingAs = await isViewingAs();
  // Skip the landing step while viewing-as: landAfterSignIn would route the admin
  // to /admin and bounce them off the learner view they came to see.
  if (!viewingAs) await landAfterSignIn(`/t/${slug}/dashboard`);
  // The data is the viewed learner's; authorization stays the admin's.
  const dataUserId = await effectiveUserId(ctx.userId);
  const isAdmin = !viewingAs && !!(await currentAdminRole(ctx.userId, ctx.tenantId));

  // Enrolments, the learner's Connect tier (server-side only — never rendered),
  // and the required-course row (fetched by slug whether or not the learner is
  // enrolled in it, so a "Not started" requirement can still be shown). These
  // three are independent, so they go together; the set-based progress reads
  // below depend on the enrolment rows and follow.
  const [rows, membershipRow, requiredCourseRow] = await Promise.all([
    db
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
      .where(and(eq(enrollments.userId, dataUserId), eq(enrollments.tenantId, ctx.tenantId)))
      .orderBy(desc(enrollments.startedAt)),
    db
      .select({ connectRoleCode: memberships.connectRoleCode })
      .from(memberships)
      .where(and(eq(memberships.userId, dataUserId), eq(memberships.tenantId, ctx.tenantId)))
      .limit(1),
    db
      .select({ slug: courses.slug, title: courses.title, status: courses.status })
      .from(courses)
      .where(
        and(eq(courses.tenantId, ctx.tenantId), eq(courses.slug, CONTRACTOR_REQUIRED_COURSE_SLUG)),
      )
      .limit(1),
  ]);

  // Progress WITHOUT the N+1: two set-based reads (completed lessons across the
  // learner's enrolments, and every lesson of the enrolled courses), then derive
  // each in memory with the same pure function getCourseProgress uses.
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
            sectionId: lessons.sectionId,
            position: lessons.position,
            type: lessons.type,
            title: lessons.title,
            estimatedMinutes: lessons.estimatedMinutes,
            assessmentForLessonId: lessons.assessmentForLessonId,
          })
          .from(lessons)
          .where(inArray(lessons.courseId, courseIds))
      : Promise.resolve(
          [] as Array<
            {
              courseId: string;
            } & LessonRow
          >,
        ),
  ]);

  const completedByEnrollment = new Map<string, string[]>();
  for (const c of completedRows) {
    if (!c.lessonId) continue;
    const arr = completedByEnrollment.get(c.enrollmentId);
    if (arr) arr.push(c.lessonId);
    else completedByEnrollment.set(c.enrollmentId, [c.lessonId]);
  }
  const lessonsByCourse = new Map<string, LessonRow[]>();
  for (const l of lessonRows) {
    const arr = lessonsByCourse.get(l.courseId);
    if (arr) arr.push(l);
    else lessonsByCourse.set(l.courseId, [l]);
  }

  const withProgress = rows.map((r) => {
    const courseLessons = lessonsByCourse.get(r.courseId) ?? [];
    const completed = new Set(completedByEnrollment.get(r.enrollmentId) ?? []);
    // Authoritative completion stays row-based (certificate trigger unchanged).
    const p = deriveProgress([...completed], courseLessons);
    // Learner-facing counts/%/time are over ITEMS (video + its check = one item).
    // Order is irrelevant to counts, so a trivial section order is fine here.
    const order = new Map(courseLessons.map((l) => [l.sectionId, 0]));
    const ip = itemProgress(deriveLearningItems(courseLessons, order, completed));
    return {
      ...r,
      percent: ip.percent,
      done: ip.doneItems,
      total: ip.totalItems,
      isComplete: p.isComplete,
      minutesLeft: ip.minutesLeft,
      minutesLeftIsPartial: ip.minutesLeftIsPartial,
    };
  });

  // The Contractor requirement. Shown to everyone except a positively-identified
  // dealer, and only when the required course actually exists and is published
  // (never point a learner at a draft or a missing course).
  const requiredCourse =
    requiredCourseRow[0] && requiredCourseRow[0].status === 'published'
      ? requiredCourseRow[0]
      : null;
  const showsRequirement =
    showsContractorRequirement(membershipRow[0]?.connectRoleCode ?? null) && !!requiredCourse;

  const requiredEnrollment = withProgress.find((r) => r.slug === CONTRACTOR_REQUIRED_COURSE_SLUG);
  const reqState = requirementState({
    enrolled: !!requiredEnrollment,
    done: requiredEnrollment?.done ?? 0,
    isComplete: requiredEnrollment?.isComplete ?? false,
  });
  const reqAction = requiredCourse ? requirementAction(reqState, requiredCourse.slug) : null;

  // Everything that is not the required course, presented calmly beneath it.
  const otherCourses = withProgress.filter((r) => r.slug !== CONTRACTOR_REQUIRED_COURSE_SLUG);

  const nothingToShow = !showsRequirement && !otherCourses.length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-14">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl">Your training</h1>
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

      {showsRequirement && requiredCourse && (
        <section aria-labelledby="required-training" className="mt-6">
          <p className="text-sm text-muted">Required training</p>
          <Card className="mt-2">
            <CardContent className="py-5">
              <h2 id="required-training" className="text-h2">
                {requiredCourse.title}
              </h2>

              {reqState === 'in-progress' && requiredEnrollment ? (
                <>
                  <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium">
                      {requiredEnrollment.percent}% complete
                    </span>
                    <span className="text-foreground-2 text-sm tabular-nums">
                      {requiredEnrollment.done} of {requiredEnrollment.total}{' '}
                      {itemsLabel(requiredEnrollment.total)}
                      {requiredEnrollment.minutesLeft != null
                        ? ` · ${requiredEnrollment.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(requiredEnrollment.minutesLeft)} left`
                        : ''}
                    </span>
                  </div>
                  <Progress value={requiredEnrollment.percent} className="mt-2 h-2" />
                </>
              ) : reqState === 'complete' ? (
                // Neutral Trained state (Slice 1): acknowledge completion without
                // celebrating a warranty-bearing credential or implying Verified.
                <p className="mt-3 text-sm text-muted">You’ve completed the required training.</p>
              ) : (
                <p className="mt-3 text-sm text-muted">Not started</p>
              )}

              {reqAction ? (
                <Button asChild size="lg" className="mt-4">
                  <Link href={reqAction.href}>{reqAction.label}</Link>
                </Button>
              ) : (
                <Link
                  href={`/learn/${requiredCourse.slug}`}
                  className="text-foreground-2 hover:text-foreground mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold transition-colors"
                >
                  Review training →
                </Link>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {otherCourses.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h2">{showsRequirement ? 'Other courses' : 'Your courses'}</h2>
          <ul className="mt-2 divide-y divide-border">
            {otherCourses.map((r) => {
              const stateLabel = r.isComplete
                ? 'Completed'
                : r.done > 0
                  ? 'In progress'
                  : 'Not started';
              const action = r.isComplete ? 'Review' : r.done > 0 ? 'Continue' : 'Start';
              return (
                <li key={r.courseId}>
                  <Link
                    href={`/learn/${r.slug}`}
                    className="-mx-2 flex min-h-11 items-center justify-between gap-4 rounded-sm px-2 py-3 transition-colors hover:bg-surface-muted"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{r.title}</span>
                      <p className="text-foreground-2 mt-0.5 text-meta tabular-nums">
                        {r.done}/{r.total} {itemsLabel(r.total)} · {stateLabel}
                      </p>
                    </div>
                    <span className="text-foreground-2 shrink-0 text-sm">{action} →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {nothingToShow && (
        <EmptyState
          className="mt-6"
          icon={<GraduationCap />}
          title="You have not started a course yet"
          action={{ href: '/', label: 'Browse courses' }}
        >
          Pick a course to enrol. Your place is saved as you go, so you can stop after a lesson and
          pick up where you left off — on a phone on site, or at a desk later.
        </EmptyState>
      )}
    </main>
  );
}
