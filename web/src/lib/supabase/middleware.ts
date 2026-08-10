import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

/** Substring shared by every Supabase auth cookie, incl. chunk suffixes (.0/.1). */
const AUTH_COOKIE_MARKER = '-auth-token';

/**
 * Every domain scope a Supabase auth cookie could have been set with on this
 * deployment. A cookie is only deleted by a Set-Cookie that MATCHES the domain
 * it was set with, so healing has to expire it at host-only AND every shared
 * scope the app has ever used — otherwise a differently-scoped copy survives and
 * the session stays wedged. Includes the old `.${ROOT_DOMAIN}` scheme so a cookie
 * minted before the host-only switch is cleaned up too.
 */
function authCookieClearDomains(): Array<string | undefined> {
  const domains = new Set<string | undefined>();
  domains.add(undefined); // host-only (the current default)
  const explicit = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();
  if (explicit) domains.add(explicit);
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? '').split(':')[0];
  if (root && root !== 'localhost' && !/^\d/.test(root)) {
    domains.add(`.${root}`);
    const parts = root.split('.');
    if (parts.length > 2) domains.add(`.${parts.slice(-2).join('.')}`);
  }
  return [...domains];
}

/**
 * Whether an auth error means the session is genuinely unusable (a rejected
 * token) rather than a transient blip. Only real auth rejections — 400/401, or
 * an explicit refresh-token failure — qualify; a network/5xx error must NOT, or
 * a momentary Supabase outage would sign every user out at once.
 */
function isUnusableSession(error: { status?: number; code?: string } | null): boolean {
  if (!error) return false;
  if (error.code === 'refresh_token_not_found' || error.code === 'refresh_token_already_used') {
    return true;
  }
  return error.status === 400 || error.status === 401;
}

/**
 * Refreshes the Supabase session on every request and returns both the
 * (possibly updated) response and the authenticated user. Called from
 * middleware.ts. Do not run logic between client creation and getUser().
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookieOptions: { domain: env.cookieDomain() },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  /*
   * Self-heal an unusable session.
   *
   * If the request carries an auth cookie but the session cannot be validated —
   * the case that bit us was `refresh_token_not_found` after a token rotation
   * left a stale cookie — expire the auth cookies so the next request starts
   * clean and the caller simply signs in again. This recovers every affected
   * browser AUTOMATICALLY on its next navigation, with no manual cookie-clearing:
   * the only workable answer to "we shipped a bad cookie" once real users exist.
   *
   * Guarded tightly (isUnusableSession): only with an auth cookie actually
   * present and only on a real auth rejection — never on a transport/5xx error,
   * which would sign everyone out on a blip. Cookies are removed from the
   * forwarded REQUEST (so this render sees a clean logged-out state instead of
   * re-trying the dead token) and expired on the RESPONSE across every scope the
   * cookie might carry (so the browser drops it for good).
   */
  const authCookies = request.cookies.getAll().filter((c) => c.name.includes(AUTH_COOKIE_MARKER));
  if (!user && authCookies.length > 0 && isUnusableSession(error)) {
    for (const { name } of authCookies) request.cookies.delete(name);
    const cleared = NextResponse.next({ request });
    for (const { name } of authCookies) {
      for (const domain of authCookieClearDomains()) {
        cleared.cookies.set(name, '', { maxAge: 0, path: '/', domain });
      }
    }
    return { response: cleared, user: null };
  }

  return { response, user };
}
