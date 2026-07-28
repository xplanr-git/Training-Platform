import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

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
];

const nextConfig = {
  reactStrictMode: true,
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

export default nextConfig;
