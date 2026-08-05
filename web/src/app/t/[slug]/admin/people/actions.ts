'use server';

import { revalidatePath } from 'next/cache';
import {
  db,
  audited,
  eq,
  and,
  users,
  memberships,
  tenants,
} from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendInviteEmail } from '@/lib/email';
import { absoluteUrl } from '@/lib/absolute-url';
import {
  parseAssignableRole,
  parseMemberStatus,
  type AssignableRole,
  type SettableMemberStatus,
} from '@/lib/validation';

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Set when the member was created but the email did not go out. */
  warning?: string;
}

/**
 * Invites a member to the current tenant.
 *
 * Reuses the auth user when the email is already known; otherwise mints one via
 * generateLink and emails a one-time link where they choose a password. The
 * membership is created with status 'invited' and flips to 'active' on their
 * first successful sign-in (see login/actions.ts). Email is sent after the
 * transaction commits and is best-effort — a mail failure must not roll back a
 * membership that was created.
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
  // Set for a brand-new account: the one-time link where they choose a password.
  let inviteUrl: string | null = null;

  if (!userId) {
    const admin = createAdminClient();
    // generateLink, not inviteUserByEmail: inviteUserByEmail delegates delivery
    // to Supabase's own sender, which errors when SMTP isn't configured — and
    // this function then returned early, so no membership was created and the
    // person was silently un-invitable. generateLink creates the user and hands
    // back the token without sending anything, so delivery is ours (Resend, our
    // template, our verified domain) and no Supabase SMTP setup is required.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: absoluteUrl('/auth/confirm') },
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? 'Could not create an account for that email. Check it for typos, then try again.' };
    }
    userId = data.user.id;

    const hashedToken = data.properties?.hashed_token;
    if (hashedToken) {
      inviteUrl =
        absoluteUrl('/auth/confirm') +
        `?token_hash=${encodeURIComponent(hashedToken)}` +
        `&type=invite&next=${encodeURIComponent('/auth/set-password')}`;
    }

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

  // Notify AFTER the transaction commits, and never let a mail failure undo a
  // membership that was created successfully. An existing account already has a
  // password, so it gets a plain sign-in link rather than a set-password token.
  let warning: string | undefined;
  try {
    const [tenant] = await db
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);
    await sendInviteEmail(
      email,
      tenant?.name ?? 'your academy',
      inviteUrl ?? absoluteUrl('/login'),
    );
  } catch (err) {
    // The membership stands, but the one-time link only ever reaches them by
    // email — so a silent 'Invitation sent' would be a lie they cannot recover
    // from. Tell the admin so they can fix the config and re-send.
    console.error('[invite] email failed', err);
    warning =
      'Member added, but the invitation email could not be sent. Check RESEND_API_KEY '
      + 'and that EMAIL_FROM uses a domain verified in Resend, then re-send.';
  }

  revalidatePath(`/t/${tenantSlug}/admin/people`);
  return { ok: true, warning };
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
    if (!after) throw new Error('That person is no longer in this academy. Reload the page.');
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
    throw new Error('You cannot deactivate yourself. Ask another admin to do it for you.');
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
