'use client';
import * as React from 'react';

import { cn } from '@/components/ui/utils';

/**
 * Borderless by default.
 *
 * A white card on the #fcfcfb shell is separated by its own surface change, the
 * keylines inside it and the whitespace around it; a border on top of all three
 * is noise, and a page of bordered boxes is what GUIDELINES.md §4b is written
 * against. Borders are kept for things that need an edge to read as pressable
 * (controls) or to lift off the page (floating menus) — a card is neither.
 *
 * Where a card genuinely needs a frame — white nesting inside white, or a form
 * that must read as one object — the call site adds `border border-border` for
 * a hairline, or a `border-b-2 border-keyline` under its header for the heavier
 * document treatment. Both are deliberate acts at the call site rather than a
 * default nobody chose.
 */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-(--radius-card)',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
}

/**
 * `as` is REQUIRED, deliberately.
 *
 * This rendered a hardcoded <h4>. On the four auth pages the card title IS the page
 * title, so those pages had no <h1> at all and their heading outline started at level
 * 4; on the storefront the card titles sat under the page <h1> and skipped straight to
 * h4. Both fail WCAG 1.3.1, and neither is visible without reading the DOM.
 *
 * There is no correct default — the right level depends entirely on what surrounds the
 * card — so rather than pick a wrong one and guard it with a test, the type makes the
 * compiler ask. Five call sites, five deliberate answers.
 */
function CardTitle({
  className,
  as: Heading,
  ...props
}: React.ComponentProps<'div'> & { as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) {
  return <Heading data-slot="card-title" className={cn('leading-none', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <p data-slot="card-description" className={cn('text-muted-foreground', className)} {...props} />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6 [&:last-child]:pb-6', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 pb-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
