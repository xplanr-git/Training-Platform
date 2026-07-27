'use client';

import { useEffect, useRef } from 'react';
import { recordVideoProgress } from '@/app/t/[slug]/learn/[courseSlug]/actions';

const BEAT_SECONDS = 15;
const EMBED_ORIGIN = 'https://iframe.mediadelivery.net';

/**
 * Bunny Stream player with watch tracking.
 *
 * Bunny exposes control via the Player.js postMessage protocol rather than a
 * first-class SDK, so this speaks that protocol directly: after the iframe
 * reports `ready` we subscribe to the events we need, then treat them exactly
 * as the api.video player does — furthest position for resume, real played time
 * for watch totals. Keeping both providers behaviourally identical is what lets
 * the reporting be provider-agnostic.
 */
type PlayerJsEvent = 'ready' | 'timeupdate' | 'pause' | 'ended' | 'seeked';

export function BunnyVideoPlayer({
  libraryId,
  videoId,
  enrollmentId,
  lessonId,
  resumeAtSec,
}: {
  libraryId: string;
  videoId: string;
  enrollmentId: string;
  lessonId: string;
  resumeAtSec: number;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const lastTimeRef = useRef<number | null>(null);
  const watchedRef = useRef(0);
  const furthestRef = useRef(resumeAtSec);
  const sentAtRef = useRef(0);
  const sentPosRef = useRef(resumeAtSec);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const send = (method: string, value?: unknown) => {
      frame.contentWindow?.postMessage(
        JSON.stringify({ context: 'player.js', version: '0.0.4', method, value }),
        EMBED_ORIGIN,
      );
    };

    const flush = () => {
      const watched = Math.round(watchedRef.current);
      const position = Math.round(furthestRef.current);
      if (watched <= 0 && position <= sentPosRef.current) return;
      watchedRef.current = 0;
      sentPosRef.current = position;
      void recordVideoProgress(enrollmentId, lessonId, position, watched).catch(() => {});
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== EMBED_ORIGIN || typeof e.data !== 'string') return;
      let msg: { context?: string; event?: PlayerJsEvent; value?: { seconds?: number } };
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.context !== 'player.js' || !msg.event) return;

      switch (msg.event) {
        case 'ready':
          (['timeupdate', 'pause', 'ended', 'seeked'] as const).forEach((ev) =>
            send('addEventListener', ev),
          );
          if (resumeAtSec > 5) send('setCurrentTime', resumeAtSec);
          break;
        case 'timeupdate': {
          const t = msg.value?.seconds;
          if (typeof t !== 'number') return;
          const prev = lastTimeRef.current;
          lastTimeRef.current = t;
          if (prev !== null) {
            const delta = t - prev;
            // Forward, real-time movement only — a jump means a seek.
            if (delta > 0 && delta < 2) watchedRef.current += delta;
          }
          if (t > furthestRef.current) furthestRef.current = t;
          if (t - sentAtRef.current >= BEAT_SECONDS) {
            sentAtRef.current = t;
            flush();
          }
          break;
        }
        case 'seeked':
          lastTimeRef.current = null;
          break;
        case 'pause':
        case 'ended':
          flush();
          break;
      }
    };

    window.addEventListener('message', onMessage);
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      flush();
      window.removeEventListener('message', onMessage);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [enrollmentId, lessonId, resumeAtSec]);

  return (
    <div className="overflow-hidden rounded-[--radius-card] bg-black">
      <iframe
        ref={frameRef}
        src={`${EMBED_ORIGIN}/embed/${libraryId}/${videoId}?autoplay=false&preload=true`}
        className="aspect-video w-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        title="Lesson video"
      />
    </div>
  );
}
