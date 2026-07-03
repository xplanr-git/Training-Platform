import { redirect } from 'next/navigation';
import { eq } from '@training-platform/db';
import { db, tenants } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { AdminShell } from '@/components/admin-shell';

/** Auth + role guard for the whole admin area, wrapped in the sidebar shell. */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getTenantContext();

  if (!ctx) redirect('/login');
  if (ctx.role !== 'company_admin' && ctx.role !== 'platform_admin') {
    redirect('/dashboard');
  }

  const [tenant] = await db
    .select({ name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  return (
    <AdminShell tenantName={tenant?.name ?? slug} userEmail={ctx.email}>
      {children}
    </AdminShell>
  );
}
