import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db, eq, and, users, memberships } from '@training-platform/db';
import { getTenantContext, tenantBySlug } from '@/lib/tenant';
import { audienceLabel, type Audience } from '@/lib/audience';
import { LearnerShell } from '@/components/learner-shell';

/**
 * Account — minimal identity for V2. Name, email, audience, and the security
 * (password) route. View-only: changing name/email touches auth/identity and is
 * out of scope here. Sign out lives in the shell.
 */
export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) redirect('/login');
  const tenant = await tenantBySlug(slug);

  const [me] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);
  const [mem] = await db
    .select({ audience: memberships.audience })
    .from(memberships)
    .where(and(eq(memberships.userId, ctx.userId), eq(memberships.tenantId, ctx.tenantId)))
    .limit(1);

  const rowClass =
    'flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4';
  const audience = audienceLabel((mem?.audience as Audience | null) ?? null);

  return (
    <>
      <LearnerShell slug={slug} tenantName={tenant?.name ?? 'Outdure Academy'} active="account" />
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-14">
        <h1 className="text-2xl">Account</h1>
        <dl className="divide-border mt-6 max-w-prose divide-y">
          <div className={rowClass}>
            <dt className="text-foreground-2 text-sm">Name</dt>
            <dd className="text-sm font-medium">{me?.name?.trim() || '—'}</dd>
          </div>
          <div className={rowClass}>
            <dt className="text-foreground-2 text-sm">Email</dt>
            <dd className="text-sm font-medium break-all">{me?.email ?? '—'}</dd>
          </div>
          <div className={rowClass}>
            <dt className="text-foreground-2 text-sm">You are</dt>
            <dd className="text-sm font-medium">{audience ?? 'Not set'}</dd>
          </div>
          <div className={rowClass}>
            <dt className="text-foreground-2 text-sm">Password</dt>
            <dd className="text-sm">
              <Link href="/login/forgot" className="text-link hover:underline">
                Change your password
              </Link>
            </dd>
          </div>
        </dl>
        <p className="text-muted mt-6 max-w-prose text-meta leading-relaxed">
          Need your name or email changed?{' '}
          <Link href={`/t/${slug}/help`} className="text-link hover:underline">
            Ask for help
          </Link>{' '}
          and we’ll update it.
        </p>
      </main>
    </>
  );
}
