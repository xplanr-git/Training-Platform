import { db, eq, subscriptions } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { PLANS } from '@/lib/stripe';
import { startSubscriptionCheckout, openBillingPortal } from './actions';

export default async function Billing({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await withTenant();

  const [sub] = ctx.tenantId
    ? await db
        .select({ planId: subscriptions.planId, status: subscriptions.status })
        .from(subscriptions)
        .where(eq(subscriptions.tenantId, ctx.tenantId))
        .limit(1)
    : [];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Plans &amp; Billing</h1>

      {sub ? (
        <div className="mt-4 flex items-center justify-between rounded-[--radius-card] border border-border bg-surface p-5">
          <div>
            <p className="font-medium capitalize">{sub.planId} plan</p>
            <p className="text-sm text-muted capitalize">Status: {sub.status}</p>
          </div>
          <form action={openBillingPortal.bind(null, slug)}>
            <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted">
              Manage billing
            </button>
          </form>
        </div>
      ) : (
        <p className="mt-2 text-muted">
          You&apos;re on the free trial. Choose a plan to continue after it ends.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className="rounded-[--radius-card] border border-border bg-surface p-5">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm text-muted">
              Up to {p.activeLearnerLimit.toLocaleString()} active learners
            </p>
            <form action={startSubscriptionCheckout.bind(null, slug, p.id)} className="mt-4">
              <button
                disabled={sub?.planId === p.id}
                className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {sub?.planId === p.id ? 'Current plan' : 'Choose plan'}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
