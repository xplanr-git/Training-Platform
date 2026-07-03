const RESERVED = new Set([
  'www', 'app', 'api', 'admin', 'platform', 'auth', 'login', 'signup',
  'dashboard', 'account', 'verify', 'static', 'assets', 'mail', 'blog',
]);

/** Normalises free text into a candidate subdomain slug. */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

/**
 * Validates a slug for use as a tenant subdomain. Returns an error message, or
 * null if valid. Rules: 3–63 chars, lowercase alphanumeric + internal hyphens,
 * not reserved.
 */
export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return 'Slug must be at least 3 characters.';
  if (slug.length > 63) return 'Slug must be at most 63 characters.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return 'Use lowercase letters, numbers, and single hyphens only.';
  }
  if (RESERVED.has(slug)) return 'That subdomain is reserved.';
  return null;
}
