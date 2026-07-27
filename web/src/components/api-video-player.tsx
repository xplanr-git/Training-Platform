'use client';

import { useEffect, useRef } from 'react';
import { PlayerSdk } from '@api.video/player-sdk';
import { recordVideoProgress } from '@/app/t/[slug]/learn/[courseSlug]/actions';

const BEAT_SECONDS = 15;

/**
 * api.video player with watch tracking.
 *
 * Two numbers are reported home: the furthest position reached (so a dealer
 * resumes at the second they stopped, on any device) and time actually played
 * since the last beat (so skipping ahead can't inflate watch time). Beats are
 * sent every ~15s while playing and flushed on pause, end, and page hide.
 */
export function ApiVideoPlayer({
  videoId,
  enrollmentId,
  lessonId,
  resumeAtSec,
}: {
  videoId: string;
  enrollmentId: string;
  lessonId: string;
  resumeAtSec: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Refs, not state: these change on every tick and must not re-render.
  const lastTimeRef = useRef<number | null>(null);
  const watchedRef = useRef(0);
  const furthestRef = useRef(resumeAtSec);
  const sentAtRef = useRef(0);
  const sentPosRef = useRef(resumeAtSec);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';

    const sdk = new PlayerSdk(host, { id: videoId, hideTitle: true });
    let disposed = false;

    const flush = () => {
      const watched = Math.round(watchedRef.current);
      const position = Math.round(furthestRef.current);
      // Nothing new to say: no time played and no further progress. Without
      // this, pause/end/hide each fired a redundant zero-watch row.
      if (watched <= 0 && position <= sentPosRef.current) return;
      watchedRef.current = 0;
      sentPosRef.current = position;
      // Fire-and-forget: tracking must never interrupt playback.
      void recordVideoProgress(enrollmentId, lessonId, position, watched).catch(() => {});
    };

    // Seek only once the player reports ready, or the request is dropped.
    if (resumeAtSec > 5) {
      sdk.addEventListener('ready', () => {
        if (!disposed) sdk.setCurrentTime(resumeAtSec);
      });
    }

    sdk.addEventListener('timeupdate', ({ currentTime }) => {
      if (disposed || typeof currentTime !== 'number') return;
      const prev = lastTimeRef.current;
      lastTimeRef.current = currentTime;
      if (prev !== null) {
        const delta = currentTime - prev;
        // Only count forward, real-time movement — a jump means a seek.
        if (delta > 0 && delta < 2) watchedRef.current += delta;
      }
      if (currentTime > furthestRef.current) furthestRef.current = currentTime;
      if (currentTime - sentAtRef.current >= BEAT_SECONDS) {
        sentAtRef.current = currentTime;
        flush();
      }
    });

    sdk.addEventListener('pause', flush);
    sdk.addEventListener('ended', flush);
    sdk.addEventListener('seeking', () => {
      lastTimeRef.current = null;
    });

    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      disposed = true;
      flush();
      document.removeEventListener('visibilitychange', onHide);
      try {
        sdk.destroy();
      } catch {
        // Player already torn down — nothing to clean up.
      }
    };
  }, [videoId, enrollmentId, lessonId, resumeAtSec]);

  return (
    <div className="overflow-hidden rounded-[--radius-card] bg-black">
      <div ref={hostRef} className="aspect-video w-full [&_iframe]:h-full [&_iframe]:w-full" />
    </div>
  );
}
