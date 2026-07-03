'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * Initialises PostHog on the client when a key is configured. No-ops in dev
 * without a key so the app runs without observability credentials.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: true,
    });
  }, []);

  return <>{children}</>;
}
