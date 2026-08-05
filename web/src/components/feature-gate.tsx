/**
 * Renders a "coming soon" panel for a gated feature. The nav keeps gated
 * entries visible (sales surface); selecting one lands here instead of a
 * half-built page.
 */
export function FeatureGate({ feature }: { feature: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        Coming soon
      </span>
      {/*
        An h1, not an h2: this component IS the whole page for /admin/coming-soon,
        so an h2 left the route with no h1 at all and a heading outline starting at
        level 2. text-xl is kept — the panel is deliberately quieter than a working
        page's title.
      */}
      <h1 className="text-xl font-semibold">{feature}</h1>
      <p className="max-w-sm text-sm text-muted">
        This part of the academy is not built yet. If you need it, tell whoever looks after this
        platform.
      </p>
    </div>
  );
}
