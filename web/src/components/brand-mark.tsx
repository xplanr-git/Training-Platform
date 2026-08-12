import { cn } from '@/components/ui/utils';

/**
 * The house brand mark — a full-length plus with square line ends, reversed out
 * of an ink square. The Structure Build / Outdure design system carries the brand
 * through the mark + wordmark, never through colour (CLAUDE.md §13), so this is
 * the whole of the brand glyph.
 *
 * This is the STRUCTURE BUILD placeholder identity, used until the owner supplies
 * the official Outdure artwork (three staggered slashes + the "OUTDURE" wordmark).
 * When that lands, only this file changes — every masthead swaps with it.
 *
 * Decorative: the adjacent wordmark ("Outdure Academy", or the tenant name)
 * carries the accessible name, so the mark is aria-hidden. `size` is the square's
 * edge in px; the plus scales to half of it.
 */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground',
        className,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-1/2 w-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="butt"
      >
        <path d="M8 1.4V14.6M1.4 8H14.6" />
      </svg>
    </span>
  );
}
