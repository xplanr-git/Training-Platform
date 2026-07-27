import { redirect } from 'next/navigation';
import { db, eq, tenants } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';

/**
 * Apex fallback dashboard. Every user belongs to a tenant, so route them to
 * their academy — admins to /admin, learners to the learning dashboard. Only
 * reached on the bare apex host; tenant subdomains rewrite /dashboard into
 * /t/[slug]/dashboard before this runs.
 */
export default async function Dashboard() {
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');

  if (ctx.tenantId) {
    const [t] = await db
      .select({ slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);
    if (t) {
      const isAdmin = ctx.role === 'company_admin' || ctx.role === 'platform_admin';
      redirect(`/t/${t.slug}${isAdmin ? '/admin' : '/dashboard'}`);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold">You&apos;re signed in</h1>
      <p className="text-neutral-600">
        Your account isn&apos;t linked to an academy yet. Ask an administrator to invite you.
      </p>
    </main>
  );
}
