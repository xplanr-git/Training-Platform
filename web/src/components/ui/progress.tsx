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
      // Greyscale fill on the data track, per the v4.1 data-viz rule: a progress
      // bar is a data mark, and "pure ink is never the default fill for a bar" —
      // ink stays reserved for text, keylines and the primary action. The fill is
      // --color-data-strong (the dark data tone), the groove is --color-data-track.
      // Squared to the 2px tag radius; a fully round bar is the pill shape
      // GUIDELINES.md §9 rules out.
      className={cn('bg-data-track relative h-2 w-full overflow-hidden rounded-sm', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-data-strong h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
