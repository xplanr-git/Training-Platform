import { Video } from 'lucide-react';

/**
 * Shows WHAT is attached to a video lesson: poster, title, length and encoding
 * state.
 *
 * Before this, attaching a video reported only a bare uuid — an author had no way
 * to tell which file they had uploaded, whether it was the right one, or whether
 * "not playing" meant broken or still transcoding. The id is the one piece of
 * information that cannot answer any of those questions.
 *
 * Props are structural rather than the BunnyVideoDetails type, which lives in a
 * server-only module.
 */
export function AttachedVideo({
  videoId,
  title,
  durationSec,
  playable,
  thumbnailUrl,
  statusLabel,
  encodeProgress,
}: {
  videoId: string;
  title: string;
  durationSec: number | null;
  playable: boolean;
  thumbnailUrl: string | null;
  statusLabel: string;
  encodeProgress: number;
}) {
  const duration =
    durationSec == null
      ? null
      : durationSec < 60
        ? `${durationSec}s`
        : `${Math.floor(durationSec / 60)}m ${String(durationSec % 60).padStart(2, '0')}s`;

  return (
    <div className="mb-3 flex gap-3 rounded-(--radius-card) border border-border bg-surface p-3">
      <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded bg-foreground">
        {thumbnailUrl ? (
          // A plain <img>, not next/image: the Bunny CDN host comes from an env var
          // rather than build-time config, and optimising a 28x16 admin thumbnail
          // would cost an image-transform request for no visible benefit.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={`Thumbnail for ${title || 'the attached video'}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Video className="h-6 w-6 text-muted" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title || 'Untitled video'}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-meta text-muted">
          {duration && <span className="tabular-nums">{duration}</span>}
          {duration && <span aria-hidden>·</span>}
          <span className={playable ? 'text-status-green' : 'text-status-amber'}>
            {statusLabel}
          </span>
        </p>
        {!playable && encodeProgress > 0 && (
          <div
            className="mt-1.5 h-1 w-full overflow-hidden rounded-sm bg-data-track"
            role="progressbar"
            aria-valuenow={encodeProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Encoding progress"
          >
            {/* A greyscale data mark, not amber: the fill's LENGTH is the datum
              (how far encoding has got), and state is already carried by the
              status word above. Colour on the fill was smuggling state into
              magnitude — the exact thing the v4.1 data-viz rule forbids. */}
            <div className="h-full bg-data-strong" style={{ width: `${encodeProgress}%` }} />
          </div>
        )}
        {!playable && (
          <p className="mt-1 text-meta text-muted">
            Reload this page to check again — the video keeps processing whether this page is open
            or not.
          </p>
        )}
        {/*
          Sans + tabular, not font-mono. The design system rejects
          robot-monospace for codes, and /verify/[code] already renders the
          verification code this way with a comment saying so — this was the one
          place that still used it, so the same class of value was set two
          different ways in the same product.
        */}
        <p className="mt-1 truncate text-eyebrow tabular-nums tracking-wide text-muted">
          {videoId}
        </p>
      </div>
    </div>
  );
}
