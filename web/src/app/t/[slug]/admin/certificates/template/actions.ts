'use server';

import { revalidatePath } from 'next/cache';
import { db, audited, eq, and, certificateTemplates } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';

export interface CertificateDesign {
  title?: string;
  signatory?: string;
  accentColor?: string;
}

/**
 * Saves the tenant's default certificate template design. Get-or-create: uses
 * the tenant's first template row (provisioning seeds one) or inserts one.
 * Admins only, audited.
 */
export async function saveCertificateTemplate(tenantSlug: string, formData: FormData) {
  const ctx = await withTenant();
  if (ctx.role !== 'company_admin' && ctx.role !== 'platform_admin') {
    throw new Error('Forbidden');
  }
  if (!ctx.tenantId) throw new Error('No tenant context');

  const design: CertificateDesign = {
    title: String(formData.get('title') ?? '').trim(),
    signatory: String(formData.get('signatory') ?? '').trim(),
    accentColor: String(formData.get('accentColor') ?? '').trim(),
  };

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: certificateTemplates.id })
      .from(certificateTemplates)
      .where(eq(certificateTemplates.tenantId, ctx.tenantId!))
      .limit(1);

    if (existing) {
      await tx
        .update(certificateTemplates)
        .set({ design })
        .where(
          and(
            eq(certificateTemplates.id, existing.id),
            eq(certificateTemplates.tenantId, ctx.tenantId!),
          ),
        );
    } else {
      await tx
        .insert(certificateTemplates)
        .values({ tenantId: ctx.tenantId!, name: 'Default', design });
    }

    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'certificate_template.update',
      resourceType: 'certificate_template',
      resourceId: existing?.id ?? null,
      after: design,
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/certificates/template`);
}
