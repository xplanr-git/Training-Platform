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
import {
  parseAssignableRole,
  parseMemberStatus,
  type AssignableRole,
  type SettableMemberStatus,
} from '@/lib/validation';

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
  const name = String(formData.get('name') ?? '').trim();
  if (!email) return { ok: false, error: 'Email is required' };

  // Checked at runtime, not cast: a tenant admin must not be able to mint a
  // platform_admin by posting the role directly. See ASSIGNABLE_ROLES.
  let role: AssignableRole;
  try {
    role = parseAssignableRole(formData.get('role') ?? 'learner');
  } catch {
    return { ok: false, error: 'That role cannot be assigned.' };
  }

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
  role: AssignableRole,
): Promise<void> {
  const ctx = await requireAdmin();
  // The parameter type is erased at runtime and this is callable directly, so
  // the allowlist has to be enforced here — otherwise 'platform_admin' passes.
  const nextRole = parseAssignableRole(role);

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(memberships)
      .set({ role: nextRole })
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
      after: { role: nextRole },
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/people`);
}

export async function setMemberStatus(
  tenantSlug: string,
  membershipId: string,
  status: SettableMemberStatus,
): Promise<void> {
  const ctx = await requireAdmin();
  const nextStatus = parseMemberStatus(status);

  // Guard against locking yourself out.
  const [target] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId)))
    .limit(1);
  if (target?.userId === ctx.userId && nextStatus === 'deactivated') {
    throw new Error('You cannot deactivate your own membership.');
  }

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(memberships)
      .set({ status: nextStatus })
      .where(
        and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId!)),
      )
      .returning();
    if (!after) throw new Error('Membership not found');
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: `membership.${nextStatus}`,
      resourceType: 'membership',
      resourceId: after.userId,
      after: { status: nextStatus },
    });
  });

  revalidatePath(`/t/${tenantSlug}/admin/people`);
}
