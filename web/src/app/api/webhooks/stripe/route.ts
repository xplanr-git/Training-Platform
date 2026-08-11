import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  db,
  audited,
  eq,
  and,
  orders,
  enrollments,
  subscriptions,
  courses,
  tenants,
} from '@training-platform/db';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { tenantOrigin } from '@/lib/host';
import { sendReceiptEmail, sendEnrollmentEmail } from '@/lib/email';

// Stripe signature verification needs the raw body → Node runtime.
export const runtime = 'nodejs';

// The enum our `subscriptions.status` column accepts — derived from the schema so
// it can't drift from the migration.
type SubscriptionStatus = NonNullable<typeof subscriptions.$inferInsert.status>;

/**
 * Stripe's subscription-status union is WIDER than our enum: it also emits
 * `paused` and `incomplete_expired`. Writing those raw — which the old
 * `sub.status as never` cast silently allowed — makes the UPDATE throw at the pg
 * enum, so the webhook 500s and Stripe retries the event indefinitely while the
 * row that decides tenant entitlement never updates. Map explicitly, and default
 * any status Stripe adds later to `past_due` rather than crashing.
 */
const STRIPE_SUBSCRIPTION_STATUS: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  unpaid: 'unpaid',
  canceled: 'canceled',
  incomplete: 'incomplete',
  incomplete_expired: 'canceled', // never paid and now expired — a dead subscription
  paused: 'past_due', // not actively billing; nearest "not currently entitled"
};

function toSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const mapped = STRIPE_SUBSCRIPTION_STATUS[status];
  if (!mapped) {
    console.warn(`[stripe] unmapped subscription status "${status}" — storing past_due`);
    return 'past_due';
  }
  return mapped;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, env.stripeWebhookSecret());
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        if (meta.kind === 'course') {
          await handleCoursePurchase(session, meta);
        } else if (meta.kind === 'subscription') {
          await handleSubscriptionCheckout(session, meta);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await db.transaction(async (tx) => {
          // Read first: the audit needs the tenant this belongs to and the
          // status it is moving away from, and after the UPDATE both are gone.
          const [before] = await tx
            .select({
              id: subscriptions.id,
              tenantId: subscriptions.tenantId,
              status: subscriptions.status,
              planId: subscriptions.planId,
            })
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, sub.id))
            .limit(1);
          if (!before) return;

          await tx
            .update(subscriptions)
            .set({
              status: toSubscriptionStatus(sub.status),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            })
            .where(eq(subscriptions.id, before.id));

          // Whether an academy is entitled to trade is decided by this row, and
          // it was being changed by an outside system with no record of who or
          // why. "Why did this academy stop working on the 3rd" was previously
          // answerable only from Stripe's dashboard. actorUserId is null: the
          // actor is Stripe, not a person.
          await audited(tx, {
            tenantId: before.tenantId,
            actorUserId: null,
            action: `subscription.${event.type === 'customer.subscription.deleted' ? 'deleted' : 'updated'}`,
            resourceType: 'subscription',
            resourceId: sub.id,
            before: { status: before.status, planId: before.planId },
            after: { status: sub.status, currentPeriodEnd: sub.current_period_end },
          });
        });
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
        if (pi) await handleRefund(pi);
        break;
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCoursePurchase(
  session: Stripe.Checkout.Session,
  meta: Record<string, string>,
) {
  const { tenantId, userId, courseId } = meta;
  if (!tenantId || !userId || !courseId) return;
  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : null;

  await db.transaction(async (tx) => {
    // Idempotency: skip if we already recorded this payment intent.
    if (paymentIntent) {
      const [dup] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.stripePaymentIntent, paymentIntent))
        .limit(1);
      if (dup) return;
    }

    await tx.insert(orders).values({
      tenantId,
      userId,
      courseId,
      stripePaymentIntent: paymentIntent,
      amount: String((session.amount_total ?? 0) / 100),
      currency: (session.currency ?? 'usd').toUpperCase(),
      status: 'paid',
    });

    await tx
      .insert(enrollments)
      .values({ tenantId, userId, courseId, status: 'active', source: 'purchase' })
      .onConflictDoNothing();

    await audited(tx, {
      tenantId,
      actorUserId: userId,
      action: 'order.paid',
      resourceType: 'order',
      resourceId: paymentIntent,
      after: { courseId, amount: session.amount_total },
    });
  });

  // Best-effort receipt + enrollment emails.
  const buyerEmail = session.customer_details?.email ?? session.customer_email;
  if (buyerEmail) {
    try {
      const [course] = await db
        .select({ title: courses.title, slug: courses.slug })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);
      const [tenant] = await db
        .select({ slug: tenants.slug })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      if (course && tenant) {
        // tenantOrigin, not an inline `${slug}.${root}`: in single-tenant mode
        // (the live deployment) that host is in neither DNS nor the TLS cert, so
        // the "Start learning" link failed at the browser. The free-enrolment
        // path already uses this; the paid path must not diverge.
        const origin = tenantOrigin(tenant.slug);
        await sendReceiptEmail(
          buyerEmail,
          course.title,
          String((session.amount_total ?? 0) / 100),
          (session.currency ?? 'usd').toUpperCase(),
        );
        await sendEnrollmentEmail(buyerEmail, course.title, `${origin}/learn/${course.slug}`);
      }
    } catch (e) {
      console.error('purchase emails failed:', e);
    }
  }
}

async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  meta: Record<string, string>,
) {
  const { tenantId, planId } = meta;
  if (!tenantId) return;
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const subId = typeof session.subscription === 'string' ? session.subscription : null;

  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(subscriptions)
        .set({
          stripeSubscriptionId: subId,
          stripeCustomerId: customerId,
          planId: planId ?? 'starter',
          status: 'active',
        })
        .where(eq(subscriptions.id, existing.id));
    } else {
      await tx.insert(subscriptions).values({
        tenantId,
        stripeSubscriptionId: subId,
        stripeCustomerId: customerId,
        planId: planId ?? 'starter',
        status: 'active',
      });
    }

    // The moment an academy starts paying, and on which plan — which decides
    // its limits and entitlements. Unrecorded until now.
    await audited(tx, {
      tenantId,
      actorUserId: null,
      action: existing ? 'subscription.update' : 'subscription.create',
      resourceType: 'subscription',
      resourceId: subId,
      after: { planId: planId ?? 'starter', status: 'active', stripeCustomerId: customerId },
    });
  });
}

async function handleRefund(paymentIntent: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntent, paymentIntent))
    .limit(1);
  if (!order) return;

  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: 'refunded' }).where(eq(orders.id, order.id));
    if (order.courseId) {
      await tx
        .update(enrollments)
        .set({ status: 'cancelled' })
        .where(and(eq(enrollments.userId, order.userId), eq(enrollments.courseId, order.courseId)));
    }
    await audited(tx, {
      tenantId: order.tenantId,
      actorUserId: order.userId,
      action: 'order.refunded',
      resourceType: 'order',
      resourceId: paymentIntent,
      after: { orderId: order.id },
    });
  });
}
