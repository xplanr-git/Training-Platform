'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, audited, eq, and, memberships } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { assertNotViewingAs } from '@/lib/view-as';
import { isAudience } from '@/lib/audience';

/**
 * A learner self-identifies their audience once, on first use, when an admin
 * hasn't already set it. This is relevance data (WHO they are), never status —
 * it cannot confer Trained/Verified/Strategic. Only ever sets the caller's own
 * membership; never runs while viewing-as.
 */
export async function setMyAudience(
  slug: string,
  value: string,
): Promise<{ ok: true } | { error: string }> {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) redirect('/login');
  await assertNotViewingAs();
  if (!isAudience(value)) return { error: 'Please choose one.' };
  const { tenantId, userId } = ctx; // narrowed to string past the guard
  await db.transaction(async (tx) => {
    await tx
      .update(memberships)
      .set({ audience: value })
      .where(and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)));
    await audited(tx, {
      tenantId,
      actorUserId: userId,
      action: 'membership.audience_self_set',
      resourceType: 'membership',
      resourceId: userId,
      after: { audience: value },
    });
  });
  revalidatePath(`/t/${slug}/dashboard`);
  return { ok: true };
}
