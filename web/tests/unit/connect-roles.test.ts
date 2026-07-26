import { describe, it, expect } from 'vitest';
import { advanceTier, connectRoleLabel } from '@/lib/connect-roles';

describe('advanceTier', () => {
  it('takes the conferred tier when the learner has none', () => {
    expect(advanceTier(null, 'CON_TRAINED')).toBe('CON_TRAINED');
    expect(advanceTier(undefined, 'DEAL_STOCKIST')).toBe('DEAL_STOCKIST');
  });

  it('advances upward within the same group', () => {
    expect(advanceTier('CON_REGISTERED', 'CON_TRAINED')).toBe('CON_TRAINED');
    expect(advanceTier('CON_TRAINED', 'CON_STRATEGIC')).toBe('CON_STRATEGIC');
    expect(advanceTier('DEAL_STOCKIST', 'DEAL_RESELLER')).toBe('DEAL_RESELLER');
  });

  it('never demotes', () => {
    expect(advanceTier('CON_VERIFIED', 'CON_TRAINED')).toBe('CON_VERIFIED');
    expect(advanceTier('CON_TRAINED', 'CON_TRAINED')).toBe('CON_TRAINED');
  });

  it('never crosses groups', () => {
    expect(advanceTier('CON_TRAINED', 'DEAL_RESELLER')).toBe('CON_TRAINED');
    expect(advanceTier('DEAL_STOCKIST', 'CON_STRATEGIC')).toBe('DEAL_STOCKIST');
  });

  it('leaves the tier unchanged when nothing is conferred', () => {
    expect(advanceTier('CON_TRAINED', null)).toBe('CON_TRAINED');
    expect(advanceTier(null, null)).toBeNull();
  });

  it('resolves labels', () => {
    expect(connectRoleLabel('CON_STRATEGIC')).toBe('Strategic Partner');
    expect(connectRoleLabel('DEAL_STOCKIST')).toBe('Stockist');
    expect(connectRoleLabel(null)).toBeNull();
  });
});
