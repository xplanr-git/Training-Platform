import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Content-Security-Policy.
 *
 * There was none, while six other security headers were set — and the omission
 * mattered more here than it usually does. The Supabase auth cookie is scoped to
 * `.training.structurebuild.co` (commit 083f1ac) and is necessarily readable by
 * JavaScript, so ONE cross-site-scripting flaw on ANY subdomain yields session
 * tokens for every account on the platform. A CSP is what stops injected script
 * from reaching an attacker's origin with them.
 *
 * 'unsafe-inline' and 'unsafe-eval' on script-src are, regrettably, required:
 * Next's App Router inlines its bootstrap and flight payload into the document,
 * and removing them needs per-request nonces plumbed through the middleware —
 * worth doing, but a bigger change than this and easy to get subtly wrong. The
 * value here is therefore mostly in connect-src and frame-src: even with script
 * injection, exfiltration has nowhere permitted to go.
 */
function contentSecurityPolicy() {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const posthog = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  const connect = [
    "'self'",
    supabase,
    // Supabase Realtime, if it is ever switched on, is a websocket to the same host.
    supabase.replace(/^https:/, 'wss:'),
    posthog,
    'https://*.ingest.sentry.io',
    'https://*.sentry.io',
    // Direct-to-Bunny tus uploads from the course builder.
    'https://video.bunnycdn.com',
    'https://*.b-cdn.net',
  ].filter(Boolean);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    // Stronger than the X-Frame-Options header alongside it, and understood by
    // browsers that ignore that one.
    "frame-ancestors 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob: https:",
    // The video player embed.
    "frame-src 'self' https://iframe.mediadelivery.net",
    `connect-src ${connect.join(' ')}`,
  ].join('; ');
}

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
];

const nextConfig = {
  reactStrictMode: true,
  // Overridable dist dir for LOCAL verify runs only. On Windows, `next build`
  // and a running `next dev` fight over `.next` (EPERM on .next/trace), and
  // with two work sessions in one checkout that collision is routine —
  // `NEXT_DIST_DIR=.next-verify npm run build` lets the gate run beside a live
  // dev server. Unset (CI, Vercel, normal dev) this is exactly '.next'.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // The v2 database schema lives in the sibling db/ package (TS source).
  transpilePackages: ['@training-platform/db'],
  // `@training-platform/db` is a `file:../db` dependency, so npm symlinks it to
  // a directory OUTSIDE this one. Next infers the file-tracing root from the
  // nearest lockfile (web/), and "Collecting build traces" then walks that
  // symlink out of the traced root — which fails on Vercel, where the Root
  // Directory is `web`. Pin the root to the repo root so ../db is inside it.
  // Requires Vercel → Settings → Build → "Include source files outside of the
  // Root Directory" (see DEPLOY.md §5).
  outputFileTracingRoot: path.join(here, '..'),
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

/**
 * Source-map upload, so a production stack trace names a line of our source
 * instead of a column in a minified chunk.
 *
 * A comment in src/instrumentation.ts claimed this was "wired in CI". It was
 * not — withSentryConfig appeared nowhere, so no build has ever uploaded a map
 * and every server-side Sentry event since was effectively unreadable.
 *
 * Upload only happens when SENTRY_AUTH_TOKEN, org and project are all present.
 * Wrapping unconditionally is still correct and is what makes the client config
 * take effect; without the token it simply skips the upload step, so a clone
 * with no Sentry credentials builds exactly as before.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // The plugin is loud by default; keep CI logs about our build, not its upload.
  silent: !process.env.CI,
  // Strip the maps from the client bundle after upload — otherwise anyone can
  // fetch them and read the source.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // Route Sentry's browser requests through our own origin, so an ad blocker
  // does not silently drop every error report.
  tunnelRoute: '/monitoring',
  disableLogger: true,
});
