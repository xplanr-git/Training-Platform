'use server';

import { revalidatePath } from 'next/cache';
import { db, audited, eq, and, users, memberships, tenants } from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendInviteEmail, sendJoinAcceptedEmail } from '@/lib/email';
import { absoluteUrl } from '@/lib/absolute-url';
import {
  parseAssignableRole,
  parseMemberStatus,
  type AssignableRole,
  type SettableMemberStatus,
} from '@/lib/validation';
import { rateLimitExceeded } from '@/lib/rate-limit-guard';
import { RULES } from '@/lib/rate-limit';
import { isAudience } from '@/lib/audience';

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
export async function inviteMember(tenantSlug: string, formData: FormData): Promise<ActionResult> {
  const ctx = await requireAdmin();

  // An admin is authenticated, so this is not an abuse gate so much as a blast
  // radius one: the action sends mail through our Resend domain, and a scripted
  // loop would burn reputation as well as quota.
  const limited = await rateLimitExceeded('invite', RULES.invite, ctx.tenantId);
  if (limited) return { ok: false, error: limited };

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  if (!email) return { ok: false, error: 'Email is required' };
  // Server-side, not just the form's `required`: a Server Action is directly
  // invocable, and `users.name` is NOT NULL DEFAULT '' so a blank sails in. The
  // name is what prints on their certificate, and there is nowhere in the
  // product to set it afterwards — no profile page, and the two writes to
  // `users` are both inserts — so a blank here is permanent.
  if (!name) {
    return { ok: false, error: 'A name is required — it prints on their certificate.' };
  }

  // Checked at runtime, not cast: a tenant admin must not be able to mint a
  // platform_admin by posting the role directly. See ASSIGNABLE_ROLES.
  let role: AssignableRole;
  try {
    role = parseAssignableRole(formData.get('role') ?? 'learner');
  } catch {
    return { ok: false, error: 'That role cannot be assigned.' };
  }

  // Audience (WHO they are) — optional; drives relevance, never status.
  const audienceRaw = String(formData.get('audience') ?? '').trim();
  const audience = isAudience(audienceRaw) ? audienceRaw : null;

  // Reuse the auth user if we already know them.
  const [existingUser] = await db
    .select({ id: users.id, name: users.name })
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
      return {
        ok: false,
        error:
          error?.message ??
          'Could not create an account for that email. Check it for typos, then try again.',
      };
    }
    userId = data.user.id;

    const hashedToken = data.properties?.hashed_token;
    if (hashedToken) {
      inviteUrl =
        absoluteUrl('/auth/confirm') +
        `?token_hash=${encodeURIComponent(hashedToken)}` +
        `&type=invite&next=${encodeURIComponent('/auth/set-password')}`;
    }

    await db.insert(users).values({ id: userId, email, name }).onConflictDoNothing();
  } else if (!existingUser!.name.trim()) {
    /*
     * The row exists but holds no name — invited before a name was required, so
     * their certificate would print an em dash. The typed name used to be
     * discarded here entirely: the insert above sits inside `if (!userId)`, so
     * for a known email the name went nowhere while the form still said
     * "Invitation sent."
     *
     * Fill it, but ONLY when blank. `users` is a global row deliberately shared
     * across academies (this lookup is by email, and memberships is unique on
     * (tenant, user)), so overwriting a name that is already set would let this
     * academy rename the person on another academy's certificates.
     */
    await db.transaction(async (tx) => {
      await tx.update(users).set({ name }).where(eq(users.id, userId!));
      // Audited because `users` is global: this write is visible on every
      // academy this person belongs to, including their certificates. A
      // cross-tenant effect with no record of who caused it is exactly what
      // §7.11 is for.
      await audited(tx, {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: 'user.name_filled',
        resourceType: 'user',
        resourceId: userId,
        before: { name: '' },
        after: { name },
      });
    });
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
      audience,
      status: 'invited',
      invitedBy: ctx.userId,
    });
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'membership.invite',
      resourceType: 'membership',
      resourceId: userId!,
      after: { email, role, audience, status: 'invited' },
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
      'Member added, but the invitation email could not be sent. Check RESEND_API_KEY ' +
      'and that EMAIL_FROM uses a domain verified in Resend, then re-send.';
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

  // No changing your own role, mirroring the self-deactivation guard in
  // setMemberStatus: the only self-change possible here is dropping your own
  // admin, which would lock you out with no way back from this screen. The UI
  // renders your row read-only, but a Server Action is directly invocable.
  const [target] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId)))
    .limit(1);
  if (target?.userId === ctx.userId) {
    throw new Error('You cannot change your own role. Ask another admin to do it.');
  }

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(memberships)
      .set({ role: nextRole })
      .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId!)))
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
      .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId!)))
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

/**
 * Accepts a join request made through /join.
 *
 * Moves 'pending' to 'invited' rather than straight to 'active', so the existing
 * lifecycle keeps working unchanged: activateMembershipOnSignIn flips 'invited'
 * to 'active' on their next successful sign-in, which is the point at which they
 * have demonstrably accepted. Going directly to 'active' would mark them as
 * having signed in when they may never have.
 *
 * The status is checked in the WHERE clause, not read and then written, so this
 * cannot resurrect a deactivated member or re-accept an already-accepted one:
 * the update simply matches nothing and the guard below reports it.
 */
export async function acceptJoinRequest(tenantSlug: string, membershipId: string): Promise<void> {
  const ctx = await requireAdmin();

  const updated = await db.transaction(async (tx) => {
    const [after] = await tx
      .update(memberships)
      .set({ status: 'invited' })
      .where(
        and(
          eq(memberships.id, membershipId),
          eq(memberships.tenantId, ctx.tenantId!),
          eq(memberships.status, 'pending'),
        ),
      )
      .returning();
    if (!after) return null;
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'membership.request_accepted',
      resourceType: 'membership',
      resourceId: after.userId,
      before: { status: 'pending' },
      after: { status: 'invited', role: after.role },
    });
    return after;
  });
  if (!updated) throw new Error('That request is no longer pending. Reload the page.');

  // Best-effort, and after the commit: a mail failure must not undo an
  // acceptance. They already chose a password at /join, so this is a plain
  // sign-in link, not a set-password token.
  try {
    const [row] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, updated.userId))
      .limit(1);
    const [tenant] = await db
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);
    if (row)
      await sendJoinAcceptedEmail(row.email, tenant?.name ?? 'your academy', absoluteUrl('/login'));
  } catch (err) {
    console.error('[join] acceptance email failed', err);
  }

  revalidatePath(`/t/${tenantSlug}/admin/people`);
}

/**
 * Declines a join request: the membership row goes, the account stays.
 *
 * Deleting the auth user instead would be wrong on two counts — it is not ours
 * to delete (the same person may belong to another academy through the shared
 * `users` row), and it would let one academy's admin destroy an account they do
 * not administer. Removing the membership removes exactly the thing this academy
 * granted, which is nothing.
 *
 * Scoped to a row that is still 'pending' in THIS tenant, so it cannot be used
 * to delete an accepted member's access.
 */
export async function declineJoinRequest(tenantSlug: string, membershipId: string): Promise<void> {
  const ctx = await requireAdmin();

  const deleted = await db.transaction(async (tx) => {
    const [gone] = await tx
      .delete(memberships)
      .where(
        and(
          eq(memberships.id, membershipId),
          eq(memberships.tenantId, ctx.tenantId!),
          eq(memberships.status, 'pending'),
        ),
      )
      .returning();
    if (!gone) return null;
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'membership.request_declined',
      resourceType: 'membership',
      resourceId: gone.userId,
      before: { status: 'pending', role: gone.role },
    });
    return gone;
  });
  if (!deleted) throw new Error('That request is no longer pending. Reload the page.');

  // Deliberately no email. Telling someone an academy declined them is the
  // academy's call to make in person, not an automated message from us.
  revalidatePath(`/t/${tenantSlug}/admin/people`);
}

/**
 * Sets/corrects a member's audience (WHO they are — installer/dealer/etc.).
 * Audience drives which training and pathway they see; it is NOT a permission
 * or a status, so it needs no admin-boundary confirmation. Empty clears it back
 * to unknown. Admin-only (requireAdmin).
 */
export async function setMemberAudience(
  tenantSlug: string,
  membershipId: string,
  value: string,
): Promise<void> {
  const ctx = await requireAdmin();
  const audience = isAudience(value) ? value : null;
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(memberships)
      .set({ audience })
      .where(and(eq(memberships.id, membershipId), eq(memberships.tenantId, ctx.tenantId)))
      .returning({ userId: memberships.userId });
    if (!updated) throw new Error('That member no longer exists. Reload the page.');
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'membership.audience_set',
      resourceType: 'membership',
      resourceId: updated.userId,
      after: { audience },
    });
  });
  revalidatePath(`/t/${tenantSlug}/admin/people`);
}
