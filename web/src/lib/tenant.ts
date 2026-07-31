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
  if (!ctx.tenantId) throw new Error('No tenant context');
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
 * impossible to skip, and gives platform admins the cross-tenant view the
 * bypass below was written to allow.
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

  // A company_admin may only administer their own academy. A platform_admin may
  // administer any — and sees that academy's data, not their own. 404 rather
  // than 403 so this doesn't confirm whether another academy exists.
  const tenantMismatch = ctx.role !== 'platform_admin' && ctx.tenantId !== tenant.id;
  if (tenantMismatch) notFound();

  // Suspended tenants are shown an "unavailable" page by the tenant shell; this
  // stops an admin page rendering underneath it.
  if (tenant.status === 'suspended' || tenant.status === 'cancelled') notFound();

  return { ...ctx, tenantId: tenant.id };
}
