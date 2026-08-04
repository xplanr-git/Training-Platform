import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons';

/** Mirrors the tenant list: heading, then the five-column academies table. */
export default function PlatformLoading() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-7 w-40" />
      <TableSkeleton rows={4} cols={5} />
      <span className="sr-only">Loading academies…</span>
    </div>
  );
}
