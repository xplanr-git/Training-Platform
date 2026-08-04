import { Skeleton } from '@/components/ui/skeleton';

/**
 * The lesson player is a two-column layout — a 72-unit outline sidebar beside a
 * 16:9 media area — so it needs its own shape. Reusing the single-column tenant
 * skeleton would shift the whole page sideways when the real content arrives.
 *
 * The aspect-video block is the important part: it reserves the player's exact
 * height, so the page doesn't lurch when a video mounts.
 */
export default function LessonLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-8 lg:px-6" aria-busy="true">
      <aside className="hidden w-72 shrink-0 lg:block">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-2 w-full" />
        <div className="mt-5 space-y-4">
          {[0, 1].map((g) => (
            <div key={g}>
              <Skeleton className="mb-2 h-3 w-24" />
              <div className="space-y-1.5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-7 w-2/3" />
        {/* Reserves the player's exact height so nothing lurches on mount. */}
        <Skeleton className="mt-6 aspect-video w-full" />
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-40" />
        </div>
        <span className="sr-only">Loading lesson…</span>
      </main>
    </div>
  );
}
