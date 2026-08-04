import { HeaderSkeleton, TableSkeleton } from '@/components/skeletons';

/** Certificates: heading then the learner/course/issued/status table. */
export default function CertificatesLoading() {
  return (
    <div aria-busy="true">
      <HeaderSkeleton />
      <TableSkeleton rows={4} cols={5} />
      <span className="sr-only">Loading certificates…</span>
    </div>
  );
}
