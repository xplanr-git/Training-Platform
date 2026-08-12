'use client';

import * as React from 'react';

import { cn } from '@/components/ui/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

/**
 * THE TABLE KEYLINE RULE — GUIDELINES.md §2, and it says to read it twice.
 *
 * The dark ink keyline appears in a table in exactly ONE place: 2px under the
 * header row. Body rows are separated by the light --color-border divider, or
 * by nothing. Putting the dark keyline between every row is called out in the
 * design system as the single most common mistake and the thing that makes a
 * table look heavy and generated.
 *
 * It is encoded here, in the primitive, rather than left to each of the four
 * admin tables — because "the header is darker than the rows" is a relationship,
 * and a rule that lives in four places is a rule that will hold in three.
 */
function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-keyline [&_tr]:border-b-2', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-surface-muted border-t border-border font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // Row divider is the LIGHT border, never --color-keyline. Selection is a
        // neutral ink wash; it was brand-50, a pale blue, which under sb would
        // have read as "these rows are links".
        'hover:bg-surface-muted data-[state=selected]:bg-sunken border-b border-border transition-colors',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // 12.5px/600 muted, and deliberately NOT uppercase: sb keeps the header
        // font constant across every density, and the tracked-out uppercase
        // "category" header is the other half of the heavy-table look the
        // keyline rule is guarding against.
        'text-muted h-10 px-2 text-left align-middle text-meta font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
