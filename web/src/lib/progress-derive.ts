export interface CourseProgress {
  completed: Set<string>;
  total: number;
  done: number;
  percent: number;
  isComplete: boolean;
  /** Minutes of author-estimated time left across incomplete lessons, or null
   *  when no remaining lesson carries an estimate. */
  minutesLeft: number | null;
  /**
   * True when `minutesLeft` covers only SOME of the remaining lessons, because
   * the others carry no estimate. The real figure is therefore higher, so the UI
   * must say "at least N min left" rather than "about N min left".
   *
   * Without this the number silently under-reports: three lessons left, one of
   * them estimated at 20 minutes, and the learner is told "about 20 min left"
   * for what is 20 minutes plus two lessons of unknown length. Always false when
   * `minutesLeft` is null, so callers can ignore it on the fallback path.
   */
  minutesLeftIsPartial: boolean;
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
  const minutesLeft = estimates.length ? estimates.reduce((sum, m) => sum + m, 0) : null;
  // Compared against REMAINING, not total: a course whose finished lessons were
  // the un-estimated ones is fully estimated from here on, and hedging there
  // would under-sell a figure that is actually complete.
  const minutesLeftIsPartial = estimates.length > 0 && estimates.length < remaining.length;

  return {
    completed,
    total,
    done,
    percent,
    isComplete: total > 0 && done >= total,
    minutesLeft,
    minutesLeftIsPartial,
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
