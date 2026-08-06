import { eq } from '@training-platform/db';
import { db, tenants } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { AdminShell } from '@/components/admin-shell';

/**
 * Auth + role guard for the whole admin area, wrapped in the sidebar shell.
 *
 * Delegates to requireAdminForSlug rather than re-deciding. The hand-rolled
 * check this replaces had two faults the shared guard does not: it read the
 * role from the JWT claim, so a demotion took up to an hour to bite; and it
 * never looked at `slug`, so the URL's academy went unverified at the shell
 * level and only the pages beneath it caught a mismatch.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(slug);

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
