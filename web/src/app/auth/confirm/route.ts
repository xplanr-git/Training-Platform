import { type NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/lib/safe-redirect';

/**
 * Landing route for every emailed auth link: invitations and password
 * recovery. Establishes a session from the one-time token, then hands off to
 * `next` (normally /auth/set-password, where the user chooses a password).
 *
 * Two link shapes are accepted because Supabase emits both:
 *  - `token_hash` + `type`, from admin.generateLink() and the default email
 *    templates — verified with verifyOtp().
 *  - `code`, from the PKCE flow used by resetPasswordForEmail() called in the
 *    browser — exchanged with exchangeCodeForSession().
 *
 * `next` is validated by resolving it and comparing origins (safeRedirect) —
 * pattern-matching the string missed `/\host` and `/%09host`, both of which the
 * URL parser resolves off-origin.
 *
 * The token is SINGLE USE. Any failure here is terminal for that link, so
 * failures go to a page that explains it and offers a fresh one rather than to
 * /login — an invitee has no password yet, so a login form is a dead end.
 *
 * This route must stay outside the tenant rewrite (see SHARED_PREFIXES in
 * lib/host.ts) or the token is spent on a 404.
 */

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = safeRedirect(searchParams.get('next'), origin, '/auth/set-password');

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL('/auth/auth-code-error', origin));
}
