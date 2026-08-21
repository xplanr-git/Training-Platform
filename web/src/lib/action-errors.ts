/**
 * Sentinel messages that Server Action guards throw and that NavForm's friendly()
 * turns into human copy.
 *
 * Single-sourced here so the contract lives in ONE place. Before, each throw site
 * and the matcher held the literal independently: renaming a sentinel silently
 * degraded the user-facing message to the generic "Something went wrong" fallback,
 * with no type error and no failing test. Now a rename is one edit, and
 * action-error-conventions.test.ts fails if a throw site or the matcher stops
 * using these.
 *
 * Pure, import-free (the helpers below reference only the local ActionError), so
 * this module is safe to import from both the server guards and the client forms
 * (NavForm and QuizForm both use friendly()/isFrameworkNavigation() from here).
 */
export const ActionError = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_INACTIVE: 'TENANT_INACTIVE',
  VIEW_AS_READONLY: 'VIEW_AS_READONLY',
  ENROLLMENT_NOT_FOUND: 'Enrollment not found',
  /**
   * A PREFIX, deliberately: two sites throw it with different tails — the builder
   * throws it bare, the learn player appends "in this course" — and friendly()
   * matches the shared prefix so both map to the same copy.
   */
  LESSON_NOT_FOUND: 'Lesson not found',
} as const;

/**
 * Next signals redirect() and notFound() from a Server Action by throwing an
 * error carrying a `digest`. Those must propagate or the navigation is swallowed
 * and the user is stranded (e.g. a session that expires mid-check must reach the
 * login page, not surface as a generic "something went wrong").
 */
export function isFrameworkNavigation(err: unknown): boolean {
  const digest = (err as { digest?: unknown })?.digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_');
}

/**
 * Turns the sentinel messages the guards throw into something a person can act
 * on. Anything unrecognised falls back to a generic line rather than leaking an
 * internal message or a stack. (In production Next redacts thrown Server Action
 * messages, so tailored, user-facing conditions should be RETURNED as { error }
 * rather than thrown; friendly() still covers the guard sentinels and dev.)
 */
export function friendly(message: string): string {
  if (message.includes(ActionError.UNAUTHENTICATED)) {
    return 'Your session has expired. Please sign in again.';
  }
  if (message.includes(ActionError.FORBIDDEN)) {
    return "You don't have permission to do that.";
  }
  if (message.includes(ActionError.VIEW_AS_READONLY)) {
    return "You're viewing as someone else — exit view-as to make changes.";
  }
  if (message.includes(ActionError.TENANT_INACTIVE)) {
    return 'This academy is switched off, so nothing can be saved. Contact Outdure to switch it back on.';
  }
  if (message.includes(ActionError.TENANT_NOT_FOUND)) {
    return 'That academy could not be found.';
  }
  if (message.includes(ActionError.ENROLLMENT_NOT_FOUND)) {
    return 'We could not find your enrolment for this course. Reload the page and try again.';
  }
  if (message.includes(ActionError.LESSON_NOT_FOUND)) {
    return 'That lesson is no longer part of this course. Reload the page.';
  }
  // Validator messages ('Invalid role.', 'Price cannot be negative.') are
  // already written for humans — short, punctuated, no internals.
  if (message.length < 120 && !message.includes('\n') && !/\bat\s+\//.test(message)) {
    return message;
  }
  return 'Something went wrong. Please reload and try again.';
}
