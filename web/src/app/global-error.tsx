'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * The last resort: an error thrown by the ROOT LAYOUT itself.
 *
 * app/error.tsx renders *inside* the root layout, so it cannot catch a failure
 * in that layout — when one happened, Next fell back to its own built-in error
 * screen and nothing was reported. This boundary replaces the whole document,
 * which is why it has to supply its own <html> and <body>.
 *
 * Styling is inline on purpose. If the root layout failed, whatever it imports
 * — including globals.css — may be exactly what failed, so a Tailwind class
 * here could render an unstyled page at the worst possible moment.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: 'global', digest: error.digest },
      level: 'fatal',
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          background: '#fff',
          color: '#111',
        }}
      >
        <main style={{ maxWidth: '28rem', padding: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            Something went badly wrong
          </h1>
          <p style={{ color: '#555', marginTop: '0.75rem' }}>
            The page could not be loaded at all. Reloading usually fixes it. If it keeps happening,
            let us know and quote this reference.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: '0.75rem',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.75rem',
                color: '#777',
                userSelect: 'all',
              }}
            >
              {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: '1.25rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#fff',
              background: '#1b1b1e',
              border: 0,
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
