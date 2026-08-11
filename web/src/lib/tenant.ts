import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { db, tenants, memberships, eq, and, inArray } from '@training-platform/db';
import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/action-errors';

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
 * The caller's CURRENT role in a tenant, read from `memberships` — not from the
 * JWT.
 *
 * The role claim is stamped into the access token at issuance and is then fixed
 * until the token refreshes, which is up to an hour (autoRefreshToken). So
 * demoting an admin (setMemberRole) or deactivating them (setMemberStatus) had
 * no effect on what they could actually do for up to an hour after the admin
 * doing it saw "Saved". For that hour a removed admin kept full mutation rights
 * over courses, people and certificates.
 *
 * Two neighbouring call sites already re-read the database for exactly this
 * reason — primaryMembership() in login/actions.ts and isTenantAdmin() in
 * course-access.ts. The guard that gates every admin mutation did not.
 *
 * Status set: 'active' and 'invited', deliberately. It mirrors the access-token
 * hook (migration 0010) and primaryMembership, so app and token agree on who
 * holds a usable membership. 'invited' has to be included — nothing flips a
 * membership to 'active' until the invitee reaches the apex /dashboard, and on a
 * tenant subdomain that page is rewritten away, so an invited admin may legitimately
 * still be 'invited'. Requiring 'active' here would lock them out of the academy
 * they were just invited to administer. What matters is that 'deactivated' and
 * 'pending' are excluded — those are the states this guard exists to catch.
 *
 * Cost: one indexed lookup on (user_id, tenant_id), deduplicated per request by
 * cache() just as getTenantContext() is. The admin layout, the page and any
 * action it invokes therefore share a single query.
 */
const currentMembershipRole = cache(
  async (userId: string, tenantId: string): Promise<AppRole | null> => {
    const [row] = await db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.tenantId, tenantId),
          inArray(memberships.status, ['active', 'invited']),
        ),
      )
      .limit(1);
    return (row?.role as AppRole) ?? null;
  },
);

/**
 * Confirms the caller administers this tenant right now. Returns the role as
 * stored, so callers report the truth rather than the claim.
 */
export async function currentAdminRole(userId: string, tenantId: string): Promise<AppRole | null> {
  const role = await currentMembershipRole(userId, tenantId);
  return role && isAdminRole(role) ? role : null;
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
  if (!tenant) throw new Error(ActionError.TENANT_NOT_FOUND);
  if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
    throw new Error(ActionError.TENANT_INACTIVE);
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
  if (!ctx) throw new Error(ActionError.UNAUTHENTICATED);
  if (!ctx.tenantId) throw new Error(ActionError.TENANT_NOT_FOUND);

  // Against the DATABASE, not ctx.role. See currentMembershipRole: a demotion or
  // deactivation must take effect on the next request, not on the next token
  // refresh up to an hour later.
  const role = await currentAdminRole(ctx.userId, ctx.tenantId);
  if (!role) throw new Error(ActionError.FORBIDDEN);

  await assertTenantActive(ctx.tenantId);
  return { ...ctx, role, tenantId: ctx.tenantId };
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

  // Against the DATABASE, and against the URL's academy rather than the claim's.
  // The role check used to read ctx.role, so a demoted or deactivated admin kept
  // every admin PAGE for up to an hour — until their token refreshed. Deliberately
  // placed after the tenant is resolved, so the membership is checked against the
  // academy actually being administered.
  const role = await currentAdminRole(ctx.userId, tenant.id);
  if (!role) redirect('/dashboard');

  // Suspended tenants are shown an "unavailable" page by the tenant shell; this
  // stops an admin page rendering underneath it.
  if (tenant.status === 'suspended' || tenant.status === 'cancelled') notFound();

  return { ...ctx, role, tenantId: tenant.id };
}

/**
 * Guard for the cross-tenant /platform area — the widest privilege in the
 * product, and the one that was checked most loosely.
 *
 * platform/layout.tsx and platform/actions.ts both tested `ctx.role ===
 * 'platform_admin'` straight off the decoded token. Revoking someone's platform
 * admin therefore left them able to suspend and un-suspend EVERY academy on the
 * platform until their token happened to refresh.
 *
 * Unlike the tenant guards this is not scoped to one academy: it asks whether the
 * caller holds a platform_admin membership anywhere, which is what the role means.
 */
export async function requirePlatformAdmin(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) throw new Error(ActionError.UNAUTHENTICATED);
  if (!(await isPlatformAdmin(ctx.userId))) throw new Error(ActionError.FORBIDDEN);
  return ctx;
}

/** As above, for pages: navigates instead of throwing. */
export async function requirePlatformAdminPage(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login?next=/platform');
  if (!(await isPlatformAdmin(ctx.userId))) redirect('/');
  return ctx;
}

/** Whether this user holds a live platform_admin membership, per the database. */
export const isPlatformAdmin = cache(async (userId: string): Promise<boolean> => {
  const [row] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.role, 'platform_admin'),
        inArray(memberships.status, ['active', 'invited']),
      ),
    )
    .limit(1);
  return !!row;
});
