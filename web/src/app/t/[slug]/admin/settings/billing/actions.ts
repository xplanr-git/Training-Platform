'use server';

import { redirect } from 'next/navigation';
import { db, eq, subscriptions } from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { stripe, priceIdForPlan } from '@/lib/stripe';
import { env } from '@/lib/env';
import { tenantOrigin } from '@/lib/host';

/** Starts a Stripe Checkout session for a SaaS subscription plan. */
export async function startSubscriptionCheckout(tenantSlug: string, planId: string) {
  const ctx = await requireAdmin();

  const priceId = priceIdForPlan(planId);
  if (!priceId) throw new Error('Plan is not available');

  const origin = tenantOrigin(tenantSlug);
  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: ctx.email ?? undefined,
    client_reference_id: ctx.tenantId,
    subscription_data: { metadata: { tenantId: ctx.tenantId, planId } },
    metadata: { tenantId: ctx.tenantId, planId, kind: 'subscription' },
    success_url: `${origin}/admin/settings/billing?success=1`,
    cancel_url: `${origin}/admin/settings/billing?canceled=1`,
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error('Could not start checkout');
  redirect(session.url);
}

/** Opens the Stripe Customer Portal for the tenant's subscription. */
export async function openBillingPortal(tenantSlug: string) {
  const ctx = await requireAdmin();

  const [sub] = await db
    .select({ customerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, ctx.tenantId))
    .limit(1);
  if (!sub?.customerId) throw new Error('No active subscription');

  const session = await stripe().billingPortal.sessions.create({
    customer: sub.customerId,
    return_url: `${tenantOrigin(tenantSlug)}/admin/settings/billing`,
  });
  redirect(session.url);
}
