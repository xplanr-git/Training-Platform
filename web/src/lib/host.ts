import { env } from '@/lib/env';

/**
 * Pure host-parsing helpers. Kept separate from lib/tenant.ts on purpose:
 * middleware runs in the Edge runtime and needs `tenantSlugFromHost`, while
 * lib/tenant.ts imports the Drizzle client to check tenant status. Importing
 * that from middleware drags the Postgres driver into the Edge bundle — Node
 * APIs it cannot use, and ~38 kB on every cold start.
 */

/**
 * Extracts the tenant slug from a request host.
 *   acme.outdure.app        -> "acme"
 *   acme.localhost:3000      -> "acme"
 *   outdure.app / localhost  -> null (apex / platform)
 */
export function tenantSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const root = env.rootDomain();
  const hostname = host.split(':')[0];
  const rootHostname = root.split(':')[0];

  if (hostname === rootHostname || hostname === `www.${rootHostname}`) return null;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;

  if (hostname.endsWith(`.${rootHostname}`)) {
    const sub = hostname.slice(0, -(rootHostname.length + 1));
    return sub || null;
  }
  return null;
}

/**
 * Routes that render the same on every host and must never be rewritten into a
 * tenant: auth, public certificate verification, API handlers, and the internal
 * `/t/...` tree itself.
 */
const SHARED_PREFIXES = ['/login', '/signup', '/verify', '/api', '/t/'];

/**
 * Routes that stay on the apex even in single-tenant mode. `/platform` is
 * cross-tenant by definition, `/dashboard` already routes by membership, and
 * `/` is the marketing page. On a tenant *subdomain* these still rewrite, which
 * preserves the existing behaviour there.
 */
const APEX_ONLY_PREFIXES = ['/platform', '/dashboard'];

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) =>
    // A prefix already ending in '/' (i.e. '/t/') matches everything beneath it.
    // Without this, '/t/acme/admin' isn't recognised as internal and gets the
    // prefix applied a second time -> '/t/acme/t/acme/admin'.
    p.endsWith('/')
      ? pathname === p || pathname.startsWith(p)
      : pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Decides the internal path a request should be rewritten to, or null to serve
 * it as-is.
 *
 * Two ways a request resolves to a tenant:
 *  - a subdomain (`acme.example.com/admin` -> `/t/acme/admin`), the
 *    multi-tenant shape; or
 *  - single-tenant mode, where DEFAULT_TENANT_SLUG makes the apex itself serve
 *    one academy, so `example.com/admin` -> `/t/acme/admin`.
 *
 * Single-tenant mode exists because one internal academy gains nothing from a
 * subdomain: without it, the short `/admin` URLs 404 on the apex and every link
 * has to carry `/t/<slug>/`. Multi-tenant routing is untouched — leaving
 * DEFAULT_TENANT_SLUG unset restores subdomain-only behaviour exactly.
 */
export function tenantRewritePath(opts: {
  host: string | null;
  pathname: string;
  defaultSlug?: string | null;
}): string | null {
  const { host, pathname, defaultSlug } = opts;
  if (matchesPrefix(pathname, SHARED_PREFIXES)) return null;

  const subdomain = tenantSlugFromHost(host);
  // On the apex, fall back to the configured single-tenant academy — but not for
  // routes that are meaningful only at the apex.
  const slug =
    subdomain ??
    (defaultSlug && !(pathname === '/' || matchesPrefix(pathname, APEX_ONLY_PREFIXES))
      ? defaultSlug
      : null);
  if (!slug) return null;

  return `/t/${slug}${pathname === '/' ? '' : pathname}`;
}
