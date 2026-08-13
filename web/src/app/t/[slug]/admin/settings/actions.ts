'use server';

import { revalidatePath } from 'next/cache';
import { db, audited, eq, tenants } from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import type { Branding } from '@/lib/content-types';

/** Saves the academy's name and storefront branding. Admins only. */
export async function updateSchoolSettings(tenantSlug: string, formData: FormData) {
  const ctx = await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) throw new Error('Name is required');

  const branding: Branding = {
    tagline: String(formData.get('tagline') ?? '').trim(),
    logoUrl: String(formData.get('logoUrl') ?? '').trim(),
  };

  await db.transaction(async (tx) => {
    // Merge over the stored branding rather than replacing it: primaryColor is
    // no longer collected (the storefront is monochrome; tenant colour lives on
    // the certificate template), but a previously saved value must survive a
    // settings save untouched — this form not asking about a field is not an
    // instruction to erase it.
    const [current] = await tx
      .select({ branding: tenants.branding })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId!));
    const merged = { ...((current?.branding as Branding | null) ?? {}), ...branding };
    const [after] = await tx
      .update(tenants)
      .set({ name, branding: merged, updatedAt: new Date() })
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
