import { connectRole } from '@/lib/connect-roles';
import type { Audience } from '@/lib/audience';

/**
 * The canonical slug of the installer training course. Kept as a documented
 * identifier (the seed script marks THIS course required for installers), NOT as
 * a source of "required" meaning — requiredness is read from data (see
 * pickRequiredCourse). Nothing infers "required" from this slug any more.
 */
export const CONTRACTOR_REQUIRED_COURSE_SLUG = 'trained-installer-training';

/**
 * Pick the required course for a learner — PURELY from explicit data. A course is
 * required only for the audiences listed in its `requiredForAudiences`. Pure and
 * UI-agnostic.
 *
 * Deliberately has NO slug/name inference and NO "unknown → installer" coercion:
 *
 *  - A KNOWN audience returns the course explicitly marked required for it (or
 *    null — an honest "nothing required for you").
 *  - An UNKNOWN audience (null/undefined) returns null. Unknown is NEVER treated
 *    as installer: the learner gets the neutral first-use audience question
 *    instead of being shown installer-required training as though identified.
 *  - An UNSEEDED environment (no course carries requiredForAudiences) returns
 *    null for everyone — an honest unconfigured state, never a slug-inferred
 *    requirement. The deploy seed (seed-required-training.mjs) configures this;
 *    it must run as part of the release (see the deploy runbook).
 */
export function pickRequiredCourse<
  T extends { slug: string; requiredForAudiences?: readonly string[] | null },
>(candidates: T[], audience: Audience | null | undefined): T | null {
  if (!audience) return null;
  return candidates.find((c) => c.requiredForAudiences?.includes(audience)) ?? null;
}

export type RequirementState = 'not-enrolled' | 'not-started' | 'in-progress' | 'complete';

/**
 * Whether this learner should see the Contractor training requirement.
 *
 * Contractor-first slice: everyone EXCEPT a learner positively identified as a
 * Dealer sees the contractor requirement — a brand-new contractor commonly has no
 * tier set yet (null), so null must NOT hide the requirement. The dealer
 * requirement is a separate, unresolved model (future slice); dealers get the
 * neutral "your courses" view instead of a contractor requirement that is not
 * theirs.
 *
 * `connectRoleCode` is read server-side only and is NEVER shown to the learner.
 */
export function showsContractorRequirement(connectRoleCode: string | null | undefined): boolean {
  return connectRole(connectRoleCode)?.group !== 'Dealer';
}

/** Map enrolment + derived progress to a requirement state. Pure. */
export function requirementState(input: {
  enrolled: boolean;
  done: number;
  isComplete: boolean;
}): RequirementState {
  if (!input.enrolled) return 'not-enrolled';
  if (input.isComplete) return 'complete';
  if (input.done > 0) return 'in-progress';
  return 'not-started';
}

/**
 * The ONE dominant next action for the requirement (or null when complete —
 * the Trained state is deliberately neutral in Slice 1, with no certification
 * consequence). A learner who is not yet enrolled starts at the course page
 * (where the existing enrol flow lives); an enrolled learner goes straight to
 * the course outline, which resolves the exact resume lesson.
 */
export function requirementAction(
  state: RequirementState,
  courseSlug: string,
): { label: string; href: string } | null {
  switch (state) {
    case 'not-enrolled':
      return { label: 'Start training', href: `/courses/${courseSlug}` };
    case 'not-started':
      return { label: 'Start training', href: `/learn/${courseSlug}` };
    case 'in-progress':
      return { label: 'Continue training', href: `/learn/${courseSlug}` };
    case 'complete':
      return null;
  }
}
