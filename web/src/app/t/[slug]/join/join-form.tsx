'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { requestToJoin } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function JoinForm({ tenantSlug, academyName }: { tenantSlug: string; academyName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await requestToJoin(tenantSlug, form);
      if (result.ok) setSent(true);
      else setError(result.error ?? 'Could not send your request. Try again.');
    });
  }

  if (sent) {
    /*
     * Deliberately identical whatever happened — request created, address already
     * registered, or already a member. Distinguishing them would turn this form
     * into an oracle for which addresses have accounts, which is the same
     * enumeration problem the password-reset action avoids.
     */
    return (
      <div
        role="status"
        className="mt-6 rounded-(--radius-card) border border-border bg-surface-muted p-5"
      >
        <p className="font-medium">Request sent</p>
        <p className="mt-1 text-sm text-muted">
          An administrator at {academyName} will review it. You will be able to sign in once it is
          accepted — we will not email you before then.
        </p>
        <Link href="/login" className="text-link hover:text-link-hover mt-4 inline-block text-sm">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-name">Your name</Label>
        {/* Required: this is what prints on any certificate you earn, and there is
            nowhere in the product to change it afterwards. */}
        <Input id="join-name" name="name" required autoComplete="name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-email">Work email</Label>
        <Input id="join-email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-password">Choose a password</Label>
        <Input
          id="join-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="text-meta text-muted">At least 8 characters.</p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Request access'}
      </Button>

      <div aria-live="polite">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <p className="text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-link hover:text-link-hover">
          Sign in
        </Link>
      </p>
    </form>
  );
}
