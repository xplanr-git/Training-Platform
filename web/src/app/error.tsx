'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Root error boundary. Catches uncaught render/Server-Action errors and shows
 * a branded fallback with a retry, instead of Next's raw error screen.
 *
 * It used to only console.error, which on a deployed app means the error is
 * written to a console nobody is reading and then discarded. `digest` is the
 * only handle correlating this render with the server-side event, so it is
 * attached as a tag rather than buried in the message.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error, {
      tags: { boundary: 'root', digest: error.digest },
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-muted"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
