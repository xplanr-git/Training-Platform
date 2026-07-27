import 'server-only';
import { env } from '@/lib/env';

/**
 * Video hosting provider layer.
 *
 * Deliberately thin and provider-agnostic: lessons store `{ provider, videoId }`
 * in their content, and the player + analytics work off that. Swapping api.video
 * for Bunny (or anything else) means implementing the same three operations
 * below and adding a branch in the player — not touching the learner flow, the
 * watch-time events, or the reporting built on them.
 *
 * YouTube stays supported unchanged so nothing breaks mid-migration.
 */

export type VideoProvider = 'youtube' | 'apivideo' | 'bunny';

/** Providers a video can be attached from (YouTube is legacy paste-a-URL only). */
export type HostedProvider = 'apivideo' | 'bunny';

export interface HostedVideo {
  provider: VideoProvider;
  videoId: string;
}

/** Reads a lesson's content blob into a provider + id, if it has one. */
export function hostedVideoFromContent(
  content: Record<string, unknown> | null | undefined,
): HostedVideo | null {
  const c = content ?? {};
  const videoId = typeof c.videoId === 'string' ? c.videoId.trim() : '';
  const provider = typeof c.provider === 'string' ? c.provider : '';
  if (!videoId) return null;
  if (provider === 'apivideo') return { provider: 'apivideo', videoId };
  if (provider === 'bunny') return { provider: 'bunny', videoId };
  return null;
}

export function apiVideoConfigured(): boolean {
  return !!env.apiVideoKey();
}

export function bunnyConfigured(): boolean {
  return !!env.bunnyApiKey() && !!env.bunnyLibraryId();
}

/** Providers an admin can currently attach a video from. */
export function availableProviders(): HostedProvider[] {
  const list: HostedProvider[] = [];
  if (apiVideoConfigured()) list.push('apivideo');
  if (bunnyConfigured()) list.push('bunny');
  return list;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}
let cached: CachedToken | null = null;

/**
 * Exchanges the API key for a short-lived access token, cached in-process until
 * shortly before expiry (api.video tokens last an hour).
 */
async function accessToken(): Promise<string> {
  const key = env.apiVideoKey();
  if (!key) throw new Error('APIVIDEO_API_KEY is not set');
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const res = await fetch(`${env.apiVideoBaseUrl()}/auth/api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: key }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`api.video auth failed (${res.status})`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error('api.video auth returned no token');
  cached = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

async function apiVideoFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await accessToken();
  return fetch(`${env.apiVideoBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
}

export interface ApiVideoDetails {
  videoId: string;
  title: string;
  /** Seconds, when api.video has finished ingesting and knows the duration. */
  durationSec: number | null;
  playable: boolean;
  thumbnail: string | null;
}

/** Fetches a video's metadata — used to confirm an id exists and get its length. */
export async function getApiVideo(videoId: string): Promise<ApiVideoDetails | null> {
  const res = await apiVideoFetch(`/videos/${encodeURIComponent(videoId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`api.video lookup failed (${res.status})`);
  const v = (await res.json()) as {
    videoId: string;
    title?: string;
    assets?: { mp4?: string; thumbnail?: string; hls?: string };
    metadata?: unknown;
  };
  // Duration lives on the status endpoint once ingest completes.
  let durationSec: number | null = null;
  const st = await apiVideoFetch(`/videos/${encodeURIComponent(videoId)}/status`);
  if (st.ok) {
    const s = (await st.json()) as {
      encoding?: { playable?: boolean; metadata?: { duration?: number } };
    };
    const d = s.encoding?.metadata?.duration;
    if (typeof d === 'number' && Number.isFinite(d) && d > 0) durationSec = Math.round(d);
  }
  return {
    videoId: v.videoId,
    title: v.title ?? '',
    durationSec,
    playable: !!v.assets?.hls,
    thumbnail: v.assets?.thumbnail ?? null,
  };
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

/**
 * Creates a video container and returns a one-shot delegated upload token, so
 * the browser uploads the file straight to api.video — the file never passes
 * through our server.
 */
export async function createApiVideoUpload(
  title: string,
): Promise<{ videoId: string; uploadToken: string }> {
  const createRes = await apiVideoFetch('/videos', {
    method: 'POST',
    body: JSON.stringify({ title: title.slice(0, 200) || 'Untitled lesson' }),
  });
  if (!createRes.ok) {
    throw new Error(`api.video create failed (${createRes.status})`);
  }
  const created = (await createRes.json()) as { videoId: string };

  const tokenRes = await apiVideoFetch('/upload-tokens', {
    method: 'POST',
    body: JSON.stringify({ ttl: 3600 }),
  });
  if (!tokenRes.ok) throw new Error(`api.video upload token failed (${tokenRes.status})`);
  const tok = (await tokenRes.json()) as { token: string };

  return { videoId: created.videoId, uploadToken: tok.token };
}
