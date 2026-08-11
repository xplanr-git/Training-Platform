'use server';

import { cookies } from 'next/headers';
import { db, audited, eq, and, memberships } from '@training-platform/db';
import { requireAdmin, getTenantContext, type AppRole } from '@/lib/tenant';
import { VIEW_AS_COOKIE, canViewAs } from '@/lib/view-as';

/**
 * Begins a read-only "view as" session over a member beneath the caller.
 *
 * Validates against the database (the target is a member of this tenant with a
 * lower role), audits it, sets the cookie, and lands the admin on the learner
 * dashboard. The cookie carries only the target id and is re-validated on every
 * request (see getViewAs), so it grants nothing on its own.
 */
export async function startViewAs(
  _tenantSlug: string,
  targetUserId: string,
): Promise<{ redirectTo?: string }> {
  const ctx = await requireAdmin();
  if (targetUserId === ctx.userId) throw new Error('You are already yourself.');

  const [target] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.userId, targetUserId), eq(memberships.tenantId, ctx.tenantId)))
    .limit(1);
  if (!target) throw new Error('That person is not a member of this academy.');
  if (!canViewAs(ctx.role, target.role as AppRole)) {
    throw new Error('You can only view as members below your own role.');
  }

  const store = await cookies();
  store.set(VIEW_AS_COOKIE, targetUserId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Re-validated every request regardless; the cap just stops a forgotten
    // session lingering forever.
    maxAge: 60 * 60,
  });

  await audited(db, {
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: 'view_as.start',
    resourceType: 'user',
    resourceId: targetUserId,
    after: { targetRole: target.role },
  });

  // The learner dashboard is what "view as" is for.
  return { redirectTo: '/dashboard' };
}

/** Ends the current view-as session and returns the admin to the People list. */
export async function stopViewAs(): Promise<{ redirectTo?: string }> {
  const ctx = await getTenantContext();
  const store = await cookies();
  const targetUserId = store.get(VIEW_AS_COOKIE)?.value;
  store.delete(VIEW_AS_COOKIE);

  if (ctx?.tenantId && targetUserId) {
    await audited(db, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'view_as.stop',
      resourceType: 'user',
      resourceId: targetUserId,
    });
  }

  return { redirectTo: '/admin/people' };
}
