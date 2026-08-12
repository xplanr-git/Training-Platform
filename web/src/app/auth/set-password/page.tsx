'use client';

import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Where an invited or password-recovering user chooses a password.
 *
 * /auth/confirm has already turned the emailed token into a session, so this
 * page updates the *current* user rather than taking a token of its own. If
 * there is no session the link was never valid — say so instead of showing a
 * form that cannot work.
 */
export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
      setChecking(false);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Matches the signup rule so the two paths can't disagree.
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Those passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    /*
     * Same as sign-in: go to /dashboard and let the server route.
     *
     * This used to call activateMembershipOnSignIn and postSignInDestination as
     * Server Actions from here, and the second returns '/login' when it cannot
     * see a session — which would send a brand-new invitee back to a login form
     * moments after their password was accepted. The dashboard resolves the
     * destination on a full document request, where the cookie is unambiguous,
     * and performs the activation itself.
     *
     * The activation still matters here: setting a password from an emailed link
     * proves control of the address, so it is an acceptance and flips 'invited'
     * to 'active'. It just happens server-side now.
     */
    const dest = '/dashboard';
    window.location.replace(dest);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="flex items-center gap-2.5">
        <BrandMark size={36} />
        <span className="text-lg font-bold">Outdure Academy</span>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle as="h1">Choose a password</CardTitle>
          <CardDescription>
            {hasSession
              ? 'Set a password so you can sign in from now on.'
              : 'This link is no longer valid.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <p className="text-sm text-muted">Checking your link…</p>
          ) : !hasSession ? (
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-muted">
                Invitation and reset links can only be used once, and they expire. Ask for a new one
                and it will work.
              </p>
              <Button asChild>
                <a href="/login/forgot">Send me a new link</a>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save password and continue'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
