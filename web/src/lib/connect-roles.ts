/**
 * Mirror of the Structurebuild Connect user types (its `permissions_user_types`
 * table, seeded in Connect migration 017). The Academy tags learners with these
 * role codes and auto-advances a learner's Contractor/Dealer tier when they
 * complete a course that confers one. Kept in sync with Connect by hand — the
 * two platforms are separate Supabase projects (no live shared table yet).
 */
export interface ConnectRole {
  code: string;
  label: string;
  group: 'Structurebuild' | 'Contractor' | 'Dealer';
  /** Advancement order within a group (higher = more senior). */
  rank: number;
}

export const CONNECT_ROLES: ConnectRole[] = [
  { code: 'STRUCTUREBUILD_SUPER', label: 'Super Admin', group: 'Structurebuild', rank: 100 },
  { code: 'STRUCTUREBUILD_ADMIN', label: 'Admin', group: 'Structurebuild', rank: 90 },
  { code: 'CON_REGISTERED', label: 'Registered', group: 'Contractor', rank: 0 },
  { code: 'CON_TRAINED', label: 'Trained', group: 'Contractor', rank: 1 },
  { code: 'CON_VERIFIED', label: 'Verified', group: 'Contractor', rank: 2 },
  { code: 'CON_STRATEGIC', label: 'Strategic Partner', group: 'Contractor', rank: 3 },
  { code: 'DEAL_STOCKIST', label: 'Stockist', group: 'Dealer', rank: 0 },
  { code: 'DEAL_RESELLER', label: 'Reseller', group: 'Dealer', rank: 1 },
];

const BY_CODE = new Map(CONNECT_ROLES.map((r) => [r.code, r]));

export function connectRole(code: string | null | undefined): ConnectRole | null {
  return code ? (BY_CODE.get(code) ?? null) : null;
}

export function connectRoleLabel(code: string | null | undefined): string | null {
  return connectRole(code)?.label ?? null;
}

/** Tiers a course can confer on completion (Contractor + Dealer only). */
export const CONFERRABLE_TIERS = CONNECT_ROLES.filter(
  (r) => r.group === 'Contractor' || r.group === 'Dealer',
);

/**
 * Given a learner's current role code and the tier a completed course confers,
 * return the resulting code: the conferred tier only if it's a same-group
 * advancement (strictly higher rank), or if the learner had no tier yet.
 * Never crosses groups and never demotes.
 */
export function advanceTier(
  current: string | null | undefined,
  confers: string | null | undefined,
): string | null {
  const next = connectRole(confers);
  if (!next) return current ?? null;
  const cur = connectRole(current);
  if (!cur) return next.code;
  if (cur.group !== next.group) return cur.code;
  return next.rank > cur.rank ? next.code : cur.code;
}
