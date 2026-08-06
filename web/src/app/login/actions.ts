'use server';

import { redirect } from 'next/navigation';
import {
  db,
  audited,
  eq,
  and,
  asc,
  sql,
  inArray,
  memberships,
  tenants,
} from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';

/**
 * The caller's primary membership, read from the DATABASE rather than from JWT
 * claims.
 *
 * This deliberately does NOT use ctx.tenantId / ctx.role. Those are decoded from
 * whatever access token the cookie currently holds, and there are moments when
 * that token is stale or its claims are unreadable — notably straight after
 * updateUser() on the set-password screen, where the browser has just been issued
 * a replacement token. When the claims came back empty, role fell back to
 * 'learner' and an admin was sent to the learner dashboard; signing out and in
 * again then worked, because the fresh token carried proper claims. A destination
 * that silently depends on token freshness is the wrong shape.
 *
 * ctx.userId is safe to trust: it comes from getUser(), which verifies the token
 * server-side rather than decoding it optimistically.
 *
 * The ordering mirrors the access-token hook (migration 0010) so the app and the
 * token agree on which membership is primary: an active one wins, and within a
 * status the oldest wins so an injected membership cannot take over.
 */
async function primaryMembership(userId: string) {
  const [row] = await db
    .select({ slug: tenants.slug, role: memberships.role, tenantId: tenants.id })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(and(eq(memberships.userId, userId), inArray(memberships.status, ['active', 'invited'])))
    .orderBy(sql`(${memberships.status} = 'active') desc`, asc(memberships.createdAt))
    .limit(1);
  return row ?? null;
}

/**
 * Where to send someone straight after sign-in (or after setting a password).
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
  if (!ctx) return '/login';

  const membership = await primaryMembership(ctx.userId);
  if (!membership) return '/dashboard';

  const isAdmin = membership.role === 'company_admin' || membership.role === 'platform_admin';
  return `/t/${membership.slug}/${isAdmin ? 'admin' : 'dashboard'}`;
}

/**
 * The single landing step every dashboard runs: accept the invitation if this is
 * the first sign-in, then send the caller wherever they actually belong.
 *
 * ONE resolver, reached by a full document request. That is the shape 623f4ba
 * moved towards and this finishes, because the apex was doing it and the tenant
 * subdomain was not — which is a real difference in behaviour, not a tidiness
 * point:
 *
 *   - `/dashboard` is in APEX_ONLY_PREFIXES, so on the apex it renders
 *     app/dashboard/page.tsx and the resolver runs. On a tenant SUBDOMAIN
 *     middleware rewrites it to `/t/<slug>/dashboard` first, so the resolver
 *     never ran at all.
 *   - So on a subdomain an admin signing in landed on the LEARNER dashboard,
 *     and a brand-new invitee's membership was never flipped from 'invited' to
 *     'active' — the People list kept showing them as invited however many times
 *     they signed in.
 *
 * `here` is the path this page is already serving. Returning instead of
 * redirecting when the destination matches is what stops a redirect loop, and it
 * is why the caller passes its own path rather than this guessing.
 */
export async function landAfterSignIn(here: string): Promise<void> {
  // Never block someone from reaching their courses over bookkeeping.
  try {
    await activateMembershipOnSignIn();
  } catch {
    // Intentionally swallowed; the activation is a no-op once active.
  }

  const dest = await postSignInDestination();
  if (dest !== here && dest !== '/login') redirect(dest);
}

/**
 * Flips a still-'invited' membership to 'active' on first successful sign-in, or
 * when the invitee sets their password from the emailed link.
 *
 * Signing in proves control of the invited email address, so at that point the
 * invitation has been accepted — leaving it 'invited' made the People list
 * misleading. Safe to call on every login: it's a no-op once active.
 *
 * Scoped by user id ALONE, not by the JWT's tenant_id claim. It used to require
 * that claim, which made this silently do nothing whenever the claims were stale
 * or unreadable — and the worst moment for that is exactly the one that matters
 * most: a brand-new invitee on the set-password screen, whose token has just been
 * replaced. They would stay 'invited' despite having demonstrably accepted.
 */
export async function activateMembershipOnSignIn() {
  const ctx = await getTenantContext();
  if (!ctx) return;

  const [invited] = await db
    .select({ id: memberships.id, tenantId: memberships.tenantId })
    .from(memberships)
    .where(and(eq(memberships.userId, ctx.userId), eq(memberships.status, 'invited')))
    .orderBy(asc(memberships.createdAt))
    .limit(1);
  if (!invited) return;

  await db.transaction(async (tx) => {
    await tx.update(memberships).set({ status: 'active' }).where(eq(memberships.id, invited.id));
    await audited(tx, {
      tenantId: invited.tenantId,
      actorUserId: ctx.userId,
      action: 'membership.activated',
      resourceType: 'membership',
      resourceId: invited.id,
      after: { status: 'active', via: 'first_sign_in' },
    });
  });
}
