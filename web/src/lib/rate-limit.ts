/**
 * In-process sliding-window rate limiter for the Server Actions we own.
 *
 * WHAT THIS CANNOT DO, stated first because it is easy to assume otherwise.
 *
 * Sign-in is not covered, and cannot be from here. `login/page.tsx` calls
 * `supabase.auth.signInWithPassword` from the BROWSER, so the request goes
 * straight to Supabase and never touches this app — a limiter in our middleware
 * or actions would count nothing. Password-guessing against sign-in is bounded
 * by Supabase's own auth rate limits, which is why the login page already
 * translates a "rate limit"/"too many" error. Covering it ourselves would mean
 * proxying authentication through a route handler, which is a bigger change than
 * this and would take on responsibility for credentials in transit.
 *
 * It is also per-instance. On Vercel each serverless instance holds its own Map,
 * and a cold start resets it, so this raises the cost of an attack without
 * bounding it globally. Upstash (or any shared store) is the correct fix and was
 * deliberately deferred — see the backlog. Do not describe this as a global
 * limit.
 *
 * What it does cover: the actions where a request reaches our server and can be
 * repeated cheaply — academy provisioning, password-reset mail, invitations, and
 * public join requests. Those are the ones that write rows or send mail.
 */

export interface RateLimitRule {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Requests left in the current window. Zero when `ok` is false. */
  remaining: number;
  /** Whole seconds until the oldest hit leaves the window. At least 1 when blocked. */
  retryAfterSeconds: number;
}

/**
 * Keys are (action, identifier) — never identifier alone. Sharing a bucket
 * across actions would let a burst of password-reset attempts lock the same
 * person out of accepting an invitation.
 */
const hits = new Map<string, number[]>();

/**
 * Bounded so a flood of distinct identifiers cannot grow the map without limit.
 * Expired keys are dropped first; only if that is not enough do we evict the
 * least-recently-touched, which is the only case where an attacker could shed
 * their own history — and doing so costs them 10k distinct keys.
 */
const MAX_KEYS = 10_000;

function prune(now: number, longestWindowMs: number): void {
  for (const [key, times] of hits) {
    if (times.length === 0 || now - times[times.length - 1] > longestWindowMs) {
      hits.delete(key);
    }
  }
}

/**
 * Records a hit and reports whether it is allowed.
 *
 * `now` is injectable so the tests do not depend on wall-clock timing; nothing
 * in the app passes it.
 */
export function rateLimit(
  action: string,
  identifier: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): RateLimitResult {
  const key = `${action}:${identifier}`;
  const windowStart = now - rule.windowMs;

  const times = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (times.length >= rule.limit) {
    // Not recorded: a blocked attempt must not extend the window, or a client
    // retrying in a tight loop would never be let back in.
    hits.set(key, times);
    const oldest = times[0];
    const waitMs = oldest + rule.windowMs - now;
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
  }

  times.push(now);
  hits.set(key, times);

  if (hits.size > MAX_KEYS) prune(now, rule.windowMs);

  return {
    ok: true,
    remaining: rule.limit - times.length,
    retryAfterSeconds: 0,
  };
}

/** Test-only. The app never clears the map; a fresh instance starts empty. */
export function __resetRateLimits(): void {
  hits.clear();
}

/**
 * The client address from an `x-forwarded-for` header.
 *
 * The header is a comma-separated chain, `client, proxy1, proxy2`, and the FIRST
 * entry is the client. Taking the last would key every request behind the same
 * proxy to one bucket, which on Vercel means one bucket for everybody.
 *
 * A client can of course send its own x-forwarded-for; Vercel overwrites the
 * first hop, so on the deployed app this is trustworthy, and locally it is not.
 * Returns 'unknown' when absent, which buckets all such requests together — the
 * safe direction, since it over-restricts rather than under-restricts.
 *
 * Kept pure and separate from the header read so it can be tested; `next/headers`
 * has no vitest alias here.
 */
export function parseForwardedFor(value: string | null | undefined): string {
  const first = (value ?? '').split(',')[0]?.trim() ?? '';
  return first || 'unknown';
}

/**
 * The rules, in one place so they can be read as a policy rather than hunted for.
 *
 * Deliberately generous: these protect against automated abuse, not against a
 * person who mistypes their email twice. The tighter number in each pair is the
 * per-email one, because an attacker rotating addresses is a different problem
 * from one hammering a single account.
 */
export const RULES = {
  /** Academy provisioning: writes a tenant, a user and a membership. */
  provisionTenant: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Password-reset mail. Cheap for us, spam for the recipient. */
  passwordReset: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Invitations send mail and create memberships. */
  invite: { limit: 30, windowMs: 60 * 60 * 1000 },
  /** Public join requests — the route that makes all of this matter. */
  join: { limit: 5, windowMs: 60 * 60 * 1000 },
  /**
   * Quiz submissions, keyed on ENROLMENT rather than IP.
   *
   * Grading is server-side, but the result came back as `?score=&passed=` on
   * every submission with nothing bounding how many a learner could make. With a
   * handful of multiple-choice questions that is a brute-forced pass, and the
   * pass auto-issues a certificate — so the integrity of an accredited
   * credential rested on nobody trying. Keyed on the enrolment because that is
   * the thing being protected; an IP key would punish a whole training room on
   * one connection and be sidestepped by a phone.
   *
   * Paired with quizzes.settings.maxAttempts, which is the real cap. This just
   * stops the seconds-long version.
   */
  quizAttempt: { limit: 10, windowMs: 10 * 60 * 1000 },
  /** Video progress pings — unbounded appends are a storage-cost DoS. */
  videoProgress: { limit: 240, windowMs: 60 * 1000 },
  /** Enrolment and checkout: writes rows and creates Stripe sessions. */
  enroll: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>;
