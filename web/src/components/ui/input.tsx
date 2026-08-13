'use client';
import * as React from 'react';

import { cn } from '@/components/ui/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // h-11 (44px tap target) on a phone, the system's 40px input height
        // (core.css `.sb-input`) from sm: up. text-base (16) below md is
        // deliberate — iOS zooms into any field under 16px — stepping down to
        // the 13.5px control size on desktop. Hover firms the border to the
        // mid grey, per the v4.1 interaction states ("hover firms the border").
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-11 w-full min-w-0 rounded-md border px-3 py-1 text-base sm:h-10 bg-input-background transition-[color,border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-control',
        'hover:border-muted focus-visible:border-ring',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
