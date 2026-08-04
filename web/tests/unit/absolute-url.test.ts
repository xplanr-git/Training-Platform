import { describe, it, expect, afterEach } from 'vitest';
import { absoluteUrl, absoluteUrlMisconfigured } from '@/lib/absolute-url';

/**
 * Regression cover for a misconfiguration that reached production silently.
 *
 * NEXT_PUBLIC_ROOT_DOMAIN was deployed as `localhost:3010`. Routing still worked
 * (an unmatched host is treated as the apex, and DEFAULT_TENANT_SLUG takes over)
 * and cookies fell back to host-only, so auth worked too. The only casualty was
 * absolute URLs: password-reset emails linked to localhost, and every
 * certificate issued in that window baked an unreachable verification URL into
 * its credential JSON — permanently, because that value is persisted at issue.
 */
const ORIGINAL_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const ORIGINAL_ENV = process.env.NODE_ENV;

function setEnv(domain: string, nodeEnv: string) {
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = domain;
  // NODE_ENV is readonly in the Node types but writable at runtime.
  (process.env as Record<string, string>).NODE_ENV = nodeEnv;
}

afterEach(() => {
  if (ORIGINAL_DOMAIN === undefined) delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  else process.env.NEXT_PUBLIC_ROOT_DOMAIN = ORIGINAL_DOMAIN;
  (process.env as Record<string, string>).NODE_ENV = ORIGINAL_ENV ?? 'test';
});

describe('absoluteUrl', () => {
  it('builds an https URL from the deployed host', () => {
    setEnv('training.structurebuild.co', 'production');
    expect(absoluteUrl('/verify/abc')).toBe('https://training.structurebuild.co/verify/abc');
    expect(absoluteUrlMisconfigured()).toBe(false);
  });

  it('adds the leading slash when a caller omits it', () => {
    setEnv('training.structurebuild.co', 'production');
    expect(absoluteUrl('login')).toBe('https://training.structurebuild.co/login');
  });

  it('REFUSES a localhost origin in a production build', () => {
    // The whole point: a link nobody outside the build machine can open must not
    // be silently emailed or persisted into a credential.
    setEnv('localhost:3010', 'production');
    expect(absoluteUrlMisconfigured()).toBe(true);
    expect(() => absoluteUrl('/auth/confirm')).toThrow(/NEXT_PUBLIC_ROOT_DOMAIN/);
    expect(() => absoluteUrl('/auth/confirm')).toThrow(/redeploy/);
  });

  it('refuses loopback spellings too', () => {
    for (const host of ['127.0.0.1:3010', 'localhost', '127.0.0.1']) {
      setEnv(host, 'production');
      expect(absoluteUrlMisconfigured(), host).toBe(true);
      expect(() => absoluteUrl('/x'), host).toThrow();
    }
  });

  it('allows localhost outside production, so local dev is unaffected', () => {
    setEnv('localhost:3010', 'development');
    expect(absoluteUrl('/auth/confirm')).toBe('http://localhost:3010/auth/confirm');
    expect(absoluteUrlMisconfigured()).toBe(false);
  });

  it('does not mistake a real host that merely contains "localhost"', () => {
    setEnv('localhost.structurebuild.co', 'production');
    expect(absoluteUrlMisconfigured()).toBe(false);
    expect(absoluteUrl('/x')).toBe('https://localhost.structurebuild.co/x');
  });
});
