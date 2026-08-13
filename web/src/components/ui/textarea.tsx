'use client';
import * as React from 'react';

import { cn } from '@/components/ui/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Same size/hover grammar as Input: 16px below md (iOS zoom), the
        // 13.5px control size on desktop, hover firms the border.
        'resize-none border-input placeholder:text-muted-foreground hover:border-muted focus-visible:border-ring aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,border-color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-control',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
