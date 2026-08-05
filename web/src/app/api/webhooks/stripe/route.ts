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
import { sendReceiptEmail, sendEnrollmentEmail } from '@/lib/email';

// Stripe signature verification needs the raw body → Node runtime.
export const runtime = 'nodejs';

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
        await db
          .update(subscriptions)
          .set({
            status: sub.status as never,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));
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
        const root = env.rootDomain();
        const origin = root.startsWith('localhost')
          ? `http://${tenant.slug}.${root}`
          : `https://${tenant.slug}.${root}`;
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

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        stripeSubscriptionId: subId,
        stripeCustomerId: customerId,
        planId: planId ?? 'starter',
        status: 'active',
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      tenantId,
      stripeSubscriptionId: subId,
      stripeCustomerId: customerId,
      planId: planId ?? 'starter',
      status: 'active',
    });
  }
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
