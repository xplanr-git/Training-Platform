'use client';

import { useState } from 'react';
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
        <p className="mt-1 text-sm text-neutral-600">
          14-day free trial. No card required.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="name" required placeholder="Your name"
          className="rounded-md border border-neutral-300 px-3 py-2" />
        <input name="email" type="email" required placeholder="Work email"
          className="rounded-md border border-neutral-300 px-3 py-2" />
        <input name="password" type="password" required minLength={8}
          placeholder="Password (8+ characters)"
          className="rounded-md border border-neutral-300 px-3 py-2" />
        <input name="companyName" required placeholder="Company / academy name"
          onChange={(e) => setSlug(normalizeSlug(e.target.value))}
          className="rounded-md border border-neutral-300 px-3 py-2" />
        <label className="flex items-center gap-1 text-sm text-neutral-600">
          <input name="slug" value={slug}
            onChange={(e) => setSlug(normalizeSlug(e.target.value))}
            required placeholder="subdomain"
            className="w-40 rounded-md border border-neutral-300 px-2 py-1" />
          <span>.{env.rootDomain()}</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50">
          {loading ? 'Creating…' : 'Create academy'}
        </button>
      </form>
    </main>
  );
}
