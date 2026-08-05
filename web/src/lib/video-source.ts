import { videoUnavailableReason, type VideoUnavailable } from '@/lib/video-availability';

/**
 * What a video lesson should actually render — decided once.
 *
 * The player used to decide this TWICE: a JSX ternary tested
 * `hosted?.provider === 'bunny' && env.bunnyLibraryId()` and then `youtubeEmbed(...)`,
 * while a `playable` const beside it repeated the same two conditions for the logging
 * gate. Two copies of one decision, and the failure mode of their drifting apart was
 * an empty space where the player belongs.
 *
 * Now there is one discriminated union and the JSX switches on `kind`, so the branches
 * are exhaustive by construction — there is no path that renders nothing.
 *
 * Deliberately free of `env` and of `lib/video.ts`. `libraryId` is a parameter so the
 * whole decision is a pure function of its inputs, and `lib/video.ts` imports React's
 * `cache`, which exists only in the react-server build and would make this untestable
 * — the same reason `video-availability.ts` lives on its own.
 */
export type VideoSource =
  | { kind: 'bunny'; videoId: string; libraryId: string }
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'unavailable'; unavailable: VideoUnavailable };

/**
 * LEGACY. Video lessons are authored through Bunny and the builder has no YouTube
 * field; this keeps already-published YouTube lessons playing until they are migrated.
 * Such lessons emit no progress events, so they have no resume position and never
 * appear in Insights' watch-time table.
 */
export function youtubeEmbed(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function resolveVideoSource(
  content: Record<string, unknown> | null | undefined,
  opts: { libraryId: string | null },
): VideoSource {
  const c = content ?? {};
  const videoId = typeof c.videoId === 'string' ? c.videoId.trim() : '';
  const provider = typeof c.provider === 'string' ? c.provider.trim() : '';
  const libraryId = opts.libraryId?.trim() || '';

  // A hosted Bunny video wins over any legacy link: lessons migrated off YouTube can
  // carry both, and the Bunny id is the real source.
  if (videoId && provider === 'bunny' && libraryId) {
    return { kind: 'bunny', videoId, libraryId };
  }

  const youtubeUrl = typeof c.youtubeUrl === 'string' ? c.youtubeUrl : '';
  const embedUrl = youtubeEmbed(youtubeUrl);
  // Only fall back to YouTube when there is no Bunny id at all. A Bunny video with an
  // unconfigured host must report host-not-configured, not silently play a stale
  // YouTube copy that records no progress.
  if (!videoId && embedUrl) return { kind: 'youtube', embedUrl };

  return {
    kind: 'unavailable',
    unavailable: videoUnavailableReason(c, { hostConfigured: !!libraryId }),
  };
}
