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

export type VideoProvider = 'youtube' | 'apivideo';

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
  if (videoId && provider === 'apivideo') return { provider: 'apivideo', videoId };
  return null;
}

export function apiVideoConfigured(): boolean {
  return !!env.apiVideoKey();
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
