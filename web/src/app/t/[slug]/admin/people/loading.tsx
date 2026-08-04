import { HeaderSkeleton, SearchSkeleton, TableSkeleton } from '@/components/skeletons';

/** People: heading, invite row, search, then the members table. */
export default function PeopleLoading() {
  return (
    <div aria-busy="true">
      <HeaderSkeleton />
      <SearchSkeleton />
      <TableSkeleton rows={4} cols={6} />
      <span className="sr-only">Loading members…</span>
    </div>
  );
}
