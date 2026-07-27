'use client';

import { useState, useTransition } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Uploads a video file straight from the browser to the hosting provider using
 * a short-lived delegated token — the file never passes through our server, so
 * there's no upload size limit to manage and no bandwidth cost on our side.
 *
 * Existing videos can also be attached by pasting their id, for anything
 * already uploaded in the provider's own dashboard.
 */
export function VideoUpload({
  lessonTitle,
  prepare,
  attach,
  attachFromUrl,
  currentVideoId,
  currentProvider,
  providers,
}: {
  lessonTitle: string;
  prepare: (
    title: string,
  ) => Promise<{ videoId: string; uploadToken: string; uploadUrl: string } | { error: string }>;
  attach: (videoId: string, provider: 'apivideo' | 'bunny') => Promise<{ error?: string } | void>;
  attachFromUrl: (
    title: string,
    url: string,
  ) => Promise<{ error?: string; videoId?: string }>;
  currentVideoId: string | null;
  currentProvider: string | null;
  providers: Array<'apivideo' | 'bunny'>;
}) {
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(currentVideoId);
  const [manualId, setManualId] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [provider, setProvider] = useState<'apivideo' | 'bunny'>(
    (currentProvider as 'apivideo' | 'bunny') ?? providers[0] ?? 'apivideo',
  );

  async function onFile(file: File) {
    setError(null);
    setProgress(0);
    const prepared = await prepare(lessonTitle);
    if ('error' in prepared) {
      setError(prepared.error);
      setProgress(null);
      return;
    }

    const body = new FormData();
    body.append('token', prepared.uploadToken);
    body.append('videoId', prepared.videoId);
    body.append('file', file);

    // XHR rather than fetch: it reports upload progress, which matters for a
    // 200 MB install video on a slow office connection.
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', prepared.uploadUrl);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          setDone(prepared.videoId);
          startTransition(async () => {
            const res = await attach(prepared.videoId, 'apivideo');
            if (res && 'error' in res && res.error) setError(res.error);
          });
        } else {
          setError(`Upload failed (${xhr.status}). Please try again.`);
          setProgress(null);
        }
        resolve();
      };
      xhr.onerror = () => {
        setError('Upload failed — check your connection and try again.');
        setProgress(null);
        resolve();
      };
      xhr.send(body);
    });
  }

  const SELECT_CLS =
    'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="flex flex-col gap-2">
      {providers.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'apivideo' | 'bunny')}
            className={SELECT_CLS}
          >
            {providers.includes('apivideo') && <option value="apivideo">api.video</option>}
            {providers.includes('bunny') && <option value="bunny">Bunny Stream</option>}
          </select>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm shadow-sm ${
            provider === 'apivideo'
              ? 'cursor-pointer hover:bg-surface-muted'
              : 'cursor-not-allowed opacity-50'
          }`}
          title={
            provider === 'apivideo'
              ? 'Uploads straight from your browser to api.video'
              : 'Bunny has no delegated browser-upload token — use a source URL below'
          }
        >
          <Upload className="h-4 w-4" />
          {progress === null ? 'Upload video' : 'Uploading…'}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={progress !== null || provider !== 'apivideo'}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </label>
        <span className="text-xs text-muted">or paste an existing video id</span>
        <Input
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="viABC123…"
          className="h-8 w-40"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!manualId.trim() || pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await attach(manualId.trim(), provider);
              if (res && 'error' in res && res.error) setError(res.error);
              else setDone(manualId.trim());
            })
          }
        >
          Attach
        </Button>
      </div>

      {provider === 'bunny' && (
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
            Ingest
          </Button>
        </div>
      )}

      {progress !== null && progress < 100 && (
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && !error && (
        <p className="text-xs text-muted">
          Attached video <code className="font-mono">{done}</code>
          {progress === 100 ? ' — processing at the provider, playable shortly.' : ''}
        </p>
      )}
    </div>
  );
}
