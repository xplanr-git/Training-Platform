import { redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/tenant';
import { postSignInDestination } from '@/app/login/actions';

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

  const dest = await postSignInDestination();
  // Anything other than this page means we know where they belong. The guard
  // matters: redirecting to '/dashboard' from '/dashboard' would loop.
  if (dest !== '/dashboard') redirect(dest);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold">You&apos;re signed in</h1>
      <p className="text-neutral-600">
        Your account isn&apos;t linked to an academy yet. Ask an administrator to invite you.
      </p>
    </main>
  );
}
