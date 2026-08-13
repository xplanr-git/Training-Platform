import { requirePlatformAdminPage } from '@/lib/tenant';

/**
 * Platform-admin area guard. Only a live platform_admin membership may enter —
 * checked against the database rather than the token's role claim, which lags a
 * revocation by up to an hour.
 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdminPage();

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface px-6 py-4">
        <h1 className="text-sm font-extrabold">Platform admin</h1>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
