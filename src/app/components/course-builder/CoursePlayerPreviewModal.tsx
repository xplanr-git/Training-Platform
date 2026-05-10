import React, { useState, useCallback, useEffect } from 'react';
import {
  X, ChevronDown, ChevronRight, CheckCircle2, Circle, PlayCircle,
  FileText, HelpCircle, Headphones, BookOpen, Lock, Menu,
  Video, Presentation, MessageSquare, Award, ClipboardList,
  Youtube, Music, MonitorPlay, Calendar, BarChart2, FileQuestion,
  ChevronLeft, ChevronRight as ChevronRightIcon, Users,
} from 'lucide-react';
import { CoursePlayerSettings, defaultPlayerSettings, SKIN_CONFIG } from './coursePlayerSettings';

interface Activity {
  id: string;
  type: string;
  title: string;
  duration?: string;
  content?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  audioUrl?: string;
  soundcloudUrl?: string;
  pdfUrl?: string;
  fileUrl?: string;
  fileName?: string;
  presentationUrl?: string;
  scormUrl?: string;
  embedCode?: string;
  meetingUrl?: string;
  meetingDate?: string;
  meetingProvider?: string;
  description?: string;
}

interface Section {
  id: string;
  title: string;
  isFree: boolean;
  isExpanded: boolean;
  activities: Activity[];
}

interface CoursePlayerPreviewModalProps {
  course: { title: string; description?: string };
  sections: Section[];
  onClose: () => void;
  playerSettings?: CoursePlayerSettings;
}

function activityIcon(type: string, cls = 'size-4 flex-shrink-0') {
  switch (type) {
    case 'video':        return <PlayCircle className={cls} />;
    case 'youtube':      return <Youtube className={cls} />;
    case 'text':
    case 'article':
    case 'ebook':        return <FileText className={cls} />;
    case 'quiz':
    case 'exam':         return <HelpCircle className={cls} />;
    case 'audio':
    case 'soundcloud':   return <Headphones className={cls} />;
    case 'pdf':          return <BookOpen className={cls} />;
    case 'presentation': return <Presentation className={cls} />;
    case 'discussion':   return <MessageSquare className={cls} />;
    case 'certificate':  return <Award className={cls} />;
    case 'assignment':   return <ClipboardList className={cls} />;
    case 'survey':       return <BarChart2 className={cls} />;
    case 'live-session': return <Calendar className={cls} />;
    case 'scorm':        return <MonitorPlay className={cls} />;
    default:             return <FileText className={cls} />;
  }
}

function ContentArea({ activity, course }: { activity: Activity | null; course: { title: string } }) {
  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
        <BookOpen className="size-16 opacity-30" />
        <p className="text-lg font-medium text-gray-500">Select a lesson to begin</p>
        <p className="text-sm text-gray-400">Choose a lesson from the sidebar to start learning</p>
      </div>
    );
  }

  if (activity.type === 'youtube') {
    const raw = activity.youtubeUrl ?? '';
    const embedUrl = raw.includes('embed/')
      ? raw
      : raw.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');
    return (
      <div className="flex flex-col h-full">
        <div className="bg-black flex-1 flex items-center justify-center">
          {embedUrl ? (
            <iframe src={embedUrl} className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <div className="size-20 rounded-full bg-white/10 flex items-center justify-center">
                <Youtube className="size-10 text-white/80" />
              </div>
              <p className="text-sm">No YouTube URL provided</p>
            </div>
          )}
        </div>
        <div className="bg-white px-8 py-5 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{activity.title}</h2>
          {activity.duration && <p className="text-sm text-gray-500">Duration: {activity.duration}</p>}
        </div>
      </div>
    );
  }

  if (activity.type === 'video') {
    const src = activity.videoUrl ?? activity.fileUrl ?? '';
    return (
      <div className="flex flex-col h-full">
        <div className="bg-black flex-1 flex items-center justify-center">
          {src ? (
            <video key={src} src={src} controls className="w-full h-full object-contain" controlsList="nodownload" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <div className="size-20 rounded-full bg-white/10 flex items-center justify-center">
                <PlayCircle className="size-10 text-white/80" />
              </div>
              <p className="text-sm">Video preview not available</p>
            </div>
          )}
        </div>
        <div className="bg-white px-8 py-5 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{activity.title}</h2>
          {activity.duration && <p className="text-sm text-gray-500">Duration: {activity.duration}</p>}
        </div>
      </div>
    );
  }

  if (activity.type === 'text' || activity.type === 'article' || activity.type === 'ebook') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-8 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{activity.title}</h1>
          {activity.content ? (
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: activity.content }} />
          ) : (
            <div className="space-y-4 text-gray-500">
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-4/5" />
              <p className="text-sm italic text-gray-400 pt-4">No content added yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activity.type === 'quiz' || activity.type === 'exam') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-8 py-10">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-sm font-medium rounded-full mb-4">
              <HelpCircle className="size-3.5" />
              {activity.type === 'exam' ? 'Exam' : 'Quiz'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <p className="font-medium text-gray-800 mb-3">Sample question {n}</p>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <label key={opt} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white cursor-pointer">
                      <div className="size-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Option {opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors mt-4">
              Submit {activity.type === 'exam' ? 'Exam' : 'Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activity.type === 'audio') {
    const src = activity.audioUrl ?? activity.fileUrl ?? '';
    return (
      <div className="flex flex-col h-full items-center justify-center gap-8 p-8">
        <div className="size-32 rounded-full bg-teal-50 flex items-center justify-center">
          <Headphones className="size-16 text-teal-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{activity.title}</h2>
          {activity.duration && <p className="text-sm text-gray-500 mb-4">Duration: {activity.duration}</p>}
        </div>
        {src ? (
          <audio key={src} src={src} controls className="w-full max-w-lg" controlsList="nodownload" />
        ) : (
          <p className="text-sm text-gray-400">No audio file provided.</p>
        )}
      </div>
    );
  }

  if (activity.type === 'soundcloud') {
    const raw = activity.soundcloudUrl ?? activity.embedCode ?? '';
    const isEmbed = raw.startsWith('<iframe');
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 p-8">
        <Music className="size-16 text-orange-400" />
        <h2 className="text-xl font-semibold text-gray-900">{activity.title}</h2>
        {isEmbed ? (
          <div className="w-full max-w-xl" dangerouslySetInnerHTML={{ __html: raw }} />
        ) : raw ? (
          <iframe
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(raw)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`}
            className="w-full max-w-xl border-0" height={166} scrolling="no" allow="autoplay"
          />
        ) : (
          <p className="text-sm text-gray-400">No SoundCloud URL provided.</p>
        )}
      </div>
    );
  }

  if (activity.type === 'pdf') {
    const src = activity.pdfUrl ?? activity.fileUrl ?? '';
    return (
      <div className="flex flex-col h-full">
        {src ? (
          <iframe src={src} className="flex-1 w-full border-0" title={activity.title} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
            <BookOpen className="size-16 text-gray-300" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{activity.title}</h2>
              <p className="text-sm text-gray-400">No PDF provided.</p>
            </div>
          </div>
        )}
        <div className="bg-white px-8 py-3 border-t border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{activity.title}</h2>
        </div>
      </div>
    );
  }

  if (activity.type === 'presentation') {
    const src = activity.presentationUrl ?? activity.fileUrl ?? '';
    return (
      <div className="flex flex-col h-full">
        {src ? (
          <iframe src={src} className="flex-1 w-full border-0" title={activity.title} allowFullScreen />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
            <Presentation className="size-16 text-gray-300" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{activity.title}</h2>
              <p className="text-sm text-gray-400">No presentation URL provided.</p>
            </div>
          </div>
        )}
        <div className="bg-white px-8 py-3 border-t border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{activity.title}</h2>
        </div>
      </div>
    );
  }

  if (activity.type === 'embed' || activity.type === 'scorm') {
    const src = activity.scormUrl ?? activity.embedCode ?? activity.fileUrl ?? '';
    const isHtmlEmbed = src.startsWith('<');
    return (
      <div className="flex flex-col h-full">
        {src && !isHtmlEmbed ? (
          <iframe src={src} className="flex-1 w-full border-0" title={activity.title} allowFullScreen />
        ) : src && isHtmlEmbed ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full" dangerouslySetInnerHTML={{ __html: src }} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
            <MonitorPlay className="size-16 text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900">{activity.title}</h2>
            <p className="text-sm text-gray-400">No embed content provided.</p>
          </div>
        )}
        <div className="bg-white px-8 py-3 border-t border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{activity.title}</h2>
        </div>
      </div>
    );
  }

  if (activity.type === 'discussion') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-8 py-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full mb-4">
            <MessageSquare className="size-3.5" /> Discussion
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{activity.title}</h1>
          {activity.content && (
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: activity.content }} />
          )}
          <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
            <MessageSquare className="size-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Discussion threads will appear here in the live course.</p>
          </div>
        </div>
      </div>
    );
  }

  if (activity.type === 'assignment' || activity.type === 'survey') {
    const isAssignment = activity.type === 'assignment';
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-8 py-10">
          <div className={`${isAssignment ? 'bg-indigo-50 border-indigo-100' : 'bg-purple-50 border-purple-100'} rounded-xl p-8 text-center border`}>
            {isAssignment
              ? <ClipboardList className="size-12 text-indigo-400 mx-auto" />
              : <BarChart2 className="size-12 text-purple-400 mx-auto" />}
            <h2 className="text-xl font-semibold text-gray-900 mt-4 mb-2">{activity.title}</h2>
            <p className="text-sm text-gray-400">
              {isAssignment ? 'Assignment submission form will appear here.' : 'Survey questions will appear here.'}
            </p>
            <button className={`mt-6 px-6 py-2.5 ${isAssignment ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg text-sm font-medium transition-colors`}>
              {isAssignment ? 'Submit Assignment' : 'Take Survey'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activity.type === 'live-session') {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6">
        <div className="size-24 rounded-full bg-blue-50 flex items-center justify-center">
          <Calendar className="size-12 text-blue-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{activity.title}</h2>
          {activity.meetingDate && <p className="text-sm text-gray-500 mb-1">Scheduled: {activity.meetingDate}</p>}
          {activity.meetingProvider && <p className="text-sm text-gray-500 mb-4">via {activity.meetingProvider}</p>}
          {activity.meetingUrl ? (
            <a href={activity.meetingUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Join Session
            </a>
          ) : (
            <p className="text-sm text-gray-400">Live session details will be shown here.</p>
          )}
        </div>
      </div>
    );
  }

  if (activity.type === 'certificate') {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6">
        <div className="size-24 rounded-full bg-yellow-50 flex items-center justify-center">
          <Award className="size-12 text-yellow-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{activity.title}</h2>
          <p className="text-sm text-gray-400 mb-4">Complete all course activities to claim your certificate.</p>
          <button className="px-6 py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
            Claim Certificate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{activity.title}</h1>
        {activity.content ? (
          <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: activity.content }} />
        ) : (
          <p className="text-gray-500">This activity will be displayed in the live course player.</p>
        )}
      </div>
    </div>
  );
}

export function CoursePlayerPreviewModal({
  course,
  sections,
  onClose,
  playerSettings = defaultPlayerSettings,
}: CoursePlayerPreviewModalProps) {
  const s = playerSettings;
  const skin = SKIN_CONFIG[s.selectedSkin];

  // Sidebar visibility: force-hide for one-activity skins; otherwise respect setting
  const sidebarShouldHide = skin.forceSidebarHidden || s.hideLeftPlayer;
  const [sidebarOpen, setSidebarOpen] = useState(!sidebarShouldHide);

  // Re-sync when settings change
  useEffect(() => {
    setSidebarOpen(!sidebarShouldHide);
  }, [sidebarShouldHide]);

  // Section expansion: either all expanded (expandSections) or only first
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    sections.forEach((sec, i) => { init[sec.id] = s.expandSections || i === 0; });
    return init;
  });

  // Re-init when expandSections setting changes
  useEffect(() => {
    const init: Record<string, boolean> = {};
    sections.forEach((sec, i) => { init[sec.id] = s.expandSections || i === 0; });
    setExpandedSections(init);
  }, [s.expandSections, sections]);

  const [sidebarTab, setSidebarTab] = useState<'path' | 'discussion' | 'learners'>('path');

  const firstActivity = sections.flatMap(sec => sec.activities)[0] ?? null;
  const [activeActivity, setActiveActivity] = useState<Activity | null>(firstActivity);

  const allActivities = sections.flatMap(sec => sec.activities);
  const activeIndex = activeActivity ? allActivities.findIndex(a => a.id === activeActivity.id) : -1;
  const prevActivity = activeIndex > 0 ? allActivities[activeIndex - 1] : null;
  const nextActivity = activeIndex < allActivities.length - 1 ? allActivities[activeIndex + 1] : null;

  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) =>
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const markComplete = useCallback(() => {
    if (activeActivity) {
      setCompleted(prev => new Set([...prev, activeActivity.id]));
      if (nextActivity) setActiveActivity(nextActivity);
    }
  }, [activeActivity, nextActivity]);

  const totalActivities = allActivities.length;
  const completedCount = completed.size;
  const progress = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;

  // Sequential/prerequisites: can only go next if current is completed
  const canGoNext = s.courseNav === 'free'
    ? !!nextActivity
    : !!nextActivity && (activeActivity ? completed.has(activeActivity.id) : false);

  // Section label helper
  const sectionLabel = (index: number) => {
    if (!s.numberSections) return '';
    const n = s.startFrom00 ? index : index + 1;
    return `${String(n).padStart(2, '0')}. `;
  };

  // Navigation bar
  const NavBar = () => {
    if (s.navBarPosition === 'hidden') return null;
    return (
      <div className={`flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white flex-shrink-0 ${skin.dark ? 'border-gray-700 bg-gray-900' : ''}`}>
        <button
          onClick={() => prevActivity && setActiveActivity(prevActivity)}
          disabled={!prevActivity}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            prevActivity
              ? skin.dark
                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              : skin.dark
                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="size-4" />
          {s.prevText || 'Previous'}
        </button>

        <button
          onClick={markComplete}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          {activeActivity && completed.has(activeActivity.id) ? (
            <><CheckCircle2 className="size-4" /> Completed</>
          ) : (
            <><CheckCircle2 className="size-4" /> Mark as complete</>
          )}
        </button>

        <button
          onClick={() => nextActivity && setActiveActivity(nextActivity)}
          disabled={!canGoNext}
          title={!canGoNext && s.courseNav !== 'free' ? 'Complete this activity first to proceed' : undefined}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            canGoNext
              ? skin.dark
                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              : skin.dark
                ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
          }`}
        >
          {s.nextText || 'Next'}
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    );
  };

  // Top bar
  const topBarBgClass = skin.topbarBg;
  const topBarTextClass = skin.topbarText;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${skin.dark ? 'bg-gray-900' : 'bg-white'}`} style={{ fontFamily: 'inherit' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between ${topBarBgClass} ${topBarTextClass} px-4 py-0 h-12 flex-shrink-0`}>
        <div className="flex items-center gap-3">
          {/* Back button */}
          {s.backButton !== 'none' && (
            <button className={`p-1.5 rounded transition-colors ${skin.dark ? 'hover:bg-white/10' : 'hover:bg-black/10'} text-sm flex items-center gap-1`}>
              <ChevronLeft className="size-4" />
              <span className="text-xs hidden sm:inline">Back</span>
            </button>
          )}
          {/* Sidebar toggle — only if sidebar is possible */}
          {!skin.forceSidebarHidden && (
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className={`p-1.5 rounded transition-colors ${skin.dark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              title="Toggle sidebar"
            >
              <Menu className="size-4" />
            </button>
          )}
          {s.showCourseName && (
            <span className="font-semibold text-sm truncate max-w-xs">{course.title}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Progress bar */}
          {s.showProgressBar && (
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-32 h-1.5 rounded-full overflow-hidden ${skin.dark ? 'bg-white/10' : 'bg-black/10'}`}>
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`text-xs ${skin.dark ? 'text-white/80' : 'text-black/60'}`}>{progress}% complete</span>
            </div>
          )}
          <div className={`w-px h-5 ${skin.dark ? 'bg-white/20' : 'bg-black/10'}`} />
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-400 text-amber-900 rounded text-xs font-semibold">
            PREVIEW MODE
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded transition-colors ml-1 ${skin.dark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
            title="Close preview"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Top nav bar (if position = top) ─────────────────────────────── */}
      {s.navBarPosition === 'top' && (
        <div className={`flex-shrink-0 border-b ${skin.dark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <NavBar />
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ────────────────────────────────────────────── */}
        {!skin.forceSidebarHidden && (
          <div
            className={`${skin.sidebarBg} ${skin.sidebarText} flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-72' : 'w-0'}`}
          >
            <div className="flex-1 overflow-y-auto">
              {/* Tabs */}
              <div className={`flex border-b ${skin.sidebarBorder}`}>
                <button
                  onClick={() => setSidebarTab('path')}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${
                    sidebarTab === 'path'
                      ? `border-current ${skin.sidebarText}`
                      : `border-transparent opacity-50 hover:opacity-80`
                  }`}
                >
                  Path
                </button>
                {s.showDiscussion && (
                  <button
                    onClick={() => setSidebarTab('discussion')}
                    className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${
                      sidebarTab === 'discussion'
                        ? `border-current ${skin.sidebarText}`
                        : `border-transparent opacity-50 hover:opacity-80`
                    }`}
                  >
                    Discussion
                  </button>
                )}
                {s.showAllLearners && (
                  <button
                    onClick={() => setSidebarTab('learners')}
                    className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${
                      sidebarTab === 'learners'
                        ? `border-current ${skin.sidebarText}`
                        : `border-transparent opacity-50 hover:opacity-80`
                    }`}
                  >
                    Learners
                  </button>
                )}
              </div>

              {/* Path tab */}
              {sidebarTab === 'path' && (
                sections.length === 0 ? (
                  <div className="p-6 text-center text-sm opacity-50">No sections added yet.</div>
                ) : (
                  sections.map((section, si) => (
                    <div key={section.id}>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${skin.sidebarHover}`}
                      >
                        <span className={`text-xs font-semibold uppercase tracking-wide text-left leading-tight ${
                          s.showCompleteSectionTitles ? '' : 'truncate'
                        } opacity-70`}>
                          {sectionLabel(si)}{section.title}
                        </span>
                        {expandedSections[section.id]
                          ? <ChevronDown className="size-3.5 opacity-50 flex-shrink-0" />
                          : <ChevronRight className="size-3.5 opacity-50 flex-shrink-0" />}
                      </button>

                      {expandedSections[section.id] && (
                        <div className="pb-1">
                          {section.activities.length === 0 ? (
                            <p className="px-4 py-2 text-xs italic opacity-30">No activities</p>
                          ) : (
                            section.activities.map(activity => {
                              const isActive = activeActivity?.id === activity.id;
                              const isDone = completed.has(activity.id);
                              // For sequential/prerequisites: lock activities that aren't yet reachable
                              const actIdx = allActivities.findIndex(a => a.id === activity.id);
                              const isLocked = s.courseNav !== 'free' && actIdx > 0 && !completed.has(allActivities[actIdx - 1]?.id ?? '');

                              return (
                                <button
                                  key={activity.id}
                                  onClick={() => !isLocked && setActiveActivity(activity)}
                                  disabled={isLocked}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-l-2 ${
                                    isActive
                                      ? `${skin.sidebarActive} ${skin.sidebarActiveBorder}`
                                      : `border-transparent ${skin.sidebarHover}`
                                  } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  <div className={`flex-shrink-0 ${isDone ? skin.completedColor : isActive ? skin.sidebarText : 'opacity-50'}`}>
                                    {isLocked
                                      ? <Lock className="size-4" />
                                      : isDone
                                        ? <CheckCircle2 className="size-4" />
                                        : activityIcon(activity.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs leading-snug ${s.showCompleteActivityTitles ? '' : 'truncate'} ${isActive ? 'font-medium' : 'opacity-70'}`}>
                                      {activity.title}
                                    </p>
                                    {activity.duration && activity.duration !== '00:00' && (
                                      <p className="text-[10px] opacity-40 mt-0.5">{activity.duration}</p>
                                    )}
                                    {s.showEbookReading && (activity.type === 'ebook' || activity.type === 'text' || activity.type === 'article') && activity.content && (
                                      <p className="text-[10px] opacity-40 mt-0.5">
                                        ~{Math.max(1, Math.ceil(activity.content.replace(/<[^>]*>/g, '').split(' ').length / 200))} min read
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {/* Discussion tab */}
              {sidebarTab === 'discussion' && s.showDiscussion && (
                <div className="p-6 text-center opacity-50 text-sm">
                  <MessageSquare className="size-8 mx-auto mb-2 opacity-40" />
                  Discussion will appear here in the live course.
                </div>
              )}

              {/* Learners tab */}
              {sidebarTab === 'learners' && s.showAllLearners && (
                <div className="p-6 text-center opacity-50 text-sm">
                  <Users className="size-8 mx-auto mb-2 opacity-40" />
                  Course learners will be listed here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Content area ────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col overflow-hidden ${skin.dark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="flex-1 overflow-hidden">
            <ContentArea activity={activeActivity} course={course} />
          </div>

          {/* Bottom navigation bar */}
          {s.navBarPosition === 'bottom' && <NavBar />}
        </div>
      </div>
    </div>
  );
}
