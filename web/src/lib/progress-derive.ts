export interface CourseProgress {
  completed: Set<string>;
  total: number;
  done: number;
  percent: number;
  isComplete: boolean;
}

/**
 * Pure completion derivation — no DB imports, so it is unit-testable in
 * isolation. Given completed lesson ids (from the append-only log) and all
 * lesson ids for a course, computes done/percent/isComplete.
 */
export function deriveProgress(
  completedLessonIds: Iterable<string>,
  allLessonIds: string[],
): CourseProgress {
  const completed = new Set(completedLessonIds);
  const total = allLessonIds.length;
  const done = allLessonIds.filter((id) => completed.has(id)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { completed, total, done, percent, isComplete: total > 0 && done >= total };
}
