import { connectRole } from '@/lib/connect-roles';
import type { Audience } from '@/lib/audience';

/**
 * "Required training" is now EXPLICIT DATA, not an inference from a course name
 * or slug: a course carries `requiredForAudiences` (which audiences must complete
 * it). pickRequiredCourse() below reads that. This constant remains ONLY as a
 * backwards-compatibility fallback for an environment whose courses have not yet
 * been seeded with requiredForAudiences (so the requirement panel does not simply
 * vanish before the seed runs). Once every environment is seeded it is dead.
 */
export const CONTRACTOR_REQUIRED_COURSE_SLUG = 'trained-installer-training';

/**
 * The effective audience for REQUIREDNESS. Unknown audience is treated as
 * installer — the default cohort — so a not-yet-onboarded installer still sees
 * their required training (matching the prior behaviour, where null/undefined
 * did not hide the requirement). This is the ONLY place unknown is coerced, and
 * only for the required-training decision; it never affects status or the rest
 * of the experience, where unknown stays neutral.
 */
export function effectiveRequirementAudience(a: Audience | null | undefined): Audience {
  return a ?? 'installer';
}

/**
 * Pick the required course for a learner from the candidate course rows, using
 * explicit data first and the legacy slug only as an unseeded-environment
 * fallback. Pure and UI-agnostic.
 *
 *  - If ANY candidate has requiredForAudiences set (i.e. the data is seeded),
 *    the required course is the one whose list includes the learner's effective
 *    audience — or none, which correctly means "no required training for you".
 *  - If NOTHING is seeded, fall back to the single legacy required slug, shown
 *    to installers/unknown only (the prior audienceAllowsRequirement gate).
 */
export function pickRequiredCourse<
  T extends { slug: string; requiredForAudiences?: readonly string[] | null },
>(candidates: T[], audience: Audience | null | undefined): T | null {
  const seeded = candidates.filter(
    (c) => c.requiredForAudiences && c.requiredForAudiences.length > 0,
  );
  if (seeded.length > 0) {
    const eff = effectiveRequirementAudience(audience);
    return seeded.find((c) => c.requiredForAudiences!.includes(eff)) ?? null;
  }
  if (audience === 'installer' || audience == null) {
    return candidates.find((c) => c.slug === CONTRACTOR_REQUIRED_COURSE_SLUG) ?? null;
  }
  return null;
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
