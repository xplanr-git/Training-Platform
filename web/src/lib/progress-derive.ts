export interface CourseProgress {
  completed: Set<string>;
  total: number;
  done: number;
  percent: number;
  isComplete: boolean;
  /** Minutes of author-estimated time left across incomplete lessons, or null
   *  when no remaining lesson carries an estimate. */
  minutesLeft: number | null;
}

export interface LessonTiming {
  id: string;
  estimatedMinutes: number | null;
}

/**
 * Pure completion derivation — no DB imports, so it is unit-testable in
 * isolation. Given completed lesson ids (from the append-only log) and all
 * lessons for a course, computes done/percent/isComplete plus the estimated
 * minutes remaining.
 *
 * Lessons may be passed as bare ids (no timing) or as {id, estimatedMinutes}.
 * Estimates are optional per lesson: only the ones that have a value are
 * summed, and `minutesLeft` is null when none of the remaining lessons do — so
 * the UI can fall back to "N lessons left".
 */
export function deriveProgress(
  completedLessonIds: Iterable<string>,
  allLessons: Array<string | LessonTiming>,
): CourseProgress {
  const completed = new Set(completedLessonIds);
  const items: LessonTiming[] = allLessons.map((l) =>
    typeof l === 'string' ? { id: l, estimatedMinutes: null } : l,
  );

  const total = items.length;
  const done = items.filter((l) => completed.has(l.id)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const remaining = items.filter((l) => !completed.has(l.id));
  const estimates = remaining
    .map((l) => l.estimatedMinutes)
    .filter((m): m is number => typeof m === 'number' && Number.isFinite(m) && m > 0);
  const minutesLeft = estimates.length
    ? estimates.reduce((sum, m) => sum + m, 0)
    : null;

  return {
    completed,
    total,
    done,
    percent,
    isComplete: total > 0 && done >= total,
    minutesLeft,
  };
}

/** Formats a minute count for learners: "45 min", "1 h", "1 h 30 min". */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
