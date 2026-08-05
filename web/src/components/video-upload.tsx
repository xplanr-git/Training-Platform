'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Attaches a Bunny Stream video to a lesson, three ways:
 *
 *  1. Upload a file straight from this page (the normal path).
 *  2. Give Bunny a public URL to pull from.
 *  3. Paste the id of something already in the library.
 *
 * The upload goes BROWSER -> BUNNY directly, never through our server, using a
 * short-lived signed ticket minted by startUpload. The library key stays on the
 * server. It is a resumable (TUS) upload, which matters for the real use case:
 * large course videos over a site connection, where a dropped connection should
 * resume rather than start over.
 */

/** Mirrors BunnyTusTicket in lib/video.ts, which is server-only and can't be imported here. */
interface UploadTicket {
  libraryId: string;
  videoId: string;
  signature: string;
  expirationTime: number;
  endpoint: string;
}

const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB — well above any lesson video.

function humanSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function VideoUpload({
  lessonTitle,
  attach,
  attachFromUrl,
  startUpload,
  currentVideoId,
}: {
  lessonTitle: string;
  attach: (videoId: string) => Promise<{ error?: string } | void>;
  attachFromUrl: (title: string, url: string) => Promise<{ error?: string; videoId?: string }>;
  startUpload: (title: string) => Promise<{ error?: string; ticket?: UploadTicket }>;
  currentVideoId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const uid = useId();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(currentVideoId);
  const [videoId, setVideoId] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onUpload() {
    if (!file) return;
    setError(null);
    setPercent(0);
    setUploading(true);

    // Mint the ticket first: no point streaming bytes if we aren't authorised.
    const prep = await startUpload(lessonTitle || file.name);
    if (prep.error || !prep.ticket) {
      setUploading(false);
      setPercent(null);
      setError(prep.error ?? 'Could not prepare the upload.');
      return;
    }
    const ticket = prep.ticket;

    // Loaded on demand so the TUS client stays out of the page's initial bundle.
    const { Upload } = await import('tus-js-client');

    await new Promise<void>((resolve) => {
      const upload = new Upload(file, {
        endpoint: ticket.endpoint,
        // Bunny authorises the upload from these headers plus the signature.
        headers: {
          AuthorizationSignature: ticket.signature,
          AuthorizationExpire: String(ticket.expirationTime),
          VideoId: ticket.videoId,
          LibraryId: ticket.libraryId,
        },
        metadata: { filetype: file.type, title: lessonTitle || file.name },
        // Resume rather than restart on a flaky connection.
        retryDelays: [0, 2000, 5000, 10000, 20000],
        onProgress(sent, total) {
          setPercent(total > 0 ? Math.round((sent / total) * 100) : 0);
        },
        onError(err) {
          console.error('[bunny upload]', err);
          setUploading(false);
          setPercent(null);
          setError(
            'The upload failed. Your connection may have dropped — try again and it will resume.',
          );
          resolve();
        },
        onSuccess() {
          // Attach only now, so an abandoned upload never points a lesson at an
          // empty video object.
          startTransition(async () => {
            const res = await attach(ticket.videoId);
            setUploading(false);
            setPercent(null);
            if (res && 'error' in res && res.error) {
              setError(res.error);
            } else {
              setDone(ticket.videoId);
              setFile(null);
              if (fileRef.current) fileRef.current.value = '';
            }
            resolve();
          });
        },
      });
      upload.start();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Upload a file — the normal path. */}
      <div className="flex flex-col gap-1.5">
        {/*
          A <label>, not a <span>. type=file has no placeholder to fall back on, so
          this control's accessible name was the empty string — a screen reader
          announced its role and nothing else. One VideoUpload renders per video
          lesson in the builder, so the id has to be unique per instance.
        */}
        <label htmlFor={`${uid}-file`} className="text-xs font-medium">
          {done ? 'Replace this video' : 'Upload a video'}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`${uid}-file`}
            ref={fileRef}
            type="file"
            accept="video/*"
            disabled={uploading || pending}
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              setError(null);
              if (picked && picked.size > MAX_BYTES) {
                setFile(null);
                setError(`That file is ${humanSize(picked.size)} — the limit is 5 GB.`);
                return;
              }
              setFile(picked);
            }}
            className="text-sm file:mr-3 file:rounded-md file:border file:border-border
                       file:bg-surface file:px-2.5 file:py-1 file:text-sm file:font-medium
                       hover:file:bg-surface-muted"
          />
          <Button
            type="button"
            size="sm"
            disabled={!file || uploading || pending}
            onClick={onUpload}
          >
            {uploading
              ? `Uploading ${percent ?? 0}%`
              : done
                ? 'Replace'
                : 'Upload'}
          </Button>
        </div>
        {file && !uploading && (
          <span className="text-xs text-muted">
            {file.name} · {humanSize(file.size)}
          </span>
        )}
        {uploading && percent !== null && (
          <div className="flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            >
              <div
                className="h-full bg-brand-600 transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-muted">{percent}%</span>
          </div>
        )}
      </div>

      {/* 2. Pull from a URL. */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
        <span className="text-xs text-muted">or import from a link</span>
        <Input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://…/video.mp4"
          className="h-8 w-56"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!sourceUrl.trim() || pending || uploading}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await attachFromUrl(lessonTitle, sourceUrl.trim());
              if (res.error) setError(res.error);
              else if (res.videoId) setDone(res.videoId);
            })
          }
        >
          {pending ? 'Importing…' : 'Import'}
        </Button>
      </div>

      {/* 3. Attach an existing library id. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">or attach a video already in Bunny</span>
        <Input
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          placeholder="9f347567-cac1-…"
          className="h-8 w-56"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!videoId.trim() || pending || uploading}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await attach(videoId.trim());
              if (res && 'error' in res && res.error) setError(res.error);
              else setDone(videoId.trim());
            })
          }
        >
          Attach
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {done && !error && (
        <p className="text-xs text-muted">
          Uploading again replaces the attached video for this lesson.
        </p>
      )}
    </div>
  );
}
