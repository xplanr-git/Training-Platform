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
      <h2 className="text-xl font-semibold">{feature}</h2>
      <p className="max-w-sm text-sm text-muted">
        This is on the roadmap and not part of the current release. Contact us if
        it&apos;s a priority for your academy.
      </p>
    </div>
  );
}
