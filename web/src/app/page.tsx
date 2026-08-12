import Link from 'next/link';
import { env } from '@/lib/env';
import { Button } from '@/components/ui/button';

export default function PlatformHome() {
  // Set only in single-tenant mode, which is the only mode where the apex can
  // resolve an academy for /join to belong to.
  const joinable = !!env.defaultTenantSlug();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-display">Outdure Academy</h1>
      <p className="text-foreground-2 max-w-xl text-lg">
        Product training and certification for Outdure contractors and dealers. Work through the
        courses at your own pace, on any device, and get certified.
      </p>
      {/*
        Both actions were hand-rolled anchors — one a neutral-900 fill, one a
        neutral-300 outline — which is a second button language on the app's front
        door, and the one screen where the brand impression is formed. On the kit
        they inherit the ink primary, the quiet secondary, and the 44px phone tap
        target the kit's sizes encode.
      */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        {/*
          Only when a single-tenant academy is configured. `/join` is tenant-scoped
          — middleware rewrites it to /t/<slug>/join — so on a bare multi-tenant
          apex there is no academy to join and the link would 404. This page was
          the front door with no way in for anyone who did not already have an
          account.
        */}
        {joinable && (
          <Button asChild variant="outline">
            <Link href="/join">Request access</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
