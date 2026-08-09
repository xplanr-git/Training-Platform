'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/components/ui/utils';

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      // Ink fill on a sunken track. The track was bg-primary/20 — a 20% ink wash,
      // which reads as a lighter version of the fill rather than as a groove the
      // fill sits in. Squared to the 2px tag radius; a fully round bar is the pill
      // shape GUIDELINES.md §9 rules out.
      className={cn('bg-sunken relative h-2 w-full overflow-hidden rounded-sm', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
