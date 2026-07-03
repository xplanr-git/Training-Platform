import Link from 'next/link';
import { db, and, eq, desc, tenants, courses } from '@training-platform/db';

/**
 * Tenant storefront (catalog). Public — lists this academy's PUBLISHED courses.
 * Read is explicitly scoped to the resolved tenant + status=published (Drizzle
 * bypasses RLS). Reached via subdomain rewrite: acme.domain/ -> /t/acme.
 */
export default async function TenantHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  const catalog = tenant
    ? await db
        .select()
        .from(courses)
        .where(and(eq(courses.tenantId, tenant.id), eq(courses.status, 'published')))
        .orderBy(desc(courses.createdAt))
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold">{tenant?.name ?? slug}</h1>
        <p className="mt-2 text-muted">Browse our courses and start learning.</p>
      </header>

      {catalog.length === 0 ? (
        <p className="text-muted">No courses are published yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.slug}`}
              className="flex flex-col rounded-[--radius-card] border border-border bg-surface p-5 transition hover:shadow-md"
            >
              <h2 className="font-semibold">{c.title}</h2>
              <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted">
                {c.description || 'No description yet.'}
              </p>
              <span className="mt-3 text-sm font-medium text-brand-700">
                {c.price ? `${c.currency} ${c.price}` : 'Free'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
