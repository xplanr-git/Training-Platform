'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/components/ui/utils';

/**
 * Neutral tag shades, straight from core.css §6: `default` is the FILLED tag —
 * dark grey (--color-data-strong) with white text, because "none is ever solid
 * black": pure ink is reserved for text, keylines and the primary action, and
 * an ink-filled tag reads as a small button. `secondary` is the soft resting
 * tag (sunken, ink text); `outline` the quiet one. Metrics match StatusBadge:
 * 20px tall at the 11px label size.
 */
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm border h-5 px-2 text-label font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring aria-invalid:border-destructive transition-colors overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-data-strong text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90',
        outline: 'border-input text-foreground [a&]:hover:bg-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/**
 * The five status tones. Soft tint, matching text colour, and a dot.
 *
 * The dot is not decoration — it is what makes the tag survive WCAG 1.4.1.
 * "Status is a squared tag with a dot + label, never colour alone"
 * (GUIDELINES.md §5): a red pill and a green pill are the same pill to a
 * colour-blind reader, and identical again in a greyscale print of the
 * certificate page. The word carries the meaning; the colour only speeds up
 * finding it.
 *
 * Tones map to STATE, never to category or decoration. A chart series that
 * happens to be green does not mean "complete" — that palette is --color-cat-*.
 *
 * Each pairing is measured against its own tint rather than against the page:
 * green 4.99:1, amber 5.30:1, red 5.28:1, blue 5.77:1, grey 5.76:1 — all clear
 * AA for normal text, which is the level a 12px label needs. The tints are
 * opaque so those numbers hold on every surface; see globals.css for why that
 * matters and what broke when they were not.
 */
const TONES = {
  green: 'text-status-green bg-status-green-bg',
  amber: 'text-status-amber bg-status-amber-bg',
  red: 'text-status-red bg-status-red-bg',
  blue: 'text-status-blue bg-status-blue-bg',
  grey: 'text-status-grey bg-status-grey-bg',
} as const;

export type StatusTone = keyof typeof TONES;

function StatusBadge({
  tone = 'grey',
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & { tone?: StatusTone }) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        // core.css `.sb-tag`: a 20px tag at the 11px LABEL size (was 24px at
        // 12.5, one notch heavier than the system's). Dot 6px, gap 5→gap-1.5,
        // squared 2px.
        'inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-sm px-2 text-label font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}

export { Badge, badgeVariants, StatusBadge };
