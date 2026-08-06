'use client';

import { SegmentError } from '@/components/segment-error';

/** Academy-wide boundary: storefront, course landings, dashboard. */
export default function TenantError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      boundary="tenant"
      title="This page could not be loaded"
      description="Something went wrong while loading this part of the academy. Trying again usually works."
      backHref="/"
      backLabel="Back to courses"
    />
  );
}
