/**
 * Why a video lesson has nothing to play.
 *
 * All of these rendered as the same bare line, "Video unavailable." — the least
 * useful thing to say, because they need different responses and most of them are
 * nobody-in-the-academy's fault:
 *
 *  - `not-attached`        the author has not added a video yet. An ordinary state
 *                          on a course being built, fixable in the builder, and NOT
 *                          a fault — logging it would bury the signal for the rest.
 *  - `host-not-configured` a Bunny video IS attached, but this deployment has no
 *                          BUNNY_LIBRARY_ID. Nobody in the academy can fix it, and
 *                          nothing was logged, so it was indistinguishable from the
 *                          author simply not having got round to it.
 *  - `unknown-provider`    content carries a video id under a provider this build
 *                          cannot play. `hostedVideoFromContent` returns null for
 *                          these, which is exactly why they looked like "nothing
 *                          attached".
 *  - `unplayable-link`     a legacy `youtubeUrl` that is not a YouTube link — e.g.
 *                          a Vimeo URL pasted into the old field.
 *  - `unexpected`          the content looks playable and the host is configured, so
 *                          reaching this means something else is wrong. Kept as a
 *                          real case rather than returning null, because the
 *                          alternative is a blank space where the player belongs —
 *                          worse than the line this replaces.
 *
 * Deliberately in its own module, free of `env` and of `lib/video.ts`. That file
 * imports React's `cache`, which exists only in the react-server build, so anything
 * living there cannot be unit-tested at all — and `hostConfigured` is a parameter
 * rather than an env read so the central claim is actually verifiable.
 */
export type VideoUnavailable =
  | { reason: 'not-attached' }
  | { reason: 'host-not-configured'; videoId: string }
  | { reason: 'unknown-provider'; providerName: string }
  | { reason: 'unplayable-link'; url: string }
  | { reason: 'unexpected' };

export function videoUnavailableReason(
  content: Record<string, unknown> | null | undefined,
  opts: { hostConfigured: boolean },
): VideoUnavailable {
  const c = content ?? {};
  const videoId = typeof c.videoId === 'string' ? c.videoId.trim() : '';
  const provider = typeof c.provider === 'string' ? c.provider.trim() : '';
  const youtubeUrl = typeof c.youtubeUrl === 'string' ? c.youtubeUrl.trim() : '';

  if (videoId && provider === 'bunny') {
    // A Bunny id with a configured host should have played. Say so plainly instead
    // of blaming configuration that is in fact fine.
    return opts.hostConfigured
      ? { reason: 'unexpected' }
      : { reason: 'host-not-configured', videoId };
  }
  // A stale legacy link is checked AFTER the hosted video: lessons migrated off
  // YouTube can carry both, and the hosted id is the real source.
  if (videoId) return { reason: 'unknown-provider', providerName: provider || 'unnamed' };
  if (youtubeUrl) return { reason: 'unplayable-link', url: youtubeUrl };
  return { reason: 'not-attached' };
}

/** Reasons that indicate a deployment or data fault worth finding in the logs. */
export function isVideoFault(u: VideoUnavailable): boolean {
  return u.reason !== 'not-attached';
}
