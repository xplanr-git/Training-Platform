import { HeaderSkeleton, StatGridSkeleton } from '@/components/skeletons';

/**
 * Fallback for admin pages without a closer loading.tsx, shaped like the admin
 * dashboard (heading, description, three stat cards) since that is where most
 * navigations land. Pages with a materially different shape — the tables and
 * Insights — define their own so nothing jumps on swap-in.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true">
      <HeaderSkeleton />
      <StatGridSkeleton count={3} cols={3} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
