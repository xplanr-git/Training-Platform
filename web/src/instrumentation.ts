/**
 * Next.js instrumentation hook. Initialises Sentry on the server only when a
 * DSN is configured, so the app builds and runs without observability creds.
 * Full source-map upload (withSentryConfig) is wired in CI where the auth
 * token is available.
 */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  }
}
