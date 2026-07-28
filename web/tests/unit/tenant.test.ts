import { describe, it, expect, beforeAll } from 'vitest';
import { tenantSlugFromHost } from '@/lib/host';

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
