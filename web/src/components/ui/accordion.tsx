'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronRightIcon } from 'lucide-react';

import { cn } from '@/components/ui/utils';

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      // Flush list: items are divided by the 1px DARK keyline, which is the
      // second (and only other) sanctioned use of it after the 2px header rule.
      // This was a bare `border-b` with no colour, so it was already painting
      // currentColor — near-black by accident rather than by decision.
      className={cn('border-keyline border-b last:border-b-0', className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          // No hover:underline. An underline means "this is a text link"; on a
          // section heading that opens a panel it is a false signal.
          //
          // The RESOLVED accordion hover is "A · Row wash": a full-width sunken
          // wash bounded by the item keylines — no radius (rounded-md would
          // give the wash a pill edge the keylines then cut through), no
          // shadow spill. Metrics per `.sb-acc .q`: 15/700 (text-h3), 20px
          // vertical and 12px horizontal padding.
          'focus-visible:border-ring hover:bg-surface-muted flex flex-1 items-start justify-between gap-4 px-3 py-5 text-left text-h3 font-bold transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-90',
          className,
        )}
        {...props}
      >
        {children}
        {/*
          THE CHEVRON RULE (GUIDELINES.md §6): points RIGHT when collapsed and
          rotates DOWN only when expanded. It was a down-chevron rotating to up,
          which reads as "collapse me" on a panel that is already shut — the
          arrow was describing the widget instead of its state.
        */}
        <ChevronRightIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      {/* `.sb-acc .a`: body copy inset to the trigger's text, text-2. */}
      <div className={cn('text-foreground-2 px-3 pt-0 pb-5', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
