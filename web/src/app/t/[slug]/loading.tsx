import { Skeleton } from '@/components/ui/skeleton';
import { CardListSkeleton } from '@/components/skeletons';

/**
 * Fallback for learner pages without a closer loading.tsx — the storefront,
 * course landing and learner dashboard, which all share a centred prose column.
 * The lesson player has its own, because its two-column layout is nothing like
 * this and swapping between them would visibly jump.
 */
export default function TenantLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-14" aria-busy="true">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <CardListSkeleton count={3} />
      <span className="sr-only">Loading…</span>
    </main>
  );
}
