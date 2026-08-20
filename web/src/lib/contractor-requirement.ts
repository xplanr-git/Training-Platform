import { connectRole } from '@/lib/connect-roles';

/**
 * The Academy training a Contractor must complete to satisfy Outdure's required
 * installer training standard.
 *
 * Confirmed business rule: Registered → complete the required installer training
 * → Trained (no staff review). The course is user-facing named "Outdure Installer
 * Training"; the STATUS "Trained" is a separate concept and is not exposed here.
 *
 * Encoded as the course SLUG — a single, human-checkable constant, deliberately
 * NOT a configuration system: Slice 1 has exactly one required course. The slug
 * intentionally stays `trained-installer-training` (a stable internal identifier)
 * even though the display name changed to "Outdure Installer Training": the
 * user-facing name and the internal id do not need to match, and renaming the
 * slug would churn links/references for no functional gain.
 *
 * When the dealer/Product-Champion model is resolved, a second requirement will
 * live alongside this one; that is a later slice, not a reason to generalise now.
 */
export const CONTRACTOR_REQUIRED_COURSE_SLUG = 'trained-installer-training';

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
