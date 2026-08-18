'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/components/ui/utils';

/**
 * Click-to-edit text that saves itself — the HubSpot property pattern. The
 * value renders as (button) text with a pencil that appears on hover/focus;
 * clicking swaps in an input; Enter or leaving the field saves, Escape backs
 * out, and an unchanged value saves nothing at all. The new value shows
 * immediately (optimistic) with a small tick once the server confirms; on
 * failure it reverts and says why.
 *
 * Built from spans only, deliberately: callers sit this inside heading
 * elements (h2 allows phrasing content, not <p>/<div>), so even the error
 * line is a block-styled <span>.
 *
 * `onSave` receives the RAW trimmed string and is expected to be a bound
 * Server Action that validates and throws — validation lives server-side,
 * in one place, exactly as the forms it replaces did.
 */
export function InlineTextField({
  value,
  label,
  onSave,
  type = 'text',
  min,
  max,
  suffix,
  placeholder,
  emptyLabel,
  textClassName,
  inputClassName,
  className,
}: {
  value: string;
  /** Names the control: the display button reads "Edit {label}". */
  label: string;
  onSave: (raw: string) => Promise<void>;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  /** Rendered after the value, e.g. "min" for a duration. */
  suffix?: string;
  placeholder?: string;
  /** Shown (muted) when there is no value yet, e.g. "mins". */
  emptyLabel?: string;
  textClassName?: string;
  inputClassName?: string;
  className?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Holds the just-saved value until the refreshed server props catch up —
  // without it the old value flashes back for the length of the round trip.
  const [override, setOverride] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOverride(null);
  }, [value]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const shown = override ?? value;

  function start() {
    setError(null);
    setDraft(shown);
    setEditing(true);
  }

  function commit() {
    const clean = draft.trim();
    setEditing(false);
    if (clean === shown.trim()) return;
    setOverride(clean);
    setError(null);
    setPending(true);
    startTransition(async () => {
      try {
        await onSave(clean);
        setSaved(true);
        router.refresh();
      } catch (err) {
        console.error('[inline save failed]', err);
        setOverride(null);
        const message = err instanceof Error ? err.message : '';
        setError(
          message && message.length < 120 && !message.includes('\n')
            ? message
            : 'Could not save. Reload the page and try again.',
        );
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <span className={cn('inline-flex min-w-0 max-w-full flex-col', className)}>
      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
        {editing ? (
          <>
            <Input
              ref={inputRef}
              autoFocus
              type={type}
              min={min}
              max={max}
              aria-label={label}
              placeholder={placeholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit();
                } else if (e.key === 'Escape') {
                  setEditing(false);
                }
              }}
              className={cn('h-8', inputClassName)}
            />
            {suffix && <span className="shrink-0 text-meta text-muted">{suffix}</span>}
          </>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={pending}
            aria-label={`Edit ${label}`}
            className="group/inline -mx-1 inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-sm px-1 py-0.5 text-left hover:bg-surface-muted"
          >
            {/* break-words, not truncate: titles show in full and wrap. */}
            <span className={cn('min-w-0 break-words', textClassName, !shown && 'text-muted')}>
              {shown ? (suffix ? `${shown} ${suffix}` : shown) : (emptyLabel ?? 'Add')}
            </span>
            <Pencil
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover/inline:opacity-100 group-focus-visible/inline:opacity-100"
            />
          </button>
        )}
        {pending && (
          <Loader2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 animate-spin text-muted" />
        )}
        {saved && !pending && (
          <Check aria-hidden="true" className="text-status-green h-3.5 w-3.5 shrink-0" />
        )}
      </span>
      {/* A save changes nothing a screen reader announces on its own. */}
      <span aria-live="polite" className="sr-only">
        {pending ? 'Saving…' : saved ? 'Saved' : ''}
      </span>
      {error && (
        <span role="alert" className="mt-0.5 block text-meta text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
