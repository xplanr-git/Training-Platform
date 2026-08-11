/**
 * Shapes of the jsonb columns the app reads and writes.
 *
 * TYPES only, with no runtime cost. Drizzle returns `unknown` for a jsonb column,
 * so each reader still asserts the shape — but the assertion now names ONE shared
 * type instead of re-typing the same `as { … }` at every call site. A shape change
 * is a single edit here, and TypeScript flags the readers (and the writers typed
 * against it) that no longer fit, instead of the old silent drift.
 */

/** `tenants.branding` — storefront branding. */
export interface Branding {
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string;
}

/** `quizzes.settings` — grading rules. */
export interface QuizSettings {
  passThreshold?: number;
  maxAttempts?: number;
}
