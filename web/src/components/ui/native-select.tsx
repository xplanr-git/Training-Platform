import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/components/ui/utils';

/**
 * The design system's select (`core.css .sb-select`) on a NATIVE <select>, for
 * server-action forms where a Radix Select's client boundary buys nothing.
 * Before this existed, five files copy-pasted a hand-rolled class string that
 * kept the browser-default chevron (different on every OS), sat at 36px with a
 * transparent fill and an off-system shadow — the exact "page bypasses the
 * kit" drift this primitive removes.
 *
 * Metrics match Input: 44px tap target on a phone, the system's 40px control
 * height from sm: up, 16px below md (iOS zooms any field under 16px) stepping
 * to the 13.5px control size, hover firms the border. `appearance-none` kills
 * the browser chrome; the chevron is a lucide icon in an overlay so it takes
 * currentColor and follows the theme — a background-image data-URI cannot.
 */
function NativeSelect({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<'select'> & { wrapperClassName?: string }) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        data-slot="native-select"
        className={cn(
          'border-input bg-input-background hover:border-muted focus-visible:border-ring aria-invalid:border-destructive flex h-11 w-full min-w-0 appearance-none rounded-md border pr-9 pl-3 text-base transition-[color,border-color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 md:text-control',
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="text-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}

export { NativeSelect };
