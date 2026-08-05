import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { rateLimit, parseForwardedFor, __resetRateLimits, RULES } from '@/lib/rate-limit';

/**
 * The limiter is pure with an injectable clock, so these are behavioural rather
 * than source assertions — no wall-clock waiting, no flakiness.
 */
describe('rateLimit', () => {
  beforeEach(() => __resetRateLimits());

  const rule = { limit: 3, windowMs: 60_000 };

  it('allows up to the limit and reports what is left', () => {
    expect(rateLimit('a', 'ip1', rule, 1000)).toMatchObject({ ok: true, remaining: 2 });
    expect(rateLimit('a', 'ip1', rule, 1001)).toMatchObject({ ok: true, remaining: 1 });
    expect(rateLimit('a', 'ip1', rule, 1002)).toMatchObject({ ok: true, remaining: 0 });
  });

  it('blocks the one after, with a retry-after', () => {
    for (const t of [1000, 1001, 1002]) rateLimit('a', 'ip1', rule, t);
    const blocked = rateLimit('a', 'ip1', rule, 1003);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('lets the caller back in exactly one window after the oldest hit', () => {
    // The boundary is strict (`t > now - windowMs`), so the hit at 1000 expires
    // at 61_000, not after it. Pinned because an off-by-one here is either a
    // free extra request or a limit that outlasts its stated window.
    for (const t of [1000, 1001, 1002]) rateLimit('a', 'ip1', rule, t);
    expect(rateLimit('a', 'ip1', rule, 60_999).ok, 'one ms early').toBe(false);
    expect(rateLimit('a', 'ip1', rule, 61_000).ok, 'oldest hit has expired').toBe(true);
  });

  it('does NOT extend the window when it blocks', () => {
    /*
     * The trap in a naive implementation: recording the blocked attempt too. A
     * client retrying in a tight loop would then keep pushing the window forward
     * and never be let back in, turning a one-minute limit into a permanent ban.
     */
    for (const t of [1000, 1001, 1002]) rateLimit('a', 'ip1', rule, t);
    for (let t = 1003; t < 60_000; t += 100) rateLimit('a', 'ip1', rule, t);
    expect(rateLimit('a', 'ip1', rule, 61_002).ok).toBe(true);
  });

  it('counts each identifier separately', () => {
    for (const t of [1000, 1001, 1002]) rateLimit('a', 'ip1', rule, t);
    expect(rateLimit('a', 'ip2', rule, 1003).ok).toBe(true);
  });

  it('counts each action separately', () => {
    /*
     * Sharing a bucket across actions would let a burst of password-reset
     * attempts lock the same person out of accepting an invitation.
     */
    for (const t of [1000, 1001, 1002]) rateLimit('passwordReset', 'ip1', rule, t);
    expect(rateLimit('invite', 'ip1', rule, 1003).ok).toBe(true);
  });

  it('reports a shrinking retry-after as the window drains', () => {
    for (const t of [1000, 1001, 1002]) rateLimit('a', 'ip1', rule, t);
    expect(rateLimit('a', 'ip1', rule, 31_000).retryAfterSeconds).toBe(30);
    expect(rateLimit('a', 'ip1', rule, 55_000).retryAfterSeconds).toBe(6);
  });

  it('never reports a retry-after of zero while blocked', () => {
    // A zero would tell a client to retry immediately, producing a hot loop.
    for (const t of [1000, 1001, 1002]) rateLimit('a', 'ip1', rule, t);
    const almost = rateLimit('a', 'ip1', rule, 60_999);
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

describe('the rules are a policy, not magic numbers', () => {
  it('every rule has a positive limit and window', () => {
    for (const [name, rule] of Object.entries(RULES)) {
      expect(rule.limit, `${name}.limit`).toBeGreaterThan(0);
      expect(rule.windowMs, `${name}.windowMs`).toBeGreaterThan(0);
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
