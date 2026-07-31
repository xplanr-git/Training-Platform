'use server';

import { db, audited, eq, and, memberships, tenants } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';

/**
 * Where to send someone straight after sign-in.
 *
 * Must be resolved on the server: the destination depends on the caller's tenant
 * *slug*, and the JWT only carries `tenant_id`. Returning a bare '/admin' only
 * worked on a tenant subdomain, where middleware rewrites it to
 * '/t/<slug>/admin' — on the apex host it 404s, which is what signing in at the
 * root domain used to do. The E2E suite missed it because it drives a subdomain.
 *
 * '/t/...' is in the middleware's shared-prefix list, so the path below resolves
 * unchanged on the apex *and* on a subdomain.
 */
export async function postSignInDestination(): Promise<string> {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) return '/dashboard';

  const [tenant] = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);
  if (!tenant) return '/dashboard';

  const isAdmin = ctx.role === 'company_admin' || ctx.role === 'platform_admin';
  return `/t/${tenant.slug}/${isAdmin ? 'admin' : 'dashboard'}`;
}

/**
 * Flips a still-'invited' membership to 'active' on first successful sign-in.
 * Signing in proves control of the invited email address, so at that point the
 * invitation has been accepted — leaving it 'invited' made the People list
 * misleading. Safe to call on every login: it's a no-op once active.
 */
export async function activateMembershipOnSignIn() {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) return;

  const [invited] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, ctx.userId),
        eq(memberships.tenantId, ctx.tenantId),
        eq(memberships.status, 'invited'),
      ),
    )
    .limit(1);
  if (!invited) return;

  await db.transaction(async (tx) => {
    await tx
      .update(memberships)
      .set({ status: 'active' })
      .where(eq(memberships.id, invited.id));
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'membership.activated',
      resourceType: 'membership',
      resourceId: invited.id,
      after: { status: 'active', via: 'first_sign_in' },
    });
  });
}
