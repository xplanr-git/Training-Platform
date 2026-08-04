'use client';

import { useEffect, useRef } from 'react';
import { recordVideoProgress } from '@/app/t/[slug]/learn/[courseSlug]/actions';

const BEAT_SECONDS = 15;
const EMBED_ORIGIN = 'https://iframe.mediadelivery.net';

/**
 * Don't bother resuming a position this small — landing the learner at 0 is
 * indistinguishable and avoids a pointless seek. Previously 5s, which meant a
 * short first visit was never resumed at all.
 */
const MIN_RESUME_SEC = 1;

/**
 * How many times to re-issue the seek. Bunny frequently has no metadata yet when
 * it emits `ready`, so a single setCurrentTime there is silently dropped and the
 * video starts from the beginning. Re-issuing on early timeupdates fixes it.
 */
const MAX_RESUME_ATTEMPTS = 4;

/**
 * Never resume this close to the end. Someone who watched to the finish has a
 * stored position at the last second; seeking there drops them on a video that
 * is already over, and pressing play restarts it anyway — which reads as "resume
 * is broken" when it is really "there was nothing left to resume".
 */
const END_TOLERANCE_SEC = 3;

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
  // Starts at 0, NOT at resumeAtSec. Seeding it with the resume value meant a
  // failed seek still reported the resume position back, so the stored furthest
  // point looked correct while the learner actually restarted from the
  // beginning — the failure was invisible in the data. The server takes
  // max(positionSec) across all events, so reporting only this session's real
  // furthest can never move a learner backwards.
  const furthestRef = useRef(0);
  const sentAtRef = useRef(0);
  const sentPosRef = useRef(0);
  const resumeAttemptsRef = useRef(0);
  const resumeDoneRef = useRef(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    // Refs outlive the effect, so reset the resume state whenever it re-runs
    // (e.g. resumeAtSec changed after a refresh). Note `ready` will NOT fire
    // again for an already-loaded iframe — the retry on timeupdate is what
    // makes the seek land in that case.
    resumeAttemptsRef.current = 0;
    resumeDoneRef.current = resumeAtSec <= MIN_RESUME_SEC;
    lastTimeRef.current = null;

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
      let msg: {
        context?: string;
        event?: PlayerJsEvent;
        value?: { seconds?: number; duration?: number };
      };
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
          if (resumeAtSec > MIN_RESUME_SEC) {
            resumeAttemptsRef.current += 1;
            send('setCurrentTime', resumeAtSec);
          } else {
            resumeDoneRef.current = true;
          }
          break;
        case 'timeupdate': {
          const t = msg.value?.seconds;
          if (typeof t !== 'number') return;

          // Duration only becomes known once the player reports it. If the stored
          // position is at (or within a few seconds of) the end, there is nothing
          // to resume — the learner finished it. Seeking there strands them on a
          // completed video, and pressing play restarts from 0 anyway, which is
          // indistinguishable from resume being broken.
          const duration = msg.value?.duration;
          if (
            !resumeDoneRef.current &&
            typeof duration === 'number' &&
            duration > 0 &&
            resumeAtSec >= duration - END_TOLERANCE_SEC
          ) {
            resumeDoneRef.current = true;
          }

          // Re-issue the seek while the player is still reporting a position
          // before the resume point: `ready` fires before Bunny has metadata, so
          // the first setCurrentTime is often dropped. Retry until it lands or we
          // run out of attempts, then accept where we are rather than fighting
          // the player forever (or the learner scrubbing backwards on purpose).
          if (!resumeDoneRef.current) {
            if (t >= resumeAtSec - 1) {
              resumeDoneRef.current = true;
            } else if (resumeAttemptsRef.current < MAX_RESUME_ATTEMPTS) {
              resumeAttemptsRef.current += 1;
              send('setCurrentTime', resumeAtSec);
              // Don't count this pre-resume playback as watched, and don't let it
              // set the furthest point.
              lastTimeRef.current = null;
              return;
            } else {
              resumeDoneRef.current = true;
            }
          }

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
