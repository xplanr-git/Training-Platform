import { db, eq, and, lessons, progressEvents } from '@training-platform/db';
import { deriveProgress, type CourseProgress } from '@/lib/progress-derive';

export { deriveProgress, type CourseProgress };

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
    db.select({ id: lessons.id }).from(lessons).where(eq(lessons.courseId, courseId)),
  ]);

  const completedIds = completedRows
    .map((r) => r.lessonId)
    .filter((id): id is string => !!id);
  return deriveProgress(
    completedIds,
    lessonRows.map((l) => l.id),
  );
}
