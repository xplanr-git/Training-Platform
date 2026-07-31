/**
 * Validates a caller-supplied redirect target (`?next=`).
 *
 * Isomorphic on purpose: the same rule has to apply in the /auth/confirm route
 * handler and in the client-side sign-in and set-password pages. Three separate
 * hand-rolled checks is how the app ended up with two different open redirects.
 *
 * Validation is by RESOLUTION, not by pattern matching. Rejecting known-bad
 * shapes one at a time never converges — `//host` was blocked while `/\host` and
 * `/%09host` still resolved off-origin, because the WHATWG URL parser treats a
 * backslash as a slash for http(s) and strips tab/CR/LF before parsing. Letting
 * the parser decide and then comparing origins closes the whole class.
 */
const DEFAULT_FALLBACK = '/dashboard';

export function safeRedirect(
  raw: string | null | undefined,
  origin: string,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!raw) return fallback;

  let resolved: URL;
  try {
    resolved = new URL(raw, origin);
  } catch {
    return fallback;
  }

  // Anything that resolves to a different origin is an open redirect, whatever
  // shape it arrived in.
  if (resolved.origin !== origin) return fallback;

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  return path.startsWith('/') ? path : fallback;
}
