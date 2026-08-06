'use server';

import { db, audited, eq, and, users, memberships, tenants } from '@training-platform/db';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimitExceeded } from '@/lib/rate-limit-guard';
import { RULES } from '@/lib/rate-limit';

export interface JoinResult {
  ok: boolean;
  error?: string;
}

/**
 * A member of the public asking for a learner account on an academy.
 *
 * Owner decision, 2026-08-06: ADMIN APPROVAL. This is deliberately not the same
 * thing as `/signup`, which provisions a whole academy plus an owner and must
 * stay untouched.
 *
 * What makes the gate hold: the membership is created with status 'pending', and
 * the access-token hook (migration 0010) and primaryMembership both select
 * `status in ('active','invited')`. A pending row therefore yields no tenant
 * claim and resolves to no academy — the request grants nothing until an admin
 * accepts, by construction rather than by a check anyone has to remember. Both
 * lists are asserted in tests precisely because widening either would open the
 * door with no other visible symptom.
 *
 * The account IS created here, with the password the person chose, so accepting
 * is a single decision for the admin rather than a second round of email. They
 * can sign in immediately and will be told they are waiting; they can reach
 * nothing else.
 */
export async function requestToJoin(tenantSlug: string, formData: FormData): Promise<JoinResult> {
  // First, before any account is minted: this is the one unauthenticated route
  // that creates an auth user, so it is the cheapest thing to abuse.
  const limited = await rateLimitExceeded('join', RULES.join);
  if (limited) return { ok: false, error: limited };

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!name) {
    // Same reason as the invite path: this is what prints on their certificate,
    // and there is nowhere in the product to set it afterwards.
    return { ok: false, error: 'Enter your name — it prints on your certificate.' };
  }
  if (!email.includes('@')) return { ok: false, error: 'Enter a valid email address.' };
  if (password.length < 8) {
    return { ok: false, error: 'Choose a password of at least 8 characters.' };
  }

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);
  if (!tenant) return { ok: false, error: 'That academy does not exist.' };

  const [existingUser] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId = existingUser?.id ?? null;

  if (userId) {
    /*
     * The address already has an account — on this academy or another one.
     *
     * Deliberately NOT told apart in the response. Saying "you already have an
     * account" or "you already asked" to an unauthenticated caller turns this
     * form into an oracle for which addresses are registered, which is the same
     * account-enumeration problem the password-reset action is written to avoid.
     * The generic success below is what they see either way.
     */
    const [already] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.tenantId, tenant.id), eq(memberships.userId, userId)))
      .limit(1);
    if (already) return { ok: true };

    // Fill a blank name, never overwrite one: `users` is a single row shared
    // across academies, so overwriting would rename this person on another
    // academy's certificates.
    if (!existingUser!.name.trim()) {
      await db.transaction(async (tx) => {
        await tx.update(users).set({ name }).where(eq(users.id, userId!));
        // Audited because `users` is global: this write shows up on every
        // academy this person belongs to, including their certificates.
        // actorUserId is the person themselves — they supplied it on /join.
        await audited(tx, {
          tenantId: tenant.id,
          actorUserId: userId,
          action: 'user.name_filled',
          resourceType: 'user',
          resourceId: userId,
          before: { name: '' },
          after: { name, via: 'join_request' },
        });
      });
    }
  } else {
    const admin = createAdminClient();
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !created.user) {
      console.error('[join] could not create account', error?.message);
      // Still generic: the failure is usually "email already registered", which
      // would leak the same thing the branch above is careful not to.
      return { ok: true };
    }
    userId = created.user.id;
    await db.insert(users).values({ id: userId, email, name }).onConflictDoNothing();
  }

  await db.transaction(async (tx) => {
    await tx.insert(memberships).values({
      tenantId: tenant.id,
      userId: userId!,
      role: 'learner',
      status: 'pending',
      // No invitedBy: nobody invited them, they asked.
    });
    await audited(tx, {
      tenantId: tenant.id,
      // The actor is the requester themselves — this is the one membership
      // mutation with no admin behind it.
      actorUserId: userId,
      action: 'membership.requested',
      resourceType: 'membership',
      resourceId: userId!,
      after: { email, role: 'learner', status: 'pending' },
    });
  });

  return { ok: true };
}
