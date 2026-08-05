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
      <div className="relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-900">
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
          <Video className="h-6 w-6 text-neutral-500" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title || 'Untitled video'}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          {duration && <span className="tabular-nums">{duration}</span>}
          {duration && <span aria-hidden>·</span>}
          <span className={playable ? 'text-brand-600' : 'text-amber-700'}>{statusLabel}</span>
        </p>
        {!playable && encodeProgress > 0 && (
          <div
            className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuenow={encodeProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Encoding progress"
          >
            <div className="h-full bg-amber-500" style={{ width: `${encodeProgress}%` }} />
          </div>
        )}
        {!playable && (
          <p className="mt-1 text-xs text-muted">
            Reload this page to check again — the video keeps processing whether this
            page is open or not.
          </p>
        )}
        <p className="mt-1 truncate font-mono text-[11px] text-faint">{videoId}</p>
      </div>
    </div>
  );
}
