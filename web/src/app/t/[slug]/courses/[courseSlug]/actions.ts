'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, audited, eq, and, courses, enrollments } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { assertNotViewingAs } from '@/lib/view-as';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { tenantOrigin } from '@/lib/host';
import { sendEnrollmentEmail } from '@/lib/email';
import { enforceRateLimit } from '@/lib/rate-limit-guard';
import { RULES } from '@/lib/rate-limit';

/**
 * Enrolls the current user in a published course (free path). Idempotent — a
 * repeat enroll is a no-op. Stripe checkout for priced courses is Phase E2.
 */
export async function enrollFree(tenantSlug: string, courseId: string, courseSlug: string) {
  const ctx = await getTenantContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
  if (!ctx.tenantId)
    throw new Error(
      'Your account is not linked to an academy yet. Sign out, sign in again, then tell whoever runs your academy.',
    );
  await assertNotViewingAs();

  // Writes a row and sends mail. Scoped to the user, not just the IP, so one
  // account cannot enrol in every course on the storefront in a loop.
  await enforceRateLimit('enroll', RULES.enroll, ctx.userId);

  const [course] = await db
    .select({ id: courses.id, status: courses.status, title: courses.title })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!course || course.status !== 'published')
    throw new Error(
      'This course is not open for enrolment. Nothing is wrong at your end — go back and refresh the course list.',
    );

  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, ctx.userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  if (!existing) {
    await db.transaction(async (tx) => {
      const [enrollment] = await tx
        .insert(enrollments)
        .values({
          tenantId: ctx.tenantId!,
          userId: ctx.userId,
          courseId,
          status: 'active',
          source: 'free',
        })
        .returning();
      await audited(tx, {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: 'enrollment.create',
        resourceType: 'enrollment',
        resourceId: enrollment.id,
        after: { courseId, source: 'free' },
      });
    });
    revalidatePath(`/t/${tenantSlug}/dashboard`);

    if (ctx.email) {
      try {
        await sendEnrollmentEmail(
          ctx.email,
          course.title,
          `${tenantOrigin(tenantSlug)}/learn/${courseSlug}`,
        );
      } catch (e) {
        console.error('enrollment email failed:', e);
      }
    }
  }

  return { redirectTo: `/learn/${courseSlug}` };
}

/**
 * Starts a Stripe Checkout session to buy a priced course. On payment, the
 * webhook records an order and auto-enrolls the buyer (E2 webhook handler).
 */
export async function startCoursePurchase(
  tenantSlug: string,
  courseId: string,
  courseSlug: string,
) {
  const ctx = await getTenantContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
  if (!ctx.tenantId)
    throw new Error(
      'Your account is not linked to an academy yet. Sign out, sign in again, then tell whoever runs your academy.',
    );
  await assertNotViewingAs();

  // Each call creates a Stripe Checkout Session — a write against a third-party
  // API with its own rate limits and, on some plans, its own costs. Uncapped,
  // this was a way to burn our Stripe quota from a browser loop.
  await enforceRateLimit('enroll', RULES.enroll, ctx.userId);

  const [course] = await db
    .select({
      id: courses.id,
      title: courses.title,
      price: courses.price,
      currency: courses.currency,
      status: courses.status,
    })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!course || course.status !== 'published' || !course.price) {
    throw new Error('Course is not purchasable');
  }

  const origin = tenantOrigin(tenantSlug);
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: course.currency.toLowerCase(),
          unit_amount: Math.round(Number(course.price) * 100),
          product_data: { name: course.title },
        },
      },
    ],
    customer_email: ctx.email ?? undefined,
    metadata: {
      kind: 'course',
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      courseId,
      courseSlug,
    },
    success_url: `${origin}/learn/${courseSlug}`,
    cancel_url: `${origin}/courses/${courseSlug}`,
  });

  if (!session.url) throw new Error('Could not start checkout');
  redirect(session.url);
}
