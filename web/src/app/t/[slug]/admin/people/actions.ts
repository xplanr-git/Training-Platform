'use server';

import { revalidatePath } from 'next/cache';
import {
  db,
  audited,
  eq,
  and,
  users,
  memberships,
} from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';

type InviteRole = 'company_admin' | 'instructor' | 'learner';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Invites a member to the current tenant. Reuses an existing auth user if the
 * email is already known; otherwise creates one via Supabase's invite flow
 * (the invitee sets their password from the emailed link). Adds a membership
 * with status 'invited'. Actual email delivery is Resend (Phase E3); Supabase's
 * built-in invite covers MVP.
 */
export async function inviteMember(
  tenantSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? 'learner') as InviteRole;
  const name = String(formData.get('name') ?? '').trim();
  if (!email) return { ok: false, error: 'Email is required' };

  // Reuse the auth user if we already know them.
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId = existingUser?.id ?? null;

  if (!userId) {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? 'Could not invite user' };
    }
    userId = data.user.id;
    await db
      .insert(users)
      .values({ id: userId, email, name })
      .onConflictDoNothing();
  }

  const [existingMembership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.tenantId, ctx.tenantId), eq(memberships.userId, userId)))
    .limit(1);
  if (existingMembership) {
    return { ok: false, error: 'That person is already a member.' };
  }

  await db.transaction(async (tx) => {
    await tx.insert(memberships).values({
      tenantId: ctx.tenantId!,
      userId: userId!,
      role,
      status: 'invited',
      invitedBy: ctx.userId,
    });
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'membership.invite',
      resourceType: 'membership',
      resourceId: userId!,
      after: { email, role, status: 'invited' },
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/people`);
  return { ok: true };
}

export async function setMemberRole(
  tenantSlug: string,
  membershipId: string,
  role: InviteRole,
): Promise<void> {
  const ctx = await requireAdmin();

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(memberships)
      .set({ role })
      .where(
        and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId!)),
      )
      .returning();
    if (!after) throw new Error('Membership not found');
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'membership.role_change',
      resourceType: 'membership',
      resourceId: after.userId,
      after: { role },
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/people`);
}

export async function setMemberStatus(
  tenantSlug: string,
  membershipId: string,
  status: 'active' | 'deactivated',
): Promise<void> {
  const ctx = await requireAdmin();

  // Guard against locking yourself out.
  const [target] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId)))
    .limit(1);
  if (target?.userId === ctx.userId && status === 'deactivated') {
    throw new Error('You cannot deactivate your own membership.');
  }

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(memberships)
      .set({ status })
      .where(
        and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId!)),
      )
      .returning();
    if (!after) throw new Error('Membership not found');
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: `membership.${status}`,
      resourceType: 'membership',
      resourceId: after.userId,
      after: { status },
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/people`);
}
