import 'server-only';
import { env } from '@/lib/env';

/**
 * Builds an absolute URL for something that LEAVES the app — an email link, a
 * certificate's verification id, a payment return URL.
 *
 * Why this exists rather than string-concatenating env.appOrigin():
 *
 * NEXT_PUBLIC_ROOT_DOMAIN was once deployed to production as `localhost:3010`
 * (copied wholesale from a local .env file). Nothing appeared broken. Route
 * resolution still worked, because a host that doesn't match the configured root
 * is treated as the apex and DEFAULT_TENANT_SLUG takes over; cookies fell back to
 * host-only and auth worked. The ONLY casualty was absolute URLs — so password
 * reset emails linked to http://localhost:3010, and every certificate issued in
 * that window baked an unreachable verification URL into its credential JSON,
 * permanently, because that value is persisted at issue time.
 *
 * A misconfiguration whose only symptom is a dead link in someone else's inbox
 * is exactly the kind that survives to production. So this refuses to build the
 * URL at all, loudly, instead of quietly producing a useless one. Callers that
 * send mail surface the message; the admin sees what to fix.
 */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export function absoluteUrl(path: string): string {
  const origin = env.appOrigin();
  const suffix = path.startsWith('/') ? path : `/${path}`;

  if (process.env.NODE_ENV === 'production' && LOCAL_ORIGIN.test(origin)) {
    throw new Error(
      `NEXT_PUBLIC_ROOT_DOMAIN is "${env.rootDomain()}" in a production build, so ` +
        `${suffix} would be published as ${origin}${suffix} — a link nobody outside ` +
        `this machine can open. Set NEXT_PUBLIC_ROOT_DOMAIN to the deployed host ` +
        `and redeploy.`,
    );
  }

  return `${origin}${suffix}`;
}

/** True when absoluteUrl() would refuse. Lets callers warn without throwing. */
export function absoluteUrlMisconfigured(): boolean {
  return process.env.NODE_ENV === 'production' && LOCAL_ORIGIN.test(env.appOrigin());
}
