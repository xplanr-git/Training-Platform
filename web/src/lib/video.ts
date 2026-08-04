import 'server-only';
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

async function bunnyFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = env.bunnyApiKey();
  const lib = env.bunnyLibraryId();
  if (!key || !lib) throw new Error('Bunny Stream is not configured');
  return fetch(`${BUNNY_API}/library/${lib}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      AccessKey: key,
      accept: 'application/json',
    },
    cache: 'no-store',
  });
}

export interface BunnyVideoDetails {
  videoId: string;
  title: string;
  durationSec: number | null;
  /** Bunny status 4 = finished encoding and playable. */
  playable: boolean;
}

export async function getBunnyVideo(videoId: string): Promise<BunnyVideoDetails | null> {
  const res = await bunnyFetch(`/videos/${encodeURIComponent(videoId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Bunny lookup failed (${res.status})`);
  const v = (await res.json()) as {
    guid?: string;
    title?: string;
    length?: number;
    status?: number;
  };
  if (!v.guid) return null;
  return {
    videoId: v.guid,
    title: v.title ?? '',
    durationSec: typeof v.length === 'number' && v.length > 0 ? Math.round(v.length) : null,
    playable: v.status === 4,
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

/** Tells Bunny to pull the media from a public URL (server-side ingest). */
export async function fetchBunnyFromUrl(videoId: string, url: string): Promise<void> {
  const res = await bunnyFetch(`/videos/${encodeURIComponent(videoId)}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`Bunny fetch failed (${res.status})`);
}
