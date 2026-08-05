import { redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/tenant';

/** Platform-admin area guard. Only platform_admin role may enter. */
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login?next=/platform');
  if (ctx.role !== 'platform_admin') redirect('/');

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface px-6 py-4">
        <h1 className="text-lg font-semibold">Platform admin</h1>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
