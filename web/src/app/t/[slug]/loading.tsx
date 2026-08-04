/**
 * Shown while a learner-facing page loads — the storefront, a course page, the
 * dashboard, or a lesson. Same reasoning as the admin one: a click needs to
 * produce a visible response immediately, before any server work starts.
 */
export default function TenantLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-pulse px-4 py-8" aria-busy="true">
      <div className="h-8 w-2/3 rounded bg-surface-muted" />
      <div className="mt-3 h-4 w-full rounded bg-surface-muted" />
      <div className="mt-2 h-4 w-4/5 rounded bg-surface-muted" />
      <div className="mt-8 space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-[--radius-card] border border-border bg-surface" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
