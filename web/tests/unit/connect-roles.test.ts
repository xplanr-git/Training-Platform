import { describe, it, expect } from 'vitest';
import { advanceTier, connectRoleLabel, connectRole, CONFERRABLE_TIERS } from '@/lib/connect-roles';

describe('advanceTier', () => {
  it('takes the conferred tier when the learner has none', () => {
    expect(advanceTier(null, 'CON_TRAINED')).toBe('CON_TRAINED');
  });

  it('advances upward within the same group', () => {
    expect(advanceTier('CON_REGISTERED', 'CON_TRAINED')).toBe('CON_TRAINED');
  });

  it('never demotes', () => {
    expect(advanceTier('CON_VERIFIED', 'CON_TRAINED')).toBe('CON_VERIFIED');
    expect(advanceTier('CON_TRAINED', 'CON_TRAINED')).toBe('CON_TRAINED');
  });

  it('never crosses groups', () => {
    expect(advanceTier('CON_TRAINED', 'DEAL_RESELLER')).toBe('CON_TRAINED');
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

/**
 * Confirmed business rule (pre-Slice-2 correction): a course may NEVER confer a
 * staff-reviewed status (Verified) or an Outdure-selected designation (Strategic
 * Partner). Registered/Trained/Verified/Strategic are NOT one training ladder.
 */
describe('a course cannot confer a non-training status', () => {
  it('refuses to confer CON_VERIFIED (staff-reviewed) — even from a mis-set course', () => {
    expect(advanceTier(null, 'CON_VERIFIED')).toBeNull();
    expect(advanceTier('CON_REGISTERED', 'CON_VERIFIED')).toBe('CON_REGISTERED');
    expect(advanceTier('CON_TRAINED', 'CON_VERIFIED')).toBe('CON_TRAINED');
  });

  it('refuses to confer CON_STRATEGIC (Outdure-selected)', () => {
    expect(advanceTier(null, 'CON_STRATEGIC')).toBeNull();
    expect(advanceTier('CON_TRAINED', 'CON_STRATEGIC')).toBe('CON_TRAINED');
    expect(advanceTier('CON_VERIFIED', 'CON_STRATEGIC')).toBe('CON_VERIFIED');
  });

  it('still confers CON_TRAINED (the training-earned status) as normal', () => {
    expect(advanceTier('CON_REGISTERED', 'CON_TRAINED')).toBe('CON_TRAINED');
    expect(advanceTier(null, 'CON_TRAINED')).toBe('CON_TRAINED');
  });

  it('excludes Verified and Strategic Partner from the admin conferrable options', () => {
    const codes = CONFERRABLE_TIERS.map((t) => t.code);
    expect(codes).not.toContain('CON_VERIFIED');
    expect(codes).not.toContain('CON_STRATEGIC');
    expect(codes).toContain('CON_TRAINED');
  });
});

/**
 * Confirmed commercial progression is Reseller → Stockist (Reseller is the entry
 * level; Stockist is the senior objective). The code rank must reflect that.
 */
describe('dealer commercial progression is Reseller → Stockist', () => {
  it('ranks Stockist above Reseller', () => {
    const reseller = connectRole('DEAL_RESELLER');
    const stockist = connectRole('DEAL_STOCKIST');
    expect(reseller && stockist && reseller.rank < stockist.rank).toBe(true);
  });

  it('a Reseller advances to Stockist, and a Stockist is never demoted to Reseller', () => {
    expect(advanceTier('DEAL_RESELLER', 'DEAL_STOCKIST')).toBe('DEAL_STOCKIST');
    expect(advanceTier('DEAL_STOCKIST', 'DEAL_RESELLER')).toBe('DEAL_STOCKIST');
  });
});
