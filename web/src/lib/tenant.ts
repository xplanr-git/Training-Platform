import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { db, tenants, eq } from '@training-platform/db';
import { createClient } from '@/lib/supabase/server';

export type AppRole = 'platform_admin' | 'company_admin' | 'instructor' | 'learner';

export interface TenantContext {
  userId: string;
  tenantId: string | null;
  role: AppRole;
  email: string | null;
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
 *
 * Wrapped in React's `cache()`, which deduplicates by argument for the lifetime
 * of a single request. getUser() is a NETWORK round trip to Supabase Auth — it
 * verifies the token rather than decoding it — and this is called independently
 * by the admin layout, the page, and any guard the page invokes. That was three
 * or more sequential auth calls per navigation, each adding latency before a
 * single row of data was fetched. Now it is one.
 */
export const getTenantContext = cache(async (): Promise<TenantContext | null> => {
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
});

export interface AdminContext extends TenantContext {
  tenantId: string;
}

function isAdminRole(role: AppRole): boolean {
  return role === 'company_admin' || role === 'platform_admin';
}

/**
 * Refuses access when the tenant is no longer entitled to trade.
 *
 * The tenant shell blocks suspended *pages*, but Server Actions do not render
 * through a layout, and the Drizzle connection bypasses RLS — so without this
 * check a suspended academy's admin could still POST mutations directly. The
 * status values mirror the shell's.
 */
async function assertTenantActive(tenantId: string): Promise<void> {
  const [tenant] = await db
    .select({ status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!tenant) throw new Error('TENANT_NOT_FOUND');
  if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
    throw new Error('TENANT_INACTIVE');
  }
}

/**
 * Guard for admin-only Server Actions. The admin layout guards the UI, but
 * Server Actions can be POSTed directly — so every admin mutation must re-check
 * the caller is a company_admin (or platform_admin) with a tenant, and that the
 * tenant is still active. Throws otherwise. Returns a context with tenantId
 * narrowed to string.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getTenantContext();
  if (!ctx) throw new Error('UNAUTHENTICATED');
  if (!isAdminRole(ctx.role)) throw new Error('FORBIDDEN');
  if (!ctx.tenantId) throw new Error('TENANT_NOT_FOUND');
  await assertTenantActive(ctx.tenantId);
  return { ...ctx, tenantId: ctx.tenantId };
}

/**
 * Guard for admin *pages*, which know which academy they are for from the URL.
 * Resolves that slug, confirms the caller is entitled to administer it, and
 * returns a context scoped to the URL's tenant.
 *
 * Replaces the previous `withTenant(expectedTenantId?)`, whose verification was
 * opt-in: every admin page called it bare, so the slug was never checked and
 * another academy's admin URL rendered the caller's *own* data under that
 * academy's address. Taking the slug as a required argument makes the check
 * impossible to skip.
 *
 * The URL's academy and the caller's must match — for every role. See the
 * comment on the mismatch check for why a platform_admin bypass is actively
 * harmful here.
 */
export async function requireAdminForSlug(slug: string): Promise<AdminContext> {
  const ctx = await getTenantContext();
  // Pages navigate rather than throw: a bare throw here renders a 500, which is
  // both a poor experience and misleading — being signed out, or pointed at
  // someone else's academy, is a routing outcome, not a server fault.
  if (!ctx) redirect('/login');
  if (!isAdminRole(ctx.role)) redirect('/dashboard');

  const [tenant] = await db
    .select({ id: tenants.id, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  if (!tenant) notFound();

  // Nobody administers an academy other than their own — platform admins
  // included. 404 rather than 403 so this doesn't confirm another academy exists.
  //
  // This deliberately has NO platform_admin bypass. Letting one through made the
  // page render the URL's academy while every Server Action still scoped its
  // writes to the caller's own tenant (they all use requireAdmin() -> JWT
  // tenant_id, and the builder/quiz actions take no slug at all). Saving School
  // Settings while viewing another academy therefore overwrote your OWN
  // academy's name and branding, and resource ids from the viewed tenant simply
  // failed their WHERE clauses. Cross-tenant oversight belongs on /platform,
  // which is scoped for it; a half-working cross-tenant admin is worse than none.
  const tenantMismatch = ctx.tenantId !== tenant.id;
  if (tenantMismatch) notFound();

  // Suspended tenants are shown an "unavailable" page by the tenant shell; this
  // stops an admin page rendering underneath it.
  if (tenant.status === 'suspended' || tenant.status === 'cancelled') notFound();

  return { ...ctx, tenantId: tenant.id };
}
