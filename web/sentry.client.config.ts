/**
 * Browser-side Sentry.
 *
 * This file did not exist. `@sentry/nextjs` was installed and
 * src/instrumentation.ts initialised it for the SERVER only, so every error
 * that happened in a browser — a failed Server Action, a render crash, an
 * unhandled rejection in the video player — went nowhere at all. The login bug
 * that produced the last four commits on this branch was found because a person
 * reported it, which is the only way anything client-side was ever going to be
 * found.
 *
 * Next.js loads this automatically for the client runtime; it is not imported
 * anywhere. Guarded on the DSN so a clone without observability credentials
 * still builds and runs.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Matches the server sampling in src/instrumentation.ts. One rate in two
    // places is a trap; if this changes, change both.
    tracesSampleRate: 0.1,

    /*
     * Session Replay is deliberately OFF.
     *
     * PostHog already provides replay (CLAUDE.md §2), so enabling it here would
     * mean paying twice and recording learners twice. More importantly this app
     * renders quiz answer keys in the admin builder and learner names on
     * certificates, and a replay of an admin session would capture both.
     */
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    /*
     * Do not report noise the user cannot act on and we cannot fix.
     * A navigation that aborts an in-flight fetch is normal, not an error, and
     * browser-extension frames are not our code.
     */
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'AbortError',
      'NetworkError when attempting to fetch resource',
      'Failed to fetch',
    ],

    /*
     * Scrub before send. Supabase auth tokens live in a JS-readable cookie by
     * necessity (lib/env.ts), and a URL can carry a `?next=` or a password-reset
     * `token_hash`. Sending either to a third party would turn an error report
     * into a credential leak.
     */
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      const scrub = (url?: string) => {
        if (!url) return url;
        try {
          const u = new URL(url);
          for (const p of ['token_hash', 'token', 'access_token', 'refresh_token', 'code']) {
            if (u.searchParams.has(p)) u.searchParams.set(p, '[redacted]');
          }
          return u.toString();
        } catch {
          return url;
        }
      };
      if (event.request?.url) event.request.url = scrub(event.request.url);
      if (event.request?.headers) delete event.request.headers.cookie;
      return event;
    },
  });
}
