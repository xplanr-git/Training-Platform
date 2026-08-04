import 'server-only';
import { cache } from 'react';
import { env } from '@/lib/env';

/**
 * Video hosting provider layer.
 *
 * Lessons store `{ provider, videoId }` in their content, and the player plus
 * all watch-time reporting work off that — so changing host means implementing
 * the operations below and adding a player branch, not touching the learner
 * flow or the analytics built on it. That was proven by running Bunny and
 * api.video side by side; Bunny won on cost, no watermark, and edge coverage,
 * so api.video was removed (recoverable from git history if ever needed).
 *
 * Bunny is the only provider a video can be AUTHORED with — the builder has no
 * URL field. YouTube playback survives only for legacy lessons whose content
 * still holds a youtubeUrl; those record no watch time or resume position and
 * should be migrated to Bunny.
 */

export type VideoProvider = 'youtube' | 'bunny';

/** Providers a video can be attached from. Bunny only. */
export type HostedProvider = 'bunny';

export interface HostedVideo {
  provider: HostedProvider;
  videoId: string;
}

/** Reads a lesson's content blob into a provider + id, if it has one. */
export function hostedVideoFromContent(
  content: Record<string, unknown> | null | undefined,
): HostedVideo | null {
  const c = content ?? {};
  const videoId = typeof c.videoId === 'string' ? c.videoId.trim() : '';
  const provider = typeof c.provider === 'string' ? c.provider : '';
  if (videoId && provider === 'bunny') return { provider: 'bunny', videoId };
  return null;
}

export function bunnyConfigured(): boolean {
  return !!env.bunnyApiKey() && !!env.bunnyLibraryId();
}

/** Providers an admin can currently attach a video from. */
export function availableProviders(): HostedProvider[] {
  return bunnyConfigured() ? ['bunny'] : [];
}

/* ─────────────────────────── Bunny Stream ─────────────────────────── */

const BUNNY_API = 'https://video.bunnycdn.com';

/**
 * `revalidate` opts a GET into Next's data cache for that many seconds. Omit it
 * and the request is uncached, which is what every mutation and every
 * correctness-critical read wants. Deliberately not a plain RequestInit passthrough:
 * `cache: 'no-store'` and `next.revalidate` are mutually exclusive in Next, and
 * letting callers set both is a footgun.
 */
type BunnyFetchInit = Omit<RequestInit, 'cache'> & { revalidate?: number };

async function bunnyFetch(path: string, init?: BunnyFetchInit): Promise<Response> {
  const key = env.bunnyApiKey();
  const lib = env.bunnyLibraryId();
  if (!key || !lib) throw new Error('Bunny Stream is not configured');
  const { revalidate, ...rest } = init ?? {};
  return fetch(`${BUNNY_API}/library/${lib}${path}`, {
    ...rest,
    headers: {
      ...(rest.headers ?? {}),
      AccessKey: key,
      accept: 'application/json',
    },
    ...(revalidate === undefined ? { cache: 'no-store' as const } : { next: { revalidate } }),
  });
}

export interface BunnyVideoDetails {
  videoId: string;
  title: string;
  durationSec: number | null;
  /** Bunny status 4 = finished encoding and playable. */
  playable: boolean;
  /** Poster image, or null before Bunny has generated one. */
  thumbnailUrl: string | null;
  /** Human-readable encoding state, so an author isn't left guessing. */
  statusLabel: string;
  /** 0–100 while transcoding. */
  encodeProgress: number;
}

/**
 * Bunny's numeric video states. Worth naming: an author who has just uploaded
 * needs to know whether "not playing yet" means broken or still transcoding.
 */
function bunnyStatusLabel(status: number | undefined, progress: number): string {
  switch (status) {
    case 0:
      return 'Created — waiting for the file';
    case 1:
      return 'Uploaded — queued for processing';
    case 2:
      return 'Processing';
    case 3:
      return progress > 0 ? `Transcoding — ${progress}%` : 'Transcoding';
    case 4:
      return 'Ready';
    case 5:
      return 'Failed to encode';
    case 6:
      return 'Upload failed';
    default:
      return 'Unknown state';
  }
}

/**
 * Fresh read, uncached. Use where the ANSWER MATTERS RIGHT NOW — chiefly
 * attachVideo, which calls this to confirm a video really exists before pointing
 * a lesson at it. A cached miss there would reject a video that had just been
 * uploaded seconds earlier.
 */
export async function getBunnyVideo(videoId: string): Promise<BunnyVideoDetails | null> {
  return readBunnyVideo(videoId);
}

/**
 * Cached read for DISPLAY — the builder's attached-video cards.
 *
 * Two layers, doing different jobs:
 *  - `cache()` deduplicates within a single request, so two lessons pointing at
 *    the same video cost one call instead of two.
 *  - `revalidate` shares the result across requests for a few seconds, which is
 *    the bigger win: the builder issues one call per video lesson on every
 *    render, so navigating in and out of a ten-video course was ten calls each
 *    time.
 *
 * A short window is safe because the only field that moves is the encoding
 * status, which changes over minutes; once a video is Ready it never changes
 * again. Worst case the card is a few seconds stale, and it already tells the
 * author to reload to check again.
 */
export const getBunnyVideoCached = cache(
  (videoId: string): Promise<BunnyVideoDetails | null> =>
    readBunnyVideo(videoId, BUNNY_DETAILS_REVALIDATE_SEC),
);

/** Seconds to share a video's details for. Encoding progresses over minutes. */
const BUNNY_DETAILS_REVALIDATE_SEC = 20;

async function readBunnyVideo(
  videoId: string,
  revalidate?: number,
): Promise<BunnyVideoDetails | null> {
  const res = await bunnyFetch(`/videos/${encodeURIComponent(videoId)}`, { revalidate });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Bunny lookup failed (${res.status})`);
  const v = (await res.json()) as {
    guid?: string;
    title?: string;
    length?: number;
    status?: number;
    encodeProgress?: number;
    thumbnailFileName?: string;
  };
  if (!v.guid) return null;

  const cdn = env.bunnyCdnHostname();
  const progress = typeof v.encodeProgress === 'number' ? v.encodeProgress : 0;

  return {
    videoId: v.guid,
    title: v.title ?? '',
    durationSec: typeof v.length === 'number' && v.length > 0 ? Math.round(v.length) : null,
    playable: v.status === 4,
    thumbnailUrl:
      cdn && v.thumbnailFileName ? `https://${cdn}/${v.guid}/${v.thumbnailFileName}` : null,
    statusLabel: bunnyStatusLabel(v.status, progress),
    encodeProgress: progress,
  };
}

/** Creates an empty video object; the file is uploaded (or fetched) separately. */
export async function createBunnyVideo(title: string): Promise<{ videoId: string }> {
  const res = await bunnyFetch('/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.slice(0, 200) || 'Untitled lesson' }),
  });
  if (!res.ok) throw new Error(`Bunny create failed (${res.status})`);
  const created = (await res.json()) as { guid: string };
  return { videoId: created.guid };
}

/** Everything the browser needs to upload one file, and nothing more. */
export interface BunnyTusTicket {
  libraryId: string;
  videoId: string;
  /** sha256(libraryId + apiKey + expirationTime + videoId) — proves the server authorised THIS video. */
  signature: string;
  /** Unix seconds. The signature is only valid until this moment. */
  expirationTime: number;
  endpoint: string;
}

/** Bunny's resumable-upload endpoint (TUS 1.0.0). */
const BUNNY_TUS_ENDPOINT = 'https://video.bunnycdn.com/tusupload';

/** How long a ticket stays valid. Long enough for a big file on a slow site. */
const TUS_TICKET_TTL_SEC = 3 * 60 * 60;

/**
 * Creates a video object and returns a signed ticket the BROWSER can upload to
 * directly, without the library key ever leaving the server.
 *
 * This is what makes in-app upload possible. Bunny has no OAuth-style delegated
 * upload token: a direct PUT needs the library AccessKey, which must never reach
 * a client. The resumable (TUS) endpoint instead accepts a SHA-256 signature
 * over the library id, the api key, an expiry and the specific video id — so the
 * browser is authorised to upload exactly one video, for a limited time, and
 * learns nothing reusable.
 *
 * Resumability is the reason to prefer this over a same-origin proxy upload:
 * course videos are large, site connections are not, and a dropped upload
 * resumes rather than restarting. It also keeps the file off our own bandwidth.
 */
export async function createBunnyTusTicket(title: string): Promise<BunnyTusTicket> {
  const key = env.bunnyApiKey();
  const libraryId = env.bunnyLibraryId();
  if (!key || !libraryId) throw new Error('Bunny Stream is not configured');

  const { videoId } = await createBunnyVideo(title);
  const expirationTime = Math.floor(Date.now() / 1000) + TUS_TICKET_TTL_SEC;

  // Deliberately imported here rather than at module scope: this file is also
  // pulled into contexts that only need the pure helpers.
  const { createHash } = await import('node:crypto');
  const signature = createHash('sha256')
    .update(`${libraryId}${key}${expirationTime}${videoId}`)
    .digest('hex');

  return { libraryId, videoId, signature, expirationTime, endpoint: BUNNY_TUS_ENDPOINT };
}

/** Tells Bunny to pull the media from a public URL (server-side ingest). */
export async function fetchBunnyFromUrl(videoId: string, url: string): Promise<void> {
  const res = await bunnyFetch(`/videos/${encodeURIComponent(videoId)}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`Bunny fetch failed (${res.status})`);
}
