import { describe, it, expect } from 'vitest';
import {
  CONTRACTOR_REQUIRED_COURSE_SLUG,
  showsContractorRequirement,
  requirementState,
  requirementAction,
} from '@/lib/contractor-requirement';

/**
 * Slice 1 learner-home logic. These are the pure rules the requirements-led home
 * renders from: which learners see the contractor requirement, what state their
 * required training is in, and the single dominant action for that state.
 */
describe('contractor requirement', () => {
  it('required course is the confirmed contractor training', () => {
    expect(CONTRACTOR_REQUIRED_COURSE_SLUG).toBe('trained-installer-training');
  });

  describe('showsContractorRequirement', () => {
    it('shows for a contractor tier', () => {
      expect(showsContractorRequirement('CON_REGISTERED')).toBe(true);
      expect(showsContractorRequirement('CON_TRAINED')).toBe(true);
    });
    it('shows when no tier is set yet (a brand-new contractor)', () => {
      expect(showsContractorRequirement(null)).toBe(true);
      expect(showsContractorRequirement(undefined)).toBe(true);
    });
    it('hides for a dealer (their requirement is a separate, later model)', () => {
      expect(showsContractorRequirement('DEAL_STOCKIST')).toBe(false);
      expect(showsContractorRequirement('DEAL_RESELLER')).toBe(false);
    });
  });

  describe('requirementState', () => {
    it('not-enrolled when there is no enrolment', () => {
      expect(requirementState({ enrolled: false, done: 0, isComplete: false })).toBe(
        'not-enrolled',
      );
    });
    it('not-started when enrolled with nothing done', () => {
      expect(requirementState({ enrolled: true, done: 0, isComplete: false })).toBe('not-started');
    });
    it('in-progress when some lessons are done', () => {
      expect(requirementState({ enrolled: true, done: 3, isComplete: false })).toBe('in-progress');
    });
    it('complete when the course is complete', () => {
      expect(requirementState({ enrolled: true, done: 26, isComplete: true })).toBe('complete');
    });
  });

  describe('requirementAction', () => {
    const slug = 'trained-installer-training';
    it('starts at the course page when not enrolled', () => {
      expect(requirementAction('not-enrolled', slug)).toEqual({
        label: 'Start training',
        href: `/courses/${slug}`,
      });
    });
    it('starts at the outline when enrolled but not started', () => {
      expect(requirementAction('not-started', slug)).toEqual({
        label: 'Start training',
        href: `/learn/${slug}`,
      });
    });
    it('continues at the outline when in progress', () => {
      expect(requirementAction('in-progress', slug)).toEqual({
        label: 'Continue training',
        href: `/learn/${slug}`,
      });
    });
    it('has no dominant action when complete (neutral Trained state in Slice 1)', () => {
      expect(requirementAction('complete', slug)).toBeNull();
    });
  });
});
