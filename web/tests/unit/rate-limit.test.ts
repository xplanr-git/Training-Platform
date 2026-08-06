import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  rateLimit,
  rateLimitLocal,
  parseForwardedFor,
  __resetRateLimits,
  RULES,
} from '@/lib/rate-limit';

/**
 * The limiter is pure with an injectable clock, so these are behavioural rather
 * than source assertions — no wall-clock waiting, no flakiness.
 */
describe('rateLimitLocal', () => {
  beforeEach(() => __resetRateLimits());

  const rule = { limit: 3, windowMs: 60_000 };

  it('allows up to the limit and reports what is left', () => {
    expect(rateLimitLocal('a', 'ip1', rule, 1000)).toMatchObject({ ok: true, remaining: 2 });
    expect(rateLimitLocal('a', 'ip1', rule, 1001)).toMatchObject({ ok: true, remaining: 1 });
    expect(rateLimitLocal('a', 'ip1', rule, 1002)).toMatchObject({ ok: true, remaining: 0 });
  });

  it('blocks the one after, with a retry-after', () => {
    for (const t of [1000, 1001, 1002]) rateLimitLocal('a', 'ip1', rule, t);
    const blocked = rateLimitLocal('a', 'ip1', rule, 1003);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('lets the caller back in exactly one window after the oldest hit', () => {
    // The boundary is strict (`t > now - windowMs`), so the hit at 1000 expires
    // at 61_000, not after it. Pinned because an off-by-one here is either a
    // free extra request or a limit that outlasts its stated window.
    for (const t of [1000, 1001, 1002]) rateLimitLocal('a', 'ip1', rule, t);
    expect(rateLimitLocal('a', 'ip1', rule, 60_999).ok, 'one ms early').toBe(false);
    expect(rateLimitLocal('a', 'ip1', rule, 61_000).ok, 'oldest hit has expired').toBe(true);
  });

  it('does NOT extend the window when it blocks', () => {
    /*
     * The trap in a naive implementation: recording the blocked attempt too. A
     * client retrying in a tight loop would then keep pushing the window forward
     * and never be let back in, turning a one-minute limit into a permanent ban.
     */
    for (const t of [1000, 1001, 1002]) rateLimitLocal('a', 'ip1', rule, t);
    for (let t = 1003; t < 60_000; t += 100) rateLimitLocal('a', 'ip1', rule, t);
    expect(rateLimitLocal('a', 'ip1', rule, 61_002).ok).toBe(true);
  });

  it('counts each identifier separately', () => {
    for (const t of [1000, 1001, 1002]) rateLimitLocal('a', 'ip1', rule, t);
    expect(rateLimitLocal('a', 'ip2', rule, 1003).ok).toBe(true);
  });

  it('counts each action separately', () => {
    /*
     * Sharing a bucket across actions would let a burst of password-reset
     * attempts lock the same person out of accepting an invitation.
     */
    for (const t of [1000, 1001, 1002]) rateLimitLocal('passwordReset', 'ip1', rule, t);
    expect(rateLimitLocal('invite', 'ip1', rule, 1003).ok).toBe(true);
  });

  it('reports a shrinking retry-after as the window drains', () => {
    for (const t of [1000, 1001, 1002]) rateLimitLocal('a', 'ip1', rule, t);
    expect(rateLimitLocal('a', 'ip1', rule, 31_000).retryAfterSeconds).toBe(30);
    expect(rateLimitLocal('a', 'ip1', rule, 55_000).retryAfterSeconds).toBe(6);
  });

  it('never reports a retry-after of zero while blocked', () => {
    // A zero would tell a client to retry immediately, producing a hot loop.
    for (const t of [1000, 1001, 1002]) rateLimitLocal('a', 'ip1', rule, t);
    const almost = rateLimitLocal('a', 'ip1', rule, 60_999);
    expect(almost.ok).toBe(false);
    expect(almost.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe('parseForwardedFor', () => {
  it('takes the client, which is the FIRST entry', () => {
    // Taking the last would key every request behind a proxy to one bucket —
    // on Vercel, one bucket for the entire internet.
    expect(parseForwardedFor('203.0.113.9, 70.41.3.18, 150.172.238.178')).toBe('203.0.113.9');
  });

  it('handles a single address and stray whitespace', () => {
    expect(parseForwardedFor('203.0.113.9')).toBe('203.0.113.9');
    expect(parseForwardedFor('  203.0.113.9 , 10.0.0.1')).toBe('203.0.113.9');
  });

  it('falls back to a shared bucket when the header is absent', () => {
    // Over-restricting is the safe direction.
    for (const v of [null, undefined, '', '   ', ',']) {
      expect(parseForwardedFor(v)).toBe('unknown');
    }
  });
});

describe('the shared store', () => {
  /*
   * Counting per-instance meant the real limit was "N per instance per window",
   * and on Vercel a cold start reset it — so spraying requests wide enough to
   * land on fresh instances defeated it. These cover the routing and, more
   * importantly, the failure behaviour: an unreachable store must not take
   * sign-up, invitations and enrolment down with it.
   */
  const realFetch = globalThis.fetch;
  const env = { ...process.env };

  beforeEach(() => __resetRateLimits());
  afterEach(() => {
    globalThis.fetch = realFetch;
    process.env = { ...env };
  });

  const shared = { limit: 2, windowMs: 60_000, shared: true };

  it('is not consulted at all when it is not configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error('should not be reached');
    }) as typeof fetch;

    await expect(rateLimit('a', 'ip1', shared, 1000)).resolves.toMatchObject({ ok: true });
    expect(called, 'no store configured, so no network call').toBe(false);
  });

  it('is not consulted for a rule that does not ask for it', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error('should not be reached');
    }) as typeof fetch;

    // videoProgress is deliberately per-instance: a Redis round trip on every
    // heartbeat of every viewer is not worth it for a storage-cost guard.
    await rateLimit('videoProgress', 'e1', RULES.videoProgress, 1000);
    expect(called).toBe(false);
  });

  it('uses the store verdict when it answers', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    // [allowed, remaining, oldestScore] — blocked, oldest hit at t=1000.
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ result: [0, 0, 1000] }), { status: 200 })) as typeof fetch;

    const r = await rateLimit('a', 'ip1', shared, 31_000);
    expect(r.ok).toBe(false);
    // Derived from the store's oldest score, not from local state.
    expect(r.retryAfterSeconds).toBe(30);
  });

  it('FAILS OPEN to the in-process limiter when the store is unreachable', async () => {
    /*
     * The direction matters. Refusing everybody would turn a Redis blip into a
     * total outage of sign-up, invitations and enrolment; falling back restores
     * exactly the behaviour this app shipped with.
     */
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    globalThis.fetch = (async () => {
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;

    expect((await rateLimit('a', 'ip1', shared, 1000)).ok).toBe(true);
    expect((await rateLimit('a', 'ip1', shared, 1001)).ok).toBe(true);
    // Still counted locally — fail-open means fall back, not stop counting.
    expect((await rateLimit('a', 'ip1', shared, 1002)).ok).toBe(false);
  });

  it('backs off after a failure rather than timing out on every request', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;

    await rateLimit('a', 'ip1', shared, 1000);
    await rateLimit('a', 'ip2', shared, 1001);
    await rateLimit('a', 'ip3', shared, 1002);
    expect(calls, 'one failure should suppress the next attempts').toBe(1);
  });

  it('treats an error body as a failure rather than as a verdict', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'NOSCRIPT' }), { status: 200 })) as typeof fetch;

    // A 200 carrying an error must not be read as "allowed with 0 remaining".
    expect((await rateLimit('a', 'ip1', shared, 1000)).ok).toBe(true);
  });
});

describe('the rules are a policy, not magic numbers', () => {
  it('every rule has a positive limit and window', () => {
    for (const [name, rule] of Object.entries(RULES)) {
      expect(rule.limit, `${name}.limit`).toBeGreaterThan(0);
      expect(rule.windowMs, `${name}.windowMs`).toBeGreaterThan(0);
    }
  });

  it('the rules that guard a real boundary are counted across instances', () => {
    // Account creation, mail, money, and anything that grants something.
    for (const name of [
      'provisionTenant',
      'passwordReset',
      'invite',
      'join',
      'enroll',
      'quizAttempt',
    ] as const) {
      expect(RULES[name].shared, `${name} should be shared`).toBe(true);
    }
  });

  it('the unauthenticated actions are the tightest', () => {
    // Provisioning and joining are reachable by anyone; inviting needs an admin.
    expect(RULES.provisionTenant.limit).toBeLessThan(RULES.invite.limit);
    expect(RULES.join.limit).toBeLessThan(RULES.invite.limit);
  });
});

describe('the limiter is actually applied where it matters', () => {
  const SRC = resolve(process.cwd(), 'src');
  const code = (...p: string[]) =>
    readFileSync(join(SRC, ...p), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

  /*
   * A limiter nothing calls is worse than none, because it reads as covered. One
   * assertion per action that reaches our server and can be repeated cheaply.
   */
  const guarded: Array<[string, string[], string]> = [
    ['academy provisioning', ['app', 'signup', 'actions.ts'], 'provisionTenant'],
    ['password reset', ['app', 'login', 'forgot', 'actions.ts'], 'passwordReset'],
    ['invitations', ['app', 't', '[slug]', 'admin', 'people', 'actions.ts'], 'invite'],
  ];

  for (const [label, path, rule] of guarded) {
    it(`${label} consults the limiter`, () => {
      const src = code(...path);
      expect(src).toMatch(/rateLimitExceeded\(|enforceRateLimit\(/);
      expect(src, `should use RULES.${rule}`).toMatch(new RegExp(`RULES\\.${rule}\\b`));
    });
  }

  it('provisioning is checked before it writes anything', () => {
    const src = code('app', 'signup', 'actions.ts');
    const check = src.indexOf('rateLimitExceeded(');
    const write = src.search(/db\.transaction\(|\.insert\(/);
    expect(check).toBeGreaterThan(-1);
    expect(write).toBeGreaterThan(-1);
    expect(check, 'the limit must be consulted before the first write').toBeLessThan(write);
  });

  it('password reset stays indistinguishable when limited', () => {
    /*
     * The page catches everything and always reports "sent", by design, so this
     * action must not throw — it would stop the mail while telling nobody. It
     * returns the same { ok: true } and logs server-side.
     */
    const src = code('app', 'login', 'forgot', 'actions.ts');
    const at = src.indexOf('rateLimitExceeded(');
    const after = src.slice(at, at + 320);
    expect(after).toMatch(/return \{ ok: true \}/);
    expect(after).not.toMatch(/throw/);
  });

  it('the limiter documents that sign-in is out of reach', () => {
    /*
     * Sign-in is a browser-to-Supabase call (login/page.tsx), so nothing here can
     * count it. If that ever moves server-side this note must change, and the
     * assertion below is what will notice.
     */
    const lib = readFileSync(join(SRC, 'lib', 'rate-limit.ts'), 'utf8');
    expect(lib).toMatch(/signInWithPassword/);
    const loginPage = readFileSync(join(SRC, 'app', 'login', 'page.tsx'), 'utf8');
    expect(
      loginPage,
      'sign-in moved off the client — revisit what the limiter claims to cover',
    ).toMatch(/supabase\.auth\.signInWithPassword/);
  });
});
