import * as React from 'react';
import { cn } from '@/components/ui/utils';

/**
 * A tinted message box for a STATE — a warning, a read-only notice, a pass/fail
 * result. It uses the status tokens (opaque tint + AA-verified dark text), never
 * raw Tailwind `amber-*`/`green-*` utilities, so a warning is the same colour on
 * every surface and survives greyscale. For an inline status label use
 * `StatusBadge`; this is the box that carries a sentence.
 *
 * The tokens are the same five the design system reserves for state
 * (GUIDELINES.md §5). `sb-design-conventions.test.ts` bans the raw numbered
 * palette utilities this replaced, so a stray one cannot come back a component
 * at a time.
 */
const TONES = {
  green: 'border-status-green/30 bg-status-green-bg text-status-green',
  amber: 'border-status-amber/30 bg-status-amber-bg text-status-amber',
  red: 'border-status-red/30 bg-status-red-bg text-status-red',
  blue: 'border-status-blue/30 bg-status-blue-bg text-status-blue',
  grey: 'border-status-grey/30 bg-status-grey-bg text-status-grey',
} as const;

export type CalloutTone = keyof typeof TONES;

function Callout({
  tone = 'amber',
  className,
  ...props
}: React.ComponentProps<'div'> & { tone?: CalloutTone }) {
  return (
    <div
      data-slot="callout"
      className={cn('rounded-(--radius-card) border px-4 py-3 text-sm', TONES[tone], className)}
      {...props}
    />
  );
}

export { Callout };
