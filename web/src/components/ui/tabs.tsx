'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/components/ui/utils';

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('border-border flex w-full items-center gap-6 border-b', className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Underline tabs, not filled pills. The active tab is marked by the
        // 1.75px ink keyline plus a weight change — two channels, so the
        // selection survives greyscale — and the -mb-px pulls it over the
        // list's own border so the two lines occupy the same row rather than
        // stacking. Metrics are core.css `.sb-tabs`: 48px row, the 13.5px
        // control size, 500 resting → 600 active (was 600→700, a step heavier
        // than the system across the board).
        "text-muted data-[state=active]:border-primary data-[state=active]:text-foreground -mb-px inline-flex h-12 items-center justify-center gap-1.5 border-b-[1.75px] border-transparent px-1 text-control font-medium whitespace-nowrap transition-colors data-[state=active]:font-semibold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
