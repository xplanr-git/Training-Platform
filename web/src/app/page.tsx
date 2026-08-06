import Link from 'next/link';
import { env } from '@/lib/env';

export default function PlatformHome() {
  // Set only in single-tenant mode, which is the only mode where the apex can
  // resolve an academy for /join to belong to.
  const joinable = !!env.defaultTenantSlug();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Outdure Academy</h1>
      <p className="max-w-xl text-lg text-neutral-600">
        Product training and certification for Outdure contractors and dealers. Work through the
        courses at your own pace, on any device, and get certified.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Sign in
        </Link>
        {/*
          Only when a single-tenant academy is configured. `/join` is tenant-scoped
          — middleware rewrites it to /t/<slug>/join — so on a bare multi-tenant
          apex there is no academy to join and the link would 404. This page was
          the front door with no way in for anyone who did not already have an
          account.
        */}
        {joinable && (
          <Link
            href="/join"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
          >
            Request access
          </Link>
        )}
      </div>
    </main>
  );
}
