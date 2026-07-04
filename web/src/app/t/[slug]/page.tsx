import Link from 'next/link';
import { db, and, eq, ilike, desc, tenants, courses } from '@training-platform/db';

/**
 * Tenant storefront (catalog). Public — lists this academy's PUBLISHED courses.
 * Read is explicitly scoped to the resolved tenant + status=published (Drizzle
 * bypasses RLS). Reached via subdomain rewrite: acme.domain/ -> /t/acme.
 */
export default async function TenantHome({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, branding: tenants.branding })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  const branding = (tenant?.branding ?? {}) as {
    tagline?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  const accent = branding.primaryColor || undefined;

  const filters = tenant
    ? [eq(courses.tenantId, tenant.id), eq(courses.status, 'published')]
    : [];
  if (tenant && query) filters.push(ilike(courses.title, `%${query}%`));

  const catalog = tenant
    ? await db
        .select()
        .from(courses)
        .where(and(...filters))
        .orderBy(desc(courses.createdAt))
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <header className="mb-10">
        {branding.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt={tenant?.name ?? slug} className="mb-4 h-12 w-auto" />
        )}
        <h1 className="text-3xl font-semibold" style={accent ? { color: accent } : undefined}>
          {tenant?.name ?? slug}
        </h1>
        <p className="mt-2 text-muted">
          {branding.tagline || 'Browse our courses and start learning.'}
        </p>
        <form method="get" className="mt-5 flex max-w-md gap-2">
          <input
            type="search"
            name="q"
            aria-label="Search courses"
            defaultValue={query}
            placeholder="Search courses…"
            className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
          />
          <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted">
            Search
          </button>
        </form>
      </header>

      {catalog.length === 0 ? (
        <p className="text-muted">
          {query
            ? `No courses match “${query}”.`
            : 'No courses are published yet. Check back soon.'}
        </p>
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
              <span
                className="mt-3 text-sm font-medium text-brand-700"
                style={accent ? { color: accent } : undefined}
              >
                {c.price ? `${c.currency} ${c.price}` : 'Free'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
