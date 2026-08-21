'use server';

import { redirect } from 'next/navigation';
import { db, eq, users, helpRequests } from '@training-platform/db';
import { getTenantContext } from '@/lib/tenant';
import { getAudience } from '@/lib/audience-server';
import { buildLearnerContext, summariseContext } from '@/lib/learner-context';
import { sendSupportEmail } from '@/lib/email';

/**
 * Help v1: a learner asks for help; Outdure receives the message WITH the
 * context of where they were, so they don't have to reconstruct it. Context is
 * built via the shared buildLearnerContext() so a future "Ask BART" consumes the
 * same shape. Delivery uses the existing email infra (no-ops + logs when Resend
 * is unset, e.g. non-prod). Not a ticketing system.
 */
export async function submitHelpRequest(
  slug: string,
  ctxInput: {
    path: string;
    courseSlug?: string;
    courseTitle?: string;
    topicTitle?: string;
    item?: string;
  },
  message: string,
): Promise<{ ok: true } | { error: string }> {
  const ctx = await getTenantContext();
  if (!ctx?.tenantId) redirect('/login');
  const text = String(message ?? '')
    .trim()
    .slice(0, 4000);
  if (!text) return { error: 'Tell us what you need help with.' };

  const [me] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);
  const audience = await getAudience(ctx.userId, ctx.tenantId);

  const context = buildLearnerContext({
    tenantSlug: slug,
    userId: ctx.userId,
    email: me?.email ?? 'unknown',
    audience,
    courseSlug: ctxInput.courseSlug ?? null,
    courseTitle: ctxInput.courseTitle ?? null,
    topicTitle: ctxInput.topicTitle ?? null,
    learningItem: ctxInput.item ?? null,
    path: ctxInput.path,
  });

  // Persist FIRST — the DB row is the source of truth, so a request is never lost
  // even if email delivery fails or is unset. Written through the privileged
  // server connection; help_requests has RLS on + no REST grant (migration 0022),
  // so this PII is not reachable from the client. Internal IDs are stored, never
  // shown to the learner.
  const [saved] = await db
    .insert(helpRequests)
    .values({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      email: context.email,
      message: text,
      path: context.path,
      courseSlug: context.courseSlug ?? null,
      courseTitle: context.courseTitle ?? null,
      topicTitle: context.topicTitle ?? null,
      learningItem: context.learningItem ?? null,
      audience: context.audience ?? null,
      deliveryStatus: 'unsent',
    })
    .returning({ id: helpRequests.id });

  let deliveryStatus: 'sent' | 'failed' = 'sent';
  try {
    await sendSupportEmail(context.email, summariseContext(context), text);
  } catch (e) {
    // The request is already persisted; email is only the notification.
    deliveryStatus = 'failed';
    console.error('[help] delivery failed', { requestId: saved.id, error: (e as Error).message });
  }
  await db.update(helpRequests).set({ deliveryStatus }).where(eq(helpRequests.id, saved.id));
  return { ok: true };
}
