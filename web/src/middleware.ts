import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { tenantRewritePath } from '@/lib/host';
import { env } from '@/lib/env';

/**
 * Runs on every request:
 *  1. Refreshes the Supabase auth session (keeps cookies fresh).
 *  2. Resolves the request to a tenant and rewrites it into the internal
 *     `/t/<slug>/...` tree — from a subdomain, or from the apex when
 *     DEFAULT_TENANT_SLUG configures single-tenant mode. See tenantRewritePath
 *     for which routes are excluded and why.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const rewritePath = tenantRewritePath({
    host: request.headers.get('host'),
    pathname,
    defaultSlug: env.defaultTenantSlug(),
  });

  if (rewritePath) {
    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    const rewrite = NextResponse.rewrite(url, { request });
    // Preserve any refreshed auth cookies from updateSession.
    response.cookies.getAll().forEach((c) => rewrite.cookies.set(c));
    return rewrite;
  }

  // Gate the platform-admin area behind auth.
  if (pathname.startsWith('/platform') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip static assets and image optimisation.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
