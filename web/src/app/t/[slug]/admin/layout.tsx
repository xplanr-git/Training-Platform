import type { Metadata } from 'next';
import { requireAdminForSlug, tenantBySlug } from '@/lib/tenant';
import { AdminShell } from '@/components/admin-shell';

/**
 * Titles every admin screen as "<Page> · <Academy>".
 *
 * Every page in the admin area used to render the root layout's static
 * "Outdure Academy", so a browser tab, a history entry and a bookmark all said
 * the same thing for eleven different screens — and an admin with several tabs
 * open could not tell them apart.
 *
 * The template lives here rather than in the root layout so the academy's own
 * name is used, which is also what makes it correct for more than one tenant.
 * It costs nothing: requireAdminForSlug has already resolved this row through
 * the request-cached tenantBySlug, so this is a map lookup.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await tenantBySlug(slug);
  const name = tenant?.name ?? 'Academy';
  return {
    title: {
      // Used by any admin route that sets no title of its own.
      default: `${name} admin`,
      template: `%s · ${name}`,
    },
  };
}

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

  // Already resolved by requireAdminForSlug above; tenantBySlug is request-cached,
  // so this is a map lookup rather than a second round trip for the same row.
  const tenant = await tenantBySlug(slug);

  return (
    <AdminShell tenantName={tenant?.name ?? slug} userEmail={ctx.email}>
      {children}
    </AdminShell>
  );
}
