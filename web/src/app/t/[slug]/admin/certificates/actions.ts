'use server';

import { revalidatePath } from 'next/cache';
import { db, audited, eq, and, certificates } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';

/** Revokes or reinstates an issued certificate. Admins only, audited. */
export async function setCertificateRevoked(
  tenantSlug: string,
  certificateId: string,
  revoked: boolean,
) {
  const ctx = await withTenant();
  if (ctx.role !== 'company_admin' && ctx.role !== 'platform_admin') {
    throw new Error('Forbidden');
  }
  if (!ctx.tenantId) throw new Error('No tenant context');

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(certificates)
      .set({ revokedAt: revoked ? new Date() : null })
      .where(
        and(eq(certificates.id, certificateId), eq(certificates.tenantId, ctx.tenantId!)),
      )
      .returning();
    if (!after) throw new Error('Certificate not found');

    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: revoked ? 'certificate.revoke' : 'certificate.reinstate',
      resourceType: 'certificate',
      resourceId: after.verificationCode,
      after: { revoked },
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/certificates`);
}
