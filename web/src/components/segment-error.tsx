'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

/**
 * Shared fallback for the segment-level error boundaries.
 *
 * There was exactly ONE error boundary in the app, at the root. So a single
 * failed query in the admin analytics page — one Postgres timeout — replaced the
 * entire application with a generic full-screen apology, losing the navigation,
 * the academy's branding and any sense of where you were. A boundary inside a
 * segment fails only that segment: the layout above it survives, so the sidebar
 * and the way out are still there.
 *
 * `digest` is the only handle tying what the user saw to the server-side event,
 * so it is both reported as a tag and shown, selectable, for them to quote.
 */
export function SegmentError({
  error,
  reset,
  boundary,
  title,
  description,
  backHref,
  backLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Which boundary caught it — the tag that makes Sentry groupable by area. */
  boundary: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error, { tags: { boundary, digest: error.digest } });
  }, [error, boundary]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted">{description}</p>
      {error.digest && (
        <p className="select-all font-mono text-xs text-muted">Reference: {error.digest}</p>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
