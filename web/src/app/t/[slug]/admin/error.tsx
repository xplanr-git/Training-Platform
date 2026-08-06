'use client';

import { SegmentError } from '@/components/segment-error';

/**
 * Admin-area boundary. Sits INSIDE the admin layout, so the sidebar survives —
 * an admin whose analytics query times out keeps their navigation instead of
 * being dropped onto a bare full-screen error.
 */
export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      boundary="admin"
      title="This screen could not be loaded"
      description="Something went wrong loading this admin screen. Nothing you were viewing has been changed."
      backHref="/admin"
      backLabel="Admin home"
    />
  );
}
