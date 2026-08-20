'use server';

import { redirect } from 'next/navigation';
import { db, eq, users } from '@training-platform/db';
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

  try {
    await sendSupportEmail(context.email, summariseContext(context), text);
  } catch (e) {
    // Never lose the request if delivery fails: it is at least in the server log.
    console.error('[help] delivery failed', { context, error: (e as Error).message });
  }
  // Structured log so a request is reconstructable even where email is unset.
  console.log('[help] request', { email: context.email, context: summariseContext(context) });
  return { ok: true };
}
