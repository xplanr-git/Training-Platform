import { Skeleton } from '@/components/ui/skeleton';

/**
 * This page resolves which academy you belong to and redirects, so it is a brief
 * waypoint rather than a destination. It still needs a loading state: without
 * one the browser sits on the previous page during the lookup, which reads as a
 * dead click right after signing in.
 */
export default function DashboardLoading() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 px-6"
      aria-busy="true"
    >
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-64" />
      <span className="sr-only">Taking you to your academy…</span>
    </main>
  );
}
