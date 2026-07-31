'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendPasswordResetEmail } from '@/lib/email';
import { env } from '@/lib/env';

/**
 * Sends a password-reset link.
 *
 * Delivery goes through Resend, not Supabase's sender: `generateLink` mints the
 * token without emailing it, so the message is ours — our template, our verified
 * domain, and no dependency on Supabase SMTP being configured.
 *
 * ALWAYS returns success, whatever happened. Reporting "no account with that
 * address" to an unauthenticated caller is account enumeration — it turns this
 * form into an oracle for which of your dealers' emails are registered. The
 * caller therefore learns nothing; failures are logged server-side only.
 *
 * Not rate-limited. Anyone can make this send mail to a known address, which is
 * a nuisance vector rather than a breach (the mail only ever goes to the address
 * itself). Worth putting behind a limiter when one exists — see the Upstash note
 * in CLAUDE.md §4 #7.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  const address = email.trim().toLowerCase();
  if (!address || !address.includes('@')) return { ok: true };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: address,
    });

    const hashedToken = data?.properties?.hashed_token;
    if (error || !hashedToken) {
      // Most often: no such user. Deliberately indistinguishable to the caller.
      console.log(`[reset] no link generated for ${address}: ${error?.message ?? 'no token'}`);
      return { ok: true };
    }

    const url =
      `${env.appOrigin()}/auth/confirm` +
      `?token_hash=${encodeURIComponent(hashedToken)}` +
      `&type=recovery&next=${encodeURIComponent('/auth/set-password')}`;

    await sendPasswordResetEmail(address, url);
  } catch (err) {
    console.error('[reset] failed', err);
  }

  return { ok: true };
}
