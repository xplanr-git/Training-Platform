import { db, eq, and, lessons, progressEvents } from '@training-platform/db';

/**
 * Derives completion state from the append-only progress_events log — state is
 * never stored, always computed (CLAUDE.md §5). Returns the set of completed
 * lesson ids for an enrollment plus a percentage against the course's lessons.
 */
export async function getCourseProgress(enrollmentId: string, courseId: string) {
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

  const completed = new Set(
    completedRows.map((r) => r.lessonId).filter((id): id is string => !!id),
  );
  const total = lessonRows.length;
  const done = lessonRows.filter((l) => completed.has(l.id)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { completed, total, done, percent, isComplete: total > 0 && done >= total };
}
