/** Shared input validators for write paths. Pure + unit-tested. */

/**
 * Parses raw form input to an integer clamped to [min, max], falling back to
 * `fallback` for non-numeric input. Unlike `Math.max(min, Number(x))`, this
 * never propagates NaN — critical for values like quiz points (an integer
 * column) and pass thresholds (a NaN threshold makes `score >= NaN` always
 * false, silently breaking a quiz).
 */
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
