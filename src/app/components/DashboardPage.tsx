import React, { useState, useRef } from 'react';
import { User, Course } from '@/app/types';
import { TrendingUp, Award, Clock, Target, User as UserIcon, Mail, Building2, Briefcase, Calendar, BookOpen, LayoutDashboard, Inbox, Star, ShoppingBag, ChevronRight, ChevronDown, Settings, Bell, Lock, Globe, Pencil, Check, X, AtSign, Phone, AlignLeft, PenLine, Send, FileText, CalendarClock, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Accessibility, Palette, Sun, Moon, Monitor, Type, ZoomIn, Camera, Trash2 } from 'lucide-react';

interface DashboardPageProps {
  currentUser: User;
  courses: Course[];
  onCourseClick: (courseId: string) => void;
  onContinueLearning: (courseId: string) => void;
}

export function DashboardPage({ currentUser, courses, onCourseClick, onContinueLearning }: DashboardPageProps) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [editingProfile, setEditingProfile] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', message: '' });
  const [commExpanded,    setCommExpanded]    = useState(false);
  const [activeCommTab,   setActiveCommTab]   = useState<'compose' | 'inbox' | 'drafts' | 'sent'>('inbox');
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'notifications' | 'privacy' | 'language' | 'accessibility' | 'appearance'>('notifications');
  const [sendDropOpen, setSendDropOpen] = useState(false);

  // ── Privacy & Security ──────────────────────────────────────────────────
  type SecurityPanel = 'change-password' | 'two-factor' | 'connected-accounts' | null;
  const [securityPanel, setSecurityPanel] = useState<SecurityPanel>(null);
  const toggleSecPanel = (p: SecurityPanel) => setSecurityPanel(s => s === p ? null : p);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSuccess, setPwSuccess] = useState(false);
  const handleChangePw = () => {
    if (!pwForm.current || pwForm.next.length < 8 || pwForm.next !== pwForm.confirm) return;
    setPwSuccess(true);
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState({
    google: false, facebook: false, linkedin: false, instagram: false,
  });
  // ────────────────────────────────────────────────────────────────────────

  // ── Appearance state ────────────────────────────────────────────────────
  const [theme,       setTheme]       = useState<'light' | 'dark' | 'system'>('light');
  const [accentColor, setAccentColor] = useState(0);  // index into accent palette
  const [compactMode, setCompactMode] = useState(false);
  // ── Accessibility state ─────────────────────────────────────────────────
  const [textSize,      setTextSize]      = useState<'Small' | 'Medium' | 'Large' | 'X-Large'>('Medium');
  const [reduceMotion,  setReduceMotion]  = useState(false);
  const [highContrast,  setHighContrast]  = useState(false);
  const [keyboardNav,   setKeyboardNav]   = useState(true);
  // ────────────────────────────────────────────────────────────────────────

  // ── Notification toggles ────────────────────────────────────────────────
  const [notifToggles, setNotifToggles] = useState({
    courseUpdates:   true,
    newMessages:     true,
    certificateEarned: true,
    weeklyReport:    true,
  });
  type NotifKey = keyof typeof notifToggles;
  // ────────────────────────────────────────────────────────────────────────

  // ── Reviews ─────────────────────────────────────────────────────────────
  interface Review { courseId: string; rating: number; text: string; date: string; }
  const [reviews, setReviews] = useState<Review[]>([]);
  const [writingReviewFor, setWritingReviewFor] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, text: '' });
  const [hoverRating, setHoverRating] = useState(0);

  const submitReview = (courseId: string) => {
    if (!reviewForm.rating) return;
    setReviews(r => [...r.filter(x => x.courseId !== courseId), {
      courseId,
      rating: reviewForm.rating,
      text: reviewForm.text.trim(),
      date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
    }]);
    setWritingReviewFor(null);
    setReviewForm({ rating: 0, text: '' });
    setHoverRating(0);
  };
  // ────────────────────────────────────────────────────────────────────────

  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    username: '',
    phone: '',
    biography: '',
    position: currentUser.position || '',
    yearsInCompany: currentUser.yearsInCompany?.toString() || '',
  });

  // ── Profile picture ─────────────────────────────────────────────────────
  const [profilePicture,      setProfilePicture]      = useState<string | null>(null);
  const [avatarDropdownOpen,  setAvatarDropdownOpen]  = useState(false);
  const [viewingProfilePic,   setViewingProfilePic]   = useState(false);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfilePicture(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };
  // ────────────────────────────────────────────────────────────────────────

  // ── Compose rich-text editor ────────────────────────────────────────────
  const editorRef    = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savedRange   = useRef<Range | null>(null);

  const [formatState, setFormatState] = useState({
    bold: false, italic: false, underline: false,
    strike: false, ul: false, ol: false,
  });
  const [linkPopover, setLinkPopover] = useState(false);
  const [linkUrl,     setLinkUrl]     = useState('');

  const updateFormatState = () => {
    setFormatState({
      bold:      document.queryCommandState('bold'),
      italic:    document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike:    document.queryCommandState('strikeThrough'),
      ul:        document.queryCommandState('insertUnorderedList'),
      ol:        document.queryCommandState('insertOrderedList'),
    });
  };

  const execFormat = (command: string) => {
    document.execCommand(command, false);
    updateFormatState();
  };

  // Save current selection so we can restore it after the link popover steals focus
  const saveSelection = () => {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const insertLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    restoreSelection();
    document.execCommand('createLink', false, url.startsWith('http') ? url : `https://${url}`);
    setLinkPopover(false);
    setLinkUrl('');
    savedRange.current = null;
  };

  const closeLinkPopover = () => {
    setLinkPopover(false);
    setLinkUrl('');
    savedRange.current = null;
  };

  const clearEditor = () => {
    if (editorRef.current) editorRef.current.innerHTML = '';
    setFormatState({ bold: false, italic: false, underline: false, strike: false, ul: false, ol: false });
    setLinkPopover(false);
    setLinkUrl('');
  };
  // ───────────────────────────────────────────────────────────────────────────

  const enrolledCourses = courses.filter(course =>
    currentUser.enrolledCourses.includes(course.id)
  );

  const getCourseProgress = (course: Course): number => {
    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const completedLessons = currentUser.completedLessons.filter(lessonId =>
      course.modules.some(module => module.lessons.some(lesson => lesson.id === lessonId))
    ).length;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const totalCoursesEnrolled = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(course => getCourseProgress(course) === 100).length;
  const inProgressCourses = enrolledCourses.filter(course => {
    const progress = getCourseProgress(course);
    return progress > 0 && progress < 100;
  }).length;
  const totalLessonsCompleted = currentUser.completedLessons.length;

  // Initials avatar
  const initials = currentUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Derive root class names from accessibility/appearance state
  const textSizeClass = { Small: 'a11y-text-sm', Medium: '', Large: 'a11y-text-lg', 'X-Large': 'a11y-text-xl' }[textSize];
  const rootClasses = [
    'min-h-screen bg-gray-50',
    textSizeClass,
    reduceMotion  ? 'a11y-reduce-motion'  : '',
    highContrast  ? 'a11y-high-contrast'  : '',
    !keyboardNav  ? 'a11y-no-focus-ring'  : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      <style>{`
        /* Text size */
        .a11y-text-sm  { font-size: 0.8125rem; }
        .a11y-text-lg  { font-size: 1rem; }
        .a11y-text-xl  { font-size: 1.125rem; }

        /* Reduce motion */
        .a11y-reduce-motion *, .a11y-reduce-motion *::before, .a11y-reduce-motion *::after {
          transition-duration: 0ms !important;
          animation-duration: 0ms !important;
        }

        /* High contrast */
        .a11y-high-contrast .text-gray-400 { color: #374151 !important; }
        .a11y-high-contrast .text-gray-500 { color: #1f2937 !important; }
        .a11y-high-contrast .placeholder-gray-300::placeholder { color: #6b7280 !important; }
        .a11y-high-contrast .border-gray-100 { border-color: #d1d5db !important; }
        .a11y-high-contrast .border-gray-200 { border-color: #9ca3af !important; }
        .a11y-high-contrast .bg-gray-50 { background-color: #f3f4f6 !important; }

        /* No focus ring */
        .a11y-no-focus-ring *:focus { outline: none !important; box-shadow: none !important; }
      `}</style>
      {/* Hidden file input for profile picture */}
      <input
        ref={profilePicInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProfilePicChange}
      />

      {/* Profile picture lightbox */}
      {viewingProfilePic && profilePicture && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setViewingProfilePic(false)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img src={profilePicture} alt="Profile" className="max-h-[80vh] max-w-[80vw] rounded-2xl shadow-2xl object-contain" />
            <button
              onClick={() => setViewingProfilePic(false)}
              className="absolute -top-3 -right-3 size-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center gap-4">
          {/* Avatar with dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setAvatarDropdownOpen(o => !o)}
              className="relative size-14 rounded-full focus:outline-none"
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="size-14 rounded-full object-cover" />
              ) : (
                <div className="size-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {initials}
                </div>
              )}
              {/* Camera badge */}
              <div className="absolute bottom-0 right-0 size-5 rounded-full bg-gray-700 border-2 border-white shadow flex items-center justify-center">
                <Camera className="size-2.5 text-white" />
              </div>
            </button>

            {/* Dropdown */}
            {avatarDropdownOpen && (
              <>
                {/* Click-away backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setAvatarDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                  <button
                    onClick={() => { setAvatarDropdownOpen(false); if (profilePicture) setViewingProfilePic(true); }}
                    disabled={!profilePicture}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-b border-gray-100"
                  >
                    <UserIcon className="size-4 text-gray-400" />
                    View Profile Picture
                  </button>
                  <button
                    onClick={() => { setAvatarDropdownOpen(false); profilePicInputRef.current?.click(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="size-4 text-gray-400" />
                    Upload Photo
                  </button>
                </div>
              </>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{currentUser.company}</p>
            <h1 className="text-2xl font-bold text-gray-900">Hello, {currentUser.name}!</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Nav menu */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {/* Navigation menu */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Dashboard */}
                {[
                  { id: 'dashboard',  label: 'Dashboard',  icon: <LayoutDashboard className="size-4" /> },
                  { id: 'my-profile', label: 'My Profile', icon: <UserIcon className="size-4" /> },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b border-gray-100 ${
                      activeMenu === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={activeMenu === item.id ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                      {item.label}
                    </span>
                    <ChevronRight className={`size-3.5 ${activeMenu === item.id ? 'text-blue-400' : 'text-gray-300'}`} />
                  </button>
                ))}

                {/* Communication — expandable */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => { setCommExpanded(e => !e); setActiveMenu('communication'); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                      activeMenu === 'communication' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={activeMenu === 'communication' ? 'text-blue-600' : 'text-gray-400'}>
                        <Mail className="size-4" />
                      </span>
                      Communication
                    </span>
                    {commExpanded
                      ? <ChevronDown className={`size-3.5 ${activeMenu === 'communication' ? 'text-blue-400' : 'text-gray-300'}`} />
                      : <ChevronRight className={`size-3.5 ${activeMenu === 'communication' ? 'text-blue-400' : 'text-gray-300'}`} />
                    }
                  </button>

                  {/* Sub-items */}
                  {commExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {[
                        { id: 'compose', label: 'Create Message', icon: <PenLine className="size-3.5" /> },
                        { id: 'inbox',   label: 'Inbox',          icon: <Inbox className="size-3.5" /> },
                        { id: 'drafts',  label: 'Drafts',         icon: <FileText className="size-3.5" /> },
                        { id: 'sent',    label: 'Sent',           icon: <Send className="size-3.5" /> },
                      ].map((sub, i, arr) => (
                        <button
                          key={sub.id}
                          onClick={() => { setActiveMenu('communication'); setActiveCommTab(sub.id as any); setComposing(sub.id === 'compose'); }}
                          className={`w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-xs transition-colors ${
                            i < arr.length - 1 ? 'border-b border-gray-100' : ''
                          } ${
                            activeCommTab === sub.id && activeMenu === 'communication'
                              ? 'text-blue-600 font-medium'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {sub.icon}
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rest of menu */}
                {[
                  { id: 'enrolled-courses', label: 'Enrolled Courses', icon: <BookOpen className="size-4" />,    comingSoon: false },
                  { id: 'reviews',          label: 'Reviews',          icon: <Star className="size-4" />,        comingSoon: false },
                  { id: 'order-history',    label: 'Order History',    icon: <ShoppingBag className="size-4" />, comingSoon: true  },
                ].map((item, i, arr) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b border-gray-100 ${
                      activeMenu === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={activeMenu === item.id ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                      {item.label}
                      {item.comingSoon && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 leading-none">
                          Soon
                        </span>
                      )}
                    </span>
                    <ChevronRight className={`size-3.5 ${activeMenu === item.id ? 'text-blue-400' : 'text-gray-300'}`} />
                  </button>
                ))}

                {/* Settings — expandable */}
                <div>
                  <button
                    onClick={() => { setSettingsExpanded(e => !e); setActiveMenu('settings'); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                      activeMenu === 'settings' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={activeMenu === 'settings' ? 'text-blue-600' : 'text-gray-400'}>
                        <Settings className="size-4" />
                      </span>
                      Settings
                    </span>
                    {settingsExpanded
                      ? <ChevronDown className={`size-3.5 ${activeMenu === 'settings' ? 'text-blue-400' : 'text-gray-300'}`} />
                      : <ChevronRight className={`size-3.5 ${activeMenu === 'settings' ? 'text-blue-400' : 'text-gray-300'}`} />
                    }
                  </button>

                  {settingsExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {[
                        { id: 'notifications',  label: 'Notifications',      icon: <Bell className="size-3.5" /> },
                        { id: 'privacy',        label: 'Privacy & Security', icon: <Lock className="size-3.5" /> },
                        { id: 'language',       label: 'Language & Region',  icon: <Globe className="size-3.5" /> },
                        { id: 'accessibility',  label: 'Accessibility',      icon: <Accessibility className="size-3.5" /> },
                        { id: 'appearance',     label: 'Appearance',         icon: <Palette className="size-3.5" /> },
                      ].map((sub, i, arr) => (
                        <button
                          key={sub.id}
                          onClick={() => { setActiveMenu('settings'); setActiveSettingsTab(sub.id as any); }}
                          className={`w-full flex items-center gap-3 pl-10 pr-4 py-2.5 text-xs transition-colors ${
                            i < arr.length - 1 ? 'border-b border-gray-100' : ''
                          } ${
                            activeSettingsTab === sub.id && activeMenu === 'settings'
                              ? 'text-blue-600 font-medium bg-blue-50/50'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {sub.icon}
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right panel — content per active menu */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* ── Dashboard ── */}
              {activeMenu === 'dashboard' && (
                <>
                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Enrolled',     value: totalCoursesEnrolled,  icon: <TrendingUp className="size-5 text-blue-600" />,   bg: 'bg-blue-50',   color: 'text-blue-600' },
                      { label: 'In Progress',  value: inProgressCourses,     icon: <Clock className="size-5 text-yellow-600" />,       bg: 'bg-yellow-50', color: 'text-yellow-600' },
                      { label: 'Completed',    value: completedCourses,      icon: <Award className="size-5 text-green-600" />,        bg: 'bg-green-50',  color: 'text-green-600' },
                      { label: 'Lessons Done', value: totalLessonsCompleted, icon: <Target className="size-5 text-purple-600" />,      bg: 'bg-purple-50', color: 'text-purple-600' },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-4 flex flex-col items-center gap-1.5`}>
                        {s.icon}
                        <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                        <span className="text-xs text-gray-500">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recent courses */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent Courses</h3>
                    {enrolledCourses.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No enrolled courses yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {enrolledCourses.slice(0, 3).map(course => {
                          const progress = getCourseProgress(course);
                          return (
                            <div key={course.id} className="flex items-center gap-4">
                              <img src={course.imageUrl} alt={course.title} className="size-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}% complete</p>
                              </div>
                              <button onClick={() => onContinueLearning(course.id)} className="text-xs text-blue-600 font-medium hover:underline flex-shrink-0">Continue</button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── My Profile ── */}
              {activeMenu === 'my-profile' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  {/* Profile picture section */}
                  <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
                    <button
                      onClick={() => profilePicInputRef.current?.click()}
                      title="Change profile picture"
                      className="relative size-20 rounded-full flex-shrink-0 group focus:outline-none"
                    >
                      {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="size-20 rounded-full object-cover" />
                      ) : (
                        <div className="size-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                          {initials}
                        </div>
                      )}
                      {/* Camera badge — bottom-right edge */}
                      <div className="absolute bottom-0 right-0 size-6 rounded-full bg-gray-700 border-2 border-white shadow flex items-center justify-center">
                        <Camera className="size-3 text-white" />
                      </div>
                    </button>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{profileForm.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{currentUser.company} · {currentUser.role?.replace(/_/g, ' ')}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => profilePicInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Camera className="size-3.5" />
                          {profilePicture ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {profilePicture && (
                          <button
                            onClick={() => setProfilePicture(null)}
                            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">JPG, PNG or GIF · Max 5 MB</p>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Profile Details</h3>
                    {!editingProfile ? (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Pencil className="size-3.5" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProfile(false)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          <X className="size-3.5" />
                          Cancel
                        </button>
                        <button
                          onClick={() => setEditingProfile(false)}
                          className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-3 py-1.5 rounded-lg"
                        >
                          <Check className="size-3.5" />
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Full Name</p>
                        {editingProfile ? (
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{profileForm.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Email Address</p>
                        {editingProfile ? (
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{profileForm.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Username */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <AtSign className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Username</p>
                        {editingProfile ? (
                          <input
                            type="text"
                            placeholder="e.g. aljamorabo"
                            value={profileForm.username}
                            onChange={e => setProfileForm(f => ({ ...f, username: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-300"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{profileForm.username || <span className="text-gray-400">—</span>}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Phone Number</p>
                        {editingProfile ? (
                          <input
                            type="tel"
                            placeholder="e.g. +61 400 000 000"
                            value={profileForm.phone}
                            onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-300"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{profileForm.phone || <span className="text-gray-400">—</span>}</p>
                        )}
                      </div>
                    </div>

                    {/* Biography */}
                    <div className="flex items-start gap-4 py-3 border-b border-gray-100">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlignLeft className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Biography</p>
                        {editingProfile ? (
                          <textarea
                            rows={3}
                            placeholder="A short bio about yourself…"
                            value={profileForm.biography}
                            onChange={e => setProfileForm(f => ({ ...f, biography: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-300 resize-none"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 whitespace-pre-line">{profileForm.biography || <span className="text-gray-400">—</span>}</p>
                        )}
                      </div>
                    </div>

                    {/* Company — read-only */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Company</p>
                        <p className="text-sm font-medium text-gray-900">{currentUser.company}</p>
                      </div>
                      {editingProfile && <span className="text-xs text-gray-400 flex-shrink-0">Managed by admin</span>}
                    </div>

                    {/* Role — read-only */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Role</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{currentUser.role?.replace(/_/g, ' ')}</p>
                      </div>
                      {editingProfile && <span className="text-xs text-gray-400 flex-shrink-0">Managed by admin</span>}
                    </div>

                    {/* Position */}
                    <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Position / Job Title</p>
                        {editingProfile ? (
                          <input
                            type="text"
                            placeholder="e.g. Senior Installer"
                            value={profileForm.position}
                            onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-300"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{profileForm.position || <span className="text-gray-400">—</span>}</p>
                        )}
                      </div>
                    </div>

                    {/* Years at Company */}
                    <div className="flex items-center gap-4 py-3">
                      <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="size-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">Years at Company</p>
                        {editingProfile ? (
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 3"
                            value={profileForm.yearsInCompany}
                            onChange={e => setProfileForm(f => ({ ...f, yearsInCompany: e.target.value }))}
                            className="w-32 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-300"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {profileForm.yearsInCompany ? `${profileForm.yearsInCompany} ${Number(profileForm.yearsInCompany) === 1 ? 'year' : 'years'}` : <span className="text-gray-400">—</span>}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Communication ── */}
              {activeMenu === 'communication' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      {activeCommTab === 'compose' ? 'New Message' : activeCommTab === 'inbox' ? 'Inbox' : activeCommTab === 'drafts' ? 'Drafts' : 'Sent'}
                    </h3>
                    {activeCommTab === 'compose' && (
                      <button
                        onClick={() => { setActiveCommTab('inbox'); setComposing(false); setComposeForm({ to: '', subject: '', message: '' }); clearEditor(); }}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <X className="size-3.5" />
                        Discard
                      </button>
                    )}
                  </div>

                  {/* Compose form */}
                  {activeCommTab === 'compose' && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                        <span className="text-xs text-gray-400 w-14 flex-shrink-0">To</span>
                        <input
                          type="text"
                          placeholder="Recipient name or email"
                          value={composeForm.to}
                          onChange={e => setComposeForm(f => ({ ...f, to: e.target.value }))}
                          className="flex-1 text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                        <span className="text-xs text-gray-400 w-14 flex-shrink-0">Subject</span>
                        <input
                          type="text"
                          placeholder="Message subject"
                          value={composeForm.subject}
                          onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))}
                          className="flex-1 text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                        />
                      </div>
                      {/* Formatting toolbar */}
                      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50">
                        {([
                          { label: 'Bold',          icon: <Bold className="size-3.5" />,          cmd: 'bold',          active: formatState.bold },
                          { label: 'Italic',        icon: <Italic className="size-3.5" />,        cmd: 'italic',        active: formatState.italic },
                          { label: 'Underline',     icon: <Underline className="size-3.5" />,     cmd: 'underline',     active: formatState.underline },
                          { label: 'Strikethrough', icon: <Strikethrough className="size-3.5" />, cmd: 'strikeThrough', active: formatState.strike },
                        ] as const).map(btn => (
                          <button
                            key={btn.label}
                            type="button"
                            title={btn.label}
                            onMouseDown={e => { e.preventDefault(); execFormat(btn.cmd); }}
                            className={`p-1.5 rounded transition-colors ${
                              btn.active
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                            }`}
                          >
                            {btn.icon}
                          </button>
                        ))}
                        <div className="w-px h-4 bg-gray-200 mx-1 flex-shrink-0" />
                        <button
                          type="button"
                          title="Bullet List"
                          onMouseDown={e => { e.preventDefault(); execFormat('insertUnorderedList'); }}
                          className={`p-1.5 rounded transition-colors ${
                            formatState.ul ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                          }`}
                        >
                          <List className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Numbered List"
                          onMouseDown={e => { e.preventDefault(); execFormat('insertOrderedList'); }}
                          className={`p-1.5 rounded transition-colors ${
                            formatState.ol ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                          }`}
                        >
                          <ListOrdered className="size-3.5" />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-1 flex-shrink-0" />
                        {/* Link button + popover */}
                        <div className="relative">
                          <button
                            type="button"
                            title="Insert Link"
                            onMouseDown={e => {
                              e.preventDefault();
                              if (linkPopover) { closeLinkPopover(); return; }
                              saveSelection();
                              setLinkPopover(true);
                              // Focus the URL input on next tick
                              setTimeout(() => linkInputRef.current?.focus(), 0);
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              linkPopover ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                            }`}
                          >
                            <Link className="size-3.5" />
                          </button>

                          {linkPopover && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                              {/* Arrow */}
                              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 bg-white border-l border-t border-gray-200 rotate-45" />
                              <p className="text-xs font-medium text-gray-500 mb-2">Insert Link</p>
                              <div className="flex items-center gap-2">
                                <input
                                  ref={linkInputRef}
                                  type="url"
                                  placeholder="https://example.com"
                                  value={linkUrl}
                                  onChange={e => setLinkUrl(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') { e.preventDefault(); insertLink(); }
                                    if (e.key === 'Escape') closeLinkPopover();
                                  }}
                                  className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={insertLink}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0"
                                >
                                  Insert
                                </button>
                                <button
                                  type="button"
                                  onClick={closeLinkPopover}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rich-text editor area */}
                      <style>{`
                        .compose-editor:empty:before{content:attr(data-placeholder);color:#d1d5db;pointer-events:none}
                        .compose-editor ul{list-style-type:disc;padding-left:1.25rem;margin:0.25rem 0}
                        .compose-editor ol{list-style-type:decimal;padding-left:1.25rem;margin:0.25rem 0}
                        .compose-editor li{margin:0.1rem 0}
                        .compose-editor a{color:#2563eb;text-decoration:underline}
                      `}</style>
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder="Write your message…"
                        onKeyUp={updateFormatState}
                        onMouseUp={updateFormatState}
                        onSelect={updateFormatState}
                        className="compose-editor min-h-[150px] px-4 py-3 text-sm text-gray-900 focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={() => { setActiveCommTab('inbox'); setComposing(false); setComposeForm({ to: '', subject: '', message: '' }); setSendDropOpen(false); clearEditor(); }}
                          className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>

                        {/* Split send button */}
                        <div className="relative">
                          <div className="flex items-center rounded-lg overflow-hidden border border-blue-600">
                            {/* Primary send action */}
                            <button
                              onClick={() => { setActiveCommTab('sent'); setComposing(false); setComposeForm({ to: '', subject: '', message: '' }); setSendDropOpen(false); clearEditor(); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                            >
                              <Send className="size-3.5" />
                              Send
                            </button>
                            {/* Dropdown toggle */}
                            <button
                              onClick={() => setSendDropOpen(o => !o)}
                              className="px-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-l border-blue-500 transition-colors"
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                          </div>

                          {/* Dropdown menu */}
                          {sendDropOpen && (
                            <div className="absolute bottom-full right-0 mb-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                              <button
                                onClick={() => { setActiveCommTab('sent'); setComposing(false); setComposeForm({ to: '', subject: '', message: '' }); setSendDropOpen(false); clearEditor(); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                              >
                                <Send className="size-3.5 text-gray-400" />
                                Send
                              </button>
                              <button
                                onClick={() => setSendDropOpen(false)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                              >
                                <CalendarClock className="size-3.5 text-gray-400" />
                                Scheduled Send
                              </button>
                              <button
                                onClick={() => { setActiveCommTab('drafts'); setComposing(false); setSendDropOpen(false); clearEditor(); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <FileText className="size-3.5 text-gray-400" />
                                Save as Draft
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inbox / Drafts / Sent empty states */}
                  {activeCommTab === 'inbox' && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Inbox className="size-12 text-gray-200 mb-3" />
                      <p className="text-gray-500 font-medium">No messages yet</p>
                      <p className="text-sm text-gray-400 mt-1">Messages from your company will appear here.</p>
                    </div>
                  )}
                  {activeCommTab === 'drafts' && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="size-12 text-gray-200 mb-3" />
                      <p className="text-gray-500 font-medium">No drafts</p>
                      <p className="text-sm text-gray-400 mt-1">Messages you save as drafts will appear here.</p>
                    </div>
                  )}
                  {activeCommTab === 'sent' && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Send className="size-12 text-gray-200 mb-3" />
                      <p className="text-gray-500 font-medium">No sent messages</p>
                      <p className="text-sm text-gray-400 mt-1">Messages you send will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Enrolled Courses ── */}
              {activeMenu === 'enrolled-courses' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Enrolled Courses</h3>
                    <button
                      onClick={() => onCourseClick('')}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <BookOpen className="size-3.5" />
                      Browse &amp; Add Course
                    </button>
                  </div>
                  {enrolledCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BookOpen className="size-12 text-gray-200 mb-3" />
                      <p className="text-gray-500 font-medium">No courses enrolled</p>
                      <button onClick={() => onCourseClick('')} className="mt-4 text-sm text-blue-600 font-medium hover:underline">Browse Courses →</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrolledCourses.map(course => {
                        const progress = getCourseProgress(course);
                        return (
                          <div key={course.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                            <img src={course.imageUrl} alt={course.title} className="size-14 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{course.instructor}</p>
                              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}% complete</p>
                            </div>
                            <button onClick={() => onContinueLearning(course.id)} className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                              {progress === 0 ? 'Start' : progress === 100 ? 'Review' : 'Continue'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Reviews ── */}
              {activeMenu === 'reviews' && (
                <div className="flex flex-col gap-5">
                  {/* My submitted reviews */}
                  {reviews.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">My Reviews</h3>
                      <div className="space-y-4">
                        {reviews.map(r => {
                          const course = enrolledCourses.find(c => c.id === r.courseId);
                          if (!course) return null;
                          return (
                            <div key={r.courseId} className="flex gap-4 p-4 rounded-xl border border-gray-100">
                              <img src={course.imageUrl} alt={course.title} className="size-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                                  <button
                                    onClick={() => { setWritingReviewFor(r.courseId); setReviewForm({ rating: r.rating, text: r.text }); setHoverRating(0); }}
                                    className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                  >
                                    Edit
                                  </button>
                                </div>
                                {/* Stars */}
                                <div className="flex items-center gap-0.5 mt-1">
                                  {[1,2,3,4,5].map(n => (
                                    <Star key={n} className={`size-3.5 ${n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                  ))}
                                  <span className="text-xs text-gray-400 ml-1.5">{r.date}</span>
                                </div>
                                {r.text && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.text}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Courses available to review */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      {enrolledCourses.length > 0 ? 'Rate a Course' : 'Reviews'}
                    </h3>

                    {enrolledCourses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Star className="size-12 text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">No courses enrolled</p>
                        <p className="text-sm text-gray-400 mt-1">Enrol in a course to leave a review.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enrolledCourses.map(course => {
                          const existing = reviews.find(r => r.courseId === course.id);
                          const isWriting = writingReviewFor === course.id;
                          return (
                            <div key={course.id} className="border border-gray-100 rounded-xl overflow-hidden">
                              {/* Course row */}
                              <div className="flex items-center gap-4 p-4">
                                <img src={course.imageUrl} alt={course.title} className="size-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{course.instructor}</p>
                                  {existing && (
                                    <div className="flex items-center gap-0.5 mt-1">
                                      {[1,2,3,4,5].map(n => (
                                        <Star key={n} className={`size-3 ${n <= existing.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    if (isWriting) { setWritingReviewFor(null); setReviewForm({ rating: 0, text: '' }); setHoverRating(0); }
                                    else { setWritingReviewFor(course.id); setReviewForm({ rating: existing?.rating ?? 0, text: existing?.text ?? '' }); setHoverRating(0); }
                                  }}
                                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    isWriting
                                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      : existing
                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {isWriting ? 'Cancel' : existing ? 'Edit Review' : 'Write Review'}
                                </button>
                              </div>

                              {/* Inline review form */}
                              {isWriting && (
                                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                                  {/* Star picker */}
                                  <p className="text-xs text-gray-500 mb-2">Your rating</p>
                                  <div className="flex items-center gap-1 mb-4">
                                    {[1,2,3,4,5].map(n => (
                                      <button
                                        key={n}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(n)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                                        className="transition-transform hover:scale-110"
                                      >
                                        <Star className={`size-6 transition-colors ${
                                          n <= (hoverRating || reviewForm.rating)
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-gray-300 fill-gray-300'
                                        }`} />
                                      </button>
                                    ))}
                                    {reviewForm.rating > 0 && (
                                      <span className="text-xs text-gray-500 ml-2">
                                        {['','Poor','Fair','Good','Very good','Excellent'][reviewForm.rating]}
                                      </span>
                                    )}
                                  </div>

                                  {/* Comment */}
                                  <p className="text-xs text-gray-500 mb-2">Your review <span className="text-gray-400">(optional)</span></p>
                                  <textarea
                                    rows={3}
                                    placeholder="Share what you liked or learned from this course…"
                                    value={reviewForm.text}
                                    onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-300 resize-none bg-white"
                                  />

                                  <div className="flex items-center justify-end gap-2 mt-3">
                                    <button
                                      onClick={() => { setWritingReviewFor(null); setReviewForm({ rating: 0, text: '' }); setHoverRating(0); }}
                                      className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => submitReview(course.id)}
                                      disabled={!reviewForm.rating}
                                      className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {existing ? 'Update Review' : 'Submit Review'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Order History ── */}
              {activeMenu === 'order-history' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Order History</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Coming Soon</span>
                  </div>

                  {/* Coming soon body */}
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="size-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                      <ShoppingBag className="size-8 text-amber-400" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-800 mb-2">Order History is coming soon</h4>
                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                      We're building a full purchase history and receipt tracker. Once it's live, all your course orders will appear here.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Settings ── */}
              {activeMenu === 'settings' && (
                <div className="flex flex-col gap-5">
                  {/* Notifications */}
                  {activeSettingsTab === 'notifications' && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Bell className="size-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      {(([
                        { key: 'courseUpdates',    label: 'Course updates',          sub: 'Get notified when a course you enrolled in is updated' },
                        { key: 'newMessages',      label: 'New messages',            sub: 'Receive alerts for new inbox messages' },
                        { key: 'certificateEarned',label: 'Certificate earned',      sub: 'Notify me when I earn a certificate' },
                        { key: 'weeklyReport',     label: 'Weekly progress report',  sub: 'A weekly summary of your learning activity' },
                      ]) as { key: NotifKey; label: string; sub: string }[]).map(item => {
                        const on = notifToggles[item.key];
                        return (
                          <div key={item.key} className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.label}</p>
                              <p className="text-xs text-gray-400">{item.sub}</p>
                            </div>
                            <button
                              onClick={() => setNotifToggles(t => ({ ...t, [item.key]: !t[item.key] }))}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                on ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform duration-200 ${
                                on ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>}

                  {/* Privacy & Security */}
                  {activeSettingsTab === 'privacy' && <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
                      <Lock className="size-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-700">Privacy & Security</h3>
                    </div>

                    {/* ── Change Password ── */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSecPanel('change-password')}
                        className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                      >
                        Change Password
                        <ChevronDown className={`size-4 text-gray-300 transition-transform ${securityPanel === 'change-password' ? 'rotate-180' : ''}`} />
                      </button>
                      {securityPanel === 'change-password' && (
                        <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                          {pwSuccess && (
                            <div className="flex items-center gap-2 mb-4 mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                              <Check className="size-4 flex-shrink-0" />
                              Password updated successfully.
                            </div>
                          )}
                          <div className="space-y-3 mt-4">
                            {[
                              { key: 'current', label: 'Current Password',  placeholder: '••••••••' },
                              { key: 'next',    label: 'New Password',       placeholder: 'Min. 8 characters' },
                              { key: 'confirm', label: 'Confirm Password',   placeholder: 'Repeat new password' },
                            ].map(f => (
                              <div key={f.key}>
                                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                                <input
                                  type="password"
                                  placeholder={f.placeholder}
                                  value={pwForm[f.key as keyof typeof pwForm]}
                                  onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-300"
                                />
                              </div>
                            ))}
                            {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                              <p className="text-xs text-red-500">Passwords do not match.</p>
                            )}
                            {pwForm.next && pwForm.next.length < 8 && (
                              <p className="text-xs text-red-500">Password must be at least 8 characters.</p>
                            )}
                          </div>
                          <button
                            onClick={handleChangePw}
                            disabled={!pwForm.current || pwForm.next.length < 8 || pwForm.next !== pwForm.confirm}
                            className="mt-4 w-full py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Update Password
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Two-Factor Authentication ── */}
                    <div className="border-b border-gray-100">
                      <button
                        onClick={() => toggleSecPanel('two-factor')}
                        className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                      >
                        <span className="flex items-center gap-3">
                          Two-Factor Authentication
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${twoFaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {twoFaEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </span>
                        <ChevronDown className={`size-4 text-gray-300 transition-transform ${securityPanel === 'two-factor' ? 'rotate-180' : ''}`} />
                      </button>
                      {securityPanel === 'two-factor' && (
                        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                          <div className="flex items-start gap-4">
                            <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${twoFaEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Lock className={`size-5 ${twoFaEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">
                                {twoFaEnabled ? '2FA is active on your account' : 'Add an extra layer of security'}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {twoFaEnabled
                                  ? 'Each sign-in requires your password and a one-time code.'
                                  : 'Require a one-time code in addition to your password when signing in.'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setTwoFaEnabled(v => !v)}
                            className={`mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                              twoFaEnabled
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {twoFaEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Connected Accounts ── */}
                    <div>
                      <button
                        onClick={() => toggleSecPanel('connected-accounts')}
                        className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                      >
                        Connected Accounts
                        <ChevronDown className={`size-4 text-gray-300 transition-transform ${securityPanel === 'connected-accounts' ? 'rotate-180' : ''}`} />
                      </button>
                      {securityPanel === 'connected-accounts' && (
                        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 space-y-3">
                          {([
                            {
                              key: 'google', label: 'Google',
                              icon: (
                                <svg viewBox="0 0 24 24" className="size-5" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                              ),
                            },
                            {
                              key: 'facebook', label: 'Facebook',
                              icon: (
                                <svg viewBox="0 0 24 24" className="size-5" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                                </svg>
                              ),
                            },
                            {
                              key: 'linkedin', label: 'LinkedIn',
                              icon: (
                                <svg viewBox="0 0 24 24" className="size-5" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/>
                                </svg>
                              ),
                            },
                            {
                              key: 'instagram', label: 'Instagram',
                              icon: (
                                <svg viewBox="0 0 24 24" className="size-5" xmlns="http://www.w3.org/2000/svg">
                                  <defs>
                                    <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#FFDC80"/>
                                      <stop offset="26%" stopColor="#FCAF45"/>
                                      <stop offset="52%" stopColor="#F77737"/>
                                      <stop offset="73%" stopColor="#F56040"/>
                                      <stop offset="86%" stopColor="#FD1D1D"/>
                                      <stop offset="100%" stopColor="#833AB4"/>
                                    </linearGradient>
                                  </defs>
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="url(#ig)"/>
                                </svg>
                              ),
                            },
                          ] as { key: keyof typeof connectedAccounts; label: string; icon: React.ReactNode }[]).map(acct => {
                            const linked = connectedAccounts[acct.key];
                            return (
                              <div key={acct.key} className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="size-9 rounded-xl border border-gray-100 flex items-center justify-center bg-white flex-shrink-0">
                                    {acct.icon}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{acct.label}</p>
                                    <p className="text-xs text-gray-400">{linked ? 'Connected' : 'Not connected'}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setConnectedAccounts(a => ({ ...a, [acct.key]: !a[acct.key] }))}
                                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                    linked
                                      ? 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {linked ? 'Disconnect' : 'Connect'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>}

                  {/* Language & Region */}
                  {activeSettingsTab === 'language' && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Globe className="size-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-700">Language & Region</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Language</p>
                          <p className="text-xs text-gray-400">Platform display language</p>
                        </div>
                        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Timezone</p>
                          <p className="text-xs text-gray-400">Used for scheduling and reports</p>
                        </div>
                        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>UTC+10 (AEST)</option>
                          <option>UTC+0 (GMT)</option>
                          <option>UTC-5 (EST)</option>
                          <option>UTC-8 (PST)</option>
                        </select>
                      </div>
                    </div>
                  </div>}

                  {/* Accessibility */}
                  {activeSettingsTab === 'accessibility' && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Accessibility className="size-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-700">Accessibility</h3>
                    </div>
                    <div className="space-y-5">
                      {/* Text size */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Type className="size-3.5 text-gray-400" />
                          <p className="text-sm font-medium text-gray-800">Text Size</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(['Small', 'Medium', 'Large', 'X-Large'] as const).map(size => (
                            <button
                              key={size}
                              onClick={() => setTextSize(size)}
                              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                textSize === size
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Currently: <span className="font-medium text-gray-600">{textSize}</span>
                        </p>
                      </div>

                      {/* Reduce motion */}
                      {[
                        { label: 'Reduce Motion',                sub: 'Minimise animations and transitions across the platform', val: reduceMotion,  set: setReduceMotion },
                        { label: 'High Contrast',                sub: 'Increase colour contrast for better visibility',           val: highContrast,  set: setHighContrast },
                        { label: 'Enhanced Keyboard Navigation', sub: 'Show focus rings and keyboard shortcuts throughout the app', val: keyboardNav,  set: setKeyboardNav },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between gap-4 py-3 border-t border-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-400">{item.sub}</p>
                          </div>
                          <button
                            onClick={() => item.set(v => !v)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${item.val ? 'bg-blue-600' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform duration-200 ${item.val ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>}

                  {/* Appearance */}
                  {activeSettingsTab === 'appearance' && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Palette className="size-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-700">Appearance</h3>
                    </div>
                    <div className="space-y-5">
                      {/* Theme */}
                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-3">Theme</p>
                        <div className="grid grid-cols-3 gap-3">
                          {([
                            { id: 'light',  label: 'Light',  icon: <Sun className="size-5 text-amber-500" />,    preview: 'bg-white border-gray-200' },
                            { id: 'dark',   label: 'Dark',   icon: <Moon className="size-5 text-indigo-400" />,  preview: 'bg-gray-900 border-gray-700' },
                            { id: 'system', label: 'System', icon: <Monitor className="size-5 text-blue-500" />, preview: 'bg-gradient-to-br from-white to-gray-900 border-gray-300' },
                          ] as const).map(t => (
                            <button
                              key={t.id}
                              onClick={() => setTheme(t.id)}
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                theme === t.id
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-full h-10 rounded-lg border ${t.preview}`} />
                              <div className="flex items-center gap-1.5">
                                {t.icon}
                                <span className={`text-xs font-medium ${theme === t.id ? 'text-blue-700' : 'text-gray-700'}`}>{t.label}</span>
                              </div>
                              {theme === t.id && (
                                <span className="text-[10px] font-semibold text-blue-600 -mt-1">Selected</span>
                              )}
                            </button>
                          ))}
                        </div>
                        {theme !== 'light' && (
                          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                            {theme === 'dark' ? 'Dark mode preview — full dark theme coming soon.' : 'System theme will match your device preference — coming soon.'}
                          </p>
                        )}
                      </div>

                      {/* Accent colour */}
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-800 mb-3">Accent Colour</p>
                        <div className="flex items-center gap-2.5">
                          {[
                            { color: 'bg-blue-500',    ring: 'ring-blue-500',    label: 'Blue' },
                            { color: 'bg-violet-500',  ring: 'ring-violet-500',  label: 'Violet' },
                            { color: 'bg-emerald-500', ring: 'ring-emerald-500', label: 'Emerald' },
                            { color: 'bg-rose-500',    ring: 'ring-rose-500',    label: 'Rose' },
                            { color: 'bg-amber-500',   ring: 'ring-amber-500',   label: 'Amber' },
                            { color: 'bg-gray-700',    ring: 'ring-gray-700',    label: 'Slate' },
                          ].map((c, i) => (
                            <button
                              key={i}
                              title={c.label}
                              onClick={() => setAccentColor(i)}
                              className={`size-7 rounded-full ${c.color} transition-all hover:scale-110 ${
                                accentColor === i ? `ring-2 ring-offset-2 ${c.ring} scale-110` : ''
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Selected: <span className="font-medium text-gray-600">{['Blue','Violet','Emerald','Rose','Amber','Slate'][accentColor]}</span>
                        </p>
                      </div>

                      {/* Compact mode */}
                      <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Compact Mode</p>
                          <p className="text-xs text-gray-400">Reduce spacing and padding to show more content</p>
                        </div>
                        <button
                          onClick={() => setCompactMode(v => !v)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${compactMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform duration-200 ${compactMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
  );
}
