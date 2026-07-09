import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export type AppRole = 'platform_admin' | 'company_admin' | 'instructor' | 'learner';

export interface TenantContext {
  userId: string;
  tenantId: string | null;
  role: AppRole;
  email: string | null;
}

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

/** Decodes (does not verify) the claims of an already-server-verified JWT. */
function decodeClaims(accessToken: string): Record<string, unknown> {
  try {
    const payload = accessToken.split('.')[1];
    const json = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/**
 * Resolves the authenticated caller's tenant context from their session JWT
 * (claims injected by the Custom Access Token Hook). Returns null if there is
 * no valid session. The token is verified server-side by getUser() first.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const claims = session?.access_token ? decodeClaims(session.access_token) : {};

  return {
    userId: user.id,
    tenantId: (claims.tenant_id as string) ?? null,
    role: ((claims.role as AppRole) ?? 'learner') as AppRole,
    email: user.email ?? null,
  };
}

/**
 * Guard for tenant-scoped server code. Ensures there is a session and, when a
 * tenant slug is supplied (from the subdomain), that the caller's JWT tenant
 * matches it — platform admins bypass the match. Throws on violation.
 */
export async function withTenant(expectedTenantId?: string): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) throw new Error('UNAUTHENTICATED');

  if (
    expectedTenantId &&
    ctx.role !== 'platform_admin' &&
    ctx.tenantId !== expectedTenantId
  ) {
    throw new Error('TENANT_MISMATCH');
  }
  return ctx;
}

export interface AdminContext extends TenantContext {
  tenantId: string;
}

/**
 * Guard for admin-only Server Actions. The admin layout guards the UI, but
 * Server Actions can be POSTed directly — so every admin mutation must re-check
 * the caller is a company_admin (or platform_admin) with a tenant. Throws
 * otherwise. Returns a context with tenantId narrowed to string.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getTenantContext();
  if (!ctx) throw new Error('UNAUTHENTICATED');
  if (ctx.role !== 'company_admin' && ctx.role !== 'platform_admin') {
    throw new Error('FORBIDDEN');
  }
  if (!ctx.tenantId) throw new Error('No tenant context');
  return { ...ctx, tenantId: ctx.tenantId };
}
