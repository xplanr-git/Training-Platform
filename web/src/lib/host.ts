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
