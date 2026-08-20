'use client';

import { useState, useTransition } from 'react';
import { setMemberAudience } from './actions';
import { AUDIENCE_OPTIONS } from '@/lib/audience';
import { NativeSelect } from '@/components/ui/native-select';

/**
 * Inline audience picker for a member (WHO they are — installer/dealer/etc.).
 * Audience drives relevance, not permissions or status, so — unlike RoleSelect —
 * it needs no admin-boundary confirmation. "Unknown" clears it.
 */
export function AudienceSelect({
  tenantSlug,
  membershipId,
  audience,
  personLabel,
}: {
  tenantSlug: string;
  membershipId: string;
  audience: string | null;
  personLabel: string;
}) {
  const [current, setCurrent] = useState(audience ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === current) return;
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      try {
        await setMemberAudience(tenantSlug, membershipId, next);
      } catch (err) {
        setCurrent(previous);
        setError(err instanceof Error ? err.message : 'Could not change audience.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <NativeSelect
        aria-label={`Audience for ${personLabel}`}
        value={current}
        onChange={onChange}
        disabled={pending}
      >
        <option value="">Unknown</option>
        {AUDIENCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
      {error && (
        <span role="alert" className="text-meta text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
