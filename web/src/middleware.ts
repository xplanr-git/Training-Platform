import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { tenantSlugFromHost } from '@/lib/tenant';

// Shared routes that render the same on every host (apex and subdomains) and
// must NOT be rewritten into the tenant tree.
const SHARED_PREFIXES = ['/login', '/signup', '/verify', '/api', '/t/'];

/**
 * Runs on every request:
 *  1. Refreshes the Supabase auth session (keeps cookies fresh).
 *  2. Rewrites tenant subdomains (`acme.domain/...`) to the internal
 *     `/t/acme/...` route tree so tenant pages resolve by slug — except the
 *     shared auth/verify/api routes, which serve the root app on every host.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const host = request.headers.get('host');
  const slug = tenantSlugFromHost(host);
  const { pathname } = request.nextUrl;

  const isShared = SHARED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || (p === '/t/' && pathname.startsWith(p)),
  );

  if (slug && !isShared) {
    const url = request.nextUrl.clone();
    url.pathname = `/t/${slug}${pathname === '/' ? '' : pathname}`;
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
