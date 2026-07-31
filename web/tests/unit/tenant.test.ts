import { describe, it, expect, beforeAll } from 'vitest';
import { tenantSlugFromHost, tenantRewritePath } from '@/lib/host';

beforeAll(() => {
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'outdure.app';
});

describe('tenantSlugFromHost', () => {
  it('extracts the subdomain slug', () => {
    expect(tenantSlugFromHost('acme.outdure.app')).toBe('acme');
    expect(tenantSlugFromHost('acme.outdure.app:443')).toBe('acme');
  });

  it('returns null for the apex and www', () => {
    expect(tenantSlugFromHost('outdure.app')).toBeNull();
    expect(tenantSlugFromHost('www.outdure.app')).toBeNull();
  });

  it('returns null for localhost and unknown hosts', () => {
    expect(tenantSlugFromHost('localhost:3000')).toBeNull();
    expect(tenantSlugFromHost('example.com')).toBeNull();
    expect(tenantSlugFromHost(null)).toBeNull();
  });
});

const APEX = 'outdure.app';
const SUB = 'acme.outdure.app';

describe('tenantRewritePath — multi-tenant (no default slug)', () => {
  const at = (host: string, pathname: string) => tenantRewritePath({ host, pathname });

  it('rewrites a subdomain into the tenant tree', () => {
    expect(at(SUB, '/admin')).toBe('/t/acme/admin');
    expect(at(SUB, '/admin/courses')).toBe('/t/acme/admin/courses');
    expect(at(SUB, '/')).toBe('/t/acme');
  });

  it('leaves the apex alone — this is why /admin 404s without a subdomain', () => {
    expect(at(APEX, '/admin')).toBeNull();
    expect(at(APEX, '/admin/certificates')).toBeNull();
    expect(at(APEX, '/')).toBeNull();
  });

  it('never rewrites shared routes, on any host', () => {
    for (const host of [APEX, SUB]) {
      expect(at(host, '/login')).toBeNull();
      expect(at(host, '/signup')).toBeNull();
      expect(at(host, '/verify/abc123')).toBeNull();
      // Email-link landings. Single-use tokens: a rewrite here 404s AND spends
      // the token, so the failure cannot be retried.
      expect(at(host, '/auth/confirm')).toBeNull();
      expect(at(host, '/auth/set-password')).toBeNull();
      expect(at(host, '/api/webhooks/stripe')).toBeNull();
      // Already internal — rewriting again would double the prefix.
      expect(at(host, '/t/acme/admin')).toBeNull();
    }
  });
});

describe('tenantRewritePath — single-tenant mode', () => {
  const at = (host: string, pathname: string) =>
    tenantRewritePath({ host, pathname, defaultSlug: 'outdure' });

  it('serves the academy from the apex, so short URLs resolve', () => {
    expect(at(APEX, '/admin')).toBe('/t/outdure/admin');
    expect(at(APEX, '/admin/certificates')).toBe('/t/outdure/admin/certificates');
    expect(at(APEX, '/learn/fire-safety')).toBe('/t/outdure/learn/fire-safety');
  });

  it('never swallows the /auth email-link landings', () => {
    // The regression this locks in: with DEFAULT_TENANT_SLUG set (production),
    // '/auth/confirm' is neither '/' nor apex-only, so without the SHARED_PREFIXES
    // entry it rewrites to '/t/outdure/auth/confirm' and 404s for every invitee.
    expect(at(APEX, '/auth/confirm')).toBeNull();
    expect(at(APEX, '/auth/confirm?token_hash=x&type=invite')).toBeNull();
    expect(at(APEX, '/auth/set-password')).toBeNull();
    expect(at(APEX, '/auth/auth-code-error')).toBeNull();
    expect(at(SUB, '/auth/confirm')).toBeNull();
  });

  it('keeps the marketing page, platform admin and /dashboard on the apex', () => {
    expect(at(APEX, '/')).toBeNull();
    expect(at(APEX, '/platform')).toBeNull();
    expect(at(APEX, '/platform/anything')).toBeNull();
    expect(at(APEX, '/dashboard')).toBeNull();
  });

  it('still lets a real subdomain win over the default', () => {
    // Multi-tenancy is not disabled by single-tenant mode.
    expect(at(SUB, '/admin')).toBe('/t/acme/admin');
    // Even for the routes held back on the apex.
    expect(at(SUB, '/dashboard')).toBe('/t/acme/dashboard');
  });

  it('ignores a blank or whitespace default', () => {
    expect(tenantRewritePath({ host: APEX, pathname: '/admin', defaultSlug: '' })).toBeNull();
    expect(
      tenantRewritePath({ host: APEX, pathname: '/admin', defaultSlug: null }),
    ).toBeNull();
  });
});
