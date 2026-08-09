'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/components/ui/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm border px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring aria-invalid:border-destructive transition-colors overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
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
        'inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-sm px-2 text-xs font-semibold whitespace-nowrap',
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
