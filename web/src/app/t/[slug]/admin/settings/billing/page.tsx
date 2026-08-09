import { Button } from '@/components/ui/button';
import { db, eq, subscriptions } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { PLANS } from '@/lib/stripe';
import { startSubscriptionCheckout, openBillingPortal } from './actions';
import { NavForm } from '@/components/nav-form';

/**
 * Stripe's own status vocabulary, which the webhook writes through verbatim. It was
 * rendered with a bare `capitalize`, and that does not split on an underscore — so an
 * academy whose payment had failed read "Status: Past_due". platform/page.tsx already
 * carries a label map for exactly this reason.
 */
const SUBSCRIPTION_STATUS: Record<string, string> = {
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Payment overdue',
  canceled: 'Cancelled',
  incomplete: 'Payment not finished',
  incomplete_expired: 'Payment not finished',
  unpaid: 'Unpaid',
  paused: 'Paused',
};

export default async function Billing({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(slug);

  const [sub] = ctx.tenantId
    ? await db
        .select({ planId: subscriptions.planId, status: subscriptions.status })
        .from(subscriptions)
        .where(eq(subscriptions.tenantId, ctx.tenantId))
        .limit(1)
    : [];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl">Plans and billing</h1>

      {sub ? (
        <div className="mt-4 flex items-center justify-between rounded-(--radius-card) border border-border bg-surface p-5">
          <div>
            <p className="font-medium capitalize">{sub.planId} plan</p>
            <p className="text-sm text-muted">
              Status: {SUBSCRIPTION_STATUS[sub.status] ?? sub.status}
            </p>
          </div>
          <NavForm action={openBillingPortal.bind(null, slug)}>
            <button className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted">
              Manage billing
            </button>
          </NavForm>
        </div>
      ) : (
        <p className="mt-2 text-muted">
          You&apos;re on the free trial. Choose a plan to continue after it ends.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className="rounded-(--radius-card) border border-border bg-surface p-5">
            <h2 className="text-base">{p.name}</h2>
            <p className="mt-1 text-sm text-muted">
              Up to {p.activeLearnerLimit.toLocaleString()} active learners
            </p>
            <NavForm action={startSubscriptionCheckout.bind(null, slug, p.id)} className="mt-4">
              {/*
                Was a hand-rolled brand-600 button — the last blue fill in the
                admin area, and a fifth button treatment besides. On the kit it
                inherits the ink primary, the disabled state and the tap target.
              */}
              <Button type="submit" disabled={sub?.planId === p.id} className="w-full">
                {sub?.planId === p.id ? 'Current plan' : 'Choose plan'}
              </Button>
            </NavForm>
          </div>
        ))}
      </div>
    </div>
  );
}
