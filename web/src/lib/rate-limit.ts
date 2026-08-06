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
 * It is per-instance UNLESS a shared store is configured. Set
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN and every rule marked
 * `shared` is counted across all instances in one atomic Redis sliding window;
 * without them each serverless instance holds its own Map and a cold start
 * resets it, which raises the cost of an attack without bounding it. So the
 * honest description depends on deployment — check whether those variables are
 * set before calling the limit global.
 *
 * If the shared store is unreachable it FAILS OPEN to the in-process map, which
 * is a deliberate choice: refusing everybody would turn a Redis blip into a
 * total outage of sign-up, invitations and enrolment.
 *
 * What it covers: the actions where a request reaches our server and can be
 * repeated cheaply — academy provisioning, password-reset mail, invitations,
 * public join requests, enrolment and checkout, quiz submissions, and video
 * heartbeats. Those are the ones that write rows, send mail, spend money at a
 * third party, or grant something.
 */

export interface RateLimitRule {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /**
   * Count this rule across ALL instances, when a shared store is configured.
   *
   * Not every rule wants it. A shared store means a network round trip on every
   * call, so it is right for the rules that guard a real boundary (account
   * creation, mail, money) and wrong for high-frequency cost guards like video
   * heartbeats, where per-instance counting is adequate and one Redis call per
   * learner every fifteen seconds is not.
   */
  shared?: boolean;
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
 * Records a hit against the in-process map and reports whether it is allowed.
 *
 * `now` is injectable so the tests do not depend on wall-clock timing; nothing
 * in the app passes it.
 *
 * Kept synchronous and exported so it stays directly unit-testable, and so it
 * can serve as the fallback when the shared store is absent or unreachable.
 */
export function rateLimitLocal(
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

/* ── Shared store ────────────────────────────────────────────────────────── */

/**
 * Counting across instances.
 *
 * The in-process map above is per-instance, and on Vercel a cold start resets
 * it — so the limit was "N per instance per window", which raises the cost of an
 * attack without bounding it. Spraying requests wide enough to land on fresh
 * instances defeated it entirely.
 *
 * Configured by UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN. With neither
 * set, everything falls back to the in-process map and behaves exactly as
 * before, so nothing has to change for local development or a self-hosted run.
 */
function sharedStoreConfigured(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/**
 * One atomic sliding window, evaluated inside Redis.
 *
 * A read-then-write from the application would race between instances — which
 * is the very thing the shared store exists to fix — so the whole decision is
 * one EVAL. Returns {allowed, remaining, oldestScore}.
 */
const SLIDING_WINDOW_LUA = `
local key    = KEYS[1]
local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit  = tonumber(ARGV[3])
local member = ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return {0, 0, tonumber(oldest[2]) or now}
end
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window)
return {1, limit - count - 1, 0}
`.trim();

/** Set by the first failure so a down store is not retried on every request. */
let sharedStoreDisabledUntil = 0;

async function rateLimitShared(
  cfg: { url: string; token: string },
  action: string,
  identifier: string,
  rule: RateLimitRule,
  now: number,
): Promise<RateLimitResult | null> {
  if (now < sharedStoreDisabledUntil) return null;

  const key = `rl:${action}:${identifier}`;
  // Unique per hit, so two calls in the same millisecond are two members rather
  // than one overwritten score.
  const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const res = await fetch(`${cfg.url}/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        SLIDING_WINDOW_LUA,
        '1',
        key,
        String(now),
        String(rule.windowMs),
        String(rule.limit),
        member,
      ]),
      // A limiter must never become the slowest thing in the request.
      signal: AbortSignal.timeout(1000),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);

    const body = (await res.json()) as { result?: [number, number, number]; error?: string };
    if (body.error || !Array.isArray(body.result)) throw new Error(body.error ?? 'bad response');

    const [allowed, remaining, oldest] = body.result;
    if (allowed === 1) return { ok: true, remaining: Number(remaining), retryAfterSeconds: 0 };

    const waitMs = Number(oldest) + rule.windowMs - now;
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
  } catch (e) {
    /*
     * FAIL OPEN, to the in-process limiter.
     *
     * Deliberate, and the direction matters. If the store is unreachable the
     * choice is between refusing everybody and counting per-instance for a
     * while. Refusing everybody turns a Redis blip into a total outage of
     * sign-up, invitations and enrolment; falling back restores exactly the
     * behaviour this app shipped with. Neither is ideal, and the second is
     * plainly less bad.
     *
     * Backed off for a minute so one outage does not add a failed round trip
     * (and its timeout) to every subsequent request.
     */
    sharedStoreDisabledUntil = now + 60_000;
    console.error('[rate-limit] shared store unavailable, falling back per-instance:', e);
    return null;
  }
}

/**
 * Records a hit and reports whether it is allowed.
 *
 * Uses the shared store when one is configured AND the rule asks for it;
 * otherwise, and on any store failure, the in-process map.
 */
export async function rateLimit(
  action: string,
  identifier: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  const cfg = rule.shared ? sharedStoreConfigured() : null;
  if (cfg) {
    const result = await rateLimitShared(cfg, action, identifier, rule, now);
    if (result) return result;
  }
  return rateLimitLocal(action, identifier, rule, now);
}

/**
 * Test-only. The app never clears this; a fresh instance starts empty.
 *
 * Resets the shared-store backoff as well as the map. Both are module state, and
 * leaving the backoff set made tests order-dependent: a test that tripped it
 * silently suppressed the store in every test that ran afterwards.
 */
export function __resetRateLimits(): void {
  hits.clear();
  sharedStoreDisabledUntil = 0;
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
  provisionTenant: { limit: 3, windowMs: 60 * 60 * 1000, shared: true },
  /** Password-reset mail. Cheap for us, spam for the recipient. */
  passwordReset: { limit: 5, windowMs: 15 * 60 * 1000, shared: true },
  /** Invitations send mail and create memberships. */
  invite: { limit: 30, windowMs: 60 * 60 * 1000, shared: true },
  /** Public join requests — the route that makes all of this matter. */
  join: { limit: 5, windowMs: 60 * 60 * 1000, shared: true },
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
  quizAttempt: { limit: 10, windowMs: 10 * 60 * 1000, shared: true },
  /**
   * Video progress pings — unbounded appends are a storage-cost DoS.
   *
   * Deliberately NOT shared. The player beats every ~15s per learner, so a
   * shared store would mean a Redis round trip on every heartbeat of every
   * viewer — added latency and request cost for a guard against storage waste,
   * not against a security boundary. Per-instance is adequate here.
   */
  videoProgress: { limit: 240, windowMs: 60 * 1000 },
  /** Enrolment and checkout: writes rows and creates Stripe sessions. */
  enroll: { limit: 20, windowMs: 60 * 60 * 1000, shared: true },
} as const satisfies Record<string, RateLimitRule>;
