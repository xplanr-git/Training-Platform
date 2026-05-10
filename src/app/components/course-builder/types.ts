export interface Activity {
  id: string;
  type: 'video' | 'text' | 'quiz' | 'completion' | 'pdf' | 'audio' | 'presentation' | 'article' | 'embed' | 'discussion' | 'certificate' | 'live-session' | 'ebook' | 'exam' | 'assignment' | 'survey' | 'scorm' | 'youtube' | 'soundcloud';
  title: string;
  duration?: string;
  order?: number;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  description?: string;
  embedCode?: string;
  videoUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
  presentationUrl?: string;
  scormUrl?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  meetingUrl?: string;
  meetingDate?: string;
  meetingProvider?: string;
  sectionId?: string; // Track which section this activity belongs to
  pageCount?: number; // Track number of pages in PDF
}

export interface Section {
  id: string;
  title: string;
  isFree: boolean;
  isExpanded: boolean;
  activities: Activity[];
  order?: number;
}