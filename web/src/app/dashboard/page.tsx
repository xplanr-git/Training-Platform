import { redirect } from 'next/navigation';
import { db, and, eq, asc, memberships, tenants } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { landAfterSignIn } from '@/app/login/actions';

/**
 * Apex fallback dashboard. Every user belongs to a tenant, so route them to
 * their academy — admins to /admin, learners to the learning dashboard. Only
 * reached on the bare apex host; tenant subdomains rewrite /dashboard into
 * /t/[slug]/dashboard before this runs.
 *
 * Delegates to postSignInDestination so there is ONE resolver deciding where a
 * signed-in person belongs. This page previously duplicated that logic off the
 * JWT's role claim, which meant an admin arriving here with a stale token was
 * routed to the learner dashboard — and it had to be fixed twice.
 */
export default async function Dashboard() {
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');

  /*
   * The activation and the routing both live in landAfterSignIn, which the
   * tenant-subdomain dashboard also calls — so the two hosts cannot drift.
   *
   * They used to be called as Server Actions from the sign-in and set-password
   * screens, where the session cookie the client had just written was not
   * reliably visible, so the one path that proves someone accepted an invitation
   * could silently do nothing. A page is a full document request, so the cookie
   * is certain. Safe on every visit: a no-op once the membership is active and
   * once the caller is already where they belong.
   */
  await landAfterSignIn('/dashboard');

  /*
   * A pending join request lands here, because the access-token hook and
   * primaryMembership both ignore 'pending' — which is exactly the gate working.
   * But the message below used to tell them to "ask an administrator to invite
   * you", which they had already done, so the one state the page could not
   * explain was the one it was most likely to be showing.
   */
  const [waiting] = await db
    .select({ academy: tenants.name })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(and(eq(memberships.userId, ctx.userId), eq(memberships.status, 'pending')))
    .orderBy(asc(memberships.createdAt))
    .limit(1);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-xl">You&apos;re signed in</h1>
      {waiting ? (
        <p className="text-neutral-600">
          Your request to join {waiting.academy} is waiting for an administrator to accept it.
          You&apos;ll be able to open the courses as soon as it is.
        </p>
      ) : (
        <p className="text-neutral-600">
          Your account isn&apos;t linked to an academy yet. Ask an administrator to invite you.
        </p>
      )}
    </main>
  );
}
