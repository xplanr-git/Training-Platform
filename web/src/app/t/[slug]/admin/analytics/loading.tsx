import { HeaderSkeleton, StatGridSkeleton, TableSkeleton } from '@/components/skeletons';

/**
 * Insights: eight headline metrics over two rows of four, then the video
 * engagement and question friction tables. It aggregates across enrollments,
 * quiz answers and progress events, so it is the slowest admin page and the one
 * that most needs a shape to wait inside.
 */
export default function AnalyticsLoading() {
  return (
    <div aria-busy="true">
      <HeaderSkeleton />
      <StatGridSkeleton count={8} cols={4} />
      <TableSkeleton rows={3} cols={5} />
      <span className="sr-only">Loading insights…</span>
    </div>
  );
}
