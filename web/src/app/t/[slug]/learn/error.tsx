'use client';

import { SegmentError } from '@/components/segment-error';

/**
 * Learner boundary. The reassurance is the point: this fires mid-course, and the
 * first thing someone assumes when a lesson page breaks is that their progress
 * has gone. Progress is written by its own actions and is unaffected by a render
 * failure here.
 */
export default function LearnError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      {...props}
      boundary="learn"
      title="This lesson could not be loaded"
      description="Something went wrong loading this lesson. Your progress is saved — trying again usually works."
      backHref="/dashboard"
      backLabel="My courses"
    />
  );
}
