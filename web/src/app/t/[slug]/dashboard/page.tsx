import Link from 'next/link';
import { GraduationCap, Info } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { redirect } from 'next/navigation';
import {
  db,
  eq,
  and,
  asc,
  desc,
  inArray,
  isNotNull,
  enrollments,
  courses,
  progressEvents,
  lessons,
  sections,
  memberships,
} from '@training-platform/db';
import { getTenantContext, currentAdminRole, tenantBySlug } from '@/lib/tenant';
import { effectiveUserId, isViewingAs } from '@/lib/view-as';
import { landAfterSignIn } from '@/app/login/actions';
import { deriveProgress, formatMinutes } from '@/lib/progress';
import {
  deriveLearningItems,
  itemProgress,
  itemsLabel,
  type LessonRow,
} from '@/lib/learning-units';
import { showsInstallerPathway } from '@/lib/audience';
import { getAudience } from '@/lib/audience-server';
import {
  pickRequiredCourse,
  showsContractorRequirement,
  requirementState,
  requirementAction,
} from '@/lib/contractor-requirement';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LearnerShell } from '@/components/learner-shell';
import { AudiencePicker } from '@/components/audience-picker';
import { setMyAudience } from './actions';

/**
 * Authenticated learner HOME — orientation, not just a course list (V2).
 *
 * It answers, within the first viewport where possible: what is this, what
 * applies to me, where am I up to, how long is left, and — dominant for a
 * returning learner — CONTINUE (resume the exact saved spot). A new learner
 * gets a concise "how this works + your place is saved" welcome before the
 * curriculum; a completed learner gets their outcome + where to find their
 * record. Relevance is driven by AUDIENCE (who they are), never by status.
 */
export default async function LearnerDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');
  if (!ctx.tenantId) redirect('/');

  const viewingAs = await isViewingAs();
  if (!viewingAs) await landAfterSignIn(`/t/${slug}/dashboard`);
  const dataUserId = await effectiveUserId(ctx.userId);
  const [isAdmin, tenant, audience] = await Promise.all([
    viewingAs
      ? Promise.resolve(false)
      : currentAdminRole(ctx.userId, ctx.tenantId).then((r) => !!r),
    tenantBySlug(slug),
    getAudience(dataUserId, ctx.tenantId),
  ]);

  const [rows, membershipRow, requiredCandidates] = await Promise.all([
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
    // Candidate required courses: PUBLISHED courses explicitly marked required
    // for some audience. Purely data-driven — no slug fallback. pickRequiredCourse()
    // resolves the learner's one (or none) below.
    db
      .select({
        slug: courses.slug,
        title: courses.title,
        status: courses.status,
        requiredForAudiences: courses.requiredForAudiences,
      })
      .from(courses)
      .where(
        and(
          eq(courses.tenantId, ctx.tenantId),
          eq(courses.status, 'published'),
          isNotNull(courses.requiredForAudiences),
        ),
      ),
  ]);

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
          .where(and(inArray(lessons.courseId, courseIds), eq(lessons.active, true)))
      : Promise.resolve([] as Array<{ courseId: string } & LessonRow>),
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
    const p = deriveProgress([...completed], courseLessons);
    const order = new Map(courseLessons.map((l) => [l.sectionId, 0]));
    const ip = itemProgress(deriveLearningItems(courseLessons, order, completed));
    return {
      ...r,
      completedSet: completed,
      percent: ip.percent,
      done: ip.doneItems,
      total: ip.totalItems,
      isComplete: p.isComplete,
      minutesLeft: ip.minutesLeft,
      minutesLeftIsPartial: ip.minutesLeftIsPartial,
    };
  });

  // Audience relevance is DATA-driven and honest: pickRequiredCourse returns the
  // course explicitly marked required for this learner's KNOWN audience, else
  // null. An UNKNOWN audience matches nothing — the AudiencePicker above asks the
  // question instead; unknown is never treated as installer. A dealer/distributor/
  // staff learner matches no installer requirement, so it is never forced on them.
  const requiredCourse = pickRequiredCourse(requiredCandidates, audience);
  const showsRequirement =
    !!requiredCourse && showsContractorRequirement(membershipRow[0]?.connectRoleCode ?? null);

  const requiredEnrollment = requiredCourse
    ? withProgress.find((r) => r.slug === requiredCourse.slug)
    : undefined;
  const reqState = requirementState({
    enrolled: !!requiredEnrollment,
    done: requiredEnrollment?.done ?? 0,
    isComplete: requiredEnrollment?.isComplete ?? false,
  });
  const reqAction = requiredCourse ? requirementAction(reqState, requiredCourse.slug) : null;

  // Overall learner state → which orientation to lead with.
  const allComplete = withProgress.length > 0 && withProgress.every((r) => r.isComplete);

  // The course to CONTINUE: the required one if in progress, else the most
  // recently-started incomplete course. Resume to its first incomplete lesson so
  // the lesson player can pick up the saved video position — not the course start.
  const continueCourse =
    requiredEnrollment && !requiredEnrollment.isComplete && requiredEnrollment.done > 0
      ? requiredEnrollment
      : (withProgress.find((r) => r.done > 0 && !r.isComplete) ?? null);
  let resumeHref: string | null = null;
  if (continueCourse) {
    const ordered = await db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(sections, eq(sections.id, lessons.sectionId))
      // Resume must skip excluded lessons — never resume into one that 404s.
      .where(and(eq(lessons.courseId, continueCourse.courseId), eq(lessons.active, true)))
      .orderBy(asc(sections.position), asc(lessons.position));
    const nextLesson = ordered.find((l) => !continueCourse.completedSet.has(l.id));
    resumeHref = nextLesson
      ? `/learn/${continueCourse.slug}/${nextLesson.id}`
      : `/learn/${continueCourse.slug}`;
  }

  // The "other courses" list excludes the required course (it has its own panel)
  // AND the course shown in the Continue hero, so a resumed non-required course
  // never appears twice on Home.
  const heroCourseSlug = continueCourse && resumeHref ? continueCourse.slug : null;
  const requiredSlug = showsRequirement ? (requiredCourse?.slug ?? null) : null;
  const otherCourses = withProgress.filter(
    (r) => r.slug !== requiredSlug && r.slug !== heroCourseSlug,
  );
  const nothingToShow = !showsRequirement && !otherCourses.length && !heroCourseSlug;

  const showPathway = showsInstallerPathway(audience);
  const tenantName = tenant?.name ?? 'Outdure Academy';

  return (
    <>
      <LearnerShell slug={slug} tenantName={tenantName} active="home" />
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-14">
        {isAdmin && (
          <div className="mb-6 flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href={`/t/${slug}/admin`}>Admin</Link>
            </Button>
          </div>
        )}

        {/* First-use relevance question — only when audience is unknown. */}
        {audience === null && !viewingAs && (
          <div className="mb-8">
            <AudiencePicker action={setMyAudience.bind(null, slug)} />
          </div>
        )}

        {/* State-aware welcome / continue. */}
        {continueCourse && resumeHref ? (
          <section className="rounded-(--radius-card) bg-sunken px-5 py-5">
            <p className="text-muted text-meta">Pick up where you left off</p>
            <h1 className="text-h2 mt-0.5 font-bold">{continueCourse.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={continueCourse.percent} className="h-2 max-w-xs flex-1" />
              <span className="text-foreground-2 shrink-0 text-meta tabular-nums">
                {continueCourse.percent}%
                {continueCourse.minutesLeft != null
                  ? ` · ${continueCourse.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(continueCourse.minutesLeft)} left`
                  : ''}
              </span>
            </div>
            <Button asChild size="lg" className="mt-4">
              <Link href={resumeHref}>Continue training</Link>
            </Button>
            <p className="text-muted mt-3 text-meta">
              Your progress and video position are saved automatically — leave any time and pick up
              here.
            </p>
          </section>
        ) : allComplete ? (
          <section className="rounded-(--radius-card) bg-sunken px-5 py-5">
            <h1 className="text-h2 font-bold">You’ve completed your training</h1>
            <p className="text-foreground-2 mt-1 text-sm leading-relaxed">
              Nice work. You can revisit any course any time, and your certificate and training
              record are on{' '}
              <Link href={`/t/${slug}/training`} className="text-link hover:underline">
                My training
              </Link>
              .
            </p>
          </section>
        ) : (
          <section>
            <h1 className="text-2xl">Welcome to {tenantName}</h1>
            <p className="text-foreground-2 mt-2 max-w-prose text-sm leading-relaxed">
              This is where you complete the Outdure product training for your role. Work through it
              at your own pace, on any device — your progress and video position are saved
              automatically, so you can stop after a lesson and pick up later.
            </p>
          </section>
        )}

        {/* Required training. */}
        {showsRequirement && requiredCourse && (
          <section aria-labelledby="required-training" className="mt-10">
            <p className="text-muted text-sm">Required training</p>
            <div className="mt-2">
              <h2 id="required-training" className="text-h2">
                {requiredCourse.title}
              </h2>
              {reqState === 'in-progress' && requiredEnrollment ? (
                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium">
                    {requiredEnrollment.percent}% complete
                  </span>
                  <span className="text-foreground-2 text-meta tabular-nums">
                    {requiredEnrollment.done} of {requiredEnrollment.total}{' '}
                    {itemsLabel(requiredEnrollment.total)}
                    {requiredEnrollment.minutesLeft != null
                      ? ` · ${requiredEnrollment.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(requiredEnrollment.minutesLeft)} left`
                      : ''}
                  </span>
                </div>
              ) : reqState === 'complete' ? (
                <p className="text-muted mt-2 text-sm">You’ve completed the required training.</p>
              ) : (
                <p className="text-muted mt-2 text-sm">
                  Not started
                  {requiredEnrollment?.minutesLeft != null
                    ? ` · ${requiredEnrollment.minutesLeftIsPartial ? 'at least' : 'about'} ${formatMinutes(requiredEnrollment.minutesLeft)}`
                    : ''}
                </p>
              )}
              {reqAction && reqState !== 'in-progress' && (
                <Button asChild size="lg" className="mt-4">
                  <Link href={reqAction.href}>{reqAction.label}</Link>
                </Button>
              )}
              {reqState === 'in-progress' && (
                <Link
                  href={`/learn/${requiredCourse.slug}`}
                  className="text-foreground-2 hover:text-foreground mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold"
                >
                  View all topics →
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Installer pathway — conservative, directional, never auto-progressing. */}
        {showPathway && (
          <section className="mt-10">
            <h2 className="text-h3">Where this training can lead</h2>
            <ol className="mt-3 space-y-3">
              <li className="border-keyline border-l-[1.75px] pl-4">
                <p className="text-sm font-semibold">Trained</p>
                <p className="text-foreground-2 mt-0.5 text-meta leading-relaxed">
                  Complete the required installer training. This is the status this Academy can
                  award.
                </p>
              </li>
              <li className="border-border border-l pl-4">
                <p className="text-foreground-2 text-sm font-semibold">Verified Installer</p>
                <p className="text-muted mt-0.5 text-meta leading-relaxed">
                  A separate Outdure review beyond training. Not earned by completing a course.
                </p>
              </li>
              <li className="border-border border-l pl-4">
                <p className="text-foreground-2 text-sm font-semibold">Strategic Partner</p>
                <p className="text-muted mt-0.5 text-meta leading-relaxed">
                  A closer relationship, selected by Outdure. Not earned by completing a course.
                </p>
              </li>
            </ol>
            <p className="text-muted mt-3 flex items-start gap-1.5 text-meta leading-relaxed">
              <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Exact benefits and warranty wording are confirmed by Outdure.
            </p>
          </section>
        )}

        {/* Other / enrolled courses. */}
        {otherCourses.length > 0 && (
          <section className="mt-10">
            <h2 className="text-h2">{showsRequirement ? 'Other courses' : 'Your courses'}</h2>
            <ul className="divide-border mt-2 divide-y">
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
                      className="hover:bg-surface-muted -mx-2 flex min-h-11 items-center justify-between gap-4 rounded-sm px-2 py-3 transition-colors"
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
            className="mt-8"
            icon={<GraduationCap />}
            title="No training assigned yet"
            action={{ href: `/t/${slug}/help`, label: 'Ask for help' }}
          >
            You don’t have any training to complete right now. If you were expecting some, let us
            know and we’ll sort it out.
          </EmptyState>
        )}
      </main>
    </>
  );
}
