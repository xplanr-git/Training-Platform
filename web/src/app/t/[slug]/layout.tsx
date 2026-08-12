import { notFound } from 'next/navigation';
import { tenantBySlug } from '@/lib/tenant';
import { getViewAs } from '@/lib/view-as';
import { ViewAsBanner } from '@/components/view-as-banner';

/**
 * Tenant shell. Resolves the tenant by subdomain slug and blocks access when
 * the tenant is suspended or cancelled. This is the enforcement point that
 * replaces the old localStorage suspension hack; RLS additionally denies data
 * once a tenant's membership/claims are revoked.
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await tenantBySlug(slug);

  if (!tenant) notFound();

  if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl">Academy unavailable</h1>
        <p className="text-muted">
          {tenant.name} is switched off at the moment. Nothing is wrong at your end — tell whoever
          runs your academy.
        </p>
      </main>
    );
  }

  // Re-validated per request; a stale/forged/cross-tenant cookie resolves to null.
  const viewAs = await getViewAs();

  return (
    <>
      {viewAs && <ViewAsBanner name={viewAs.targetName} role={viewAs.targetRole} />}
      {children}
    </>
  );
}
