import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { db, eq, and, memberships, users } from '@training-platform/db';
import { getTenantContext, currentAdminRole, type AppRole } from '@/lib/tenant';

/**
 * "View as" — an admin sees the app exactly as a member beneath them would, but
 * READ-ONLY.
 *
 * The one security invariant: the target user's id is used ONLY to scope data
 * reads. Authorization and every write still resolve to the real admin
 * (getTenantContext), and writes are refused entirely while a session is active
 * (assertNotViewingAs). So this can neither escalate privilege nor record
 * anything as the target — which matters for a platform selling audit-grade
 * evidence: an admin's look must never pollute a learner's progress.
 */

/** Host-only, httpOnly cookie holding the user id an admin is viewing as. */
export const VIEW_AS_COOKIE = 'sb_view_as';

const ROLE_RANK: Record<AppRole, number> = {
  platform_admin: 3,
  company_admin: 2,
  instructor: 1,
  learner: 0,
};

/**
 * Whether `callerRole` may view AS `targetRole`: strictly-lower rank only. An
 * admin never views a peer or a superior, so view-as can't be a lateral or
 * upward privilege probe. Combined with startViewAs requiring an admin, only
 * company_admin/platform_admin can start it, and only over instructors/learners
 * (and, for a platform admin, company admins).
 */
export function canViewAs(callerRole: AppRole, targetRole: AppRole): boolean {
  return ROLE_RANK[targetRole] < ROLE_RANK[callerRole];
}

export interface ViewAsState {
  adminUserId: string;
  targetUserId: string;
  targetName: string;
  targetRole: AppRole;
}

/**
 * The active view-as session, or null — RE-VALIDATED against the database on
 * every request, so the cookie alone grants nothing:
 *  - the real caller must currently be an admin of this tenant, and
 *  - the target must be a member of THIS tenant with a strictly-lower role.
 *
 * A stale, forged, cross-tenant, or since-revoked cookie therefore resolves to
 * null. `cache()` dedupes it per request, so the layout banner, a page, and a
 * guard share one lookup.
 */
export const getViewAs = cache(async (): Promise<ViewAsState | null> => {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) return null;

  const store = await cookies();
  const targetUserId = store.get(VIEW_AS_COOKIE)?.value;
  if (!targetUserId || targetUserId === ctx.userId) return null;

  // The real caller must be an admin of this tenant, per the database.
  const callerRole = await currentAdminRole(ctx.userId, ctx.tenantId);
  if (!callerRole) return null;

  // The target must be a member of THIS tenant, with a role below the caller's.
  const [target] = await db
    .select({ role: memberships.role, name: users.name, email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.userId, targetUserId), eq(memberships.tenantId, ctx.tenantId)))
    .limit(1);
  if (!target) return null;

  const targetRole = target.role as AppRole;
  if (!canViewAs(callerRole, targetRole)) return null;

  return {
    adminUserId: ctx.userId,
    targetUserId,
    targetName: target.name || target.email,
    targetRole,
  };
});

/**
 * The user id whose DATA a learner surface should read: the view-as target when
 * a session is active, otherwise the real caller. READS ONLY — never pass the
 * result to a write.
 */
export async function effectiveUserId(realUserId: string): Promise<string> {
  return (await getViewAs())?.targetUserId ?? realUserId;
}

/** True when the current request is an admin viewing as someone else. */
export async function isViewingAs(): Promise<boolean> {
  return (await getViewAs()) !== null;
}

/**
 * Refuses a mutation while viewing-as. View-as is a read-only lens; the write
 * paths already scope to the real admin (so they cannot touch the target's rows
 * regardless), but this turns an incidental "Enrollment not found" into a clear,
 * honest refusal. Every learner-facing mutation calls it.
 */
export async function assertNotViewingAs(): Promise<void> {
  if (await getViewAs()) throw new Error('VIEW_AS_READONLY');
}
