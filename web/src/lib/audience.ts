/**
 * Academy audience — WHO the learner is (installer/dealer/distributor/staff),
 * distinct from training/commercial STATUS. Drives relevance: which training and
 * which pathway a learner sees. `null` = unknown, a legitimate state that must
 * never be silently treated as installer.
 */
export type Audience = 'installer' | 'dealer' | 'distributor' | 'staff' | 'other';

export const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'installer', label: 'Installer / Contractor' },
  { value: 'dealer', label: 'Dealer / Reseller' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'staff', label: 'Outdure / StructureBuild staff' },
  { value: 'other', label: 'Other' },
];

export function isAudience(v: unknown): v is Audience {
  return (
    v === 'installer' || v === 'dealer' || v === 'distributor' || v === 'staff' || v === 'other'
  );
}

export function audienceLabel(a: Audience | null | undefined): string | null {
  if (!a) return null;
  return AUDIENCE_OPTIONS.find((o) => o.value === a)?.label ?? null;
}

/**
 * Whether the installer/contractor pathway (Trained → Verified → Strategic) is
 * relevant to show. Only installers see it; unknown audience does NOT (we don't
 * guess). Dealers/distributors/staff have their own pathways which are not yet
 * defined, so we show none rather than invent one.
 */
export function showsInstallerPathway(a: Audience | null): boolean {
  return a === 'installer';
}
