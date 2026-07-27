'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Attaches a Bunny Stream video to a lesson, either by pasting the id of one
 * already in the library or by giving Bunny a public URL to pull from.
 *
 * Direct file upload from the browser is not offered yet: Bunny has no
 * delegated upload token, so it needs either the library key (which must never
 * reach the browser) or a signed TUS upload. Until that's built, uploading in
 * Bunny's own dashboard and pasting the id is the path.
 */
export function VideoUpload({
  lessonTitle,
  attach,
  attachFromUrl,
  currentVideoId,
}: {
  lessonTitle: string;
  attach: (videoId: string) => Promise<{ error?: string } | void>;
  attachFromUrl: (title: string, url: string) => Promise<{ error?: string; videoId?: string }>;
  currentVideoId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(currentVideoId);
  const [videoId, setVideoId] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Bunny video id</span>
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
          disabled={!videoId.trim() || pending}
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

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">or ingest from a URL</span>
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
          disabled={!sourceUrl.trim() || pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await attachFromUrl(lessonTitle, sourceUrl.trim());
              if (res.error) setError(res.error);
              else if (res.videoId) setDone(res.videoId);
            })
          }
        >
          {pending ? 'Ingesting…' : 'Ingest'}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && !error && (
        <p className="text-xs text-muted">
          Attached video <code className="font-mono">{done}</code> — encoding at Bunny if just
          added, playable shortly.
        </p>
      )}
    </div>
  );
}
