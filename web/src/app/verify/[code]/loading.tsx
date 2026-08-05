import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mirrors the certificate card: a centred panel at max-w-2xl. This one matters
 * more than most — it is a PUBLIC page, often the first thing a third party
 * verifying a credential ever sees, and it joins six tables before it can render.
 */
export default function VerifyLoading() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-14"
      aria-busy="true"
    >
      <div className="rounded-(--radius-card) border border-border bg-surface p-8">
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto mt-6 h-7 w-64" />
        <Skeleton className="mx-auto mt-6 h-3 w-32" />
        <Skeleton className="mx-auto mt-3 h-8 w-72" />
        <Skeleton className="mx-auto mt-6 h-3 w-40" />
        <Skeleton className="mx-auto mt-3 h-6 w-80 max-w-full" />
        <Skeleton className="mx-auto mt-8 h-3 w-28" />
      </div>
      <span className="sr-only">Checking this certificate…</span>
    </main>
  );
}
