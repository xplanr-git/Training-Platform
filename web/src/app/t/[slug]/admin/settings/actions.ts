'use server';

import { revalidatePath } from 'next/cache';
import { db, audited, eq, tenants } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';

/** Saves the academy's name and storefront branding. Admins only. */
export async function updateSchoolSettings(tenantSlug: string, formData: FormData) {
  const ctx = await withTenant();
  if (ctx.role !== 'company_admin' && ctx.role !== 'platform_admin') {
    throw new Error('Forbidden');
  }
  if (!ctx.tenantId) throw new Error('No tenant context');

  const name = String(formData.get('name') ?? '').trim();
  if (!name) throw new Error('Name is required');

  const branding = {
    tagline: String(formData.get('tagline') ?? '').trim(),
    logoUrl: String(formData.get('logoUrl') ?? '').trim(),
    primaryColor: String(formData.get('primaryColor') ?? '').trim(),
  };

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(tenants)
      .set({ name, branding, updatedAt: new Date() })
      .where(eq(tenants.id, ctx.tenantId!))
      .returning();
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'tenant.settings_update',
      resourceType: 'tenant',
      resourceId: ctx.tenantId,
      after: { name, branding: after?.branding },
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/settings`);
  revalidatePath(`/t/${tenantSlug}`);
}
