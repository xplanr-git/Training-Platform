/** Shared input validators for write paths. Pure + unit-tested. */

/**
 * Parses raw form input to an integer clamped to [min, max], falling back to
 * `fallback` for non-numeric input. Unlike `Math.max(min, Number(x))`, this
 * never propagates NaN — critical for values like quiz points (an integer
 * column) and pass thresholds (a NaN threshold makes `score >= NaN` always
 * false, silently breaking a quiz).
 */
/**
 * Optional per-lesson time estimate, in minutes. Blank/invalid means "the
 * author didn't estimate this one" → null (the UI then falls back to showing
 * lessons remaining instead of a time). Clamped to a sane 1..1440.
 */
export function parseOptionalMinutes(
  raw: FormDataEntryValue | string | null | undefined,
): number | null {
  const s = typeof raw === 'string' ? raw.trim() : raw;
  if (s === '' || s === null || s === undefined) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(1440, Math.max(1, Math.round(n)));
}

export function clampInt(
  raw: FormDataEntryValue | string | null | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  // Blank / missing means "not provided" → fallback. (Number('') is 0, not
  // NaN, so this guard must come before coercion.)
  const s = typeof raw === 'string' ? raw.trim() : raw;
  if (s === '' || s === null || s === undefined) return fallback;
  const n = Number(s);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Returns the URL only if it is an absolute http(s) URL, else null. Guards
 * against `javascript:` / `data:` URLs reaching an `href` or `<iframe src>`
 * (stored XSS), and against relative/garbage values. Used wherever a
 * user-supplied URL (PDF link, logo) is rendered.
 */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export function isCourseStatus(value: string): value is CourseStatus {
  return (COURSE_STATUSES as readonly string[]).includes(value);
}

/**
 * The roles a tenant admin may assign. `platform_admin` is deliberately absent:
 * it grants sight of every academy and the power to suspend them, so it is
 * seeded out of band (DEPLOY.md §3) and must never be reachable from a
 * tenant-scoped write.
 *
 * This has to be checked at runtime. The role arrives from the caller on a
 * Server Action, and a TypeScript annotation — `formData.get('role') as
 * InviteRole` — is erased at compile time, so it constrains nothing. The
 * membership_role enum in Postgres *does* include platform_admin and would have
 * accepted it.
 */
export const ASSIGNABLE_ROLES = ['company_admin', 'instructor', 'learner'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignableRole(value: unknown): value is AssignableRole {
  return (
    typeof value === 'string' && (ASSIGNABLE_ROLES as readonly string[]).includes(value)
  );
}

/** Narrows untrusted input to an assignable role, or throws. */
export function parseAssignableRole(raw: unknown): AssignableRole {
  if (!isAssignableRole(raw)) throw new Error('Invalid role.');
  return raw;
}

/**
 * Membership statuses an admin may set. `invited` is absent — it is only ever
 * written when an invitation is created, and letting it be set again would push
 * an active member back into a pending state.
 */
export const SETTABLE_MEMBER_STATUSES = ['active', 'deactivated'] as const;
export type SettableMemberStatus = (typeof SETTABLE_MEMBER_STATUSES)[number];

export function parseMemberStatus(raw: unknown): SettableMemberStatus {
  if (
    typeof raw !== 'string' ||
    !(SETTABLE_MEMBER_STATUSES as readonly string[]).includes(raw)
  ) {
    throw new Error('Invalid status.');
  }
  return raw as SettableMemberStatus;
}

/**
 * Parses a course price from raw form input into a normalized decimal string
 * (or null for a free course). Rejects negatives, non-numbers, and absurd
 * values so bad data never reaches the `numeric` column or Stripe's
 * `unit_amount`. A price of 0 (or blank) means free → null.
 */
export function parsePrice(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error('Price must be a number.');
  if (n < 0) throw new Error('Price cannot be negative.');
  if (n > 1_000_000) throw new Error('Price is too large.');
  if (n === 0) return null;
  // Reject sub-cent precision rather than silently rounding money.
  if (Math.round(n * 100) !== n * 100) {
    throw new Error('Price can have at most 2 decimal places.');
  }
  return (n).toFixed(2);
}
