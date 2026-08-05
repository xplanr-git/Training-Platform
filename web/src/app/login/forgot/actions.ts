'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendPasswordResetEmail } from '@/lib/email';
import { absoluteUrl } from '@/lib/absolute-url';
import { rateLimitExceeded } from '@/lib/rate-limit-guard';
import { RULES } from '@/lib/rate-limit';

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
 * Rate-limited per IP and per address (RULES.passwordReset). Over budget, it
 * returns the same { ok: true } WITHOUT sending — the uniform response is the
 * point of this action, and the page catches everything and reports "sent"
 * regardless, so a thrown message would reach nobody. A real person will not
 * request five resets for one address in fifteen minutes; a script will.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  const address = email.trim().toLowerCase();
  if (!address || !address.includes('@')) return { ok: true };

  const limited = await rateLimitExceeded('passwordReset', RULES.passwordReset, address);
  if (limited) {
    console.log(`[reset] rate limited for ${address}`);
    return { ok: true };
  }

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
      absoluteUrl('/auth/confirm') +
      `?token_hash=${encodeURIComponent(hashedToken)}` +
      `&type=recovery&next=${encodeURIComponent('/auth/set-password')}`;

    await sendPasswordResetEmail(address, url);
  } catch (err) {
    console.error('[reset] failed', err);
  }

  return { ok: true };
}
