'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AuthMasthead } from '@/components/auth-masthead';
import { createClient } from '@/lib/supabase/client';
import { safeRedirect } from '@/lib/safe-redirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Supabase's wording, in our voice and with a way forward. "Invalid login
 * credentials" is accurate, anonymous and tells nobody what to do next — and this is
 * the most-used screen in the product. Unknown messages fall through to a neutral
 * line rather than leaking a provider string.
 */
function signInMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'That email and password do not match. Check them, or use “Forgot password?” to set a new one.';
  }
  if (m.includes('email not confirmed')) {
    return 'You have not opened the link in your invitation email yet. Open it, set a password, then sign in.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Wait a minute, then try again.';
  }
  return 'We could not sign you in. Try again in a moment.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /*
   * Submit guards, in refs so they take effect SYNCHRONOUSLY — before React
   * re-renders and before the next submit event runs.
   *
   * A disabled submit button does not stop a form submit that a password
   * manager triggers itself: 1Password (and others) autofill and then submit by
   * dispatching the form's own submit event, which runs THIS handler directly,
   * button state notwithstanding. When a sign-in then leaves the form on screen
   * — any error does — the manager re-submits, and the cycle repeats fast enough
   * to trip Supabase's auth rate limit. That limit is not ours to raise or
   * intercept: sign-in goes browser->Supabase and never reaches our server (see
   * lib/rate-limit.ts). One observed session sent ~600 sign-in requests this way
   * and locked the account's whole IP out with 429s.
   *
   * `inFlight` collapses overlapping submits to one request; `cooldownUntil`
   * makes a post-failure storm self-throttling. Together they make a single
   * auto-submit harmless and a loop bounded — for every user, with nobody
   * changing a 1Password setting.
   */
  const inFlight = useRef(false);
  const cooldownUntil = useRef(0);
  const rapidFailures = useRef(0);
  const lastFailureAt = useRef(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // One request at a time; drop a resubmit that arrives while one is open.
    if (inFlight.current) return;
    // And drop anything arriving inside the post-failure cooldown below.
    if (Date.now() < cooldownUntil.current) return;

    inFlight.current = true;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Escalate the wait only for BACK-TO-BACK failures — the signature of an
      // auto-submit loop, not of a person retyping. A failure spaced out like
      // human typing resets the counter, so a genuine second attempt is never
      // penalised; a burst backs off 0.5s, 1s, 2s… capped at 20s, which holds
      // the request rate far below Supabase's auth limit.
      const now = Date.now();
      rapidFailures.current = now - lastFailureAt.current < 4000 ? rapidFailures.current + 1 : 1;
      lastFailureAt.current = now;
      if (rapidFailures.current >= 2) {
        cooldownUntil.current = now + Math.min(500 * 2 ** (rapidFailures.current - 2), 20_000);
      }

      // Clear loading and re-open the form ONLY on failure. This used to clear
      // unconditionally, right here — so on SUCCESS the button went back to
      // "Sign in" and re-enabled itself while more round trips were still
      // running, and the natural response was to press it again (another
      // sign-in attempt against a rate limit that is not ours to raise). The
      // report was "I can't see if it's signing in, and then it doesn't if I
      // click the button again".
      setLoading(false);
      setError(signInMessage(error.message));
      inFlight.current = false;
      return;
    }
    /*
     * Go to /dashboard and let the SERVER decide where you belong.
     *
     * This used to call two Server Actions from here first —
     * activateMembershipOnSignIn, then postSignInDestination — and the second
     * one returns '/login' whenever it cannot see a session. A Server Action is
     * a fetch, and the session cookie the browser client had just written was
     * not reliably visible to it, so a SUCCESSFUL sign-in resolved its
     * destination to the login page. With the old router.push that was a no-op
     * from /login and looked like nothing happening; with a hard navigation it
     * became a visible bounce straight back to the form.
     *
     * /dashboard is reached by a full document request, where the cookie is
     * unambiguous, and that page already resolves the real destination and
     * performs the activation. So the client does not need to know either — it
     * just has to leave. Two fewer round trips on the critical path as well.
     *
     * ?next= is still honoured: safeRedirect resolves and compares origins,
     * because startsWith('/') alone let '//evil.com' through.
     */
    const rawNext = new URLSearchParams(window.location.search).get('next');
    const next = rawNext ? safeRedirect(rawNext, window.location.origin) : null;
    const dest = next ?? '/dashboard';
    // A HARD navigation, for the same reason sign-out uses one: router.refresh()
    // fired straight after router.push() re-fetches the route being LEFT and can
    // drop the pending push, which on sign-out produced "it signed out but did
    // not redirect". The same pair here risks signing you in and leaving you on
    // the form. Replacing the document also guarantees the server renders with
    // the session cookie that was just set, and replace() keeps Back from
    // returning to a sign-in form you have already used.
    //
    // `loading` and `inFlight` are deliberately never cleared on this path: the
    // button stays disabled and reading "Signing in…", and any trailing
    // auto-submit is ignored, until the document is replaced.
    window.location.replace(dest);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <AuthMasthead />

      <Card className="border border-border">
        <CardHeader>
          <CardTitle as="h1" className="text-h1">
            Sign in
          </CardTitle>
          <CardDescription>
            Access your Outdure product training and certifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/login/forgot"
                  // 16px tall as bare text, and it is the recovery path on a
                  // shared site machine. Padding with a negative inset keeps the
                  // label where it was while giving it a real target.
                  className="-my-3 -mr-1.5 inline-flex min-h-11 items-center rounded px-1.5 text-meta text-link hover:text-link-hover hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
