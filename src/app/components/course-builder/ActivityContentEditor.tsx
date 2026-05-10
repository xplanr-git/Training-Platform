import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Music, Presentation, CheckSquare, Award, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Activity } from '@/app/types';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '/utils/supabase/client';

// Configure PDF.js worker globally
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface ActivityContentEditorProps {
  activity: Activity;
  onChange: (activity: Activity, forceSave?: boolean) => void;
  onSave?: () => void;
  onClose: () => void;
  getActivityIcon: (activity: Activity, size?: string) => JSX.Element;
  courseId?: string;
}

export function ActivityContentEditor({ activity, onChange, onSave, onClose, getActivityIcon, courseId }: ActivityContentEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const getActivityIconColor = (act: Activity) => {
    switch (act.type) {
      case 'video': return 'bg-indigo-600';
      case 'pdf': return 'bg-indigo-600';
      case 'audio': return 'bg-indigo-600';
      case 'presentation': return 'bg-indigo-600';
      case 'live-session': return 'bg-emerald-600';
      case 'quiz': return 'bg-gray-700';
      default: return 'bg-gray-600';
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      // sanitize file name
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = courseId 
        ? `${courseId}/${Date.now()}-${cleanFileName}`
        : `${Date.now()}-${cleanFileName}`;
      
      let uploadSuccess = false;
      let publicUrl = '';
      let error = null;

      // 1. Try uploading to 'course-content' bucket
      try {
        const { data, error: uploadErr } = await supabase.storage
          .from('course-content')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadErr && data) {
          uploadSuccess = true;
          const { data: { publicUrl: url } } = supabase.storage
            .from('course-content')
            .getPublicUrl(fileName);
          publicUrl = url;
        } else {
          error = uploadErr;
        }
      } catch (e) {
        error = e;
      }

      // 2. If bucket missing, try to create it and retry
      if (!uploadSuccess && error && (error.message?.includes('Bucket not found') || error.message?.includes('not found'))) {
        try {
          // Attempt to create bucket
          const { error: createError } = await supabase.storage.createBucket('course-content', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf']
          });

          if (createError) {
             console.error("Bucket creation failed:", createError);
             toast.warning("Bucket 'course-content' not found", {
               description: "Attempted to create it automatically but failed. Please create a public bucket named 'course-content' in your Supabase dashboard."
             });
          }

          if (!createError) {
            // Retry upload
            const { data: retryData, error: retryError } = await supabase.storage
              .from('course-content')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });
            
            if (!retryError && retryData) {
              uploadSuccess = true;
              const { data: { publicUrl: url } } = supabase.storage
                .from('course-content')
                .getPublicUrl(fileName);
              publicUrl = url;
            }
          }
        } catch (e) {
          console.error("Bucket creation failed:", e);
        }
      }

      // 3. Fallback: Try 'public' bucket if 'course-content' failed
      if (!uploadSuccess) {
        try {
          const { data: publicData, error: publicError } = await supabase.storage
            .from('public')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (!publicError && publicData) {
            uploadSuccess = true;
            const { data: { publicUrl: url } } = supabase.storage
              .from('public')
              .getPublicUrl(fileName);
            publicUrl = url;
          } else {
             console.error("Storage upload failed (primary & fallback):", error);
             // Do NOT overwrite the original 'error' with 'publicError'.
             // We want to show the user the reason why the PRIMARY bucket ('course-content') failed.
             // e.g., if 'course-content' exists but has RLS issues, we want to show "Permission denied",
             // not "Bucket not found" from the fallback 'public' bucket.
          }
        } catch (e) {
          console.error("Public bucket fallback failed:", e);
        }
      }

      // STRICT MODE: No fallback to database storage allowed.
      // If storage upload fails, we must return null and show error.
      if (!uploadSuccess) {
        const errorMessage = error?.message || "Storage upload failed";
        let description = "Could not upload file to storage bucket. Please try again or contact support.";
        
        if (errorMessage.includes("Bucket not found")) {
            description = "Missing 'course-content' bucket. Please create it in your Supabase dashboard (Storage > New Bucket > Public).";
        } else if (errorMessage.includes("violates row-level security")) {
            description = "Permission denied. Please check your Supabase Storage RLS policies.";
        }

        toast.error(`Upload failed: ${errorMessage}`, {
          description: description
        });
        return null;
      }

      return publicUrl;
    } catch (error: any) {
      console.error('Error in file handling:', error);
      toast.error("Upload failed", {
        description: error.message || "Could not upload file."
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center size-12 ${getActivityIconColor(activity)} rounded-lg flex-shrink-0`}>
              {getActivityIcon(activity, 'size-6 text-white')}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{activity.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Configure your activity content</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Title</label>
            <input
              type="text"
              value={activity.title}
              onChange={(e) => onChange({ ...activity, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter activity title"
            />
          </div>

          {/* Description Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={activity.description?.startsWith('data:') ? '(PDF Data Stored in Description)' : (activity.description || '')}
              disabled={activity.description?.startsWith('data:')}
              onChange={(e) => onChange({ ...activity, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Enter activity description"
            />
          </div>

          {/* Activity Type Specific Content */}
          {(activity.type === 'video') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                  <Upload className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop your video file here, or click to browse</p>
                  <p className="text-xs text-gray-500">Supported formats: MP4, MOV, AVI, WebM (Max 500MB)</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // 1. Get metadata
                          const video = document.createElement('video');
                          video.preload = 'metadata';
                          
                          // Create a promise to get duration
                          const getDuration = new Promise<string>((resolve) => {
                            video.onloadedmetadata = () => {
                              window.URL.revokeObjectURL(video.src);
                              const duration = Math.round(video.duration);
                              const minutes = Math.floor(duration / 60);
                              const seconds = duration % 60;
                              resolve(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                            };
                            video.onerror = () => resolve('00:00');
                          });
                          
                          video.src = URL.createObjectURL(file);
                          const duration = await getDuration;

                          // 2. Upload
                          let publicUrl = await handleFileUpload(file);
                          
                          if (publicUrl) {
                            onChange({
                              ...activity,
                              fileName: file.name,
                              videoUrl: publicUrl,
                              duration
                            }, true);
                          }
                        } catch (error) {
                          console.error('Error handling video:', error);
                        }
                      }
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-teal-700">
                    Choose File
                  </label>
                </div>
                {(activity.fileName || (activity as any).file_name) && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">Selected: {activity.fileName || (activity as any).file_name}</p>
                    {activity.duration && activity.duration !== '00:00' && (
                      <p className="text-sm text-teal-600 font-medium">Duration: {activity.duration}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or enter video URL</label>
                <input
                  type="url"
                  value={activity.videoUrl || ''}
                  onChange={(e) => onChange({ ...activity, videoUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (MM:SS)</label>
                <input
                  type="text"
                  value={activity.duration || '00:00'}
                  onChange={(e) => {
                    // Validate format MM:SS
                    const value = e.target.value;
                    if (/^\d{0,2}:?\d{0,2}$/.test(value) || value === '') {
                      onChange({ ...activity, duration: value });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="05:30"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically detected from uploaded videos, or enter manually</p>
              </div>
            </div>
          )}

          {activity.type === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PDF File</label>
              
              {uploadError && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex gap-3 items-start">
                  <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Upload Failed</p>
                    <p>{uploadError}</p>
                  </div>
                </div>
              )}

              {!(activity.fileName || (activity as any).file_name || activity.pdfUrl || (activity as any).pdf_url || activity.fileUrl || (activity as any).file_url || (activity.content && activity.content.startsWith('http'))) && !isUploading ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                  <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop your PDF file here, or click to browse</p>
                  <p className="text-xs text-gray-500">Supported format: PDF (Max 50MB)</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setIsUploading(true);
                          
                          // 1. Get temporary URL for page counting
                          const tempUrl = URL.createObjectURL(file);
                          let numPages = 0;
                          
                          try {
                            console.log('Counting PDF pages for:', file.name);
                            const loadingTask = pdfjsLib.getDocument(tempUrl);
                            const pdf = await loadingTask.promise;
                            numPages = pdf.numPages;
                            console.log('PDF Page count:', numPages);
                          } catch (err) {
                            console.warn('Could not count pages:', err);
                          } finally {
                            // Clean up blob URL
                            URL.revokeObjectURL(tempUrl);
                          }

                          // 2. Upload to storage
                          const publicUrl = await handleFileUpload(file);
                          
                          if (publicUrl) {
                            const isBase64 = publicUrl.startsWith('data:');
                            
                            // STRICT PERSISTENCE ENFORCEMENT:
                            // If storage failed and we are falling back to Base64 (database storage),
                            // we enforce a reasonable size limit to prevent request timeouts.
                            // We've increased this to 7MB to ensure that files passing the 4.5MB check (which become ~6MB Base64) are accepted.
                            if (isBase64 && publicUrl.length > 7 * 1024 * 1024) { // 7MB Limit
                              toast.error("Save rejected: File too large", {
                                description: "Storage server is unavailable and file exceeds database backup limit (7MB). Please contact support or try a smaller file."
                              });
                              // CRITICAL: Do not update state/UI if we know persistence is likely to fail
                              return;
                            }

                            // Sanitize filename
                            const cleanFileName = file.name.replace(/[^\x00-\x7F]/g, "").replace(/[^a-zA-Z0-9. -_]/g, "_");

                            // We include both camelCase and snake_case to ensure backend compatibility
                            // as Supabase/Postgres often expects snake_case while frontend uses camelCase.
                            onChange({
                              ...activity,
                              type: 'pdf',
                              fileName: cleanFileName || file.name,
                              // @ts-ignore - Support snake_case for backend
                              file_name: cleanFileName || file.name,
                              pdfUrl: publicUrl,
                              // @ts-ignore - Support snake_case for backend
                              pdf_url: publicUrl,
                              // UNIVERSAL PERSISTENCE: Save to all possible fields to ensure backend persistence
                              fileUrl: publicUrl,
                              // @ts-ignore
                              file_url: publicUrl,
                              content: publicUrl,
                              embedCode: publicUrl,
                              // Only use description for storage if it's Base64 (database storage fallback)
                              description: isBase64 ? publicUrl : (activity.description || ''),
                              
                              pageCount: numPages || undefined,
                              // @ts-ignore - Support snake_case for backend
                              page_count: numPages || undefined
                            }, true);
                            
                            if (isBase64) {
                              toast.info("Saved to database backup", {
                                description: "Storage was unavailable. File saved to database (using multiple fields for redundancy)."
                              });
                            } else {
                              toast.success("PDF uploaded successfully");
                            }
                          }
                        } catch (error) {
                          console.error('Error handling PDF:', error);
                          toast.error("Failed to save PDF");
                        } finally {
                          setIsUploading(false);
                          e.target.value = '';
                        }
                      }
                    }}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-teal-700">
                    Choose File
                  </label>
                </div>
              ) : isUploading ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
                  <Loader2 className="size-12 text-teal-600 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">Uploading PDF...</p>
                  <p className="text-sm text-gray-500">Please wait while we process your file.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        Selected: {activity.fileName || (activity as any).file_name}
                      </p>
                      <div className="flex items-center gap-2">
                         <label className="text-sm font-medium text-gray-700">Pages:</label>
                         <input
                           type="number"
                           min="1"
                           value={activity.pageCount || (activity as any).page_count || ''}
                           onChange={(e) => {
                             const count = parseInt(e.target.value) || undefined;
                             onChange({
                               ...activity,
                               pageCount: count,
                               // @ts-ignore - Support snake_case for backend
                               page_count: count
                             }, true);
                           }}
                           className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                         />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={activity.pdfUrl || (activity as any).pdf_url || activity.fileUrl || (activity as any).file_url || activity.content || activity.embedCode || (activity.description?.startsWith('data:') ? activity.description : '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
                        title="Open PDF in new tab"
                      >
                        <ExternalLink className="size-4" />
                        Open
                      </a>
                      <button 
                        onClick={() => onChange({
                        ...activity, 
                        fileName: undefined, 
                        // @ts-ignore - Support snake_case for backend
                        file_name: undefined,
                        pdfUrl: undefined, 
                        // @ts-ignore - Support snake_case for backend
                        pdf_url: undefined,
                        // Clear content fallback
                        content: undefined,
                        embedCode: undefined,
                        description: activity.description?.startsWith('data:') ? undefined : activity.description,
                        pageCount: undefined,
                        // @ts-ignore - Support snake_case for backend
                        page_count: undefined
                      })}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    >
                      <X className="size-4" />
                      Remove PDF
                    </button>
                    </div>
                  </div>
                  {(activity.pdfUrl || (activity as any).pdf_url || activity.fileUrl || (activity as any).file_url || activity.content || activity.embedCode || (activity.description?.startsWith('data:') ? activity.description : undefined)) && (
                    <div className="h-[600px] w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-900">
                      <iframe
                        src={activity.pdfUrl || (activity as any).pdf_url || activity.fileUrl || (activity as any).file_url || activity.content || activity.embedCode || (activity.description?.startsWith('data:') ? activity.description : undefined)}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activity.type === 'audio' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                <Music className="size-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Drag and drop your audio file here, or click to browse</p>
                <p className="text-xs text-gray-500">Supported formats: MP3, WAV, AAC, OGG (Max 100MB)</p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      let publicUrl = await handleFileUpload(file);
                      
                      if (publicUrl) {
                        onChange({
                          ...activity,
                          fileName: file.name,
                          audioUrl: publicUrl
                        }, true);
                      }
                    }
                  }}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-teal-700">
                  Choose File
                </label>
              </div>
              {(activity.fileName || (activity as any).file_name) && (
                <p className="text-sm text-gray-600 mt-2">Selected: {activity.fileName || (activity as any).file_name}</p>
              )}
            </div>
          )}

          {activity.type === 'presentation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Presentation File</label>
              
              {!(activity.fileName || (activity as any).file_name || activity.presentationUrl) && !isUploading ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                  <Presentation className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop your presentation file here, or click to browse</p>
                  <p className="text-xs text-gray-500">Supported formats: PPT, PPTX, ODP, PDF (Max 100MB)</p>
                  <input
                    type="file"
                    accept=".ppt,.pptx,.odp,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setIsUploading(true);
                          let publicUrl = await handleFileUpload(file);
                          
                          if (publicUrl) {
                            onChange({
                              ...activity,
                              fileName: file.name,
                              // @ts-ignore
                              file_name: file.name,
                              presentationUrl: publicUrl
                            }, true);
                          }
                        } catch (error) {
                          console.error('Error uploading presentation:', error);
                          toast.error("Failed to upload presentation");
                        } finally {
                          setIsUploading(false);
                          e.target.value = '';
                        }
                      }
                    }}
                    className="hidden"
                    id="presentation-upload"
                  />
                  <label htmlFor="presentation-upload" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-teal-700">
                    Choose File
                  </label>
                </div>
              ) : isUploading ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
                  <Loader2 className="size-12 text-teal-600 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">Uploading Presentation...</p>
                  <p className="text-sm text-gray-500">Please wait while we process your file.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        Selected: {activity.fileName || (activity as any).file_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={activity.presentationUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
                      >
                        <ExternalLink className="size-4" />
                        Download
                      </a>
                      <button 
                        onClick={() => onChange({
                          ...activity, 
                          fileName: undefined, 
                          // @ts-ignore
                          file_name: undefined,
                          presentationUrl: undefined
                        })}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                      >
                        <X className="size-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activity.type === 'article' || activity.type === 'text') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Article Content</label>
              <textarea
                value={activity.content || ''}
                onChange={(e) => onChange({ ...activity, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 h-64 font-mono text-sm"
                placeholder="Write your article content here... (Markdown supported)"
              />
              <p className="text-xs text-gray-500 mt-2">You can use Markdown formatting</p>
            </div>
          )}

          {activity.type === 'youtube' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
              <input
                type="url"
                value={activity.videoUrl || ''}
                onChange={(e) => onChange({ ...activity, videoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-500 mt-2">Enter the direct link to the YouTube video.</p>
            </div>
          )}

          {activity.type === 'embed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Embed Code or URL</label>
              <textarea
                value={activity.embedCode || ''}
                onChange={(e) => onChange({ ...activity, embedCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 h-32 font-mono text-sm"
                placeholder='<iframe src="..."></iframe> or https://...'
              />
              <p className="text-xs text-gray-500 mt-2">Paste embed code or URL from YouTube, Vimeo, Google Forms, etc.</p>
            </div>
          )}

          {(activity.type === 'quiz' || activity.type === 'exam' || activity.type === 'survey') && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <CheckSquare className="size-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Quiz Builder</h4>
              <p className="text-sm text-gray-500 mb-4">Create questions, set correct answers, and configure scoring</p>
              <button className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Open Quiz Builder
              </button>
            </div>
          )}

          {activity.type === 'discussion' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discussion Prompt</label>
              <textarea
                value={activity.content || ''}
                onChange={(e) => onChange({ ...activity, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 h-32"
                placeholder="What question or topic would you like students to discuss?"
              />
            </div>
          )}

          {activity.type === 'certificate' && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Award className="size-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Certificate Designer</h4>
              <p className="text-sm text-gray-500 mb-4">Design your certificate template and set completion requirements</p>
              <button className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Open Certificate Designer
              </button>
            </div>
          )}

          {activity.type === 'live-session' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Date & Time</label>
                <input
                  type="datetime-local"
                  value={activity.meetingDate || ''}
                  onChange={(e) => onChange({ ...activity, meetingDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter meeting URL</label>
                <input
                  type="url"
                  value={activity.meetingUrl || ''}
                  onChange={(e) => onChange({ ...activity, meetingUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Notes</label>
                <textarea
                  value={activity.content || ''}
                  onChange={(e) => onChange({ ...activity, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 h-24"
                  placeholder="Add any notes or instructions for the live session..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className={`px-4 py-2 text-gray-700 hover:text-gray-900 font-medium ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (onSave) {
                  onSave();
                } else {
                  onClose();
                }
              }}
              disabled={isUploading}
              className={`px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading && <Loader2 className="size-4 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}