import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { EmptyState, NoMatches } from '@/components/empty-state';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { createClient as supabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { db, and, eq, ilike, desc, count, courses } from '@training-platform/db';
import { tenantBySlug } from '@/lib/tenant';
import { parsePage, pageMeta, PAGE_SIZE } from '@/lib/pagination';
import { safeHttpUrl } from '@/lib/validation';
import type { Branding } from '@/lib/content-types';
import { Pagination } from '@/components/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Per-tenant SEO metadata for the storefront. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await tenantBySlug(slug);
  if (!t) return { title: 'Academy' };
  const tagline = (t.branding as Branding | null)?.tagline;
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

  // Same row generateMetadata just resolved — request-cached, so this is free.
  const tenant = await tenantBySlug(slug);

  const branding = (tenant?.branding ?? {}) as Branding;
  const logoUrl = safeHttpUrl(branding.logoUrl);

  const filters = tenant ? [eq(courses.tenantId, tenant.id), eq(courses.status, 'published')] : [];
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
  // The viewer is read HERE, inside the existing Promise.all, so knowing who is
  // looking costs no extra round trip. It is needed because this page became the
  // landing page for signed-in users when `/` started following the session — and
  // it had no header at all, so a learner arriving here had no way to reach their
  // dashboard and no way to sign out, on a page they now land on by default.
  const [countRows, requestedRows, viewer] = await Promise.all([
    tenant
      ? db
          .select({ total: count() })
          .from(courses)
          .where(and(...filters))
      : Promise.resolve([] as Array<{ total: number }>),
    tenant ? rowsAt(requestedOffset) : Promise.resolve([] as Awaited<ReturnType<typeof rowsAt>>),
    // getSession, NOT getUser: getUser makes a network round trip to Supabase to
    // re-validate the JWT, and the middleware has ALREADY done exactly that on
    // this request — so calling it here made the storefront pay for two auth
    // round trips per page load, on the page `/` now lands on. getSession reads
    // the cookie locally.
    //
    // Measured signed OUT: no difference, because getUser short-circuits with no
    // session to validate. The cost only lands on signed-in users, which is the
    // case that could not be measured here — no test account exists on this
    // project. So this is a correct-by-construction fix, not a measured one.
    //
    // Safe for this specific use: the only thing it decides is which nav links to
    // render. It grants no access and gates no data — every read on this page is
    // scoped to the published courses of a tenant resolved from the URL. A forged
    // cookie would buy someone a "Sign out" link and nothing else.
    supabase().then((c) => c.auth.getSession().then((r) => !!r.data.session)),
  ]);
  const signedIn = viewer;
  const total = countRows[0]?.total ?? 0;
  const meta = pageMeta(requestedPage, total);

  // Only when ?page= was past the end does the clamped offset differ, and only
  // then is a second query needed — so the common path stays at one round trip.
  const catalog =
    !tenant || meta.offset === requestedOffset ? requestedRows : await rowsAt(meta.offset);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:py-14">
      <header className="mb-10">
        <nav className="mb-6 flex flex-wrap items-center justify-end gap-3 text-sm">
          <ThemeToggle className="mr-auto" />
          {signedIn ? (
            <>
              <Link href="/dashboard" className="text-link hover:text-link-hover hover:underline">
                My learning
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-link hover:text-link-hover hover:underline">
                Sign in
              </Link>
              {/* Always safe here: this page IS a tenant, so /join resolves. */}
              <Link href="/join" className="text-link hover:text-link-hover hover:underline">
                Request access
              </Link>
            </>
          )}
        </nav>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={tenant?.name ?? slug} className="mb-4 h-12 w-auto" />
        )}
        <h1 className="text-display">{tenant?.name ?? slug}</h1>
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
        query ? (
          <NoMatches query={query} basePath="/" />
        ) : (
          <EmptyState icon={<GraduationCap />} title="No courses published yet">
            Training courses will appear here as soon as they are published. If you were expecting
            one, ask whoever invited you — they may still be putting it together.
          </EmptyState>
        )
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => (
            <Link key={c.id} href={`/courses/${c.slug}`} className="group block">
              <Card className="flex h-full flex-col border border-transparent transition-colors group-hover:border-keyline">
                <CardHeader>
                  <CardTitle as="h2" className="text-base">
                    {c.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {c.description || 'No description yet.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  {/* System blue, never the tenant accent: "blue = link" only
                      stays true if nothing else can paint a link another
                      colour. Tenant colour lives on the certificate (owner
                      decision 2026-08-13); storefront identity is carried by
                      the logo and name. */}
                  <span className="text-link group-hover:text-link-hover text-sm font-semibold group-hover:underline">
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
