'use client';

import { Button } from '@/components/ui/button';
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
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="text-muted">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
