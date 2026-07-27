'use server';

import { db, audited, eq, and, memberships } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';

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
