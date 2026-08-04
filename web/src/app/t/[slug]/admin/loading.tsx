/**
 * Shown the instant an admin page is navigated to, while the server resolves the
 * guard and its queries.
 *
 * Without this, a navigation showed the OLD page until the new one was fully
 * ready — so a click produced no visible response and the app felt unresponsive
 * or broken. A route-level loading state is the only thing that reacts
 * immediately, because Next renders it before any server work begins.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-52 rounded bg-surface-muted" />
      <div className="mt-2 h-4 w-80 rounded bg-surface-muted" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-[--radius-card] border border-border bg-surface" />
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-11 rounded border border-border bg-surface" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
