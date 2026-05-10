export type SkinId =
  | 'coloured-minimal'
  | 'classic'
  | 'minimal'
  | 'one-activity-minimal'
  | 'one-activity-dark';

export interface CoursePlayerSettings {
  selectedSkin: SkinId;
  // Path player toggles
  hideLeftPlayer: boolean;
  showCourseName: boolean;
  showProgressBar: boolean;
  showAllLearners: boolean;
  showDiscussion: boolean;
  expandSections: boolean;
  numberSections: boolean;
  startFrom00: boolean;
  showCompleteSectionTitles: boolean;
  showCompleteActivityTitles: boolean;
  showEbookReading: boolean;
  // Navigation bar
  navBarPosition: 'top' | 'bottom' | 'hidden';
  prevText: string;
  nextText: string;
  // Back button
  backButton: 'none' | 'course-layout' | 'after-login' | 'another-page' | 'specific-url';
  backPage: string;
  backUrl: string;
  // Auto-progress & navigation & completion
  autoProgress: boolean;
  courseNav: 'free' | 'sequential' | 'prerequisites';
  completionRule: string;
  specificCert: string;
  // Apply to all
  applySkin: boolean;
  applyAppearance: boolean;
  applyNavigation: boolean;
  applyActivityCompletion: boolean;
  applyCourseCompletion: boolean;
}

export const defaultPlayerSettings: CoursePlayerSettings = {
  selectedSkin: 'coloured-minimal',
  hideLeftPlayer: false,
  showCourseName: true,
  showProgressBar: true,
  showAllLearners: false,
  showDiscussion: false,
  expandSections: false,
  numberSections: true,
  startFrom00: false,
  showCompleteSectionTitles: false,
  showCompleteActivityTitles: false,
  showEbookReading: false,
  navBarPosition: 'bottom',
  prevText: 'Previous',
  nextText: 'Next',
  backButton: 'another-page',
  backPage: 'start-courses',
  backUrl: '',
  autoProgress: true,
  courseNav: 'sequential',
  completionRule: 'all-activities',
  specificCert: '',
  applySkin: false,
  applyAppearance: false,
  applyNavigation: false,
  applyActivityCompletion: false,
  applyCourseCompletion: false,
};

// Per-skin visual config used by the preview modal
export const SKIN_CONFIG: Record<
  SkinId,
  {
    sidebarBg: string;
    sidebarText: string;
    sidebarBorder: string;
    sidebarActive: string;
    sidebarHover: string;
    sidebarActiveBorder: string;
    topbarBg: string;
    topbarText: string;
    topbarBorder: string;
    completedColor: string;
    forceSidebarHidden: boolean;
    dark: boolean;
  }
> = {
  'coloured-minimal': {
    sidebarBg: 'bg-teal-800',
    sidebarText: 'text-white',
    sidebarBorder: 'border-teal-700',
    sidebarActive: 'bg-white/15',
    sidebarHover: 'hover:bg-white/5',
    sidebarActiveBorder: 'border-white',
    topbarBg: 'bg-teal-700',
    topbarText: 'text-white',
    topbarBorder: '',
    completedColor: 'text-teal-300',
    forceSidebarHidden: false,
    dark: false,
  },
  'classic': {
    sidebarBg: 'bg-gray-900',
    sidebarText: 'text-white',
    sidebarBorder: 'border-gray-700',
    sidebarActive: 'bg-white/10',
    sidebarHover: 'hover:bg-white/5',
    sidebarActiveBorder: 'border-gray-400',
    topbarBg: 'bg-gray-800',
    topbarText: 'text-white',
    topbarBorder: '',
    completedColor: 'text-green-400',
    forceSidebarHidden: false,
    dark: false,
  },
  'minimal': {
    sidebarBg: 'bg-gray-50',
    sidebarText: 'text-gray-800',
    sidebarBorder: 'border-gray-200',
    sidebarActive: 'bg-teal-50',
    sidebarHover: 'hover:bg-gray-100',
    sidebarActiveBorder: 'border-teal-500',
    topbarBg: 'bg-white border-b border-gray-200',
    topbarText: 'text-gray-800',
    topbarBorder: 'border-gray-200',
    completedColor: 'text-teal-600',
    forceSidebarHidden: false,
    dark: false,
  },
  'one-activity-minimal': {
    sidebarBg: 'bg-gray-50',
    sidebarText: 'text-gray-800',
    sidebarBorder: 'border-gray-200',
    sidebarActive: 'bg-gray-200',
    sidebarHover: 'hover:bg-gray-100',
    sidebarActiveBorder: 'border-gray-400',
    topbarBg: 'bg-white border-b border-gray-200',
    topbarText: 'text-gray-800',
    topbarBorder: 'border-gray-200',
    completedColor: 'text-teal-600',
    forceSidebarHidden: true,
    dark: false,
  },
  'one-activity-dark': {
    sidebarBg: 'bg-gray-900',
    sidebarText: 'text-white',
    sidebarBorder: 'border-gray-700',
    sidebarActive: 'bg-white/10',
    sidebarHover: 'hover:bg-white/5',
    sidebarActiveBorder: 'border-gray-400',
    topbarBg: 'bg-gray-900 border-b border-gray-700',
    topbarText: 'text-white',
    topbarBorder: 'border-gray-700',
    completedColor: 'text-green-400',
    forceSidebarHidden: true,
    dark: true,
  },
};
