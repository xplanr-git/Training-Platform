import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shared loading shapes, so each `loading.tsx` is three lines rather than a
 * hand-rolled pile of pulsing divs.
 *
 * These deliberately mirror the real layouts — same container widths, same grid
 * columns, same row heights. A skeleton that doesn't match causes the page to
 * jump when it swaps in, which reads as jank and is arguably worse than showing
 * nothing. Each shape below is paired with the page it stands in for.
 */

/** Page heading plus its one-line description. Common to every admin page. */
export function HeaderSkeleton({ wide }: { wide?: boolean }) {
  return (
    <>
      <Skeleton className={wide ? 'h-7 w-64' : 'h-7 w-44'} />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
    </>
  );
}

/**
 * A row of stat cards. `cols` matches the real grid so the cards land in the
 * same places: 3 on the admin dashboard, 4 (over two rows) on Insights.
 */
export function StatGridSkeleton({ count, cols }: { count: number; cols: 3 | 4 }) {
  return (
    <div
      className={`mt-6 grid grid-cols-2 gap-3 ${cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-[--radius-card] border border-border bg-surface px-4 py-4"
        >
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="mt-2 h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * A bordered table: header strip then rows. Used by Courses, People and
 * Certificates, which share this shape.
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="mt-6 overflow-hidden rounded-[--radius-card] border border-border bg-surface">
      <div className="flex gap-4 border-b border-border bg-surface-muted px-4 py-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={c === 0 ? 'h-4 flex-[2]' : 'h-4 flex-1'} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A search input sitting above a list. */
export function SearchSkeleton() {
  return (
    <div className="mt-5 flex max-w-sm gap-2">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 w-20" />
    </div>
  );
}

/** Stacked cards — the learner dashboard and course outline shape. */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-6 space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-[--radius-card] border border-border bg-surface p-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
