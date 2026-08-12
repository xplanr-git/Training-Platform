/**
 * Date formatting for anything a person reads.
 *
 * Every one of these sites used to call `toLocaleDateString()` with no arguments.
 * That takes its locale AND its timezone from whatever is rendering it — and these
 * are server components, so on Vercel that resolved to `en-US` in UTC. A
 * certificate issued on 11 August 2026 printed as `8/11/2026`, which an Australian
 * or British reader parses as 8 November. On the public `/verify/:code` page, read
 * by third parties checking someone's credential, an off-by-three-months date is
 * the worst possible defect.
 *
 * Two deliberate choices:
 *
 * - **`en-GB` with a spelled-out or abbreviated month.** The point is not that
 *   British ordering is correct where American is wrong; it is that `11 August
 *   2026` and `11 Aug 2026` cannot be misread by anyone, in any locale. A purely
 *   numeric date always can. Do not "simplify" these back to a numeric format.
 *
 * - **`timeZone: 'UTC'`, pinned explicitly.** The timestamps are stored in UTC, so
 *   formatting in UTC is the only rendering that cannot disagree with the stored
 *   value. Left implicit it inherits the host's zone, which means the same
 *   certificate can show two different days depending on where it is rendered, and
 *   a certificate issued at 23:00 UTC would date a day late for anyone east of
 *   Greenwich. This is currently a no-op on Vercel (which runs UTC) — that is the
 *   point: it stays correct if the host's zone ever changes.
 *
 * Open product question, deliberately NOT decided here: whether a credential
 * should be dated in the issuing academy's local timezone rather than UTC. That
 * needs a tenant-timezone column and an owner decision; pinning UTC makes the
 * current behaviour explicit and deterministic instead of accidental.
 */

const LONG = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const SHORT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Accepts what Drizzle hands back for a timestamp column, plus raw strings. */
type DateInput = Date | string | number;

function toDate(value: DateInput): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * `11 August 2026`. For certificates and anywhere the date is the content rather
 * than a column — it is read once, carefully, and must not be ambiguous.
 */
export function formatDateLong(value: DateInput | null | undefined): string {
  if (value == null) return '—';
  const d = toDate(value);
  return d ? LONG.format(d) : '—';
}

/**
 * `11 Aug 2026`. For table cells and dense lists, where the long month costs
 * column width. Still unambiguous.
 */
export function formatDateShort(value: DateInput | null | undefined): string {
  if (value == null) return '—';
  const d = toDate(value);
  return d ? SHORT.format(d) : '—';
}

/**
 * `5,000`. Same reasoning as the dates, one class down in severity: a bare
 * `Number.toLocaleString()` groups digits using the renderer's locale, so the same
 * plan limit reads "5,000" on Vercel and "5.000" under a German locale. Pinned so
 * the separator is a property of the product rather than of the host.
 */
const COUNT = new Intl.NumberFormat('en-GB');

export function formatCount(value: number): string {
  return Number.isFinite(value) ? COUNT.format(value) : '—';
}
