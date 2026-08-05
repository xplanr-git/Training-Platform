import 'server-only';
import { db, eq, and, inArray, enrollments, memberships } from '@training-platform/db';
import { deriveProgress, type CourseProgress, type LessonTiming } from '@/lib/progress-derive';

/**
 * How the current viewer is allowed to see a course.
 *
 *  - `enrolled` — a learner (or an admin who genuinely enrolled). Progress is
 *    read and written normally.
 *  - `preview`  — an admin of this academy looking at their own course without
 *    being enrolled. Read-only: nothing is recorded, no completion, no
 *    certificate. This is what makes it possible to check a DRAFT course, and to
 *    check a published one, without appearing in your own statistics.
 *  - `denied`   — neither. Send them to the course page to enrol.
 */
export type CourseView =
  | { mode: 'enrolled'; enrollmentId: string }
  | { mode: 'preview'; enrollmentId: null }
  | { mode: 'denied'; enrollmentId: null };

/**
 * Whether this user administers this academy — checked against the DATABASE, not
 * the JWT's role claim. Claims are decoded from whatever token the cookie holds
 * and can be stale (see the note in login/actions.ts), and a preview that
 * intermittently denies an admin would be worse than none.
 */
export async function isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
  const [row] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, tenantId),
        inArray(memberships.status, ['active']),
      ),
    )
    .limit(1);
  return row?.role === 'company_admin' || row?.role === 'platform_admin';
}

/**
 * Decides how this viewer may see this course. Enrolment always wins, so an
 * admin who really is enrolled keeps their genuine progress rather than
 * silently dropping into a read-only view.
 */
export async function resolveCourseView(
  userId: string,
  tenantId: string,
  courseId: string,
): Promise<CourseView> {
  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  if (enrollment) return { mode: 'enrolled', enrollmentId: enrollment.id };

  if (await isTenantAdmin(userId, tenantId)) return { mode: 'preview', enrollmentId: null };
  return { mode: 'denied', enrollmentId: null };
}

/**
 * Progress for a preview: the shape the UI expects, with nothing completed.
 *
 * Built from the same pure derivation the real path uses, so a preview shows a
 * genuine "0 of N · about X min left" rather than a hand-made placeholder that
 * could drift from the real calculation.
 */
export function previewProgress(allLessons: Array<string | LessonTiming>): CourseProgress {
  return deriveProgress([], allLessons);
}
