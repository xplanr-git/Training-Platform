'use server';

import { revalidatePath } from 'next/cache';
import { db, audited, eq, tenants } from '@training-platform/db';
import { requirePlatformAdmin } from '@/lib/tenant';

type TenantStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';

/**
 * Platform-admin action to change a tenant's status. Suspending a tenant blocks
 * all access (enforced in the tenant layout + RLS). Audited.
 */
export async function setTenantStatus(tenantId: string, status: TenantStatus) {
  // Checked against memberships, not the token's role claim: this action can
  // suspend any academy on the platform, and a revoked platform admin used to
  // keep that power until their token refreshed.
  const ctx = await requirePlatformAdmin();

  await db.transaction(async (tx) => {
    const [before] = await tx
      .select({ status: tenants.status })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    const [after] = await tx
      .update(tenants)
      .set({ status, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))
      .returning();
    if (!after) throw new Error('That academy could not be found.');

    await audited(tx, {
      tenantId,
      actorUserId: ctx.userId,
      action: `tenant.${status}`,
      resourceType: 'tenant',
      resourceId: tenantId,
      before: before ?? null,
      after: { status },
    });
  });

  revalidatePath('/platform');
}
