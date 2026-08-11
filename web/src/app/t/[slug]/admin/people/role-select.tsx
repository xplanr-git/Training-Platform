'use client';

import { useState, useTransition } from 'react';
import { setMemberRole } from './actions';
import type { AssignableRole } from '@/lib/validation';

const SELECT_CLS =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm disabled:opacity-60';

const ROLE_OPTIONS: Array<{ value: AssignableRole; label: string }> = [
  { value: 'learner', label: 'Learner' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'company_admin', label: 'Admin' },
];

const ROLE_LABELS: Record<string, string> = {
  learner: 'Learner',
  instructor: 'Instructor',
  company_admin: 'Admin',
  platform_admin: 'Platform',
};

/**
 * Direct role picker for a member.
 *
 * Replaces a ghost button that CYCLED learner → instructor → company_admin on
 * each click — no confirmation, and nothing marking it as a control, so one
 * stray click silently granted or revoked admin (and a platform_admin dropped
 * straight to learner). A <select> sets the role in one deliberate action, and
 * the change that hands over (or takes away) control of the academy asks first.
 *
 * `editable` is false for the signed-in admin's own row (you cannot change your
 * own role — the server enforces this too) and for platform_admin, which is not
 * demotable from a tenant screen; both render as read-only text rather than a
 * dead control.
 */
export function RoleSelect({
  tenantSlug,
  membershipId,
  role,
  personLabel,
  editable,
}: {
  tenantSlug: string;
  membershipId: string;
  role: string;
  /** Name (or email) of the member, for the select's accessible name. */
  personLabel: string;
  editable: boolean;
}) {
  const [current, setCurrent] = useState(role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editable) {
    return <span className="text-sm">{ROLE_LABELS[role] ?? role}</span>;
  }

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as AssignableRole;
    if (next === current) return;

    // Confirm crossing the admin boundary in EITHER direction — granting or
    // revoking control of the academy is the most consequential change here.
    const grantingAdmin = next === 'company_admin';
    const revokingAdmin = current === 'company_admin';
    if (grantingAdmin || revokingAdmin) {
      const message = grantingAdmin
        ? `Make ${personLabel} an Admin? They will be able to manage courses, people, certificates and settings for this academy.`
        : `Remove ${personLabel}'s Admin access? They will no longer be able to manage the academy.`;
      if (!window.confirm(message)) {
        e.target.value = current; // revert the visible selection
        return;
      }
    }

    setError(null);
    const previous = current;
    setCurrent(next); // optimistic
    startTransition(async () => {
      try {
        await setMemberRole(tenantSlug, membershipId, next);
      } catch (err) {
        setCurrent(previous); // roll back on failure
        setError(err instanceof Error ? err.message : 'Could not change the role.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label={`Role for ${personLabel}`}
        className={SELECT_CLS}
        value={current}
        onChange={onChange}
        disabled={pending}
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
