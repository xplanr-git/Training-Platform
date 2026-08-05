'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { activateMembershipOnSignIn, postSignInDestination } from './actions';
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
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(signInMessage(error.message));
      return;
    }
    // An invited member has now proven control of their email — mark active.
    try {
      await activateMembershipOnSignIn();
    } catch {
      // Non-fatal: never block sign-in on bookkeeping.
    }
    // Honour ?next=, else ask the server where to go: the destination needs the
    // tenant slug, which the JWT doesn't carry.
    // startsWith('/') alone let '//evil.com' through — resolve and compare origins.
    const rawNext = new URLSearchParams(window.location.search).get('next');
    const next = rawNext ? safeRedirect(rawNext, window.location.origin) : null;
    let dest = next ?? '/dashboard';
    if (!next) {
      try {
        dest = await postSignInDestination();
      } catch {
        // Fall back to the apex dashboard, which routes by membership.
      }
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
          <CardTitle as="h1">Sign in</CardTitle>
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
                  className="-my-3 -mr-1.5 inline-flex min-h-11 items-center rounded px-1.5 text-xs text-muted underline hover:text-foreground"
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
