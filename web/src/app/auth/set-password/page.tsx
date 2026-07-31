'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { postSignInDestination } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Where an invited or password-recovering user chooses a password.
 *
 * /auth/confirm has already turned the emailed token into a session, so this
 * page updates the *current* user rather than taking a token of its own. If
 * there is no session the link was never valid — say so instead of showing a
 * form that cannot work.
 */
export default function SetPasswordPage() {
  const router = useRouter();
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

    // Same destination logic as signing in normally: resolved server-side
    // because it needs the tenant slug, which the JWT doesn't carry.
    let dest = '/dashboard';
    try {
      dest = await postSignInDestination();
    } catch {
      // Fall back to the apex dashboard, which routes by membership.
    }
    router.push(dest);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold">Outdure Academy</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose a password</CardTitle>
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
                Invitation and reset links can only be used once, and they expire. Ask for
                a new one and it will work.
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
                <p role="alert" className="text-sm text-red-600">
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
