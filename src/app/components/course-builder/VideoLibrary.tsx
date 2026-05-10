import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Upload, Search, PlayCircle, Film, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Activity {
  id: string;
  type: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  fileName?: string;
}

interface Section {
  id: string;
  title: string;
  activities: Activity[];
}

interface LibraryVideo {
  id: string;
  title: string;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  signedUrl: string | null;
}

interface DisplayVideo {
  id: string;
  title: string;
  fileName?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  type: string;
  source: 'library' | 'section';
  sectionTitle: string;
  fileSize?: number;
  uploadedAt?: string;
}

interface VideoLibraryProps {
  sections?: Section[];
  courseId?: string;
}

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d60f2898`;

const isValidUUID = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}

export function VideoLibrary({ sections = [], courseId }: VideoLibraryProps) {
  const [query, setQuery] = useState('');
  const [libraryVideos, setLibraryVideos] = useState<LibraryVideo[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReal = isValidUUID(courseId);

  const loadLibraryVideos = useCallback(async () => {
    if (!isReal) return;
    setLoadingLibrary(true);
    try {
      const res = await fetch(`${BASE_URL}/courses/${courseId}/video-library`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await res.json();
      if (data.success) {
        setLibraryVideos(data.videos || []);
      } else {
        console.error('Failed to load video library:', data.error);
      }
    } catch (err) {
      console.error('Failed to load video library:', err);
    } finally {
      setLoadingLibrary(false);
    }
  }, [courseId, isReal]);

  useEffect(() => {
    loadLibraryVideos();
  }, [loadLibraryVideos]);

  const handleUploadClick = () => {
    if (!isReal) {
      alert('Save the course first to enable video uploads.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isReal) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadFileName(file.name);

    try {
      // Step 1 — get a signed upload URL from the server
      const urlRes = await fetch(`${BASE_URL}/courses/${courseId}/video-library/upload-url`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      const urlData = await urlRes.json();
      if (!urlData.success) throw new Error(urlData.error || 'Failed to get upload URL');

      const { signedUrl, path: storagePath } = urlData;

      // Step 2 — upload directly to Supabase Storage via XHR (for progress)
      await uploadWithProgress(signedUrl, file, setUploadProgress);

      // Step 3 — save metadata to KV store
      const metaRes = await fetch(`${BASE_URL}/courses/${courseId}/video-library`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          storagePath,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });
      const metaData = await metaRes.json();
      if (!metaData.success) throw new Error(metaData.error || 'Failed to save video metadata');

      // Step 4 — prepend to local state
      setLibraryVideos((prev) => [metaData.video, ...prev]);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err: any) {
      console.error('Video upload error:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Merge library videos + section activity videos
  const allVideos = useMemo<DisplayVideo[]>(() => {
    const libVids: DisplayVideo[] = libraryVideos.map((v) => ({
      id: v.id,
      title: v.title,
      fileName: v.fileName,
      videoUrl: v.signedUrl ?? undefined,
      type: 'video',
      source: 'library',
      sectionTitle: 'Video Library',
      fileSize: v.fileSize,
      uploadedAt: v.uploadedAt,
    }));

    const sectionVids: DisplayVideo[] = [];
    sections.forEach((section) => {
      section.activities.forEach((activity) => {
        if (activity.type === 'video' || activity.type === 'youtube') {
          sectionVids.push({
            id: activity.id,
            title: activity.title,
            fileName: activity.fileName,
            videoUrl: activity.videoUrl,
            youtubeUrl: activity.youtubeUrl,
            type: activity.type,
            source: 'section',
            sectionTitle: section.title,
          });
        }
      });
    });

    return [...libVids, ...sectionVids];
  }, [libraryVideos, sections]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allVideos;
    const q = query.toLowerCase();
    return allVideos.filter((v) => v.title.toLowerCase().includes(q));
  }, [allVideos, query]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Video Library</h3>
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? 'Uploading…' : 'Upload Video'}
        </button>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Upload progress / status */}
      {uploading && (
        <div className="mb-5 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-teal-800 truncate max-w-[80%]">{uploadFileName}</span>
            <span className="text-sm text-teal-700 font-semibold shrink-0">{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-teal-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div className="mb-5 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          <CheckCircle className="size-4 shrink-0" />
          <span>Video uploaded successfully!</span>
        </div>
      )}

      {uploadError && (
        <div className="mb-5 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="shrink-0 hover:text-red-600">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos…"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading skeleton */}
      {loadingLibrary && libraryVideos.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-gray-200 animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loadingLibrary && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Film className="size-12 text-gray-300 mb-4" />
          {allVideos.length === 0 ? (
            <>
              <p className="text-gray-500 font-medium mb-1">No videos yet</p>
              <p className="text-sm text-gray-400">
                {isReal
                  ? 'Click "Upload Video" to add your first video, or add a Video activity to a section.'
                  : 'Save the course to enable video uploads.'}
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium mb-1">No videos match "{query}"</p>
              <p className="text-sm text-gray-400">Try a different search term.</p>
            </>
          )}
        </div>
      )}

      {/* Video grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((video) => {
            const isYouTube = video.type === 'youtube';
            const thumbSrc =
              isYouTube && video.youtubeUrl
                ? `https://img.youtube.com/vi/${extractYouTubeId(video.youtubeUrl)}/mqdefault.jpg`
                : null;

            return (
              <div
                key={video.id}
                className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 relative flex items-center justify-center overflow-hidden">
                  {thumbSrc ? (
                    <img src={thumbSrc} alt={video.title} className="w-full h-full object-cover" />
                  ) : video.videoUrl ? (
                    <video
                      src={video.videoUrl}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                    />
                  ) : (
                    <PlayCircle className="size-12 text-gray-300 group-hover:text-teal-500 transition-colors" />
                  )}

                  {/* Hover play overlay */}
                  {(video.videoUrl || thumbSrc) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                      <PlayCircle className="size-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  )}

                  {/* Source badge */}
                  {video.source === 'library' && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-teal-600 text-white text-xs rounded font-medium">
                      Library
                    </span>
                  )}
                  {isYouTube && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded font-medium">
                      YouTube
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4
                    className="font-medium text-gray-900 mb-1 truncate"
                    title={video.title}
                  >
                    {video.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate max-w-[70%]" title={video.sectionTitle}>
                      {video.sectionTitle}
                    </span>
                    <span className="shrink-0">
                      {video.fileSize
                        ? formatBytes(video.fileSize)
                        : video.fileName
                        ? video.fileName.split('.').pop()?.toUpperCase()
                        : null}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? '';
}
