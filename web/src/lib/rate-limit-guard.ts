import 'server-only';
import { headers } from 'next/headers';
import { rateLimit, parseForwardedFor, type RateLimitRule } from './rate-limit';

/**
 * Server-Action-side wrapper: resolves the caller's identity from request
 * headers and applies a rule.
 *
 * Separate from rate-limit.ts so the limiter itself stays unit-testable —
 * `next/headers` throws outside a request scope and has no vitest alias.
 *
 * Read the ceiling on what this protects in rate-limit.ts before relying on it.
 * In short: sign-in is a browser-to-Supabase call and is not covered, and the
 * store is per-instance rather than shared.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  // x-real-ip is what a local reverse proxy tends to set; x-forwarded-for is
  // what Vercel sets. Neither exists under `next dev`, hence the fallback.
  return parseForwardedFor(h.get('x-forwarded-for') ?? h.get('x-real-ip'));
}

/**
 * Records an attempt and returns a message if the caller is over budget, or null
 * if they are not.
 *
 * Returns rather than throws, because the three callers have three different
 * contracts: one returns `{ ok, error }`, one throws, and the password-reset
 * action must stay indistinguishable to the caller whatever happened. A thrown
 * error would be silently swallowed by that third one — its page catches
 * everything and always reports "sent" on purpose — so the limit would have
 * stopped the mail while telling nobody anything. Use `enforceRateLimit` where
 * throwing is the right shape.
 *
 * `scope` narrows the bucket beyond the IP — an email address, usually. Both are
 * counted: an attacker rotating addresses behind one IP and one hammering a
 * single address are different problems, and either alone leaves a gap.
 *
 * The message stays well under NavForm's 120-character friendly() cap, so it
 * reaches the person instead of being replaced by a generic apology.
 */
export async function rateLimitExceeded(
  action: string,
  rule: RateLimitRule,
  scope?: string,
): Promise<string | null> {
  const ip = await clientIp();
  const identifiers = scope ? [`ip:${ip}`, `scope:${scope.toLowerCase()}`] : [`ip:${ip}`];

  for (const identifier of identifiers) {
    const result = rateLimit(action, identifier, rule);
    if (!result.ok) {
      const mins = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
      return `Too many attempts. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`;
    }
  }
  return null;
}

/** As above, but throws — for actions whose failure path is a thrown message. */
export async function enforceRateLimit(
  action: string,
  rule: RateLimitRule,
  scope?: string,
): Promise<void> {
  const message = await rateLimitExceeded(action, rule, scope);
  if (message) throw new Error(message);
}
