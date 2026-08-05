import Link from 'next/link';
import { VideoOff, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VideoUnavailable as Reason } from '@/lib/video-availability';

/**
 * Stands in for a video that cannot play.
 *
 * Replaces a bare `<p>Video unavailable.</p>`, which had two problems beyond the
 * words. It told the learner nothing about whether to wait, retry, or report it —
 * and being a single line of text where a 16:9 player belongs, it collapsed the
 * page layout, so the lesson looked broken rather than incomplete. The box keeps
 * the player's footprint.
 *
 * Two audiences, and they need opposite things:
 *
 *  - The LEARNER cannot fix any of this. They need to know whether it is their
 *    problem (never), whether waiting helps, and that they can carry on.
 *  - The ADMIN previewing the course can fix `not-attached` themselves, and for the
 *    rest needs enough detail to report it usefully — including the env var name,
 *    which is not a secret and is the single most useful word in the message.
 *
 * Admin detail is gated on `isPreview` rather than shown to everyone: a learner has
 * no use for an environment variable, and infrastructure detail on a learner page
 * is noise at best.
 */
export function VideoUnavailable({
  unavailable,
  isPreview,
  builderHref,
}: {
  unavailable: Reason;
  isPreview: boolean;
  builderHref: string | null;
}) {
  const learner = learnerMessage(unavailable);

  return (
    <div className="w-full">
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-[--radius-card] border border-dashed border-border bg-surface-muted px-6 text-center">
        <VideoOff aria-hidden="true" className="h-6 w-6 text-muted" />
        <p className="mt-3 text-base font-semibold">{learner.title}</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">{learner.body}</p>
      </div>

      {isPreview && (
        <div className="mt-3 rounded-[--radius-card] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="flex items-center gap-1.5 font-medium">
            <Wrench aria-hidden="true" className="h-4 w-4" />
            Admin view
          </p>
          <p className="mt-1 leading-relaxed">{adminMessage(unavailable)}</p>
          {unavailable.reason === 'not-attached' && builderHref && (
            <Button asChild size="sm" variant="outline" className="mt-2.5">
              <Link href={builderHref}>Open the builder</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Never blames the learner and never asks them to do something that cannot help.
 * "Try again later" is only said where trying again later actually might work.
 */
function learnerMessage(u: Reason): { title: string; body: string } {
  switch (u.reason) {
    case 'not-attached':
      return {
        title: 'This lesson has no video yet',
        body: 'It is still being put together. Nothing is wrong at your end — carry on with the other lessons and come back to this one.',
      };
    case 'host-not-configured':
    case 'unknown-provider':
    case 'unplayable-link':
    case 'unexpected':
      return {
        title: 'This video cannot be played',
        body: 'Something is wrong with how this lesson is set up, not with your device or connection. It has been logged. If it is still here tomorrow, tell whoever runs your academy.',
      };
  }
}

/** Written to be pasted into a message to whoever can actually fix it. */
function adminMessage(u: Reason): string {
  switch (u.reason) {
    case 'not-attached':
      return 'No video is attached to this lesson. Add one in the course builder.';
    case 'host-not-configured':
      return `A Bunny video is attached (id ${u.videoId}) but this deployment has no BUNNY_LIBRARY_ID, so nothing can play. Set it in the environment variables and redeploy — the lesson itself is fine.`;
    case 'unknown-provider':
      return `This lesson names the video provider "${u.providerName}", which this build cannot play. Re-attach the video from the builder.`;
    case 'unplayable-link':
      return `The legacy video link on this lesson is not a YouTube URL (${u.url}), so it cannot be embedded. Re-attach the video from the builder.`;
    case 'unexpected':
      return 'This lesson looks correctly set up and the video host is configured, so reaching this message is unexpected. It has been logged — please report it with a link to this lesson.';
  }
}
