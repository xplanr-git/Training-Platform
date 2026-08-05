'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { provisionTenant } from './actions';
import { createClient } from '@/lib/supabase/client';
import { normalizeSlug } from '@/lib/slug';
import { env } from '@/lib/env';

export default function SignupPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    const result = await provisionTenant(form);
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.');
      setLoading(false);
      return;
    }

    // Sign in so the JWT carries the new tenant/role claims, then send the
    // owner to their academy's admin.
    const supabase = createClient();
    await supabase.auth.signInWithPassword({ email, password });

    const root = env.rootDomain();
    const isLocal = root.startsWith('localhost');
    const dest = isLocal
      ? `${window.location.protocol}//${result.slug}.${root}/admin`
      : `https://${result.slug}.${root}/admin`;
    window.location.href = dest;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Create your academy</h1>
        <p className="mt-1 text-sm text-neutral-600">14-day free trial. No card required.</p>
      </div>
      {/*
        Rewritten for accessibility, not restyled. Every field had a placeholder and
        no label, so its name vanished the moment anyone typed; the subdomain field's
        wrapping <label> contained ONLY the suffix, so its accessible name computed to
        ".<rootDomain>" and never mentioned a subdomain at all; nothing carried an
        autocomplete token (1.3.5); and the error was inserted with no role and no
        live region, so a failed signup was silent (4.1.3).
      */}
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-name">Your name</Label>
          <Input id="su-name" name="name" required autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-email">Work email</Label>
          <Input id="su-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-password">Password</Label>
          <Input
            id="su-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="su-password-hint"
          />
          <p id="su-password-hint" className="text-xs text-muted">
            At least 8 characters.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-company">Company / academy name</Label>
          <Input
            id="su-company"
            name="companyName"
            required
            autoComplete="organization"
            onChange={(e) => setSlug(normalizeSlug(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-slug">Your web address</Label>
          <div className="flex items-center gap-1 text-sm text-muted">
            <Input
              id="su-slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(normalizeSlug(e.target.value))}
              required
              className="w-40"
            />
            <span>.{env.rootDomain()}</span>
          </div>
        </div>

        {/* Present in the DOM before the message arrives, so it is announced. */}
        <div aria-live="polite">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="self-start">
          {loading ? 'Creating…' : 'Create academy'}
        </Button>
      </form>
    </main>
  );
}
