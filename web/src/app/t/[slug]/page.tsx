import type { Metadata } from 'next';
import Link from 'next/link';
import { db, and, eq, ilike, desc, count, tenants, courses } from '@training-platform/db';
import { parsePage, pageMeta, PAGE_SIZE } from '@/lib/pagination';
import { safeHttpUrl } from '@/lib/validation';
import { Pagination } from '@/components/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/** Per-tenant SEO metadata for the storefront. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [t] = await db
    .select({ name: tenants.name, branding: tenants.branding })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  if (!t) return { title: 'Academy' };
  const tagline = (t.branding as { tagline?: string } | null)?.tagline;
  const description = (tagline || `Browse courses from ${t.name}.`).slice(0, 160);
  return {
    title: `${t.name} — Courses`,
    description,
    openGraph: { title: t.name, description, type: 'website' },
  };
}

/**
 * Tenant storefront (catalog). Lists this academy's PUBLISHED courses.
 * Read is explicitly scoped to the resolved tenant + status=published (Drizzle
 * bypasses RLS). Reached via subdomain rewrite: acme.domain/ -> /t/acme.
 */
export default async function TenantHome({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const [{ slug }, { q, page: pageParam }] = await Promise.all([params, searchParams]);
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
  const logoUrl = safeHttpUrl(branding.logoUrl);

  const filters = tenant
    ? [eq(courses.tenantId, tenant.id), eq(courses.status, 'published')]
    : [];
  if (tenant && query) filters.push(ilike(courses.title, `%${query}%`));

  // The count and the page of rows are independent, so they run together.
  //
  // The offset is derived DIRECTLY from ?page= rather than from pageMeta, because
  // pageMeta clamps the page against pageCount — which it computes from the total.
  // Passing a provisional total of 0 would clamp every request to page 1 and
  // silently return the first page's rows for every page.
  const requestedPage = parsePage(pageParam);
  const rowsAt = (offset: number) =>
    db
      .select()
      .from(courses)
      .where(and(...filters))
      .orderBy(desc(courses.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

  const requestedOffset = (requestedPage - 1) * PAGE_SIZE;
  const [countRows, requestedRows] = await Promise.all([
    tenant
      ? db.select({ total: count() }).from(courses).where(and(...filters))
      : Promise.resolve([] as Array<{ total: number }>),
    tenant ? rowsAt(requestedOffset) : Promise.resolve([] as Awaited<ReturnType<typeof rowsAt>>),
  ]);
  const total = countRows[0]?.total ?? 0;
  const meta = pageMeta(requestedPage, total);

  // Only when ?page= was past the end does the clamped offset differ, and only
  // then is a second query needed — so the common path stays at one round trip.
  const catalog =
    !tenant || meta.offset === requestedOffset ? requestedRows : await rowsAt(meta.offset);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:py-14">
      <header className="mb-10">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={tenant?.name ?? slug} className="mb-4 h-12 w-auto" />
        )}
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={accent ? { color: accent } : undefined}
        >
          {tenant?.name ?? slug}
        </h1>
        <p className="mt-2 text-muted">
          {branding.tagline || 'Browse the courses and start your training.'}
        </p>
        <form method="get" className="mt-6 flex max-w-md gap-2">
          <Input
            type="search"
            name="q"
            aria-label="Search courses"
            defaultValue={query}
            placeholder="Search courses…"
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </header>

      {catalog.length === 0 ? (
        <div className="rounded-[--radius-card] border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted">
            {query
              ? `No courses match “${query}”.`
              : 'No courses published yet. Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => (
            <Link key={c.id} href={`/courses/${c.slug}`} className="group block">
              <Card className="flex h-full flex-col transition group-hover:border-brand-500 group-hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {c.description || 'No description yet.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <span
                    className="text-sm font-medium text-brand-700 group-hover:underline"
                    style={accent ? { color: accent } : undefined}
                  >
                    View course →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination meta={meta} basePath="/" params={{ q: query || undefined }} />
    </main>
  );
}
