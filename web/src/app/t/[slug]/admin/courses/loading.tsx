import { HeaderSkeleton, SearchSkeleton, TableSkeleton } from '@/components/skeletons';

/** Courses list: heading, search box, then the title/status/actions table. */
export default function CoursesLoading() {
  return (
    <div aria-busy="true">
      <HeaderSkeleton />
      <SearchSkeleton />
      <TableSkeleton rows={5} cols={3} />
      <span className="sr-only">Loading courses…</span>
    </div>
  );
}
