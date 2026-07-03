import { redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/tenant';

/** Tenant admin home. Requires an admin session for this tenant. */
export default async function TenantAdmin() {
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');
  if (ctx.role !== 'company_admin' && ctx.role !== 'platform_admin') {
    redirect('/dashboard');
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-neutral-600">
        Signed in as {ctx.email}. Course authoring, people, and analytics land in
        Phase C.
      </p>
    </main>
  );
}
