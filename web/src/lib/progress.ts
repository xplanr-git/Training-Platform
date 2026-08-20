import { db, eq, and, lessons, progressEvents } from '@training-platform/db';
import { deriveProgress, formatMinutes, type CourseProgress } from '@/lib/progress-derive';

export { deriveProgress, formatMinutes, type CourseProgress };

/**
 * Derives completion state from the append-only progress_events log — state is
 * never stored, always computed (CLAUDE.md §5).
 */
export async function getCourseProgress(
  enrollmentId: string,
  courseId: string,
): Promise<CourseProgress> {
  const [completedRows, lessonRows] = await Promise.all([
    db
      .select({ lessonId: progressEvents.lessonId })
      .from(progressEvents)
      .where(
        and(
          eq(progressEvents.enrollmentId, enrollmentId),
          eq(progressEvents.eventType, 'completed'),
        ),
      ),
    db
      .select({ id: lessons.id, estimatedMinutes: lessons.estimatedMinutes })
      .from(lessons)
      // Excluded lessons (active=false) are not part of the curriculum, so they
      // are removed from the completion denominator — a withheld lesson can never
      // block completion or a certificate.
      .where(and(eq(lessons.courseId, courseId), eq(lessons.active, true))),
  ]);

  const completedIds = completedRows.map((r) => r.lessonId).filter((id): id is string => !!id);
  return deriveProgress(completedIds, lessonRows);
}
