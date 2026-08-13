import Link from 'next/link';

import { cn } from '@/components/ui/utils';

/**
 * The design system's segmented control (core.css `.sb-seg`), expressed as
 * server-rendered filter NAVIGATION rather than stateful buttons: a sunken
 * tray of links, with the active segment lifted onto the white surface by the
 * whisper shadow — selection reads as elevation, not colour, so it survives
 * greyscale like every other selected state in the system.
 *
 * Links, deliberately: the admin lists are server components filtered by query
 * params, so each segment is a plain <a> the router can prefetch, the state
 * lives in the URL (shareable, back-button-able), and no client boundary
 * opens. `aria-current="page"` marks the active segment for AT the same way
 * the side nav marks the current item.
 *
 * Metrics are `.sb-seg` exactly: 3px tray padding and gap, 4px tray radius
 * over 2px segments, 12.5/600 labels, resting text-3 darkening to ink on
 * hover. The py step-down mirrors Button: a 44px-adjacent target on a phone,
 * the system's 30px control from sm: up.
 */
type Segment = {
  label: string;
  href: string;
  active: boolean;
};

function SegmentedNav({
  label,
  items,
  className,
}: {
  /** Accessible name for the nav landmark, e.g. "Filter courses by status". */
  label: string;
  items: Segment[];
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn('inline-flex w-fit gap-[3px] rounded-md bg-sunken p-[3px]', className)}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={cn(
            'rounded-sm px-3 py-2.5 text-meta font-semibold whitespace-nowrap transition-colors sm:py-[5px]',
            item.active
              ? 'bg-card text-foreground shadow-card'
              : 'text-muted hover:text-foreground',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export { SegmentedNav };
