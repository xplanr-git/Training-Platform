import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Award } from 'lucide-react';
import {
  db,
  eq,
  and,
  desc,
  max,
  inArray,
  memberships,
  users,
  enrollments,
  courses,
  certificates,
  progressEvents,
  lessons,
} from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { deriveProgress } from '@/lib/progress';
import {
  deriveLearningItems,
  itemProgress,
  itemsLabel,
  type LessonRow,
} from '@/lib/learning-units';
import { audienceLabel, isAudience } from '@/lib/audience';
import { connectRoleLabel } from '@/lib/connect-roles';
import { formatDateShort } from '@/lib/format-date';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata = { title: 'Learner' };

/**
 * Per-learner training status for an admin — the answer to "has this person
 * started, how far are they, have they completed, where is their certificate?"
 * WITHOUT resorting to View-as. Read-only over existing data (enrolments,
 * completed events, certificates); no new model, no enterprise reporting.
 * View-as remains available on the People list as the secondary troubleshooting
 * path. Learner quiz internals / answer keys are deliberately NOT shown here.
 */
export default async function LearnerTrainingDetail({
  params,
}: {
  params: Promise<{ slug: string; userId: string }>;
}) {
  const { slug, userId } = await params;
  const ctx = await requireAdminForSlug(slug);

  const [member] = await db
    .select({
      name: users.name,
      email: users.email,
      audience: memberships.audience,
      connectRoleCode: memberships.connectRoleCode,
      status: memberships.status,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.userId, userId), eq(memberships.tenantId, ctx.tenantId!)))
    .limit(1);
  if (!member) notFound();

  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      courseId: courses.id,
      title: courses.title,
      slug: courses.slug,
      startedAt: enrollments.startedAt,
      completedAt: enrollments.completedAt,
      verificationCode: certificates.verificationCode,
      revokedAt: certificates.revokedAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .leftJoin(certificates, eq(certificates.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.userId, userId), eq(enrollments.tenantId, ctx.tenantId!)))
    .orderBy(desc(enrollments.startedAt));

  const enrollmentIds = rows.map((r) => r.enrollmentId);
  const courseIds = [...new Set(rows.map((r) => r.courseId))];
  const [completedRows, lessonRows, lastActivityRows] = await Promise.all([
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
      : Promise.resolve([] as Array<{ courseId: string } & LessonRow>),
    enrollmentIds.length
      ? db
          .select({
            enrollmentId: progressEvents.enrollmentId,
            lastAt: max(progressEvents.occurredAt),
          })
          .from(progressEvents)
          .where(inArray(progressEvents.enrollmentId, enrollmentIds))
          .groupBy(progressEvents.enrollmentId)
      : Promise.resolve([] as Array<{ enrollmentId: string; lastAt: Date | null }>),
  ]);

  const completedByEnrollment = new Map<string, string[]>();
  for (const c of completedRows) {
    if (!c.lessonId) continue;
    (
      completedByEnrollment.get(c.enrollmentId) ??
      completedByEnrollment.set(c.enrollmentId, []).get(c.enrollmentId)!
    ).push(c.lessonId);
  }
  const lessonsByCourse = new Map<string, LessonRow[]>();
  for (const l of lessonRows) {
    (lessonsByCourse.get(l.courseId) ?? lessonsByCourse.set(l.courseId, []).get(l.courseId)!).push(
      l,
    );
  }
  const lastActivityByEnrollment = new Map(lastActivityRows.map((r) => [r.enrollmentId, r.lastAt]));

  const items = rows.map((r) => {
    const courseLessons = lessonsByCourse.get(r.courseId) ?? [];
    const completed = new Set(completedByEnrollment.get(r.enrollmentId) ?? []);
    const p = deriveProgress([...completed], courseLessons);
    const order = new Map(courseLessons.map((l) => [l.sectionId, 0]));
    const ip = itemProgress(deriveLearningItems(courseLessons, order, completed));
    const state = p.isComplete ? 'Completed' : ip.doneItems > 0 ? 'In progress' : 'Not started';
    return {
      ...r,
      state,
      percent: ip.percent,
      done: ip.doneItems,
      total: ip.totalItems,
      lastAt: lastActivityByEnrollment.get(r.enrollmentId) ?? null,
      revoked: Boolean(r.verificationCode && r.revokedAt),
    };
  });

  const stateTone = (s: string): 'green' | 'blue' | 'grey' =>
    s === 'Completed' ? 'green' : s === 'In progress' ? 'blue' : 'grey';

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/t/${slug}/admin/people`}
        className="text-foreground-2 hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> People
      </Link>

      <h1 className="text-h2 mt-3">{member.name || member.email}</h1>
      <dl className="text-foreground-2 mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <dt className="sr-only">Email</dt>
          <dd>{member.email}</dd>
        </div>
        <div>
          <dt className="sr-only">Audience</dt>
          <dd>
            {isAudience(member.audience) ? audienceLabel(member.audience) : 'Audience not set'}
          </dd>
        </div>
        {member.connectRoleCode && (
          <div>
            <dt className="sr-only">Status</dt>
            <dd>{connectRoleLabel(member.connectRoleCode)}</dd>
          </div>
        )}
      </dl>

      {items.length === 0 ? (
        <EmptyState className="mt-8" title="No training yet">
          This person is not enrolled in any course yet. They enrol from their Home when they sign
          in.
        </EmptyState>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Certificate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.enrollmentId}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>
                    <StatusBadge tone={stateTone(r.state)}>{r.state}</StatusBadge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.percent}% · {r.done}/{r.total} {itemsLabel(r.total)}
                  </TableCell>
                  <TableCell className="text-foreground-2">
                    {r.lastAt ? formatDateShort(r.lastAt) : '—'}
                  </TableCell>
                  <TableCell className="text-foreground-2">
                    {r.completedAt ? formatDateShort(r.completedAt) : '—'}
                  </TableCell>
                  <TableCell>
                    {r.verificationCode && !r.revoked ? (
                      <Link
                        href={`/verify/${r.verificationCode}`}
                        className="text-link hover:text-link-hover inline-flex items-center gap-1.5 text-sm hover:underline"
                      >
                        <Award aria-hidden="true" className="h-4 w-4" /> View
                      </Link>
                    ) : r.revoked ? (
                      <span className="text-foreground-2 text-sm">Withdrawn</span>
                    ) : (
                      <span className="text-foreground-2 text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
