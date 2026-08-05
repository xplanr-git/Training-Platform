'use client';

import { useState, useTransition } from 'react';
import { inviteMember } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const SELECT_CLS =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function InviteForm({ tenantSlug }: { tenantSlug: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const form = new FormData(e.currentTarget);
    const el = e.currentTarget;
    startTransition(async () => {
      const result = await inviteMember(tenantSlug, form);
      setWarning(result.warning ?? null);
      if (result.ok) {
        setOk(true);
        el.reset();
      } else {
        setError(result.error ?? 'Invite failed');
      }
    });
  }

  return (
    <Card>
      <CardContent className="py-4">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-name">Name</Label>
            <Input id="inv-name" name="name" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-email">Email</Label>
            <Input id="inv-email" name="email" type="email" required className="w-56" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-role">Role</Label>
            <select id="inv-role" name="role" className={SELECT_CLS}>
              <option value="learner">Learner</option>
              <option value="instructor">Instructor</option>
              <option value="company_admin">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Inviting…' : 'Invite'}
          </Button>
          {/*
            All three outcomes go in one polite live region so a screen-reader user
            is told what happened. Nothing else on the page changes on success —
            the members table is server-rendered and refreshes separately — so
            without this, submitting was silent. The error also carries role=alert,
            matching NavForm, which every other admin form goes through.
          */}
          <div aria-live="polite" className="w-full">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {ok && !warning && <p className="text-sm text-brand-600">Invitation sent.</p>}
            {warning && <p className="text-sm text-amber-700">{warning}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
