/**
 * Warranty-critical competency logic for the installer training.
 *
 * The rule (confirmed): for a critical knowledge check, the learner must answer
 * every CRITICAL question correctly — they cannot compensate for a wrong critical
 * answer (e.g. bracing) with easy ones. A critical check only completes its lesson
 * on a critical pass, so 100% course completion already implies every critical
 * check passed — which is what gates Trained status, with no change to the
 * conferral guard.
 *
 * Failing a critical check does NOT allow an immediate identical retry: the
 * learner must review the relevant section first (see `reviewRequired`). These
 * are pure functions so the behaviour is unit-testable without a database; the
 * callers supply the facts.
 */

export interface QuestionCriticality {
  id: string;
  critical: boolean;
}

/** The ids of the critical questions in a check. */
export function criticalQuestionIds(questions: readonly QuestionCriticality[]): string[] {
  return questions.filter((q) => q.critical).map((q) => q.id);
}

/** Whether this quiz is a critical check (has at least one critical question). */
export function isCriticalCheck(questions: readonly QuestionCriticality[]): boolean {
  return questions.some((q) => q.critical);
}

/** True only when EVERY critical question was answered correctly. */
export function allCriticalCorrect(
  criticalIds: readonly string[],
  correctQuestionIds: ReadonlySet<string>,
): boolean {
  return criticalIds.every((id) => correctQuestionIds.has(id));
}

/**
 * Whether a new attempt at a critical check must be blocked pending review.
 *
 * Blocked when the check is critical, the lesson is not yet complete (i.e. the
 * critical questions have not all been passed), a prior attempt exists, and the
 * learner has NOT reviewed the section since that last attempt. The first attempt
 * is always allowed; after a fail, exactly one review unlocks exactly one retry.
 */
export function reviewRequired(opts: {
  isCritical: boolean;
  lessonCompleted: boolean;
  priorAttemptCount: number;
  reviewedSinceLastAttempt: boolean;
}): boolean {
  if (!opts.isCritical || opts.lessonCompleted) return false;
  if (opts.priorAttemptCount === 0) return false;
  return !opts.reviewedSinceLastAttempt;
}
