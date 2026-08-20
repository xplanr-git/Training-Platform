/**
 * Mirror of the Structurebuild Connect user types (its `permissions_user_types`
 * table, seeded in Connect migration 017). The Academy tags learners with these
 * role codes and, WHERE AUTHORISED, auto-advances a learner's Contractor tier
 * when they complete a course that confers one. Kept in sync with Connect by
 * hand — the two platforms are separate Supabase projects (no live shared table
 * yet).
 *
 * IMPORTANT — these codes are NOT one universal "ladder". They belong to
 * different concept layers with different mechanisms (see `conferral`):
 *   Registered        — a contractor's entry business status (Connect account)
 *   Trained           — TRAINING-earned status (the one a course may confer)
 *   Verified          — a SEPARATE, staff-reviewed status (Outdure/Andrea), from
 *                       evidence of a real installation — never training-earned
 *   Strategic Partner — an Outdure-SELECTED commercial designation — never earned
 *   Reseller/Stockist — DEALER commercial levels (Reseller → Stockist)
 * `rank` is an internal ordering used only to prevent DEMOTION within a group; it
 * is not a claim that these are equivalent progressive training levels.
 */

/** How a role code is arrived at — the load-bearing business distinction. */
export type Conferral =
  | 'entry' // an account/registration state, not conferred by anything here
  | 'training' // earned by completing required training — course-conferrable
  | 'staff-review' // granted by Outdure staff review (Verified) — never a course
  | 'outdure-selected' // granted by Outdure selection (Strategic Partner)
  | 'commercial' // a commercial relationship level (dealer Reseller/Stockist)
  | 'internal'; // Structurebuild platform roles

export interface ConnectRole {
  code: string;
  label: string;
  group: 'Structurebuild' | 'Contractor' | 'Dealer';
  /** Ordering within a group — used ONLY to prevent demotion, not to assert a
   *  universal training ladder (higher = more senior within the group). */
  rank: number;
  conferral: Conferral;
}

export const CONNECT_ROLES: ConnectRole[] = [
  {
    code: 'STRUCTUREBUILD_SUPER',
    label: 'Super Admin',
    group: 'Structurebuild',
    rank: 100,
    conferral: 'internal',
  },
  {
    code: 'STRUCTUREBUILD_ADMIN',
    label: 'Admin',
    group: 'Structurebuild',
    rank: 90,
    conferral: 'internal',
  },
  { code: 'CON_REGISTERED', label: 'Registered', group: 'Contractor', rank: 0, conferral: 'entry' },
  { code: 'CON_TRAINED', label: 'Trained', group: 'Contractor', rank: 1, conferral: 'training' },
  {
    code: 'CON_VERIFIED',
    label: 'Verified',
    group: 'Contractor',
    rank: 2,
    conferral: 'staff-review',
  },
  {
    code: 'CON_STRATEGIC',
    label: 'Strategic Partner',
    group: 'Contractor',
    rank: 3,
    conferral: 'outdure-selected',
  },
  // Dealer commercial progression is Reseller → Stockist (Reseller is the entry
  // level; Stockist is the senior objective). These are commercial levels, never
  // training-conferred.
  { code: 'DEAL_RESELLER', label: 'Reseller', group: 'Dealer', rank: 0, conferral: 'commercial' },
  { code: 'DEAL_STOCKIST', label: 'Stockist', group: 'Dealer', rank: 1, conferral: 'commercial' },
];

const BY_CODE = new Map(CONNECT_ROLES.map((r) => [r.code, r]));

export function connectRole(code: string | null | undefined): ConnectRole | null {
  return code ? (BY_CODE.get(code) ?? null) : null;
}

export function connectRoleLabel(code: string | null | undefined): string | null {
  return connectRole(code)?.label ?? null;
}

/** Conferral mechanisms a course may NEVER produce: a status that is granted by
 *  Outdure staff review (Verified) or by Outdure selection (Strategic Partner).
 *  Keyed on the mechanism, not the code, so any future staff/selected status is
 *  covered automatically. This is the confirmed, load-bearing business rule. */
const NON_COURSE_CONFERRAL: ReadonlySet<Conferral> = new Set<Conferral>([
  'staff-review',
  'outdure-selected',
]);

/**
 * Tiers a course may be configured to confer on completion — i.e. the
 * Contractor/Dealer tiers MINUS the ones a course must never confer (Verified,
 * Strategic Partner). This drives both the admin "confers tier" options AND its
 * submit validation, so those two statuses cannot even be selected. (This is the
 * minimum correction: dealer commercial levels are left as-is — the dealer model
 * is out of scope here — only Verified/Strategic are removed.)
 */
export const CONFERRABLE_TIERS = CONNECT_ROLES.filter(
  (r) =>
    (r.group === 'Contractor' || r.group === 'Dealer') && !NON_COURSE_CONFERRAL.has(r.conferral),
);

/**
 * Given a learner's current role code and the tier a completed course confers,
 * return the resulting code.
 *
 * Any conferred status whose mechanism is staff-review (Verified) or
 * Outdure-selected (Strategic Partner) is REFUSED outright, keeping the learner's
 * current tier — this is the guard that stops course completion, or a mis-set
 * `confers_role_code` (including the known production `CON_VERIFIED`
 * misconfiguration), from ever producing an unauthorised status. Otherwise the
 * conferred tier applies only as a same-group advancement (strictly higher rank)
 * and never demotes.
 */
export function advanceTier(
  current: string | null | undefined,
  confers: string | null | undefined,
): string | null {
  const next = connectRole(confers);
  if (!next || NON_COURSE_CONFERRAL.has(next.conferral)) return current ?? null;
  const cur = connectRole(current);
  if (!cur) return next.code;
  if (cur.group !== next.group) return cur.code;
  return next.rank > cur.rank ? next.code : cur.code;
}
