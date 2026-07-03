'use client';

import { useState, useTransition } from 'react';
import { inviteMember } from './actions';

export function InviteForm({ tenantSlug }: { tenantSlug: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const form = new FormData(e.currentTarget);
    const el = e.currentTarget;
    startTransition(async () => {
      const result = await inviteMember(tenantSlug, form);
      if (result.ok) {
        setOk(true);
        el.reset();
      } else {
        setError(result.error ?? 'Invite failed');
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-[--radius-card] border border-border bg-surface p-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Name</span>
        <input name="name" className="rounded-md border border-border px-3 py-1.5" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Email</span>
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-border px-3 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Role</span>
        <select name="role" className="rounded-md border border-border px-3 py-1.5">
          <option value="learner">Learner</option>
          <option value="instructor">Instructor</option>
          <option value="company_admin">Admin</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? 'Inviting…' : 'Invite'}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {ok && <p className="w-full text-sm text-green-600">Invitation sent.</p>}
    </form>
  );
}
