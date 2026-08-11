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
 * Plain string constants with no imports, so this module is safe to import from
 * both the server guards and the client NavForm.
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
