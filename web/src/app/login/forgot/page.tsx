'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthMasthead } from '@/components/auth-masthead';
import { requestPasswordReset } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Request a password-reset link. Also the recovery route for an invitee whose
 * one-time invitation link expired before they used it.
 *
 * The confirmation is deliberately identical whether or not the address exists —
 * see the note in actions.ts on enumeration.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // Still report sent: the outcome must not depend on the address.
    }
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <AuthMasthead />

      <Card className="border border-border">
        <CardHeader>
          <CardTitle as="h1" className="text-h1">
            {sent ? 'Check your email' : 'Reset your password'}
          </CardTitle>
          <CardDescription>
            {sent
              ? `If an account exists for ${email}, a link is on its way.`
              : "We'll email you a link to choose a new password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-muted">
                The link works once and expires shortly. If it doesn&apos;t arrive, check your spam
                folder, then try again.
              </p>
              <Button asChild variant="outline">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <Link
                href="/login"
                className="text-link hover:text-link-hover hover:underline text-center text-sm"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
