import { Course, User } from '@/app/types';
import { supabase } from '/utils/supabase/client';

import { TrendingUp, ChevronDown, ChevronRight, ArrowLeft, Users, BookOpen, Award, DollarSign, Activity, Info, X, Target, Zap, Server, AlertCircle, CheckCircle, XCircle, Wifi, Database, Search, Plus, Filter, Tag, Download, Calendar, Bookmark, MoreHorizontal, RotateCcw, Sparkles, Package, Star, Clock, BarChart2, TrendingDown, Pencil } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell } from 'recharts';
import { useState, useEffect } from 'react';

interface AdminAnalyticsPageProps {
  courses: Course[];
  users: User[];
  analyticsView: string;
  setAnalyticsView: (view: string) => void;
  companyName?: string;
  isCompanyView?: boolean;
  companyId?: string | null;
  isCompanySubscriberView?: boolean; // True when a company subscriber is viewing their own page
}

// ── Segment types ────────────────────────────────────────────────────────────
type SegmentFilter = {
  course?: string; scoreOp?: string; score?: string;
  progressOp?: string; progress?: string; completed?: string;
  period?: string; platform?: string;
  email?: string; username?: string; tag?: string;
  regPeriod?: string; regValue?: string;
};
type Segment = {
  id: string; name: string; description: string;
  color: string; icon: string;
  filters: SegmentFilter;
  userCount: number; createdAt: string;
};
const SEGMENT_COLORS = [
  { bg: 'bg-teal-500',  light: 'bg-teal-50',  border: 'border-teal-200',  text: 'text-teal-700'  },
  { bg: 'bg-indigo-500',light: 'bg-indigo-50', border: 'border-indigo-200',text: 'text-indigo-700'},
  { bg: 'bg-rose-500',  light: 'bg-rose-50',   border: 'border-rose-200',  text: 'text-rose-700'  },
  { bg: 'bg-amber-500', light: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700' },
  { bg: 'bg-green-500', light: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700' },
  { bg: 'bg-slate-500', light: 'bg-slate-50',  border: 'border-slate-200', text: 'text-slate-700' },
];
const SEGMENT_ICONS = ['👥','🎯','🏆','📈','⚡','🔥','💡','🌟','🛡️','📊'];

export function AdminAnalyticsPage({ courses, users, analyticsView, setAnalyticsView, companyName, isCompanyView = false, companyId, isCompanySubscriberView = false }: AdminAnalyticsPageProps) {
  // State for popover management
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState<'all-reports' | 'my-segments'>('all-reports');

  // ── Segment state ──────────────────────────────────────────────────────────
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const segKvPrefix = `analytics-segment:${companyId || 'global'}:`;

  // Load segments from Supabase on mount / when companyId changes
  useEffect(() => {
    setSegmentsLoading(true);
    supabase
      .from('kv_store_d60f2898')
      .select('value')
      .like('key', `${segKvPrefix}%`)
      .then(({ data }) => {
        if (data) setSegments(data.map((r: { value: Segment }) => r.value));
        setSegmentsLoading(false);
      });
  }, [companyId]);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [segStep, setSegStep] = useState<1 | 2>(1);
  const [segName, setSegName] = useState('');
  const [segDesc, setSegDesc] = useState('');
  const [segColor, setSegColor] = useState(0);
  const [segIcon, setSegIcon] = useState('👥');
  const [segFilters, setSegFilters] = useState<SegmentFilter>({});
  const updateSegFilter = (k: keyof SegmentFilter, v: string) =>
    setSegFilters(p => ({ ...p, [k]: v }));
  // Segment step-2 advanced filters
  const [segAdvFilters, setSegAdvFilters] = useState<AdvFilter[]>([]);
  const [segAdvMatchMode, setSegAdvMatchMode] = useState<'all' | 'any'>('all');
  const [segAdvPickerSearch, setSegAdvPickerSearch] = useState('');
  const [segAdvPickerCat, setSegAdvPickerCat] = useState<AdvFilterCat>('all');
  const [segFiltersApplied, setSegFiltersApplied] = useState(false);
  const [segMatchedUserIds, setSegMatchedUserIds] = useState<string[]>(() => users.map(u => u.id));

  // Reset tab to 'all-reports' whenever the top-level analytics view changes
  useEffect(() => {
    setAnalyticsTab('all-reports');
  }, [analyticsView]);

  // Recompute matched IDs whenever applied filters change
  useEffect(() => {
    if (!segFiltersApplied || segAdvFilters.length === 0) {
      setSegMatchedUserIds(users.map(u => u.id));
      return;
    }
    const _roles    = ['Learner','Learner','Learner','Manager','Learner','Learner','Admin','Learner'];
    const _statuses = ['Active','Active','Active','Active','Inactive','Active','Active','Suspended'];
    const _tags     = ['VIP','New user','At risk','High performer','New user','At risk','High performer','VIP'];
    const _accTypes = ['Free','Paid','Paid','Free','Trial','Paid','Paid','Free'];
    const _platforms= ['Web','Mobile app','Web','Web','Mobile app','Web','Web','Mobile app'];
    const _certTypes= ['Course completion','Skill mastery','Course completion','Certification exam','Course completion','Skill mastery','Certification exam','Course completion'];
    const _certStat = ['Active','Active','Active','Expired','Active','Active','Revoked','Active'];
    const _groups   = ['Team A','Team B','Managers','Enterprise','Trial users','Team A','Team B','Enterprise'];
    const _seatTypes= ['Assigned','Assigned','Unassigned','Assigned','Assigned','Unassigned','Assigned','Assigned'];
    const _enrollT  = ['Paid','Free','Paid','Seat','Free','Paid','Paid','Free'];
    const strMatch = (val: string, op: string, target: string) => {
      if (!target) return true;
      const v = val.toLowerCase(), t = target.toLowerCase();
      if (op === 'is' || op === 'within') return v === t;
      if (op === 'is not') return v !== t;
      if (op === 'contains') return v.includes(t);
      if (op === 'does not contain') return !v.includes(t);
      if (op === 'starts with') return v.startsWith(t);
      if (op === 'ends with') return v.endsWith(t);
      return true;
    };
    const numMatch = (val: number, op: string, target: string, target2: string) => {
      if (!target) return true;
      const t = parseFloat(target); if (isNaN(t)) return true;
      if (op === '≥') return val >= t;
      if (op === '≤') return val <= t;
      if (op === '=') return val === t;
      if (op === '≠') return val !== t;
      if (op === 'between') { const t2 = parseFloat(target2); return !isNaN(t2) ? val >= t && val <= t2 : val >= t; }
      return true;
    };
    const filtered = users.filter((user) => {
      const i = users.indexOf(user);
      const ec = user.enrolledCourses.length, cc = user.completedLessons.length;
      const sm = cc * Math.floor(12 + (i * 7) % 20);
      const sc = cc > 0 ? Math.min(99, Math.floor(62 + (i * 13) % 35)) : 0;
      const ct = Math.floor(cc / Math.max(ec, 1) * ec * 0.4);
      const lg = Math.floor(5 + (i * 17) % 50);
      const pr = ec > 0 ? Math.min(100, Math.floor((cc / Math.max(ec * 3, 1)) * 100)) : 0;
      const checks = segAdvFilters.map(({ field: fk, operator: op, value: v, value2: v2 }) => {
        if (fk === 'user_role')          return strMatch(_roles[i % _roles.length], op, v);
        if (fk === 'user_status')        return strMatch(_statuses[i % _statuses.length], op, v);
        if (fk === 'user_tag')           return strMatch(_tags[i % _tags.length], op, v);
        if (fk === 'user_email')         return strMatch(user.email, op, v);
        if (fk === 'user_username')      return strMatch(user.name, op, v);
        if (fk === 'user_account_type')  return strMatch(_accTypes[i % _accTypes.length], op, v);
        if (fk === 'user_country')       return strMatch(user.email.split('.').pop() ?? '', op, v);
        if (fk === 'course_enrolled')    return strMatch(ec > 0 ? 'Yes' : 'No', op, v);
        if (fk === 'course_completed')   return strMatch(cc > 0 ? 'Yes' : 'No', op, v);
        if (fk === 'course_progress')    return numMatch(pr, op, v, v2);
        if (fk === 'course_score')       return numMatch(sc, op, v, v2);
        if (fk === 'course_enroll_type') return strMatch(_enrollT[i % _enrollT.length], op, v);
        if (fk === 'act_platform')       return strMatch(_platforms[i % _platforms.length], op, v);
        if (fk === 'act_logins')         return numMatch(lg, op, v, v2);
        if (fk === 'act_study_time')     return numMatch(Math.floor(sm / 60), op, v, v2);
        if (fk === 'cert_has')           return strMatch(ct > 0 ? 'Yes' : 'No', op, v);
        if (fk === 'cert_count')         return numMatch(ct, op, v, v2);
        if (fk === 'cert_type')          return strMatch(_certTypes[i % _certTypes.length], op, v);
        if (fk === 'cert_status')        return strMatch(_certStat[i % _certStat.length], op, v);
        if (fk === 'group_name')         return strMatch(_groups[i % _groups.length], op, v);
        if (fk === 'group_seat_type')    return strMatch(_seatTypes[i % _seatTypes.length], op, v);
        if (fk === 'group_seat_status')  return strMatch(_statuses[i % _statuses.length] === 'Active' ? 'Active' : 'Inactive', op, v);
        return true;
      });
      return segAdvMatchMode === 'all' ? checks.every(Boolean) : checks.some(Boolean);
    });
    setSegMatchedUserIds(filtered.map(u => u.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segFiltersApplied, segAdvFilters, segAdvMatchMode]);

  const addSegAdvFilter = (def: FilterDef) => {
    setSegAdvFilters(prev => [...prev, { id: `${def.key}_${Date.now()}`, category: def.category, field: def.key, label: def.label, type: def.type, operator: def.defaultOp ?? 'is', value: '', value2: '' }]);
    setSegAdvPickerSearch('');
  };
  const removeSegAdvFilter = (id: string) => setSegAdvFilters(prev => prev.filter(f => f.id !== id));
  const updateSegAdvFilter = (id: string, patch: Partial<AdvFilter>) => setSegAdvFilters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

  const openNewSegment = () => {
    setEditingSegment(null);
    setSegName(''); setSegDesc(''); setSegColor(0); setSegIcon('👥');
    setSegFilters({}); setSegAdvFilters([]); setSegAdvMatchMode('all');
    setSegAdvPickerSearch(''); setSegAdvPickerCat('all'); setSegFiltersApplied(false);
    setSegMatchedUserIds(users.map(u => u.id));
    setSegStep(1); openDetail('__segment__');
  };
  const openEditSegment = (seg: Segment) => {
    setEditingSegment(seg);
    setSegName(seg.name); setSegDesc(seg.description);
    setSegColor(SEGMENT_COLORS.findIndex(c => c.bg === seg.color));
    setSegIcon(seg.icon); setSegFilters(seg.filters);
    setSegAdvFilters([]); setSegAdvMatchMode('all');
    setSegAdvPickerSearch(''); setSegAdvPickerCat('all'); setSegFiltersApplied(false);
    setSegMatchedUserIds(users.map(u => u.id));
    setSegStep(1); openDetail('__segment__');
  };
  const saveSegment = async () => {
    const userCount = segMatchedUserIds.length;
    if (editingSegment) {
      const updated: Segment = { ...editingSegment, name: segName, description: segDesc, color: SEGMENT_COLORS[segColor].bg, icon: segIcon, filters: segFilters, userCount };
      setSegments(prev => prev.map(s => s.id === editingSegment.id ? updated : s));
      await supabase.from('kv_store_d60f2898').upsert({ key: `${segKvPrefix}${updated.id}`, value: updated });
    } else {
      const newSeg: Segment = {
        id: Date.now().toString(), name: segName, description: segDesc,
        color: SEGMENT_COLORS[segColor].bg, icon: segIcon,
        filters: segFilters, userCount,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setSegments(prev => [...prev, newSeg]);
      await supabase.from('kv_store_d60f2898').upsert({ key: `${segKvPrefix}${newSeg.id}`, value: newSeg });
    }
    closeDetail();
  };
  const deleteSegment = async (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
    await supabase.from('kv_store_d60f2898').delete().eq('key', `${segKvPrefix}${id}`);
  };
  const [segDeleteConfirm, setSegDeleteConfirm] = useState<string | null>(null);
  const [analyticsFilter, setAnalyticsFilter] = useState<string>('All');
  // Slide-in navigation state
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  // Sys-health accordion (keeps its own open state)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) => {
    setOpenSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Detail panel — shared filter
  const [detailDateRange, setDetailDateRange] = useState('last-30');

  // Editable thresholds per section
  const [thresholds, setThresholds] = useState({
    completionTarget: 80,    // % target for completion rate
    atRiskBelow: 30,         // % below which a user is "at risk"
    inactiveDays: 30,        // days without login = inactive
    reEngageDays: 60,        // days without enrollment = needs re-engagement
    churnAlertPct: 5,        // churn % that triggers an alert
    growthTargetPct: 10,     // monthly growth target %
    bounceRateMax: 50,       // bounce rate % that triggers alert
    sessionTimeTarget: 15,   // avg session time target (minutes)
    passingScore: 70,        // minimum passing score %
    enrollmentGoal: 500,     // monthly enrollment goal
    conversionTarget: 5,     // visit → enrollment conversion % target
    revenueGoal: 100000,     // monthly revenue goal ($)
    seatUtilMin: 70,         // seat utilization % below which alert fires
  });
  const setThreshold = (key: keyof typeof thresholds, val: number) =>
    setThresholds(p => ({ ...p, [key]: val }));

  // Alert toggles per section
  const [alerts, setAlerts] = useState({
    atRiskAlerts: true,
    milestoneNotifs: true,
    inactiveAlerts: true,
    newUserNotifs: false,
    churnAlerts: true,
    growthReports: false,
    engagementAlerts: false,
    bounceRateAlerts: true,
    qualityAlerts: true,
    certAlerts: false,
    revenueAlerts: true,
    trafficAlerts: false,
    seatAlerts: true,
    groupReports: false,
  });
  const setAlert = (key: keyof typeof alerts, val: boolean) =>
    setAlerts(p => ({ ...p, [key]: val }));

  // User Groups & Seat inline dropdown
  const [seatDropdownOpen, setSeatDropdownOpen] = useState(false);
  const [seatSubView, setSeatSubView] = useState<string | null>(null);
  const seatSubOptions = [
    'Monthly Seat Offering Enrollments',
    'Monthly Seat Offering Registrants',
    'User Group Monthly Enrollments',
    'User Group Monthly Registrants',
  ] as const;

  // Marketing Performance inline dropdown
  const [marketingDropdownOpen, setMarketingDropdownOpen] = useState(false);
  const [marketingSubView, setMarketingSubView] = useState<string | null>(null);
  const marketingSubOptions = [
    'Daily Campaign Registrations (First-click)',
    'Daily Campaign Registration (Last-click)',
    'New App Users From Campaign (First-click)',
    'New App Users From Campaign (Last-click)',
    'Daily In-app Purchasers From Campaign (First-click)',
    'Daily In-app Purchasers From Campaign (Last-click)',
    'Daily Funnel Completion From Campaign (First-click)',
    'Daily Funnel Completion From Campaign (Last-click)',
    'Daily Course Enrollments From Campaign (First-click)',
    'Daily Course Enrollments From Campaign (Last-click)',
  ] as const;

  // Learning Performances inline dropdown
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
  const [learningSubView, setLearningSubView] = useState<string | null>(null);
  const learningSubOptions = [
    'Most Certificates Achievers',
    'Most Accomplished Learners',
    'Most Course Enrollments',
    'Most Unfinished Courses',
    'Study Time',
    'Most Avg. Score',
    'Course Average < 20',
    'Course Average Score 20 - 59',
    'Course Average Score 60 - 79',
    'Course Average Score 80 - 89',
    'Course Average Score 90 - 100',
    'Certified Users',
  ] as const;

  // Users Engagement inline dropdown
  const [engagementDropdownOpen, setEngagementDropdownOpen] = useState(false);
  const [engagementSubView, setEngagementSubView] = useState<string | null>(null);
  const engagementSubOptions = [
    'Community Top Contributors',
    'Weekly Course Discussions Engagement',
    'Inactive Community Members',
    'Most Community Posts',
    'Users With Mobile App',
    'Mobile Users',
    'Tablet Users',
    'Desktop/Laptop Users',
    'Weekly Course Top TTV Users',
    'Monthly Mobile Users',
    'Monthly Mobile App Users',
  ] as const;

  // Users Growth inline dropdown
  const [growthDropdownOpen, setGrowthDropdownOpen] = useState(false);
  const [growthSubView, setGrowthSubView] = useState<string | null>(null);
  const growthSubOptions = [
    'Registered Today',
    'Registered This Week',
    'Registered In a Month',
    'Weekly Enrollments',
    'Weekly Paid Enrollments',
    'Weekly Free Enrollments',
    'Weekly Course Enrollments',
  ] as const;

  // User Progress inline dropdown
  const [progressDropdownOpen, setProgressDropdownOpen] = useState(false);
  const [progressSubView, setProgressSubView] = useState<string | null>(null);
  const progressSubOptions = [
    'Overall User Progress',
  ] as const;

  // User Activity inline dropdown
  const [activityDropdownOpen, setActivityDropdownOpen] = useState(false);
  const [activitySubView, setActivitySubView] = useState<string | null>(null);
  const activitySubOptions = [
    'Monthly Active Users',
    'Logged In in the 30 days',
    'Not Enrolled During the Last 2 Months',
    'Users At Risk',
    'Users At Risk (enrolled and inactive)',
    'Course Abandonment Watchlist',
    'Users Who Have Initiated a Course',
  ] as const;

  // Descriptions shown beneath each sub-option label in the dropdown
  const subOptionDescriptions: Record<string, string> = {
    // User Progress
    'Overall User Progress': 'Completion rates, lesson progress & milestone achievements across all users',
    // User Activity
    'Monthly Active Users': 'Users who completed at least one lesson in the current month',
    'Logged In in the 30 days': 'All users who logged into the platform within the last 30 days',
    'Not Enrolled During the Last 2 Months': 'Users with no new course enrollments in the past 60 days',
    'Users At Risk': 'Learners falling below the completion threshold who need intervention',
    'Users At Risk (enrolled and inactive)': 'Enrolled users with no activity for the configured inactivity period',
    'Course Abandonment Watchlist': 'Users who started a course but haven\'t progressed in over 14 days',
    'Users Who Have Initiated a Course': 'Users who have opened at least one course lesson',
    // Users Growth
    'Registered Today': 'New user accounts created in the last 24 hours',
    'Registered This Week': 'New registrations from the current calendar week',
    'Registered In a Month': 'Total new users who joined in the current month',
    'Weekly Enrollments': 'Total course enrollments recorded in the past 7 days',
    'Weekly Paid Enrollments': 'Paid course enrollments completed in the past 7 days',
    'Weekly Free Enrollments': 'Free course enrollments completed in the past 7 days',
    'Weekly Course Enrollments': 'Per-course breakdown of enrollments from the past week',
    // Users Engagement
    'Community Top Contributors': 'Users ranked by posts, replies & reactions in community forums',
    'Weekly Course Discussions Engagement': 'Discussion activity within courses over the past 7 days',
    'Inactive Community Members': 'Users who haven\'t participated in community discussions recently',
    'Most Community Posts': 'Leaderboard of users with the highest total post count',
    'Users With Mobile App': 'Users who have installed and linked the mobile application',
    'Mobile Users': 'Sessions initiated from mobile phone devices',
    'Tablet Users': 'Sessions initiated from tablet devices',
    'Desktop/Laptop Users': 'Sessions initiated from desktop or laptop browsers',
    'Weekly Course Top TTV Users': 'Users with the highest total time-to-value in courses this week',
    'Monthly Mobile Users': 'Unique mobile device sessions recorded in the current month',
    'Monthly Mobile App Users': 'Users who accessed the platform via mobile app this month',
    // Learning Performances
    'Most Certificates Achievers': 'Users who have earned the highest number of certificates',
    'Most Accomplished Learners': 'Learners ranked by total completed courses and assessments',
    'Most Course Enrollments': 'Users with the highest number of active course enrollments',
    'Most Unfinished Courses': 'Users with the most courses started but not completed',
    'Study Time': 'Total and average time spent on course content per user',
    'Most Avg. Score': 'Users ranked by their average assessment score across all courses',
    'Course Average < 20': 'Courses or users with an average score below 20%',
    'Course Average Score 20 - 59': 'Courses or users with an average score between 20% and 59%',
    'Course Average Score 60 - 79': 'Courses or users with an average score between 60% and 79%',
    'Course Average Score 80 - 89': 'Courses or users with an average score between 80% and 89%',
    'Course Average Score 90 - 100': 'Courses or users achieving top scores of 90% to 100%',
    'Certified Users': 'All users who hold at least one active certification',
    // Marketing Performance
    'Daily Campaign Registrations (First-click)': 'Registrations attributed to the first ad or campaign touchpoint',
    'Daily Campaign Registration (Last-click)': 'Registrations attributed to the final campaign touchpoint before sign-up',
    'New App Users From Campaign (First-click)': 'New app installs attributed to the first campaign interaction',
    'New App Users From Campaign (Last-click)': 'New app installs attributed to the last campaign interaction',
    'Daily In-app Purchasers From Campaign (First-click)': 'In-app purchases traced back to the first campaign click',
    'Daily In-app Purchasers From Campaign (Last-click)': 'In-app purchases traced back to the last campaign click',
    'Daily Funnel Completion From Campaign (First-click)': 'Full funnel completions attributed to the first campaign touch',
    'Daily Funnel Completion From Campaign (Last-click)': 'Full funnel completions attributed to the last campaign touch',
    'Daily Course Enrollments From Campaign (First-click)': 'Course enrollments attributed to the first campaign interaction',
    'Daily Course Enrollments From Campaign (Last-click)': 'Course enrollments attributed to the last campaign interaction',
    // User Groups & Seat
    'Monthly Seat Offering Enrollments': 'Total enrollments made through seat-based offerings this month',
    'Monthly Seat Offering Registrants': 'New registrants who joined via a seat offering this month',
    'User Group Monthly Enrollments': 'Enrollments broken down by user group for the current month',
    'User Group Monthly Registrants': 'New user group members registered in the current month',
  };

  const openDetail = (name: string) => {
    setCurrentSection(name);
    requestAnimationFrame(() => requestAnimationFrame(() => setDetailVisible(true)));
  };
  const closeDetail = () => {
    setDetailVisible(false);
    setTimeout(() => setCurrentSection(null), 300);
  };

  // ── Back-bar action menus ─────────────────────────────────────────────────
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [barToast, setBarToast] = useState<string | null>(null);
  const fireBarToast = (msg: string) => {
    setBarToast(msg);
    setShowTagMenu(false);
    setShowMoreMenu(false);
    setTimeout(() => setBarToast(null), 2500);
  };
  useEffect(() => {
    if (!showTagMenu && !showMoreMenu) return;
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-bar-menu]')) { setShowTagMenu(false); setShowMoreMenu(false); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showTagMenu, showMoreMenu]);

  // ── Advanced filter builder ───────────────────────────────────────────────
  type AdvFilter = { id: string; category: string; field: string; label: string; type: string; operator: string; value: string; value2: string };
  type AdvFilterCat = 'all' | 'user' | 'course' | 'activity' | 'certificate' | 'group';
  type FilterDef = { key: string; label: string; category: AdvFilterCat; type: 'select' | 'text' | 'numberOp' | 'courseSelect'; options?: string[]; defaultOp?: string };
  const ADV_FILTER_CATALOG: FilterDef[] = [
    // User
    { key: 'user_role',         label: 'User role',           category: 'user',        type: 'select',     options: ['Learner','Manager','Admin'],                              defaultOp: 'is' },
    { key: 'user_status',       label: 'Account status',      category: 'user',        type: 'select',     options: ['Active','Inactive','Suspended'],                          defaultOp: 'is' },
    { key: 'user_tag',          label: 'Has tag',             category: 'user',        type: 'select',     options: ['VIP','New user','At risk','High performer'],              defaultOp: 'is' },
    { key: 'user_email',        label: 'Email',               category: 'user',        type: 'text',                                                                            defaultOp: 'contains' },
    { key: 'user_username',     label: 'Username',            category: 'user',        type: 'text',                                                                            defaultOp: 'contains' },
    { key: 'user_account_type', label: 'Account type',        category: 'user',        type: 'select',     options: ['Free','Paid','Trial'],                                    defaultOp: 'is' },
    { key: 'user_registered',   label: 'Registered',          category: 'user',        type: 'select',     options: ['Today','Last 7 days','Last 30 days','Last 3 months','Over 1 year ago'], defaultOp: 'within' },
    { key: 'user_country',      label: 'Country / Region',    category: 'user',        type: 'text',                                                                            defaultOp: 'contains' },
    // Course
    { key: 'course_enrolled',   label: 'Enrolled in course',  category: 'course',      type: 'courseSelect',                                                                    defaultOp: 'is' },
    { key: 'course_completed',  label: 'Completed course',    category: 'course',      type: 'select',     options: ['Yes','No'],                                               defaultOp: 'is' },
    { key: 'course_progress',   label: 'Course progress',     category: 'course',      type: 'numberOp',                                                                        defaultOp: '≥' },
    { key: 'course_score',      label: 'Avg score',           category: 'course',      type: 'numberOp',                                                                        defaultOp: '≥' },
    { key: 'course_enroll_type',label: 'Enrollment type',     category: 'course',      type: 'select',     options: ['Paid','Free','Seat'],                                     defaultOp: 'is' },
    { key: 'course_assessment', label: 'Assessment type',     category: 'course',      type: 'select',     options: ['Quiz','Assignment','Final exam'],                         defaultOp: 'is' },
    // Activity
    { key: 'act_last_active',   label: 'Last active',         category: 'activity',    type: 'select',     options: ['Today','Last 7 days','Last 30 days','Last 90 days'],      defaultOp: 'within' },
    { key: 'act_platform',      label: 'Platform',            category: 'activity',    type: 'select',     options: ['Web','Mobile app','Any'],                                 defaultOp: 'is' },
    { key: 'act_logins',        label: 'Login count',         category: 'activity',    type: 'numberOp',                                                                        defaultOp: '≥' },
    { key: 'act_study_time',    label: 'Study time (hrs)',    category: 'activity',    type: 'numberOp',                                                                        defaultOp: '≥' },
    // Certificate
    { key: 'cert_has',          label: 'Has certificates',    category: 'certificate', type: 'select',     options: ['Yes','No'],                                               defaultOp: 'is' },
    { key: 'cert_count',        label: 'Certificate count',   category: 'certificate', type: 'numberOp',                                                                        defaultOp: '≥' },
    { key: 'cert_type',         label: 'Certificate type',    category: 'certificate', type: 'select',     options: ['Course completion','Skill mastery','Certification exam'], defaultOp: 'is' },
    { key: 'cert_status',       label: 'Certificate status',  category: 'certificate', type: 'select',     options: ['Active','Expired','Revoked'],                             defaultOp: 'is' },
    // Group
    { key: 'group_name',        label: 'User group',          category: 'group',       type: 'select',     options: ['Team A','Team B','Managers','Enterprise','Trial users'],  defaultOp: 'is' },
    { key: 'group_seat_type',   label: 'Seat type',           category: 'group',       type: 'select',     options: ['Assigned','Unassigned'],                                  defaultOp: 'is' },
    { key: 'group_seat_status', label: 'Seat status',         category: 'group',       type: 'select',     options: ['Active','Inactive'],                                      defaultOp: 'is' },
  ];
  const ADV_CAT_LABELS: Record<AdvFilterCat, string> = { all: 'All', user: 'User', course: 'Course', activity: 'Activity', certificate: 'Certificate', group: 'Group' };
  const [advFilters, setAdvFilters] = useState<AdvFilter[]>([]);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [filterPickerSearch, setFilterPickerSearch] = useState('');
  const [filterPickerCat, setFilterPickerCat] = useState<AdvFilterCat>('all');
  const [advMatchMode, setAdvMatchMode] = useState<'all' | 'any'>('all');
  const addAdvFilter = (def: FilterDef) => {
    setAdvFilters(prev => [...prev, { id: `${def.key}_${Date.now()}`, category: def.category, field: def.key, label: def.label, type: def.type, operator: def.defaultOp ?? 'is', value: '', value2: '' }]);
    setShowFilterPicker(false);
    setFilterPickerSearch('');
  };
  const removeAdvFilter = (id: string) => setAdvFilters(prev => prev.filter(f => f.id !== id));
  const updateAdvFilter = (id: string, patch: Partial<AdvFilter>) => setAdvFilters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  const resetAdvFilters = () => { setAdvFilters([]); setAdvMatchMode('all'); };

  // ── Contextual filter state (Panel 2 filter panel) ──────────────────────
  const [filterTab, setFilterTab] = useState<'select-users' | 'advanced'>('select-users');
  const [usersPage, setUsersPage] = useState(1);
  const [segUsersPage, setSegUsersPage] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const USERS_PER_PAGE = 15;
  useEffect(() => { setUsersPage(1); }, [currentSection]);

  // Collapse the slide panel whenever the top-level analytics view changes
  // (e.g. clicking "AI Insights" while a detail panel is open would otherwise
  //  leave the page stuck on panel 2 showing a blank screen)
  useEffect(() => {
    setDetailVisible(false);
    const t = setTimeout(() => setCurrentSection(null), 300);
    return () => clearTimeout(t);
  }, [analyticsView]);
  useEffect(() => {
    if (!showFilterPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filter-picker]')) setShowFilterPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilterPicker]);
  const [progressStat, setProgressStat] = useState<'completion' | 'finished' | 'inprogress' | 'score'>('completion');
  const [prodStat, setProdStat] = useState<'courses' | 'completion' | 'rating' | 'enrollments' | 'dropoffs'>('courses');
  const [prodTab, setProdTab] = useState<'analytics' | 'all-courses'>('analytics');
  const [prodCoursesPage, setProdCoursesPage] = useState(1);
  const PROD_COURSES_PER_PAGE = 15;
  const [prodBarRange, setProdBarRange] = useState<7 | 30 | 180 | 365>(30);
  const [prodBarRangeOpen, setProdBarRangeOpen] = useState(false);
  const [prodLineRange, setProdLineRange] = useState<7 | 30 | 180 | 365>(30);
  const [prodLineRangeOpen, setProdLineRangeOpen] = useState(false);
  const [prodHardRange, setProdHardRange] = useState<7 | 30 | 180 | 365>(30);
  const [prodHardRangeOpen, setProdHardRangeOpen] = useState(false);
  const [prodDropRange, setProdDropRange] = useState<7 | 30 | 180 | 365>(30);
  const [prodDropRangeOpen, setProdDropRangeOpen] = useState(false);

  // ── Scheduled Reports state ───────────────────────────────────────────────
  type ScheduledReport = {
    id: string; name: string; segment: string; reportType: string;
    frequency: 'Daily' | 'Weekly' | 'Monthly';
    time: string; timezone: string; dayLabel?: string;
    timePeriod: string;
    recipients: string[]; format: 'PDF' | 'CSV' | 'Excel';
    notifyUsers: boolean;
    emailTo: string[]; emailSubject: string; emailMessage: string;
    status: 'active' | 'paused';
    lastSent?: string; nextRun: string; createdAt: string;
  };
  const [schedReports, setSchedReports] = useState<ScheduledReport[]>([]);
  const [schedLoading, setSchedLoading] = useState(true);
  const schedKvPrefix = `scheduled-report:${companyId || 'global'}:`;

  useEffect(() => {
    setSchedLoading(true);
    supabase
      .from('kv_store_d60f2898')
      .select('value')
      .like('key', `${schedKvPrefix}%`)
      .then(({ data }) => {
        if (data && data.length > 0) setSchedReports(data.map((r: { value: ScheduledReport }) => r.value));
        setSchedLoading(false);
      });
  }, [companyId]);
  const [schedFilter, setSchedFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [schedSearch, setSchedSearch] = useState('');
  const [schedPage, setSchedPage] = useState(1);
  const SCHED_PER_PAGE = 15;
  const [schedDeleteConfirm, setSchedDeleteConfirm] = useState<string | null>(null);
  // New schedule form state
  type SchedFormState = {
    name: string; segment: string; reportType: string;
    frequency: 'Daily' | 'Weekly' | 'Monthly'; time: string; timezone: string; dayLabel: string;
    timePeriod: string; format: 'PDF' | 'CSV' | 'Excel';
    notifyUsers: boolean; emailTo: string; emailSubject: string; emailMessage: string;
  };
  const SCHED_FORM_DEFAULT: SchedFormState = {
    name: '', segment: 'All Users', reportType: 'User Progress',
    frequency: 'Weekly', time: '08:00', timezone: 'UTC+8', dayLabel: 'Monday',
    timePeriod: 'Last 30 days', format: 'PDF',
    notifyUsers: false, emailTo: '', emailSubject: '', emailMessage: '',
  };
  const [schedForm, setSchedForm] = useState<SchedFormState>(SCHED_FORM_DEFAULT);
  const [schedFormOpen, setSchedFormOpen] = useState(false);
  const [schedEditId, setSchedEditId] = useState<string | null>(null);
  const [activityStat, setActivityStat] = useState<'active' | 'loggedin' | 'notenrolled' | 'avglogins'>('active');
  const [growthStat, setGrowthStat] = useState<'total' | 'new' | 'returning' | 'churn'>('total');
  const [engagementStat, setEngagementStat] = useState<'interactions' | 'bounce' | 'pages' | 'session'>('interactions');
  const [learningStat, setLearningStat] = useState<'enrollments' | 'courses' | 'certificates' | 'category'>('enrollments');
  const [marketingStat, setMarketingStat] = useState<'revenue' | 'arpu' | 'visits' | 'conversion'>('revenue');
  const [seatStat, setSeatStat] = useState<'total' | 'active' | 'utilization' | 'available'>('total');
  const [fCourse, setFCourse] = useState('');
  const [fScoreOp, setFScoreOp] = useState('≥');
  const [fScore, setFScore] = useState('');
  const [fProgressOp, setFProgressOp] = useState('≥');
  const [fProgress, setFProgress] = useState('');
  const [fCompleted, setFCompleted] = useState('');
  const [fPeriod, setFPeriod] = useState('');
  const [fPlatform, setFPlatform] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fUsername, setFUsername] = useState('');
  const [fTag, setFTag] = useState('');
  const [fRegPeriod, setFRegPeriod] = useState('');
  const [fRegValue, setFRegValue] = useState('');
  const resetFilters = () => {
    setFCourse(''); setFScoreOp('≥'); setFScore(''); setFProgressOp('≥');
    setFProgress(''); setFCompleted(''); setFPeriod(''); setFPlatform('');
    setFEmail(''); setFUsername(''); setFTag(''); setFRegPeriod(''); setFRegValue('');
  };

  // ── User Activity conversational filter ──────────────────────────────────
  type UAKind = 'activity' | 'status' | 'platform' | 'logins' | 'catalog';
  type UACondition = {
    id: string; kind: UAKind; v1: string; v2: string; v3: string;
    // catalog-sourced extras:
    field?: string; label?: string; category?: string; inputType?: string; options?: string[];
  };
  const UA_DEFAULTS: Record<Exclude<UAKind,'catalog'>, { v1: string; v2: string; v3: string }> = {
    activity: { v1: 'active', v2: 'exactly', v3: 'this month' },
    status:   { v1: 'active', v2: '',        v3: '' },
    platform: { v1: 'web',   v2: '',         v3: '' },
    logins:   { v1: '≥',     v2: '5',        v3: '' },
  };
  const uaGetOps = (type?: string) => {
    if (type === 'text')     return ['contains','does not contain','is','starts with'];
    if (type === 'numberOp') return ['≥','≤','=','≠','between'];
    return ['is','is not'];
  };
  const [uaConditions, setUaConditions] = useState<UACondition[]>([
    { id: 'ua0', kind: 'activity', v1: 'active', v2: 'exactly', v3: 'this month' },
  ]);
  const [showUaAddMenu, setShowUaAddMenu] = useState(false);
  const [uaPickerSearch, setUaPickerSearch] = useState('');
  const [uaPickerCat, setUaPickerCat] = useState<AdvFilterCat>('all');
  const addUaCondition = (kind: Exclude<UAKind,'catalog'>) => {
    setUaConditions(prev => [...prev, { id: `ua${Date.now()}`, kind, ...UA_DEFAULTS[kind] }]);
    setShowUaAddMenu(false);
  };
  const addUaFromCatalog = (def: FilterDef) => {
    setUaConditions(prev => [...prev, {
      id: `ua${Date.now()}`, kind: 'catalog',
      v1: def.defaultOp ?? (def.type === 'text' ? 'contains' : 'is'),
      v2: '', v3: '',
      field: def.key, label: def.label, category: def.category,
      inputType: def.type, options: def.options,
    }]);
    setShowUaAddMenu(false);
    setUaPickerSearch('');
  };
  const removeUaCondition = (id: string) =>
    setUaConditions(prev => prev.filter(c => c.id !== id));
  const updateUaCondition = (id: string, patch: Partial<UACondition>) =>
    setUaConditions(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  useEffect(() => {
    if (!showUaAddMenu) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-ua-add]')) { setShowUaAddMenu(false); setUaPickerSearch(''); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showUaAddMenu]);

  // Template for each sub-option  ─────────────────────────────────────────
  const subOptionTemplate: Record<string, string> = {
    'Overall User Progress': 'course-progress',
    'Monthly Active Users': 'user-activity',
    'Logged In in the 30 days': 'user-activity',
    'Not Enrolled During the Last 2 Months': 'enrollment',
    'Users At Risk': 'course-progress',
    'Users At Risk (enrolled and inactive)': 'user-activity',
    'Course Abandonment Watchlist': 'course-progress',
    'Users Who Have Initiated a Course': 'enrollment',
    'Registered Today': 'registration',
    'Registered This Week': 'registration',
    'Registered In a Month': 'registration',
    'Weekly Enrollments': 'enrollment',
    'Weekly Paid Enrollments': 'enrollment',
    'Weekly Free Enrollments': 'enrollment',
    'Weekly Course Enrollments': 'enrollment',
    'Community Top Contributors': 'community',
    'Weekly Course Discussions Engagement': 'community',
    'Inactive Community Members': 'community',
    'Most Community Posts': 'community',
    'Users With Mobile App': 'device',
    'Mobile Users': 'device',
    'Tablet Users': 'device',
    'Desktop/Laptop Users': 'device',
    'Weekly Course Top TTV Users': 'user-activity',
    'Monthly Mobile Users': 'device',
    'Monthly Mobile App Users': 'device',
    'Most Certificates Achievers': 'certificate',
    'Most Accomplished Learners': 'course-progress',
    'Most Course Enrollments': 'enrollment',
    'Most Unfinished Courses': 'course-progress',
    'Study Time': 'course-progress',
    'Most Avg. Score': 'score',
    'Course Average < 20': 'score',
    'Course Average Score 20 - 59': 'score',
    'Course Average Score 60 - 79': 'score',
    'Course Average Score 80 - 89': 'score',
    'Course Average Score 90 - 100': 'score',
    'Certified Users': 'certificate',
    'Daily Campaign Registrations (First-click)': 'campaign',
    'Daily Campaign Registration (Last-click)': 'campaign',
    'New App Users From Campaign (First-click)': 'campaign',
    'New App Users From Campaign (Last-click)': 'campaign',
    'Daily In-app Purchasers From Campaign (First-click)': 'campaign',
    'Daily In-app Purchasers From Campaign (Last-click)': 'campaign',
    'Daily Funnel Completion From Campaign (First-click)': 'campaign',
    'Daily Funnel Completion From Campaign (Last-click)': 'campaign',
    'Daily Course Enrollments From Campaign (First-click)': 'campaign',
    'Daily Course Enrollments From Campaign (Last-click)': 'campaign',
    'Monthly Seat Offering Enrollments': 'seat',
    'Monthly Seat Offering Registrants': 'seat',
    'User Group Monthly Enrollments': 'seat',
    'User Group Monthly Registrants': 'seat',
  };

  // Filter chip → expand that section's dropdown in Panel 1 (don't navigate to Panel 2)
  useEffect(() => {
    setProgressDropdownOpen(analyticsFilter === 'User Progress');
    setActivityDropdownOpen(analyticsFilter === 'User Activity');
    setGrowthDropdownOpen(analyticsFilter === 'Users Growth');
    setEngagementDropdownOpen(analyticsFilter === 'Users Engagement');
    setLearningDropdownOpen(analyticsFilter === 'Learning Performances');
    setMarketingDropdownOpen(analyticsFilter === 'Marketing Performance');
    setSeatDropdownOpen(analyticsFilter === 'User Groups & Seat');
    if (analyticsFilter === 'All') closeDetail();
  }, [analyticsFilter]);

  const showSection = (name: string) => analyticsFilter === 'All' || analyticsFilter === name;

  // Filter courses by company if companyId is provided
  let companyCourses: Course[];
  if (companyId) {
    // When viewing a specific company, filter courses by companyId
    companyCourses = courses.filter(course => course.companyId === companyId);
  } else {
    // When not viewing a specific company, use courses enrolled by the users
    const companyEnrolledCourseIds = new Set(users.flatMap(user => user.enrolledCourses));
    companyCourses = courses.filter(course => companyEnrolledCourseIds.has(course.id));
  }
  
  // Calculate enrollments from company users only
  const totalEnrollments = users.reduce((sum, user) => sum + user.enrolledCourses.length, 0);
  
  // Calculate revenue based on company enrollments
  const totalRevenue = users.reduce((sum, user) => {
    return sum + user.enrolledCourses.reduce((courseSum, courseId) => {
      const course = courses.find(c => c.id === courseId);
      const price = parseFloat(course?.price?.replace('$', '') || '0');
      return courseSum + price;
    }, 0);
  }, 0);

  // Calculate completion rate from actual company user data
  const completedCourses = users.reduce((sum, user) => {
    return sum + user.enrolledCourses.filter(courseId => {
      const course = courses.find(c => c.id === courseId);
      if (!course) return false;
      const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
      const courseLessons = course.modules.flatMap(m => m.lessons.map(l => l.id));
      const completedLessons = courseLessons.filter(lessonId => 
        user.completedLessons.includes(lessonId)
      ).length;
      return completedLessons === totalLessons;
    }).length;
  }, 0);
  
  const avgCompletionRate = totalEnrollments > 0 
    ? Math.round((completedCourses / totalEnrollments) * 100) 
    : 0;
    
  const activeUsers = users.filter(user => user.completedLessons.length > 0).length;

  // Top performing courses
  const topCourses = [...companyCourses]
    .sort((a, b) => (b.studentsEnrolled || 0) - (a.studentsEnrolled || 0))
    .slice(0, 5);

  // Monthly data (mock)
  const monthlyData = [
    { month: 'Jan', enrollments: 120, revenue: 48000 },
    { month: 'Feb', enrollments: 150, revenue: 58000 },
    { month: 'Mar', enrollments: 180, revenue: 72000 },
    { month: 'Apr', enrollments: 210, revenue: 84000 },
    { month: 'May', enrollments: 240, revenue: 96000 },
    { month: 'Jun', enrollments: 280, revenue: 112000 },
  ];

  // Website traffic data (mock)
  const trafficData = [
    { month: 'Jan', visits: 3200, uniqueVisitors: 2450, pageViews: 12800 },
    { month: 'Feb', visits: 3850, uniqueVisitors: 2920, pageViews: 15400 },
    { month: 'Mar', visits: 4200, uniqueVisitors: 3180, pageViews: 16800 },
    { month: 'Apr', visits: 4650, uniqueVisitors: 3500, pageViews: 18600 },
    { month: 'May', visits: 5100, uniqueVisitors: 3850, pageViews: 20400 },
    { month: 'Jun', visits: 5800, uniqueVisitors: 4320, pageViews: 23200 },
  ];

  // Login activity data (mock)
  const loginData = [
    { month: 'Jan', logins: 850, newUsers: 125, returningUsers: 725 },
    { month: 'Feb', logins: 980, newUsers: 145, returningUsers: 835 },
    { month: 'Mar', logins: 1120, newUsers: 168, returningUsers: 952 },
    { month: 'Apr', logins: 1280, newUsers: 192, returningUsers: 1088 },
    { month: 'May', logins: 1450, newUsers: 218, returningUsers: 1232 },
    { month: 'Jun', logins: 1680, newUsers: 252, returningUsers: 1428 },
  ];

  // User click/interaction data (mock)
  const clickData = [
    { action: 'Course Page Views', clicks: 12450, percentage: 28 },
    { action: 'Enroll Button Clicks', clicks: 3280, percentage: 7.5 },
    { action: 'Video Play', clicks: 18920, percentage: 43 },
    { action: 'Dashboard Visits', clicks: 5640, percentage: 13 },
    { action: 'Profile Updates', clicks: 1820, percentage: 4 },
    { action: 'Search Queries', clicks: 2980, percentage: 6.8 },
  ];

  // Recent activity log (mock)
  const recentActivity = [
    { time: '2 mins ago', user: 'Sarah Johnson', action: 'Enrolled in "Advanced JavaScript"', type: 'enrollment' },
    { time: '5 mins ago', user: 'Mike Chen', action: 'Completed lesson: React Hooks', type: 'completion' },
    { time: '12 mins ago', user: 'Emma Davis', action: 'Logged in from Chrome, Desktop', type: 'login' },
    { time: '18 mins ago', user: 'John Smith', action: 'Clicked "View Course Details" on Python course', type: 'click' },
    { time: '25 mins ago', user: 'Lisa Wang', action: 'Searched for "machine learning"', type: 'search' },
    { time: '32 mins ago', user: 'Tom Brown', action: 'Updated profile information', type: 'update' },
    { time: '40 mins ago', user: 'Amy Wilson', action: 'Watched video: Introduction to CSS', type: 'video' },
    { time: '45 mins ago', user: 'David Lee', action: 'Logged in from Safari, Mobile', type: 'login' },
  ];

  // Derived user metrics
  const loggedIn30Days = Math.round(users.length * 0.78);
  const notEnrolled2Months = Math.round(users.length * 0.22);
  const newUsersThisMonth = Math.round(users.length * 0.08);
  const seatUtilization = users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0;
  const topCategory = Array.from(new Set(courses.map(c => c.category)))
    .map(cat => ({ cat, count: courses.filter(c => c.category === cat).reduce((s, c) => s + (c.studentsEnrolled || 0), 0) }))
    .sort((a, b) => b.count - a.count)[0]?.cat ?? 'N/A';
  const mockGroups = [
    { name: 'Learners',  count: Math.round(users.length * 0.72), active: Math.round(users.length * 0.72 * 0.82) },
    { name: 'Managers',  count: Math.round(users.length * 0.18), active: Math.round(users.length * 0.18 * 0.90) },
    { name: 'Admins',    count: Math.round(users.length * 0.06), active: Math.round(users.length * 0.06 * 0.95) },
    { name: 'Guests',    count: Math.round(users.length * 0.04), active: Math.round(users.length * 0.04 * 0.40) },
  ];

  // Calculate daily averages
  const avgDailyVisits = Math.round(trafficData[trafficData.length - 1].visits / 30);
  const avgDailyLogins = Math.round(loginData[loginData.length - 1].logins / 30);
  const totalClicks = clickData.reduce((sum, item) => sum + item.clicks, 0);

  // System health data
  const systemUptime = 99.8;
  const errorRate = 0.12;
  const failedTransactions = 8;
  const apiIntegrations = [
    { name: 'Payment Gateway', status: 'operational', responseTime: 145, lastCheck: '2 mins ago' },
    { name: 'Video CDN', status: 'operational', responseTime: 78, lastCheck: '1 min ago' },
    { name: 'Email Service', status: 'operational', responseTime: 312, lastCheck: '3 mins ago' },
    { name: 'Analytics API', status: 'degraded', responseTime: 1823, lastCheck: '5 mins ago' },
    { name: 'User Authentication', status: 'operational', responseTime: 56, lastCheck: '1 min ago' },
    { name: 'Cloud Storage', status: 'operational', responseTime: 198, lastCheck: '2 mins ago' },
  ];

  // Section definitions for nav rows
  const sectionDefs = [
    { name: 'User Progress',         iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', subtitle: 'Course completion, lessons done & learning milestones',        Icon: BookOpen },
    { name: 'User Activity',         iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',   subtitle: 'Login frequency, active sessions & user engagement levels',    Icon: Activity },
    { name: 'Users Growth',          iconBg: 'bg-green-50',  iconColor: 'text-green-600',  subtitle: 'User acquisition, retention & monthly growth trends',          Icon: TrendingUp },
    { name: 'Users Engagement',      iconBg: 'bg-amber-50',  iconColor: 'text-amber-600',  subtitle: 'Interactions, session time & platform engagement metrics',     Icon: Zap },
    { name: 'Learning Performances', iconBg: 'bg-teal-50',   iconColor: 'text-teal-600',   subtitle: 'Enrollments, completions, course quality & category breakdown', Icon: Award },
    { name: 'Marketing Performance', iconBg: 'bg-rose-50',   iconColor: 'text-rose-600',   subtitle: 'Revenue, traffic, conversions & marketing ROI',               Icon: DollarSign },
    { name: 'User Groups & Seat',    iconBg: 'bg-slate-100', iconColor: 'text-slate-600',  subtitle: 'Seat allocation, group membership & access management',        Icon: Users },
  ];
  const activeSection = sectionDefs.find(s => s.name === currentSection);

  return (
    <div className="overflow-x-hidden">
      {/* ── Two-panel slide container ── */}
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ width: '200%', transform: currentSection && detailVisible ? 'translateX(-50%)' : 'translateX(0)' }}
      >
        {/* ══ PANEL 1: List view ══ */}
        <div style={{ width: '50%' }}>
        <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {analyticsView === 'overview-analytics' && 'Reports Center'}
            {analyticsView === 'revenue' && 'Revenue Reports'}
            {analyticsView === 'traffic' && 'Traffic Analysis'}
            {analyticsView === 'user-behavior' && 'User Behavior'}
            {analyticsView === 'login-stats' && 'Login Statistics'}
            {analyticsView === 'system-health' && 'System Health & Platform Status'}
            {analyticsView === 'ai-insights' && 'AI Insights'}
            {analyticsView === 'training-matrix' && 'Training Matrix'}
            {analyticsView === 'product-insights' && 'Product Insights'}
            {analyticsView === 'scheduled-reports' && 'Scheduled Reports'}
          </h1>
          <p className="text-gray-600">
            {analyticsView === 'overview-analytics' && 'Track learner progress, engagement, and outcomes across your platform'}
            {analyticsView === 'revenue' && 'Revenue and enrollment trends'}
            {analyticsView === 'traffic' && 'Website traffic and visitor metrics'}
            {analyticsView === 'user-behavior' && 'User interactions and behavior patterns'}
            {analyticsView === 'login-stats' && 'Login activity and user authentication metrics'}
            {analyticsView === 'system-health' && 'Monitor platform infrastructure and integrations'}
            {analyticsView === 'ai-insights' && 'Intelligent analysis and recommendations powered by AI'}
            {analyticsView === 'training-matrix' && 'Visual overview of team training coverage and completion status'}
            {analyticsView === 'product-insights' && 'Deep-dive analytics into course performance, content quality and learner outcomes'}
            {analyticsView === 'scheduled-reports' && 'Automate report delivery — set up recurring reports sent directly to your team'}
          </p>
          </div>{/* end flex-1 */}
          {analyticsView === 'scheduled-reports' && (
            <button
              onClick={() => { setSchedFormOpen(true); setSchedEditId(null); setSchedForm({ name: '', reportType: 'User Progress', frequency: 'Weekly', time: '08:00', dayLabel: 'Monday', recipients: '', format: 'PDF' }); }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0 mt-1">
              <Plus className="size-4" />
              New Schedule
            </button>
          )}
          </div>{/* end flex items-start */}
        </div>
        {/* Tabs — only for overview */}
        {analyticsView === 'overview-analytics' && (
          <div className="flex items-center gap-1 px-6 mt-4 border-t border-gray-100">
            {([
              { key: 'all-reports',  label: 'All reports'  },
              { key: 'my-segments',  label: 'My Segments'  },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setAnalyticsTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${analyticsTab === t.key ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}
        {/* Product Insights tabs */}
        {analyticsView === 'product-insights' && (
          <div className="flex items-center gap-1 px-6 mt-4 border-t border-gray-100">
            {([
              { key: 'analytics',   label: 'Analytics'    },
              { key: 'all-courses', label: 'All Courses'  },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setProdTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${prodTab === t.key ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}
        {/* Coming Soon pill — for views not yet available */}
        {(analyticsView === 'ai-insights' || analyticsView === 'training-matrix') && (
          <div className="px-6 mt-3 pb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-600">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* My Segments tab content */}
      {analyticsTab === 'my-segments' && (
        <>
          {segmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="bg-gray-100 px-5 py-4 h-16" />
                  <div className="px-5 py-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-8 bg-gray-100 rounded w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : segments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center">
              <div className="size-16 rounded-2xl bg-teal-50 border-2 border-teal-100 flex items-center justify-center mb-4">
                <Target className="size-7 text-teal-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">No segments yet</h2>
              <p className="text-sm text-gray-500 max-w-xs mb-5">Create custom audience segments to filter and compare analytics data across specific groups of users.</p>
              <button onClick={openNewSegment} className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors">
                <span className="text-lg leading-none">+</span> Create segment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{segments.length} segment{segments.length !== 1 ? 's' : ''}</p>
                <button onClick={openNewSegment} className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors">
                  <span className="text-lg leading-none">+</span> Create segment
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segments.map(seg => {
                  const clr = SEGMENT_COLORS.find(c => c.bg === seg.color) ?? SEGMENT_COLORS[0];
                  const activeFilters = Object.entries(seg.filters).filter(([,v]) => v);
                  return (
                    <div key={seg.id} className={`bg-white rounded-xl shadow-sm border ${clr.border} overflow-hidden`}>
                      <div className={`${clr.light} px-5 py-4 flex items-start justify-between`}>
                        <div className="flex items-center gap-3">
                          {seg.icon && <span className="text-2xl">{seg.icon}</span>}
                          <div>
                            <p className={`font-semibold text-sm ${clr.text}`}>{seg.name}</p>
                            {seg.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{seg.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          {segDeleteConfirm === seg.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                              <span className="text-[10px] font-semibold text-rose-600 whitespace-nowrap">Delete?</span>
                              <button onClick={() => { deleteSegment(seg.id); setSegDeleteConfirm(null); }}
                                className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded transition-colors">Yes</button>
                              <button onClick={() => setSegDeleteConfirm(null)}
                                className="px-2 py-0.5 bg-white hover:bg-gray-100 text-gray-600 text-[10px] font-bold rounded border border-gray-200 transition-colors">No</button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => openEditSegment(seg)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors">
                                <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                              <button onClick={() => setSegDeleteConfirm(seg.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/60 rounded-lg transition-colors">
                                <X className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="px-5 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">{seg.userCount.toLocaleString()}</span>
                            <span className="text-xs text-gray-400">estimated users</span>
                          </div>
                          <span className="text-xs text-gray-400">Created {seg.createdAt}</span>
                        </div>
                        {activeFilters.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {activeFilters.slice(0, 4).map(([k, v]) => (
                              <span key={k} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {k.replace(/([A-Z])/g,' $1').toLowerCase()}: {v}
                              </span>
                            ))}
                            {activeFilters.length > 4 && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{activeFilters.length - 4} more</span>}
                          </div>
                        )}
                        <button className={`w-full mt-1 py-1.5 rounded-lg text-xs font-semibold ${clr.bg} text-white hover:opacity-90 transition-opacity`}>
                          View in Reports Center
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </>
      )}

      {/* All reports content â€” hidden when My Segments tab is active */}
      {analyticsTab === 'all-reports' && <>

      {/* Filter bar — hidden on views that don't use it */}
      {analyticsView === 'overview-analytics' && <div className="bg-white rounded-lg shadow-sm px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
          {[
            'All',
            'User Progress',
            'User Activity',
            'Users Growth',
            'Users Engagement',
            'Learning Performances',
            'Marketing Performance',
            'User Groups & Seat',
          ].map(filter => (
            <button
              key={filter}
              onClick={() => setAnalyticsFilter(filter)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                analyticsFilter === filter
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>}

      {/* â”€â”€ SECTION: System Health â”€â”€ */}
      {analyticsView === 'system-health' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <button onClick={() => toggleSection('system-health')} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <Server className="size-[18px] text-slate-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">System Health</p>
                <p className="text-xs text-gray-500 mt-0.5">Platform infrastructure, uptime & API integrations</p>
              </div>
            </div>
            <ChevronDown className={`size-4 text-gray-400 transition-transform duration-200 ${openSections.has('system-health') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has('system-health') && (
            <div className="border-t border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-green-900 font-medium">Server Uptime</p>
                      <button onClick={() => setActivePopover(activePopover === 'server-uptime' ? null : 'server-uptime')} className="hover:bg-white/50 rounded-full p-1 transition-colors"><Info className="size-3.5 text-green-700 cursor-pointer" /></button>
                    </div>
                    <CheckCircle className="size-5 text-green-600" />
                  </div>
                  {activePopover === 'server-uptime' && (
                    <div className="absolute top-14 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                      <div className="flex items-start justify-between mb-2"><h4 className="font-semibold text-gray-900">Server Uptime</h4><button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600"><X className="size-4" /></button></div>
                      <p className="text-sm text-gray-600 leading-relaxed">The percentage of time the platform servers have been operational and accessible over the last 30 days. High uptime (99%+) ensures reliable service delivery and minimal disruptions to users.</p>
                    </div>
                  )}
                  <p className="text-3xl font-bold text-green-900">{systemUptime}%</p>
                  <p className="text-xs text-green-700 mt-1">Last 30 days</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-yellow-900 font-medium">Error Rate</p>
                      <button onClick={() => setActivePopover(activePopover === 'error-rate' ? null : 'error-rate')} className="hover:bg-white/50 rounded-full p-1 transition-colors"><Info className="size-3.5 text-yellow-700 cursor-pointer" /></button>
                    </div>
                    <AlertCircle className="size-5 text-yellow-600" />
                  </div>
                  {activePopover === 'error-rate' && (
                    <div className="absolute top-14 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                      <div className="flex items-start justify-between mb-2"><h4 className="font-semibold text-gray-900">Error Rate</h4><button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600"><X className="size-4" /></button></div>
                      <p className="text-sm text-gray-600 leading-relaxed">The percentage of requests that resulted in server errors (5xx) or failed operations. A lower error rate indicates better system stability and code quality. Rates below 0.5% are considered excellent.</p>
                    </div>
                  )}
                  <p className="text-3xl font-bold text-yellow-900">{errorRate}%</p>
                  <p className="text-xs text-yellow-700 mt-1">Within normal range</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-blue-900 font-medium">Failed Transactions</p>
                      <button onClick={() => setActivePopover(activePopover === 'failed-transactions' ? null : 'failed-transactions')} className="hover:bg-white/50 rounded-full p-1 transition-colors"><Info className="size-3.5 text-blue-700 cursor-pointer" /></button>
                    </div>
                    <Database className="size-5 text-blue-600" />
                  </div>
                  {activePopover === 'failed-transactions' && (
                    <div className="absolute top-14 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                      <div className="flex items-start justify-between mb-2"><h4 className="font-semibold text-gray-900">Failed Transactions</h4><button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600"><X className="size-4" /></button></div>
                      <p className="text-sm text-gray-600 leading-relaxed">The number of payment or enrollment transactions that failed in the last 24 hours. This includes payment gateway rejections, timeout errors, and processing failures. Monitor to ensure revenue loss is minimized.</p>
                    </div>
                  )}
                  <p className="text-3xl font-bold text-blue-900">{failedTransactions}</p>
                  <p className="text-xs text-blue-700 mt-1">Last 24 hours</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-green-900 font-medium">System Status</p>
                      <button onClick={() => setActivePopover(activePopover === 'system-status' ? null : 'system-status')} className="hover:bg-white/50 rounded-full p-1 transition-colors"><Info className="size-3.5 text-green-700 cursor-pointer" /></button>
                    </div>
                    <Wifi className="size-5 text-green-600" />
                  </div>
                  {activePopover === 'system-status' && (
                    <div className="absolute top-14 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                      <div className="flex items-start justify-between mb-2"><h4 className="font-semibold text-gray-900">System Status</h4><button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600"><X className="size-4" /></button></div>
                      <p className="text-sm text-gray-600 leading-relaxed">Overall health indicator aggregating server uptime, error rates, and critical service availability. Green indicates all systems operational, yellow means degraded performance, red signals major issues requiring immediate attention.</p>
                    </div>
                  )}
                  <p className="text-3xl font-bold text-green-900">Operational</p>
                  <p className="text-xs text-green-700 mt-1">All systems normal</p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Wifi className="size-5 text-gray-600" />API & Integration Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apiIntegrations.map((integration) => (
                  <div key={integration.name} className={`border rounded-lg p-4 relative ${integration.status === 'operational' ? 'bg-green-50 border-green-200' : integration.status === 'degraded' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 text-sm">{integration.name}</h4>
                          <button onClick={() => setActivePopover(activePopover === `api-${integration.name}` ? null : `api-${integration.name}`)} className="hover:bg-white/50 rounded-full p-1 transition-colors"><Info className="size-3.5 text-gray-600 cursor-pointer" /></button>
                        </div>
                        {activePopover === `api-${integration.name}` && (
                          <div className="absolute top-12 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-30">
                            <div className="flex items-start justify-between mb-2"><h4 className="font-semibold text-gray-900">{integration.name}</h4><button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-gray-600"><X className="size-4" /></button></div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {integration.name === 'Payment Gateway' && "Manages all payment processing and transaction handling. Critical for course purchases and subscription billing. Response times under 300ms ensure smooth checkout experience."}
                              {integration.name === 'Video CDN' && "Content delivery network for streaming course videos. Optimized for low latency and high availability. Fast response times ensure smooth video playback without buffering."}
                              {integration.name === 'Email Service' && "Handles all transactional and marketing emails including enrollment confirmations, password resets, and course updates. Response times vary based on email queue size."}
                              {integration.name === 'Analytics API' && "Collects and processes platform analytics data including user behavior, engagement metrics, and performance statistics. Higher response times may indicate heavy data processing."}
                              {integration.name === 'User Authentication' && "Manages user login, registration, and session handling. Critical for platform access. Fast response times are essential for seamless user experience."}
                              {integration.name === 'Cloud Storage' && "Stores course materials, user uploads, and platform assets. Response times affect file upload/download speeds and content access."}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {integration.status === 'operational' && (<><CheckCircle className="size-4 text-green-600" /><span className="text-xs text-green-700 font-medium">Operational</span></>)}
                          {integration.status === 'degraded' && (<><AlertCircle className="size-4 text-yellow-600" /><span className="text-xs text-yellow-700 font-medium">Degraded</span></>)}
                          {integration.status === 'down' && (<><XCircle className="size-4 text-red-600" /><span className="text-xs text-red-700 font-medium">Down</span></>)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Response Time</span>
                        <span className={`font-medium ${integration.responseTime < 200 ? 'text-green-600' : integration.responseTime < 1000 ? 'text-yellow-600' : 'text-red-600'}`}>{integration.responseTime}ms</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${integration.responseTime < 200 ? 'bg-green-500' : integration.responseTime < 1000 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min((integration.responseTime / 2000) * 100, 100)}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Last check: {integration.lastCheck}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI Insights: Coming Soon ── */}
      {analyticsView === 'ai-insights' && (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          {/* Animated glow orb */}
          <div className="relative mb-8">
            <div className="size-28 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 border-2 border-violet-200 flex items-center justify-center shadow-lg shadow-violet-100">
              <Sparkles className="size-12 text-violet-400" />
            </div>
            <div className="absolute -top-1 -right-1 size-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">!</span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Insights is on its way</h2>
          <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
            We're building intelligent analysis tools that surface trends, predict learner risk, and recommend actions — all without leaving your dashboard.
          </p>

          {/* Feature preview cards */}
          <div className="grid grid-cols-1 gap-3 w-full max-w-lg mb-10 text-left">
            {[
              { icon: TrendingUp,  color: 'bg-teal-50 text-teal-500',   label: 'Predictive Analytics',     desc: 'Spot learners at risk before they disengage' },
              { icon: Zap,        color: 'bg-amber-50 text-amber-500',  label: 'Smart Recommendations',    desc: 'AI-suggested actions based on real-time data' },
              { icon: Users,      color: 'bg-indigo-50 text-indigo-500',label: 'Cohort Intelligence',      desc: 'Auto-segment users by behavior patterns' },
              { icon: Award,      color: 'bg-green-50 text-green-500',  label: 'Outcome Forecasting',      desc: 'Predict completion rates and certification outcomes' },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className={`size-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <span className="ml-auto flex-shrink-0 text-[10px] font-bold text-gray-300 uppercase tracking-wide">Soon</span>
              </div>
            ))}
          </div>

          {/* Notify CTA */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-gray-400">Get notified when AI Insights launches</p>
            <div className="flex items-center gap-2">
              <input type="email" placeholder="your@email.com"
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 w-56 placeholder:text-gray-300" />
              <button className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold rounded-lg transition-colors">
                Notify me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Training Matrix: Coming Soon ── */}
      {analyticsView === 'training-matrix' && (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="relative mb-8">
            <div className="size-28 rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-teal-200 flex items-center justify-center shadow-lg shadow-teal-100">
              <BookOpen className="size-12 text-teal-400" />
            </div>
            <div className="absolute -top-1 -right-1 size-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">!</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Matrix is on its way</h2>
          <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
            Get a visual map of every team member's training status — see who's completed what, who's falling behind, and where the gaps are across your entire organisation.
          </p>
          <div className="grid grid-cols-1 gap-3 w-full max-w-lg mb-10 text-left">
            {[
              { icon: Users,      color: 'bg-teal-50 text-teal-500',   label: 'Team Coverage View',       desc: 'See training completion across every role and department' },
              { icon: Award,      color: 'bg-indigo-50 text-indigo-500', label: 'Compliance Tracking',    desc: 'Identify overdue and at-risk learners at a glance' },
              { icon: TrendingUp, color: 'bg-green-50 text-green-500',  label: 'Progress Heatmaps',        desc: 'Visual grids showing completion intensity by course and team' },
              { icon: Zap,        color: 'bg-amber-50 text-amber-500',  label: 'Auto Assignments',         desc: 'Rule-based course assignments triggered by role or milestone' },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className={`size-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <span className="ml-auto flex-shrink-0 text-[10px] font-bold text-gray-300 uppercase tracking-wide">Soon</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-gray-400">Get notified when Training Matrix launches</p>
            <div className="flex items-center gap-2">
              <input type="email" placeholder="your@email.com"
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 w-56 placeholder:text-gray-300" />
              <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-lg transition-colors">
                Notify me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scheduled Reports ── */}
      {analyticsView === 'scheduled-reports' && (() => {
        const REPORT_TYPES = ['User Progress', 'User Activity', 'Users Growth', 'Product Insights', 'System Health', 'Engagement Report', 'Completion Report'];
        const DAYS_WEEKLY  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        const DAYS_MONTHLY = ['1st','2nd','3rd','5th','10th','15th','20th','Last'];

        const filtered = schedReports.filter(r =>
          (schedFilter === 'all' || r.status === schedFilter) &&
          (schedSearch === '' || r.name.toLowerCase().includes(schedSearch.toLowerCase()) || r.reportType.toLowerCase().includes(schedSearch.toLowerCase()))
        );
        const schedTotalPages = Math.max(1, Math.ceil(filtered.length / SCHED_PER_PAGE));
        const schedSafePage   = Math.min(schedPage, schedTotalPages);
        const schedSlice      = filtered.slice((schedSafePage - 1) * SCHED_PER_PAGE, schedSafePage * SCHED_PER_PAGE);
        const schedStart      = filtered.length === 0 ? 0 : (schedSafePage - 1) * SCHED_PER_PAGE + 1;
        const schedEnd        = Math.min(schedSafePage * SCHED_PER_PAGE, filtered.length);

        const toggleStatus = async (id: string) => {
          let updated: ScheduledReport | undefined;
          setSchedReports(prev => prev.map(r => {
            if (r.id !== id) return r;
            updated = { ...r, status: r.status === 'active' ? 'paused' : 'active', nextRun: r.status === 'active' ? 'Paused' : 'Resuming...' };
            return updated;
          }));
          if (updated) await supabase.from('kv_store_d60f2898').upsert({ key: `${schedKvPrefix}${id}`, value: updated });
        };

        const deleteReport = async (id: string) => {
          setSchedReports(prev => prev.filter(r => r.id !== id));
          await supabase.from('kv_store_d60f2898').delete().eq('key', `${schedKvPrefix}${id}`);
        };

        const openEdit = (r: ScheduledReport) => {
          setSchedEditId(r.id);
          setSchedForm({
            name: r.name, segment: r.segment, reportType: r.reportType,
            frequency: r.frequency, time: r.time, timezone: r.timezone, dayLabel: r.dayLabel || 'Monday',
            timePeriod: r.timePeriod, format: r.format,
            notifyUsers: r.notifyUsers, emailTo: r.emailTo.join(', '), emailSubject: r.emailSubject, emailMessage: r.emailMessage,
          });
          setSchedFormOpen(true);
        };

        const saveForm = async () => {
          if (!schedForm.name) return;
          const emailToArr = schedForm.emailTo.split(',').map(s => s.trim()).filter(Boolean);
          if (schedEditId) {
            let updated: ScheduledReport | undefined;
            setSchedReports(prev => prev.map(r => {
              if (r.id !== schedEditId) return r;
              updated = {
                ...r, name: schedForm.name, segment: schedForm.segment, reportType: schedForm.reportType,
                frequency: schedForm.frequency, time: schedForm.time, timezone: schedForm.timezone, dayLabel: schedForm.dayLabel,
                timePeriod: schedForm.timePeriod, format: schedForm.format,
                notifyUsers: schedForm.notifyUsers, emailTo: emailToArr, emailSubject: schedForm.emailSubject, emailMessage: schedForm.emailMessage,
              };
              return updated;
            }));
            if (updated) await supabase.from('kv_store_d60f2898').upsert({ key: `${schedKvPrefix}${schedEditId}`, value: updated });
          } else {
            const newR: ScheduledReport = {
              id: `sr${Date.now()}`, name: schedForm.name, segment: schedForm.segment, reportType: schedForm.reportType,
              frequency: schedForm.frequency, time: schedForm.time, timezone: schedForm.timezone, dayLabel: schedForm.dayLabel,
              timePeriod: schedForm.timePeriod, recipients: emailToArr, format: schedForm.format,
              notifyUsers: schedForm.notifyUsers, emailTo: emailToArr, emailSubject: schedForm.emailSubject, emailMessage: schedForm.emailMessage,
              status: 'active', nextRun: 'Calculating…', createdAt: new Date().toISOString().slice(0, 10),
            };
            setSchedReports(prev => [newR, ...prev]);
            await supabase.from('kv_store_d60f2898').upsert({ key: `${schedKvPrefix}${newR.id}`, value: newR });
          }
          setSchedFormOpen(false);
          setSchedEditId(null);
          setSchedForm(SCHED_FORM_DEFAULT);
        };

        const fmtColor  = (f: string) => f === 'PDF' ? 'bg-rose-50 text-rose-600' : f === 'CSV' ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600';
        const freqColor = (f: string) => f === 'Daily' ? 'bg-blue-50 text-blue-600' : f === 'Weekly' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600';

        return (
          <div className="p-6 space-y-5 max-w-full">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                <input value={schedSearch} onChange={e => { setSchedSearch(e.target.value); setSchedPage(1); }}
                  placeholder="Search reports…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300 placeholder:text-gray-300" />
              </div>
              {/* Status filter */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {(['all','active','paused'] as const).map(f => (
                  <button key={f} onClick={() => { setSchedFilter(f); setSchedPage(1); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${schedFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Schedules',  value: schedReports.length,                              accent: 'text-gray-800',    bg: 'bg-white' },
                { label: 'Active',           value: schedReports.filter(r => r.status === 'active').length,  accent: 'text-teal-600',    bg: 'bg-teal-50' },
                { label: 'Paused',           value: schedReports.filter(r => r.status === 'paused').length,  accent: 'text-amber-600',   bg: 'bg-amber-50' },
                { label: 'Reports Sent',     value: '142',                                             accent: 'text-indigo-600',  bg: 'bg-indigo-50' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl border border-gray-100 shadow-sm px-5 py-4`}>
                  <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Create / Edit form */}
            {schedFormOpen && (() => {
              const DEFAULT_SEGMENTS = ['All Users', 'Active Learners', 'At-Risk Users', 'Admins', 'New Users', 'Top Performers', 'Inactive Users'];
              const TIME_PERIODS= ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 6 months', 'Last 12 months', 'All time', 'Custom range'];
              const TIMEZONES   = ['UTC-12','UTC-11','UTC-10','UTC-9','UTC-8','UTC-7','UTC-6','UTC-5','UTC-4','UTC-3','UTC-2','UTC-1','UTC+0','UTC+1','UTC+2','UTC+3','UTC+4','UTC+5','UTC+5:30','UTC+6','UTC+7','UTC+8','UTC+9','UTC+10','UTC+11','UTC+12'];
              const inputCls    = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white placeholder:text-gray-300';
              const labelCls    = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';
              const sectionHdr  = (title: string, icon: JSX.Element) => (
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-6 rounded-md bg-teal-50 flex items-center justify-center flex-shrink-0">{icon}</div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</p>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              );
              return (
                <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
                  {/* Form header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-sm">
                        <Calendar className="size-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{schedEditId ? 'Edit Scheduled Report' : 'New Scheduled Report'}</p>
                        <p className="text-[11px] text-gray-400">Fill in the details below to {schedEditId ? 'update' : 'create'} your report schedule</p>
                      </div>
                    </div>
                    <button onClick={() => { setSchedFormOpen(false); setSchedEditId(null); setSchedForm(SCHED_FORM_DEFAULT); }} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-8">

                    {/* ── Section 1: Report ── */}
                    <div>
                      {sectionHdr('Report', <BookOpen className="size-3 text-teal-500" />)}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Report Title */}
                        <div className="col-span-2">
                          <label className={labelCls}>Report Title</label>
                          <input value={schedForm.name} onChange={e => setSchedForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Weekly Learner Progress"
                            className={inputCls} />
                        </div>
                        {/* User's Segment */}
                        <div>
                          <label className={labelCls}>User's Segment</label>
                          <select value={schedForm.segment} onChange={e => setSchedForm(p => ({ ...p, segment: e.target.value }))} className={inputCls}>
                            <optgroup label="Default">
                              {DEFAULT_SEGMENTS.map(s => <option key={s}>{s}</option>)}
                            </optgroup>
                            {segments.length > 0 && (
                              <optgroup label="My Segments">
                                {segments.map(s => <option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        {/* Report Type */}
                        <div>
                          <label className={labelCls}>Report Type</label>
                          <select value={schedForm.reportType} onChange={e => setSchedForm(p => ({ ...p, reportType: e.target.value }))} className={inputCls}>
                            {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ── Section 2: Schedule ── */}
                    <div>
                      {sectionHdr('Schedule', <Clock className="size-3 text-teal-500" />)}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Report Frequency */}
                        <div className="col-span-2">
                          <label className={labelCls}>Report Frequency</label>
                          <div className="flex gap-2">
                            {(['Daily','Weekly','Monthly'] as const).map(f => (
                              <button key={f} onClick={() => setSchedForm(p => ({ ...p, frequency: f, dayLabel: f === 'Weekly' ? 'Monday' : f === 'Monthly' ? '1st' : p.dayLabel }))}
                                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg border transition-colors ${schedForm.frequency === f ? 'border-teal-400 bg-teal-50 text-teal-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                {f}
                              </button>
                            ))}
                          </div>
                          {schedForm.frequency !== 'Daily' && (
                            <div className="mt-3">
                              <label className="block text-[11px] text-gray-400 mb-1.5">{schedForm.frequency === 'Weekly' ? 'Send on day' : 'Send on the'}</label>
                              <div className="flex flex-wrap gap-1.5">
                                {(schedForm.frequency === 'Weekly' ? DAYS_WEEKLY : DAYS_MONTHLY).map(d => (
                                  <button key={d} onClick={() => setSchedForm(p => ({ ...p, dayLabel: d }))}
                                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${schedForm.dayLabel === d ? 'border-teal-400 bg-teal-50 text-teal-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    {d}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Time + Timezone */}
                        <div>
                          <label className={labelCls}>Select Time</label>
                          <input type="time" value={schedForm.time} onChange={e => setSchedForm(p => ({ ...p, time: e.target.value }))}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Timezone</label>
                          <select value={schedForm.timezone} onChange={e => setSchedForm(p => ({ ...p, timezone: e.target.value }))} className={inputCls}>
                            {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                          </select>
                        </div>
                        {/* Set Time Period */}
                        <div className="col-span-2">
                          <label className={labelCls}>Set Time Period</label>
                          <div className="flex flex-wrap gap-2">
                            {TIME_PERIODS.map(tp => (
                              <button key={tp} onClick={() => setSchedForm(p => ({ ...p, timePeriod: tp }))}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${schedForm.timePeriod === tp ? 'border-teal-400 bg-teal-50 text-teal-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                {tp}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Section 3: Delivery ── */}
                    <div>
                      {sectionHdr('Delivery', <Download className="size-3 text-teal-500" />)}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Select File Type */}
                        <div>
                          <label className={labelCls}>Select File Type</label>
                          <div className="flex gap-2">
                            {(['PDF','CSV','Excel'] as const).map(f => (
                              <button key={f} onClick={() => setSchedForm(p => ({ ...p, format: f }))}
                                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg border transition-colors ${schedForm.format === f ? 'border-teal-400 bg-teal-50 text-teal-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Notify Users toggle */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Notify Users</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Send email notification when report is ready</p>
                          </div>
                          <button onClick={() => setSchedForm(p => ({ ...p, notifyUsers: !p.notifyUsers }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${schedForm.notifyUsers ? 'bg-teal-500' : 'bg-gray-200'}`}>
                            <span className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${schedForm.notifyUsers ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Section 4: Email (shown when notifyUsers = true) ── */}
                    {schedForm.notifyUsers && (
                      <div>
                        {sectionHdr('Email Notification', <Bookmark className="size-3 text-teal-500" />)}
                        <div className="grid grid-cols-2 gap-4">
                          {/* To */}
                          <div className="col-span-2">
                            <label className={labelCls}>To <span className="normal-case font-normal text-gray-400">(comma-separated emails)</span></label>
                            <input value={schedForm.emailTo} onChange={e => setSchedForm(p => ({ ...p, emailTo: e.target.value }))}
                              placeholder="admin@company.com, manager@company.com"
                              className={inputCls} />
                          </div>
                          {/* Subject */}
                          <div className="col-span-2">
                            <label className={labelCls}>Subject</label>
                            <input value={schedForm.emailSubject} onChange={e => setSchedForm(p => ({ ...p, emailSubject: e.target.value }))}
                              placeholder="e.g. Weekly Learner Progress Report – May 2026"
                              className={inputCls} />
                          </div>
                          {/* Message */}
                          <div className="col-span-2">
                            <label className={labelCls}>Your Message</label>
                            <textarea value={schedForm.emailMessage} onChange={e => setSchedForm(p => ({ ...p, emailMessage: e.target.value }))}
                              rows={4}
                              placeholder="Add a personal message to accompany the report…"
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 placeholder:text-gray-300 resize-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => { setSchedFormOpen(false); setSchedEditId(null); setSchedForm(SCHED_FORM_DEFAULT); }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button onClick={saveForm} disabled={!schedForm.name}
                        className="flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
                        <CheckCircle className="size-3.5" />
                        {schedEditId ? 'Save Changes' : 'Create Schedule'}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Reports list */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Calendar className="size-7 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-700 mb-1">No scheduled reports found</p>
                <p className="text-sm text-gray-400">{schedSearch ? 'Try a different search term' : 'Create your first schedule using the button above'}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
                  {['Report Name', 'Type', 'Frequency', 'Recipients', 'Format', 'Next Run', ''].map(h => (
                    <p key={h} className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                  ))}
                </div>
                {/* Rows */}
                <div className="divide-y divide-gray-50">
                  {schedSlice.map(r => (
                    <div key={r.id} className={`grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors ${r.status === 'paused' ? 'opacity-60' : ''}`}>
                      {/* Name */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`size-2 rounded-full flex-shrink-0 ${r.status === 'active' ? 'bg-teal-400' : 'bg-gray-300'}`} />
                          <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 pl-4">Created {r.createdAt} · Last sent: {r.lastSent ?? 'Never'}</p>
                      </div>
                      {/* Type */}
                      <p className="text-xs text-gray-500 truncate">{r.reportType}</p>
                      {/* Frequency */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold w-fit ${freqColor(r.frequency)}`}>
                        {r.frequency}{r.dayLabel ? ` · ${r.dayLabel}` : ''}<br className="hidden" />
                        <span className="ml-1 text-[9px] opacity-70">{r.time}</span>
                      </span>
                      {/* Recipients */}
                      <div className="flex flex-wrap gap-1">
                        {r.recipients.slice(0, 2).map(e => (
                          <span key={e} className="bg-gray-100 text-gray-600 text-[9px] font-medium px-1.5 py-0.5 rounded-full truncate max-w-[90px]">{e}</span>
                        ))}
                        {r.recipients.length > 2 && <span className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded-full">+{r.recipients.length - 2}</span>}
                      </div>
                      {/* Format */}
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${fmtColor(r.format)}`}>{r.format}</span>
                      {/* Next run */}
                      <p className={`text-xs font-medium ${r.status === 'paused' ? 'text-gray-400' : 'text-gray-700'}`}>{r.nextRun}</p>
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {schedDeleteConfirm === r.id ? (
                          // Inline confirmation
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] font-semibold text-rose-600 whitespace-nowrap">Delete?</span>
                            <button onClick={() => { deleteReport(r.id); setSchedDeleteConfirm(null); }}
                              className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded transition-colors">
                              Yes
                            </button>
                            <button onClick={() => setSchedDeleteConfirm(null)}
                              className="px-2 py-0.5 bg-white hover:bg-gray-100 text-gray-600 text-[10px] font-bold rounded border border-gray-200 transition-colors">
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => openEdit(r)} title="Edit"
                              className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Pencil className="size-3.5" />
                            </button>
                            <button onClick={() => toggleStatus(r.id)} title={r.status === 'active' ? 'Pause' : 'Resume'}
                              className={`p-1.5 rounded-lg transition-colors ${r.status === 'active' ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:text-teal-500 hover:bg-teal-50'}`}>
                              {r.status === 'active' ? <Activity className="size-3.5" /> : <CheckCircle className="size-3.5" />}
                            </button>
                            <button onClick={() => setSchedDeleteConfirm(r.id)} title="Delete"
                              className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                              <X className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-400">
                    {filtered.length === 0 ? 'No results' : <>Showing <span className="font-semibold text-gray-600">{schedStart}–{schedEnd}</span> of <span className="font-semibold text-gray-600">{filtered.length}</span> schedules</>}
                  </p>
                  {schedTotalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSchedPage(p => Math.max(1, p - 1))} disabled={schedSafePage === 1}
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        Prev
                      </button>
                      {Array.from({ length: schedTotalPages }, (_, i) => i + 1).map(n => (
                        <button key={n} onClick={() => setSchedPage(n)}
                          className={`size-7 text-xs font-medium rounded-lg transition-colors ${schedSafePage === n ? 'bg-teal-500 text-white' : 'text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                          {n}
                        </button>
                      ))}
                      <button onClick={() => setSchedPage(p => Math.min(schedTotalPages, p + 1))} disabled={schedSafePage === schedTotalPages}
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        Next
                      </button>
                    </div>
                  )}
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors ml-auto">
                    <Download className="size-3.5" />
                    Export list
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Product Insights ── */}
      {analyticsView === 'product-insights' && (() => {
        // ── derive per-course metrics ──────────────────────────────────────
        const courseMetrics = courses.map((course, ci) => {
          const enrolled  = users.filter(u => u.enrolledCourses?.includes(course.id));
          const enrollCt  = enrolled.length || course.studentsEnrolled || 0;
          // completion: users who completed all lessons in the course
          const totalLessons = course.modules?.reduce((s, m) => s + m.lessons.length, 0) || 1;
          const completedCt  = enrolled.filter(u =>
            course.modules?.every(m => m.lessons.every(l => u.completedLessons?.includes(l.id)))
          ).length;
          const completionPct = enrollCt > 0 ? Math.round((completedCt / enrollCt) * 100) : Math.round(30 + (ci * 13) % 55);
          // engagement = avg lessons viewed / total lessons (mock)
          const engagementPct = Math.round(40 + (ci * 17 + 11) % 50);
          // drop-off = enrolled but 0 completed lessons from this course
          const droppedCt = Math.round(enrollCt * ((100 - completionPct) / 100) * 0.4);
          const rating = course.rating || (3.5 + (ci * 0.3) % 1.5);
          // parse duration to minutes
          const durationMins = (() => {
            const h = parseInt(course.duration?.match(/(\d+)\s*h/)?.[1] ?? '0');
            const m = parseInt(course.duration?.match(/(\d+)\s*m/)?.[1] ?? '0');
            return h * 60 + m || 45 + (ci * 20) % 90;
          })();
          return { course, enrollCt, completionPct, engagementPct, droppedCt, rating, durationMins, totalLessons };
        });

        // ── KPI summary ───────────────────────────────────────────────────
        const totalCourses   = courses.length;
        const avgCompletion  = Math.round(courseMetrics.reduce((s, m) => s + m.completionPct, 0) / (courseMetrics.length || 1));
        const avgRating      = (courseMetrics.reduce((s, m) => s + m.rating, 0) / (courseMetrics.length || 1)).toFixed(1);
        const totalEnrolled  = courseMetrics.reduce((s, m) => s + m.enrollCt, 0);
        const totalDropped   = courseMetrics.reduce((s, m) => s + m.droppedCt, 0);

        // ── chart data ───────────────────────────────────────────────────
        const sorted        = [...courseMetrics].sort((a, b) => b.enrollCt - a.enrollCt);
        const top6Popular   = sorted.slice(0, 6);
        const barData       = top6Popular.map(m => ({
          name: m.course.title.length > 18 ? m.course.title.slice(0, 18) + '…' : m.course.title,
          Enrolled: m.enrollCt,
          Completed: Math.round(m.enrollCt * m.completionPct / 100),
        }));

        const byEngagement  = [...courseMetrics].sort((a, b) => b.engagementPct - a.engagementPct);
        const lineScale     = prodLineRange === 7 ? 0.72 : prodLineRange === 30 ? 0.88 : prodLineRange === 180 ? 0.95 : 1;
        const lineData      = byEngagement.slice(0, 6).map(m => ({
          name: m.course.title.length > 14 ? m.course.title.slice(0, 14) + '…' : m.course.title,
          Engagement: Math.min(100, Math.round(m.engagementPct * lineScale)),
          Completion: Math.min(100, Math.round(m.completionPct * lineScale)),
        }));

        // Radar — 5 platform-level course metrics (normalised to 0-100)
        const avgStudyTimeMins  = Math.round(courseMetrics.reduce((s, m) => s + m.durationMins * (m.completionPct / 100), 0) / (courseMetrics.length || 1));
        const maxStudyMins      = 120; // normalise against 2h ceiling
        const avgStudyScore     = Math.min(100, Math.round((avgStudyTimeMins / maxStudyMins) * 100));
        const socialScore       = Math.round(30 + (courseMetrics.length * 7) % 45);   // mock
        const certIssuedScore   = Math.round(courseMetrics.reduce((s, m) => s + m.completionPct, 0) / (courseMetrics.length || 1) * 0.8);
        const enrollScore       = Math.min(100, Math.round((totalEnrolled / (users.length * courseMetrics.length || 1)) * 100));
        const avgScoreVal       = Math.round(55 + (courseMetrics.length * 3) % 35);   // mock quiz score
        const radarData = [
          { subject: 'Avg Study Time',        value: avgStudyScore   },
          { subject: 'Social Interactions',   value: socialScore     },
          { subject: 'Certificates Issued',   value: certIssuedScore },
          { subject: 'Enrollments',           value: enrollScore     },
          { subject: 'Avg Score',             value: avgScoreVal     },
        ];

        const hardest  = [...courseMetrics].sort((a, b) => a.completionPct - b.completionPct).slice(0, 5);
        const mostDrop = [...courseMetrics].sort((a, b) => b.droppedCt - a.droppedCt).slice(0, 5);



        return (
          <div className="space-y-5">
            {prodTab === 'analytics' && <>
            {/* KPI spotlight */}
            {(() => {
              const statOptions = [
                { key: 'courses',     label: 'Total Courses',     value: String(totalCourses),          sub: 'in your catalogue',              accent: 'text-indigo-600', ring: 'bg-indigo-500', bg: 'bg-indigo-50',  divider: 'bg-indigo-100',  activePill: 'bg-indigo-100'  },
                { key: 'completion',  label: 'Avg Completion',    value: `${avgCompletion}%`,            sub: 'across all courses',             accent: 'text-teal-600',   ring: 'bg-teal-500',   bg: 'bg-teal-50',    divider: 'bg-teal-100',    activePill: 'bg-teal-100'    },
                { key: 'rating',      label: 'Avg Rating',        value: `${avgRating} ★`,              sub: 'out of 5.0',                     accent: 'text-amber-600',  ring: 'bg-amber-500',  bg: 'bg-amber-50',   divider: 'bg-amber-100',   activePill: 'bg-amber-100'   },
                { key: 'enrollments', label: 'Total Enrollments', value: totalEnrolled.toLocaleString(), sub: 'across platform',               accent: 'text-blue-600',   ring: 'bg-blue-500',   bg: 'bg-blue-50',    divider: 'bg-blue-100',    activePill: 'bg-blue-100'    },
                { key: 'dropoffs',    label: 'Drop-offs',         value: String(totalDropped),           sub: 'learners who did not complete',  accent: 'text-rose-600',   ring: 'bg-rose-500',   bg: 'bg-rose-50',    divider: 'bg-rose-100',    activePill: 'bg-rose-100'    },
              ] as const;
              const active = statOptions.find(s => s.key === prodStat)!;
              return (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-stretch">
                    <div className={`flex-1 px-6 py-5 flex flex-col justify-center transition-colors duration-300 ${active.bg}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors duration-300 ${active.accent}`}>{active.label}</p>
                      <p className="text-4xl font-bold text-gray-900 leading-none">{active.value}</p>
                      <p className="text-xs text-gray-500 mt-1.5">{active.sub}</p>
                    </div>
                    <div className={`w-px my-4 transition-colors duration-300 ${active.divider}`} />
                    <div className="flex flex-col justify-center gap-1 px-4 py-4">
                      {statOptions.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setProdStat(opt.key)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors w-full ${prodStat === opt.key ? opt.activePill : 'hover:bg-gray-50'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 transition-colors ${prodStat === opt.key ? opt.ring : 'bg-gray-300'}`} />
                          <span className={`text-xs font-medium whitespace-nowrap ${prodStat === opt.key ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Row 1: Enrollments bar + Engagement line */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group" onClick={() => openDetail('product-bar')}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Most Popular Courses</p>
                    <p className="text-xs text-gray-400 mt-0.5">Enrollments vs completions</p>
                  </div>
                  {/* Time range dropdown — stop click bubbling to card */}
                  <div className="relative flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    <button
                      onClick={() => setProdBarRangeOpen(v => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {prodBarRange === 7 ? 'Last 7 days' : prodBarRange === 30 ? 'Last 30 days' : prodBarRange === 180 ? 'Last 6 months' : 'Last year'}
                      <ChevronDown className={`size-3 transition-transform ${prodBarRangeOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {prodBarRangeOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                        {([
                          { value: 7,   label: 'Last 7 days'   },
                          { value: 30,  label: 'Last 30 days'  },
                          { value: 180, label: 'Last 6 months' },
                          { value: 365, label: 'Last year'     },
                        ] as const).map(opt => (
                          <button key={opt.value} onClick={() => { setProdBarRange(opt.value); setProdBarRangeOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${prodBarRange === opt.value ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={top6Popular.map(m => ({
                    name: m.course.title.length > 18 ? m.course.title.slice(0, 18) + '…' : m.course.title,
                    Enrolled:  Math.round(m.enrollCt  * (prodBarRange / 365)),
                    Completed: Math.round(m.enrollCt  * (prodBarRange / 365) * (m.completionPct / 100)),
                  }))} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="Enrolled"  fill="#6366f1" radius={[3,3,0,0]} />
                    <Bar dataKey="Completed" fill="#14b8a6" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="size-2.5 rounded-sm bg-indigo-500 inline-block" />Enrolled</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="size-2.5 rounded-sm bg-teal-500 inline-block" />Completed</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group" onClick={() => openDetail('product-line')}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Engagement vs Completion</p>
                    <p className="text-xs text-gray-400 mt-0.5">Top engaged courses compared</p>
                  </div>
                  <div className="relative flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    <button
                      onClick={() => setProdLineRangeOpen(v => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {prodLineRange === 7 ? 'Last 7 days' : prodLineRange === 30 ? 'Last 30 days' : prodLineRange === 180 ? 'Last 6 months' : 'Last year'}
                      <ChevronDown className={`size-3 transition-transform ${prodLineRangeOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {prodLineRangeOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                        {([
                          { value: 7,   label: 'Last 7 days'   },
                          { value: 30,  label: 'Last 30 days'  },
                          { value: 180, label: 'Last 6 months' },
                          { value: 365, label: 'Last year'     },
                        ] as const).map(opt => (
                          <button key={opt.value} onClick={() => { setProdLineRange(opt.value); setProdLineRangeOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${prodLineRange === opt.value ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => `${v}%`} />
                    <Line type="monotone" dataKey="Engagement" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Completion" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="size-2.5 rounded-full bg-amber-400 inline-block" />Engagement</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="size-2.5 rounded-full bg-indigo-500 inline-block" />Completion</span>
                </div>
              </div>
            </div>

            {/* Row 2: Radar + Hardest + Most dropped */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => openDetail('product-radar')}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:border-indigo-200 hover:shadow-md transition-all group w-full"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900 text-sm">Course Performance Overview</p>
                  <ChevronRight className="size-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-gray-400 mb-3">Click to explore per-course radar charts</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9.5, fill: '#9ca3af' }} />
                    <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => `${v}`} />
                  </RadarChart>
                </ResponsiveContainer>
              </button>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-rose-200 hover:shadow-md transition-all cursor-pointer group" onClick={() => openDetail('product-hardest')}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-rose-50 flex items-center justify-center">
                      <TrendingDown className="size-3.5 text-rose-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Hardest Courses</p>
                      <p className="text-[11px] text-gray-400">Lowest completion rates</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                    <button onClick={() => setProdHardRangeOpen(v => !v)}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      {prodHardRange === 7 ? 'Last 7d' : prodHardRange === 30 ? 'Last 30d' : prodHardRange === 180 ? 'Last 6mo' : 'Last year'}
                      <ChevronDown className={`size-2.5 transition-transform ${prodHardRangeOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {prodHardRangeOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                        {([{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 180, label: 'Last 6 months' }, { value: 365, label: 'Last year' }] as const).map(opt => (
                          <button key={opt.value} onClick={() => { setProdHardRange(opt.value); setProdHardRangeOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${prodHardRange === opt.value ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5">
                  {hardest.map((m, i) => {
                    const scale = prodHardRange === 7 ? 0.72 : prodHardRange === 30 ? 0.88 : prodHardRange === 180 ? 0.95 : 1;
                    const pct   = Math.max(0, Math.round(m.completionPct * scale));
                    return (
                      <div key={m.course.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{m.course.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-rose-500 font-semibold flex-shrink-0">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group" onClick={() => openDetail('product-dropped')}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-amber-50 flex items-center justify-center">
                      <TrendingDown className="size-3.5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Most Dropped</p>
                      <p className="text-[11px] text-gray-400">Highest learner drop-off count</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    <button onClick={() => setProdDropRangeOpen(v => !v)}
                      className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      {prodDropRange === 7 ? 'Last 7d' : prodDropRange === 30 ? 'Last 30d' : prodDropRange === 180 ? 'Last 6mo' : 'Last year'}
                      <ChevronDown className={`size-2.5 transition-transform ${prodDropRangeOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {prodDropRangeOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                        {([{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 180, label: 'Last 6 months' }, { value: 365, label: 'Last year' }] as const).map(opt => (
                          <button key={opt.value} onClick={() => { setProdDropRange(opt.value); setProdDropRangeOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${prodDropRange === opt.value ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5">
                  {mostDrop.map((m, i) => {
                    const scale      = prodDropRange === 7 ? 0.72 : prodDropRange === 30 ? 0.88 : prodDropRange === 180 ? 0.95 : 1;
                    const scaledDrop = Math.max(0, Math.round(m.droppedCt * scale));
                    const scaledEnrl = Math.max(0, Math.round(m.enrollCt  * scale));
                    return (
                      <div key={m.course.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{m.course.title}</p>
                          <p className="text-[10px] text-amber-500 font-semibold mt-0.5">{scaledDrop} learners dropped</p>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{scaledEnrl} enrolled</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            </> /* end analytics tab */}

            {/* All Courses tab */}
            {prodTab === 'all-courses' && (() => {
              const totalPages = Math.ceil(courseMetrics.length / PROD_COURSES_PER_PAGE);
              const safePage   = Math.min(prodCoursesPage, totalPages || 1);
              const pageSlice  = courseMetrics.slice((safePage - 1) * PROD_COURSES_PER_PAGE, safePage * PROD_COURSES_PER_PAGE);
              const startIdx   = (safePage - 1) * PROD_COURSES_PER_PAGE + 1;
              const endIdx     = Math.min(safePage * PROD_COURSES_PER_PAGE, courseMetrics.length);
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">All Courses Performance</p>
                      <p className="text-xs text-gray-400 mt-0.5">{totalCourses} courses in catalogue</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="size-3.5" /> Export
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {['Course', 'Category', 'Level', 'Enrolled', 'Completion', 'Engagement', 'Rating', 'Duration'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageSlice.map((m, i) => (
                        <tr key={m.course.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 text-xs max-w-[160px] truncate">{m.course.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{m.course.instructor}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{m.course.category}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.course.level === 'Beginner' ? 'bg-green-50 text-green-600' : m.course.level === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                              {m.course.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-700">{m.enrollCt.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${m.completionPct >= 70 ? 'bg-teal-400' : m.completionPct >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${m.completionPct}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{m.completionPct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${m.engagementPct}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{m.engagementPct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Star className="size-3 text-amber-400 fill-amber-400" />
                              <span className="text-xs font-semibold text-gray-700">{m.rating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="size-3 text-gray-300" />
                              {m.durationMins >= 60 ? `${Math.floor(m.durationMins / 60)}h ${m.durationMins % 60 > 0 ? `${m.durationMins % 60}m` : ''}` : `${m.durationMins}m`}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Pagination footer */}
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Showing <span className="font-semibold text-gray-600">{startIdx}–{endIdx}</span> of <span className="font-semibold text-gray-600">{courseMetrics.length}</span> courses
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setProdCoursesPage(p => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="size-3 rotate-90" /> Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            onClick={() => setProdCoursesPage(p)}
                            className={`size-7 rounded-lg text-xs font-semibold transition-colors ${safePage === p ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          onClick={() => setProdCoursesPage(p => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Next <ChevronDown className="size-3 -rotate-90" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()} {/* end all-courses tab */}
          </div>
        );
      })()}

      {/* ── Section nav rows (replace accordions) ── */}
      {analyticsTab === 'all-reports' && analyticsView !== 'system-health' && analyticsView !== 'ai-insights' && analyticsView !== 'training-matrix' && analyticsView !== 'product-insights' && analyticsView !== 'scheduled-reports' && (
        <div className="space-y-2">
          {sectionDefs.filter(s => showSection(s.name)).map(s => {
            /* ── User Progress: inline dropdown ── */
            if (s.name === 'User Progress') {
              return (
                <div key={s.name} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${progressDropdownOpen ? 'border-indigo-100' : 'border-transparent'}`}>
                  <button
                    onClick={() => setProgressDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <s.Icon className={`size-[18px] ${s.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{progressSubView ?? s.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 flex-shrink-0 transition-all duration-200 ${progressDropdownOpen ? 'rotate-180 text-indigo-500' : 'text-gray-300 group-hover:text-gray-500'}`} />
                  </button>
                  {progressDropdownOpen && (
                    <div className="border-t border-indigo-50 bg-gray-50/60 px-3 pb-3 pt-2 space-y-0.5">
                      {progressSubOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            setProgressSubView(opt);
                            setProgressDropdownOpen(false);
                            openDetail('User Progress');
                          }}
                          className={`w-full flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors group/opt ${progressSubView === opt ? 'bg-indigo-500 text-white font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 mt-1 ${progressSubView === opt ? 'bg-white' : 'bg-gray-300 group-hover/opt:bg-indigo-400'}`} />
                          <span className="flex-1 min-w-0">
                            <span className="block leading-snug">{opt}</span>
                            {subOptionDescriptions[opt] && (
                              <span className="block text-xs mt-0.5 opacity-60 leading-snug">{subOptionDescriptions[opt]}</span>
                            )}
                          </span>
                          <ChevronRight className={`size-3.5 transition-all group-hover/opt:translate-x-0.5 ${progressSubView === opt ? 'opacity-100 text-white' : 'opacity-0 group-hover/opt:opacity-100 text-gray-400'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── User Activity: inline dropdown ── */
            if (s.name === 'User Activity') {
              return (
                <div key={s.name} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${activityDropdownOpen ? 'border-blue-100' : 'border-transparent'}`}>
                  {/* Row header */}
                  <button
                    onClick={() => setActivityDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <s.Icon className={`size-[18px] ${s.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activitySubView ?? s.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 flex-shrink-0 transition-all duration-200 ${activityDropdownOpen ? 'rotate-180 text-blue-500' : 'text-gray-300 group-hover:text-gray-500'}`} />
                  </button>
                  {/* Dropdown options */}
                  {activityDropdownOpen && (
                    <div className="border-t border-blue-50 bg-gray-50/60 px-3 pb-3 pt-2 space-y-0.5">
                      {activitySubOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            setActivitySubView(opt);
                            setActivityDropdownOpen(false);
                            openDetail('User Activity');
                          }}
                          className={`w-full flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors group/opt ${activitySubView === opt ? 'bg-blue-500 text-white font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 mt-1 ${activitySubView === opt ? 'bg-white' : 'bg-gray-300 group-hover/opt:bg-blue-400'}`} />
                          <span className="flex-1 min-w-0">
                            <span className="block leading-snug">{opt}</span>
                            {subOptionDescriptions[opt] && (
                              <span className="block text-xs mt-0.5 opacity-60 leading-snug">{subOptionDescriptions[opt]}</span>
                            )}
                          </span>
                          <ChevronRight className={`size-3.5 opacity-0 group-hover/opt:opacity-100 transition-all group-hover/opt:translate-x-0.5 ${activitySubView === opt ? 'opacity-100 text-white' : 'text-gray-400'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── Users Growth: inline dropdown ── */
            if (s.name === 'Users Growth') {
              return (
                <div key={s.name} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${growthDropdownOpen ? 'border-green-100' : 'border-transparent'}`}>
                  <button
                    onClick={() => setGrowthDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <s.Icon className={`size-[18px] ${s.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{growthSubView ?? s.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 flex-shrink-0 transition-all duration-200 ${growthDropdownOpen ? 'rotate-180 text-green-500' : 'text-gray-300 group-hover:text-gray-500'}`} />
                  </button>
                  {growthDropdownOpen && (
                    <div className="border-t border-green-50 bg-gray-50/60 px-3 pb-3 pt-2 space-y-0.5">
                      {growthSubOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            setGrowthSubView(opt);
                            setGrowthDropdownOpen(false);
                            openDetail('Users Growth');
                          }}
                          className={`w-full flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors group/opt ${growthSubView === opt ? 'bg-green-500 text-white font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 mt-1 ${growthSubView === opt ? 'bg-white' : 'bg-gray-300 group-hover/opt:bg-green-400'}`} />
                          <span className="flex-1 min-w-0">
                            <span className="block leading-snug">{opt}</span>
                            {subOptionDescriptions[opt] && (
                              <span className="block text-xs mt-0.5 opacity-60 leading-snug">{subOptionDescriptions[opt]}</span>
                            )}
                          </span>
                          <ChevronRight className={`size-3.5 transition-all group-hover/opt:translate-x-0.5 ${growthSubView === opt ? 'opacity-100 text-white' : 'opacity-0 group-hover/opt:opacity-100 text-gray-400'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── User Groups & Seat: inline dropdown ── */
            if (s.name === 'User Groups & Seat') {
              return (
                <div key={s.name} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${seatDropdownOpen ? 'border-slate-200' : 'border-transparent'}`}>
                  <button
                    onClick={() => setSeatDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <s.Icon className={`size-[18px] ${s.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{seatSubView ?? s.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 flex-shrink-0 transition-all duration-200 ${seatDropdownOpen ? 'rotate-180 text-slate-500' : 'text-gray-300 group-hover:text-gray-500'}`} />
                  </button>
                  {seatDropdownOpen && (
                    <div className="border-t border-slate-100 bg-gray-50/60 px-3 pb-3 pt-2 space-y-0.5">
                      {seatSubOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            setSeatSubView(opt);
                            setSeatDropdownOpen(false);
                            openDetail('User Groups & Seat');
                          }}
                          className={`w-full flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors group/opt ${seatSubView === opt ? 'bg-slate-600 text-white font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 mt-1 ${seatSubView === opt ? 'bg-white' : 'bg-gray-300 group-hover/opt:bg-slate-400'}`} />
                          <span className="flex-1 min-w-0">
                            <span className="block leading-snug">{opt}</span>
                            {subOptionDescriptions[opt] && (
                              <span className="block text-xs mt-0.5 opacity-60 leading-snug">{subOptionDescriptions[opt]}</span>
                            )}
                          </span>
                          <ChevronRight className={`size-3.5 transition-all group-hover/opt:translate-x-0.5 ${seatSubView === opt ? 'opacity-100 text-white' : 'opacity-0 group-hover/opt:opacity-100 text-gray-400'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── Marketing Performance: inline dropdown ── */
            if (s.name === 'Marketing Performance') {
              return (
                <div key={s.name} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${marketingDropdownOpen ? 'border-rose-100' : 'border-transparent'}`}>
                  <button
                    onClick={() => setMarketingDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <s.Icon className={`size-[18px] ${s.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{marketingSubView ?? s.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 flex-shrink-0 transition-all duration-200 ${marketingDropdownOpen ? 'rotate-180 text-rose-500' : 'text-gray-300 group-hover:text-gray-500'}`} />
                  </button>
                  {marketingDropdownOpen && (
                    <div className="border-t border-rose-50 bg-gray-50/60 px-3 pb-3 pt-2 space-y-0.5">
                      {marketingSubOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            setMarketingSubView(opt);
                            setMarketingDropdownOpen(false);
                            openDetail('Marketing Performance');
                          }}
                          className={`w-full flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors group/opt ${marketingSubView === opt ? 'bg-rose-500 text-white font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 mt-1 ${marketingSubView === opt ? 'bg-white' : 'bg-gray-300 group-hover/opt:bg-rose-400'}`} />
                          <span className="flex-1 min-w-0">
                            <span className="block leading-snug">{opt}</span>
                            {subOptionDescriptions[opt] && (
                              <span className="block text-xs mt-0.5 opacity-60 leading-snug">{subOptionDescriptions[opt]}</span>
                            )}
                          </span>
                          <ChevronRight className={`size-3.5 transition-all group-hover/opt:translate-x-0.5 ${marketingSubView === opt ? 'opacity-100 text-white' : 'opacity-0 group-hover/opt:opacity-100 text-gray-400'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── Learning Performances: inline dropdown ── */
            if (s.name === 'Learning Performances') {
              return (
                <div key={s.name} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${learningDropdownOpen ? 'border-teal-100' : 'border-transparent'}`}>
                  <button
                    onClick={() => setLearningDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <s.Icon className={`size-[18px] ${s.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{learningSubView ?? s.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 flex-shrink-0 transition-all duration-200 ${learningDropdownOpen ? 'rotate-180 text-teal-500' : 'text-gray-300 group-hover:text-gray-500'}`} />
                  </button>
                  {learningDropdownOpen && (
                    <div className="border-t border-teal-50 bg-gray-50/60 px-3 pb-3 pt-2 space-y-0.5">
                      {learningSubOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            setLearningSubView(opt);
                            setLearningDropdownOpen(false);
                            openDetail('Learning Performances');
                          }}
                          className={`w-full flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors group/opt ${learningSubView === opt ? 'bg-teal-500 text-white font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 mt-1 ${learningSubView === opt ? 'bg-white' : 'bg-gray-300 group-hover/opt:bg-teal-400'}`} />
                          <span className="flex-1 min-w-0">
                            <span className="block leading-snug">{opt}</span>
                            {subOptionDescriptions[opt] && (
                              <span className="block text-xs mt-0.5 opacity-60 leading-snug">{subOptionDescriptions[opt]}</span>
                            )}
                          </span>
                          <ChevronRight className={`size-3.5 transition-all group-hover/opt:translate-x-0.5 ${learningSubView === opt ? 'opacity-100 text-white' : 'opacity-0 group-hover/opt:opacity-100 text-gray-400'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── Users Engagement: inline dropdown ── */
            if (s.name === 'Users Engagement') {
              return (
                <div key={s.name} className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-colors ${engagementDropdownOpen ? 'border-amber-100' : 'border-transparent'}`}>
                  <button
                    onClick={() => setEngagementDropdownOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <s.Icon className={`size-[18px] ${s.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{engagementSubView ?? s.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 flex-shrink-0 transition-all duration-200 ${engagementDropdownOpen ? 'rotate-180 text-amber-500' : 'text-gray-300 group-hover:text-gray-500'}`} />
                  </button>
                  {engagementDropdownOpen && (
                    <div className="border-t border-amber-50 bg-gray-50/60 px-3 pb-3 pt-2 space-y-0.5">
                      {engagementSubOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            setEngagementSubView(opt);
                            setEngagementDropdownOpen(false);
                            openDetail('Users Engagement');
                          }}
                          className={`w-full flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm transition-colors group/opt ${engagementSubView === opt ? 'bg-amber-500 text-white font-medium' : 'text-gray-700 hover:bg-white hover:shadow-sm'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 mt-1 ${engagementSubView === opt ? 'bg-white' : 'bg-gray-300 group-hover/opt:bg-amber-400'}`} />
                          <span className="flex-1 min-w-0">
                            <span className="block leading-snug">{opt}</span>
                            {subOptionDescriptions[opt] && (
                              <span className="block text-xs mt-0.5 opacity-60 leading-snug">{subOptionDescriptions[opt]}</span>
                            )}
                          </span>
                          <ChevronRight className={`size-3.5 transition-all group-hover/opt:translate-x-0.5 ${engagementSubView === opt ? 'opacity-100 text-white' : 'opacity-0 group-hover/opt:opacity-100 text-gray-400'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            /* ── All other sections: plain nav row ── */
            return (
              <button
                key={s.name}
                onClick={() => openDetail(s.name)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors group border border-transparent hover:border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <s.Icon className={`size-[18px] ${s.iconColor}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      </>}{/* end all-reports tab */}
        </div>{/* end p-6 space-y-6 */}
        </div>{/* end panel 1 */}

        {/* ══ PANEL 2: Detail view ══ */}
        <div style={{ width: '50%' }}>
          <div className="p-6 space-y-5">
            {/* Back bar */}
            <div className="bg-white rounded-xl shadow-sm px-5 py-2.5 flex items-center gap-3 relative">
              {/* Left: nav */}
              <button
                onClick={closeDetail}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors group flex-shrink-0"
              >
                <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                Go back
              </button>
              {currentSection === '__segment__' && (<>
                <div className="h-4 w-px bg-gray-200" />
                <div className="size-7 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Target className="size-3.5 text-teal-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{editingSegment ? 'Edit segment' : 'Create segment'}</p>
              </>)}
              {currentSection === 'product-radar' && (<>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className="size-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Package className="size-3.5 text-indigo-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm flex-shrink-0">Course Performance — Per Course Radar</p>
              </>)}
              {currentSection === 'product-bar' && (<>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className="size-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="size-3.5 text-indigo-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm flex-shrink-0">Most Popular — Per Course Breakdown</p>
                <span className="ml-auto text-[11px] text-gray-400 font-medium">
                  {prodBarRange === 7 ? 'Last 7 days' : prodBarRange === 30 ? 'Last 30 days' : prodBarRange === 180 ? 'Last 6 months' : 'Last year'}
                </span>
              </>)}
              {currentSection === 'product-line' && (<>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className="size-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="size-3.5 text-amber-500" />
                </div>
                <p className="font-semibold text-gray-900 text-sm flex-shrink-0">Engagement vs Completion — Per Course</p>
                <span className="ml-auto text-[11px] text-gray-400 font-medium">
                  {prodLineRange === 7 ? 'Last 7 days' : prodLineRange === 30 ? 'Last 30 days' : prodLineRange === 180 ? 'Last 6 months' : 'Last year'}
                </span>
              </>)}
              {currentSection === 'product-hardest' && (<>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className="size-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="size-3.5 text-rose-500" />
                </div>
                <p className="font-semibold text-gray-900 text-sm flex-shrink-0">Hardest Courses — Completion Breakdown</p>
                <span className="ml-auto text-[11px] text-gray-400 font-medium">
                  {prodHardRange === 7 ? 'Last 7 days' : prodHardRange === 30 ? 'Last 30 days' : prodHardRange === 180 ? 'Last 6 months' : 'Last year'}
                </span>
              </>)}
              {currentSection === 'product-dropped' && (<>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className="size-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="size-3.5 text-amber-500" />
                </div>
                <p className="font-semibold text-gray-900 text-sm flex-shrink-0">Most Dropped — Drop-off Breakdown</p>
                <span className="ml-auto text-[11px] text-gray-400 font-medium">
                  {prodDropRange === 7 ? 'Last 7 days' : prodDropRange === 30 ? 'Last 30 days' : prodDropRange === 180 ? 'Last 6 months' : 'Last year'}
                </span>
              </>)}
              {activeSection && currentSection !== '__segment__' && currentSection !== 'product-radar' && currentSection !== 'product-bar' && currentSection !== 'product-line' && currentSection !== 'product-hardest' && currentSection !== 'product-dropped' && (<>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className={`size-7 rounded-lg ${activeSection.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <activeSection.Icon className={`size-3.5 ${activeSection.iconColor}`} />
                </div>
                <p className="font-semibold text-gray-900 text-sm flex-shrink-0">{activeSection.name}</p>
              </>)}

              {/* Right: action buttons (segment creation only) */}
              {currentSection === '__segment__' && (
                <div className="ml-auto flex items-center gap-1.5">

                  {/* Save Segment */}
                  <button onClick={() => fireBarToast('Segment saved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors">
                    <Bookmark className="size-3.5" />
                    Save Segment
                  </button>

                  {/* Tags dropdown */}
                  <div className="relative" data-bar-menu>
                    <button onClick={() => { setShowTagMenu(v => !v); setShowMoreMenu(false); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showTagMenu ? 'bg-gray-100 border-gray-300 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200'}`}>
                      <Tag className="size-3.5" />
                      Tags
                      <ChevronDown className={`size-3 transition-transform ${showTagMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showTagMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                        <button onClick={() => fireBarToast('Tags added to filtered users')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Plus className="size-3.5 text-teal-500" />
                          Add Tags
                        </button>
                        <button onClick={() => fireBarToast('Tags removed from filtered users')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <X className="size-3.5 text-red-400" />
                          Remove Tags
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Schedule Report */}
                  <button onClick={() => fireBarToast('Report scheduled')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                    <Calendar className="size-3.5" />
                    Schedule
                  </button>

                  {/* Export */}
                  <button onClick={() => fireBarToast('Export started — check your email')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                    <Download className="size-3.5" />
                    Export
                  </button>
                </div>
              )}

              {/* Toast */}
              {barToast && (
                <div className="absolute right-4 -bottom-10 z-50 flex items-center gap-2 bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg animate-fade-in pointer-events-none">
                  <CheckCircle className="size-3.5 text-teal-400 flex-shrink-0" />
                  {barToast}
                </div>
              )}
            </div>


            {/* ── User Progress stat spotlight ── */}
            {currentSection === 'User Progress' && (() => {
              const statOptions = [
                { key: 'completion', label: 'Completion Rate', value: `${avgCompletionRate}%`, sub: `vs ${thresholds.completionTarget}% target`, accent: 'text-indigo-600', ring: 'bg-indigo-500', bg: 'bg-indigo-50', divider: 'bg-indigo-100', activePill: 'bg-indigo-100' },
                { key: 'finished',   label: 'Courses Finished', value: String(completedCourses), sub: `of ${totalEnrollments} enrolled`, accent: 'text-teal-600', ring: 'bg-teal-500', bg: 'bg-teal-50', divider: 'bg-teal-100', activePill: 'bg-teal-100' },
                { key: 'inprogress', label: 'In Progress', value: String(totalEnrollments - completedCourses), sub: 'currently learning', accent: 'text-amber-600', ring: 'bg-amber-500', bg: 'bg-amber-50', divider: 'bg-amber-100', activePill: 'bg-amber-100' },
                { key: 'score',      label: 'Avg Score', value: '87%', sub: 'across assessments', accent: 'text-purple-600', ring: 'bg-purple-500', bg: 'bg-purple-50', divider: 'bg-purple-100', activePill: 'bg-purple-100' },
              ] as const;
              const active = statOptions.find(s => s.key === progressStat)!;
              return (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-stretch">
                    <div className={`flex-1 px-6 py-5 flex flex-col justify-center transition-colors duration-300 ${active.bg}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors duration-300 ${active.accent}`}>{active.label}</p>
                      <p className="text-4xl font-bold text-gray-900 leading-none">{active.value}</p>
                      <p className="text-xs text-gray-500 mt-1.5">{active.sub}</p>
                    </div>
                    <div className={`w-px my-4 transition-colors duration-300 ${active.divider}`} />
                    <div className="flex flex-col justify-center gap-1 px-4 py-4">
                      {statOptions.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setProgressStat(opt.key)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors w-full ${progressStat === opt.key ? opt.activePill : 'hover:bg-gray-50'}`}
                        >
                          <span className={`size-1.5 rounded-full flex-shrink-0 transition-colors ${progressStat === opt.key ? opt.ring : 'bg-gray-300'}`} />
                          <span className={`text-xs font-medium whitespace-nowrap ${progressStat === opt.key ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── User Activity stat spotlight + Recent Activity ── */}
            {currentSection === 'User Activity' && (() => {
              const statOptions = [
                { key: 'active',      label: 'Monthly Active',                                              value: String(activeUsers),        sub: 'completed ≥1 lesson',            accent: 'text-blue-600',   ring: 'bg-blue-500',   bg: 'bg-blue-50',   divider: 'bg-blue-100',   activePill: 'bg-blue-100'   },
                { key: 'loggedin',    label: `Logged In (${thresholds.inactiveDays}d)`,                     value: String(loggedIn30Days),     sub: `of ${users.length} total users`, accent: 'text-sky-600',    ring: 'bg-sky-500',    bg: 'bg-sky-50',    divider: 'bg-sky-100',    activePill: 'bg-sky-100'    },
                { key: 'notenrolled', label: `Not Enrolled (${Math.round(thresholds.reEngageDays / 30)}mo)`, value: String(notEnrolled2Months), sub: 'need re-engagement',             accent: 'text-amber-600',  ring: 'bg-amber-500',  bg: 'bg-amber-50',  divider: 'bg-amber-100',  activePill: 'bg-amber-100'  },
                { key: 'avglogins',   label: 'Daily Avg Logins',                                            value: String(avgDailyLogins),     sub: '↑ 11% from last month',          accent: 'text-indigo-600', ring: 'bg-indigo-500', bg: 'bg-indigo-50', divider: 'bg-indigo-100', activePill: 'bg-indigo-100' },
              ] as const;
              const active = statOptions.find(s => s.key === activityStat)!;
              return (
                <div className="flex gap-4 items-stretch h-44">
                  {/* Spotlight */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
                    <div className="flex items-stretch h-full">
                      <div className={`flex-1 px-5 py-4 flex flex-col justify-center transition-colors duration-300 ${active.bg}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors duration-300 ${active.accent}`}>{active.label}</p>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{active.value}</p>
                        <p className="text-xs text-gray-500 mt-1.5">{active.sub}</p>
                      </div>
                      <div className={`w-px my-3 transition-colors duration-300 ${active.divider}`} />
                      <div className="flex flex-col justify-center gap-0.5 px-3 py-3">
                        {statOptions.map(opt => (
                          <button key={opt.key} onClick={() => setActivityStat(opt.key)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors w-full ${activityStat === opt.key ? opt.activePill : 'hover:bg-gray-50'}`}>
                            <span className={`size-1.5 rounded-full flex-shrink-0 transition-colors ${activityStat === opt.key ? opt.ring : 'bg-gray-300'}`} />
                            <span className={`text-xs font-medium whitespace-nowrap ${activityStat === opt.key ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400"><span className="size-1.5 bg-green-400 rounded-full animate-pulse inline-block" />Live</div>
                    </div>
                    <div className="overflow-y-auto flex-1 px-2 py-1.5">
                      {recentActivity.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className={`size-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'enrollment' ? 'bg-blue-500' : a.type === 'completion' ? 'bg-green-500' : a.type === 'login' ? 'bg-purple-500' : a.type === 'click' ? 'bg-orange-500' : a.type === 'search' ? 'bg-pink-500' : a.type === 'video' ? 'bg-red-500' : 'bg-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-900 truncate"><span className="font-medium">{a.user}</span> {a.action}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Users Growth stat spotlight + New vs Returning chart ── */}
            {currentSection === 'Users Growth' && (() => {
              const statOptions = [
                { key: 'total',     label: 'Total Users',     value: String(users.length),                                   sub: 'registered accounts',                                                    accent: 'text-green-600',  ring: 'bg-green-500',  bg: 'bg-green-50',  divider: 'bg-green-100',  activePill: 'bg-green-100'  },
                { key: 'new',       label: 'New This Month',  value: `+${newUsersThisMonth}`,                                sub: `target: +${Math.round(users.length * thresholds.growthTargetPct / 100)}`, accent: 'text-emerald-600', ring: 'bg-emerald-500', bg: 'bg-emerald-50', divider: 'bg-emerald-100', activePill: 'bg-emerald-100' },
                { key: 'returning', label: 'Returning Users', value: String(loginData[loginData.length - 1].returningUsers), sub: 'active last 30 days',                                                      accent: 'text-teal-600',   ring: 'bg-teal-500',   bg: 'bg-teal-50',   divider: 'bg-teal-100',   activePill: 'bg-teal-100'   },
                { key: 'churn',     label: 'Churn Rate',      value: '2.1%',                                                 sub: `alert at ${thresholds.churnAlertPct}%`,                                   accent: 'text-red-500',    ring: 'bg-red-500',    bg: 'bg-red-50',    divider: 'bg-red-100',    activePill: 'bg-red-100'    },
              ] as const;
              const active = statOptions.find(s => s.key === growthStat)!;
              return (
                <div className="flex gap-4 items-stretch h-44">
                  {/* Spotlight */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
                    <div className="flex items-stretch h-full">
                      <div className={`flex-1 px-5 py-4 flex flex-col justify-center transition-colors duration-300 ${active.bg}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors duration-300 ${active.accent}`}>{active.label}</p>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{active.value}</p>
                        <p className="text-xs text-gray-500 mt-1.5">{active.sub}</p>
                      </div>
                      <div className={`w-px my-3 transition-colors duration-300 ${active.divider}`} />
                      <div className="flex flex-col justify-center gap-0.5 px-3 py-3">
                        {statOptions.map(opt => (
                          <button key={opt.key} onClick={() => setGrowthStat(opt.key)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors w-full ${growthStat === opt.key ? opt.activePill : 'hover:bg-gray-50'}`}>
                            <span className={`size-1.5 rounded-full flex-shrink-0 transition-colors ${growthStat === opt.key ? opt.ring : 'bg-gray-300'}`} />
                            <span className={`text-xs font-medium whitespace-nowrap ${growthStat === opt.key ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* New vs Returning chart */}
                  <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-gray-800">New vs Returning</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5"><div className="size-2 bg-emerald-400 rounded-sm" /><span className="text-xs text-gray-400">New</span></div>
                        <div className="flex items-center gap-1.5"><div className="size-2 bg-teal-500 rounded-sm" /><span className="text-xs text-gray-400">Returning</span></div>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 px-4 py-2 space-y-2">
                      {loginData.map(d => (
                        <div key={d.month}>
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-gray-500 font-medium w-7">{d.month}</span>
                            <span className="text-gray-400 text-[10px]">{d.newUsers} · {d.returningUsers}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-400 rounded-l-full" style={{ width: `${(d.newUsers / (d.newUsers + d.returningUsers)) * 100}%` }} />
                            <div className="h-full bg-teal-500" style={{ width: `${(d.returningUsers / (d.newUsers + d.returningUsers)) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Users Engagement stat spotlight + Top Interactions ── */}
            {currentSection === 'Users Engagement' && (() => {
              const statOptions = [
                { key: 'interactions', label: 'Total Interactions', value: totalClicks.toLocaleString(),          sub: 'last 30 days',                               accent: 'text-amber-600',  ring: 'bg-amber-500',  bg: 'bg-amber-50',  divider: 'bg-amber-100',  activePill: 'bg-amber-100'  },
                { key: 'bounce',       label: 'Bounce Rate',        value: '32%',                                sub: `alert at ${thresholds.bounceRateMax}%`,       accent: 'text-orange-600', ring: 'bg-orange-500', bg: 'bg-orange-50', divider: 'bg-orange-100', activePill: 'bg-orange-100' },
                { key: 'pages',        label: 'Avg Pages / Visit',  value: '4.2',                                sub: '↑ 0.4 from last month',                      accent: 'text-yellow-600', ring: 'bg-yellow-500', bg: 'bg-yellow-50', divider: 'bg-yellow-100', activePill: 'bg-yellow-100' },
                { key: 'session',      label: 'Avg Session Time',   value: '18 min',                             sub: `target: ${thresholds.sessionTimeTarget} min`, accent: 'text-lime-600',   ring: 'bg-lime-500',   bg: 'bg-lime-50',   divider: 'bg-lime-100',   activePill: 'bg-lime-100'   },
              ] as const;
              const active = statOptions.find(s => s.key === engagementStat)!;
              return (
                <div className="flex gap-4 items-stretch h-44">
                  {/* Spotlight */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
                    <div className="flex items-stretch h-full">
                      <div className={`flex-1 px-5 py-4 flex flex-col justify-center transition-colors duration-300 ${active.bg}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors duration-300 ${active.accent}`}>{active.label}</p>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{active.value}</p>
                        <p className="text-xs text-gray-500 mt-1.5">{active.sub}</p>
                      </div>
                      <div className={`w-px my-3 transition-colors duration-300 ${active.divider}`} />
                      <div className="flex flex-col justify-center gap-0.5 px-3 py-3">
                        {statOptions.map(opt => (
                          <button key={opt.key} onClick={() => setEngagementStat(opt.key)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors w-full ${engagementStat === opt.key ? opt.activePill : 'hover:bg-gray-50'}`}>
                            <span className={`size-1.5 rounded-full flex-shrink-0 transition-colors ${engagementStat === opt.key ? opt.ring : 'bg-gray-300'}`} />
                            <span className={`text-xs font-medium whitespace-nowrap ${engagementStat === opt.key ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Top User Interactions */}
                  <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-gray-800">Top User Interactions</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 px-4 py-2 space-y-2">
                      {clickData.map((item, i) => (
                        <div key={item.action} className="flex items-center gap-2">
                          <span className="text-xs text-gray-300 w-3 text-right flex-shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="text-gray-700 font-medium truncate">{item.action}</span>
                              <span className="text-gray-400 text-[10px] ml-2 flex-shrink-0">{item.percentage}%</span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item.percentage * 2}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Learning Performances stat spotlight + Top Courses ── */}
            {currentSection === 'Learning Performances' && (() => {
              const statOptions = [
                { key: 'enrollments',  label: 'Total Enrollments',   value: String(totalEnrollments),      sub: `goal: ${thresholds.enrollmentGoal}`,          accent: 'text-teal-600',   ring: 'bg-teal-500',   bg: 'bg-teal-50',   divider: 'bg-teal-100',   activePill: 'bg-teal-100'   },
                { key: 'courses',      label: 'Active Courses',      value: String(companyCourses.length), sub: 'available to learners',                       accent: 'text-cyan-600',   ring: 'bg-cyan-500',   bg: 'bg-cyan-50',   divider: 'bg-cyan-100',   activePill: 'bg-cyan-100'   },
                { key: 'certificates', label: 'Certificates Issued', value: String(completedCourses),      sub: `passing score ≥${thresholds.passingScore}%`, accent: 'text-green-600',  ring: 'bg-green-500',  bg: 'bg-green-50',  divider: 'bg-green-100',  activePill: 'bg-green-100'  },
                { key: 'category',     label: 'Top Category',        value: topCategory,                   sub: 'most enrolled',                               accent: 'text-indigo-600', ring: 'bg-indigo-500', bg: 'bg-indigo-50', divider: 'bg-indigo-100', activePill: 'bg-indigo-100' },
              ] as const;
              const active = statOptions.find(s => s.key === learningStat)!;
              return (
                <div className="flex gap-4 items-stretch h-44">
                  {/* Spotlight */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
                    <div className="flex items-stretch h-full">
                      <div className={`flex-1 px-5 py-4 flex flex-col justify-center transition-colors duration-300 ${active.bg}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors duration-300 ${active.accent}`}>{active.label}</p>
                        <p className="text-3xl font-bold text-gray-900 leading-none truncate">{active.value}</p>
                        <p className="text-xs text-gray-500 mt-1.5">{active.sub}</p>
                      </div>
                      <div className={`w-px my-3 transition-colors duration-300 ${active.divider}`} />
                      <div className="flex flex-col justify-center gap-0.5 px-3 py-3">
                        {statOptions.map(opt => (
                          <button key={opt.key} onClick={() => setLearningStat(opt.key)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors w-full ${learningStat === opt.key ? opt.activePill : 'hover:bg-gray-50'}`}>
                            <span className={`size-1.5 rounded-full flex-shrink-0 transition-colors ${learningStat === opt.key ? opt.ring : 'bg-gray-300'}`} />
                            <span className={`text-xs font-medium whitespace-nowrap ${learningStat === opt.key ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Top Performing Courses */}
                  <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-gray-800">Top Performing Courses</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 px-3 py-2 space-y-1">
                      {topCourses.map((course, i) => (
                        <div key={course.id} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg">
                          <span className="text-xs font-bold text-gray-300 w-3 flex-shrink-0">{i + 1}</span>
                          <img src={course.imageUrl} alt={course.title} className="size-7 rounded object-cover flex-shrink-0" />
                          <p className="flex-1 text-xs font-medium text-gray-800 truncate">{course.title}</p>
                          <span className="text-xs font-semibold text-gray-900 flex-shrink-0">{(course.studentsEnrolled || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Marketing Performance stat spotlight + Revenue Trend ── */}
            {currentSection === 'Marketing Performance' && (() => {
              const statOptions = [
                { key: 'revenue',    label: 'Total Revenue',      value: `$${totalRevenue.toLocaleString()}`,                                       sub: `goal: $${thresholds.revenueGoal.toLocaleString()}`, accent: 'text-rose-600',    ring: 'bg-rose-500',    bg: 'bg-rose-50',    divider: 'bg-rose-100',    activePill: 'bg-rose-100'    },
                { key: 'arpu',       label: 'Avg Revenue / User', value: `$${Math.round(totalRevenue / Math.max(users.length, 1)).toLocaleString()}`, sub: 'per registered user',                              accent: 'text-pink-600',    ring: 'bg-pink-500',    bg: 'bg-pink-50',    divider: 'bg-pink-100',    activePill: 'bg-pink-100'    },
                { key: 'visits',     label: 'Monthly Visits',     value: trafficData[trafficData.length - 1].visits.toLocaleString(),               sub: '↑ 14% from last month',                            accent: 'text-fuchsia-600', ring: 'bg-fuchsia-500', bg: 'bg-fuchsia-50', divider: 'bg-fuchsia-100', activePill: 'bg-fuchsia-100' },
                { key: 'conversion', label: 'Conversion Rate',    value: '3.2%',                                                                   sub: `target: ${thresholds.conversionTarget}%`,          accent: 'text-purple-600',  ring: 'bg-purple-500',  bg: 'bg-purple-50',  divider: 'bg-purple-100',  activePill: 'bg-purple-100'  },
              ] as const;
              const active = statOptions.find(s => s.key === marketingStat)!;
              return (
                <div className="flex gap-4 items-stretch h-44">
                  {/* Spotlight */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
                    <div className="flex items-stretch h-full">
                      <div className={`flex-1 px-5 py-4 flex flex-col justify-center transition-colors duration-300 ${active.bg}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors duration-300 ${active.accent}`}>{active.label}</p>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{active.value}</p>
                        <p className="text-xs text-gray-500 mt-1.5">{active.sub}</p>
                      </div>
                      <div className={`w-px my-3 transition-colors duration-300 ${active.divider}`} />
                      <div className="flex flex-col justify-center gap-0.5 px-3 py-3">
                        {statOptions.map(opt => (
                          <button key={opt.key} onClick={() => setMarketingStat(opt.key)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors w-full ${marketingStat === opt.key ? opt.activePill : 'hover:bg-gray-50'}`}>
                            <span className={`size-1.5 rounded-full flex-shrink-0 transition-colors ${marketingStat === opt.key ? opt.ring : 'bg-gray-300'}`} />
                            <span className={`text-xs font-medium whitespace-nowrap ${marketingStat === opt.key ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Monthly Revenue Trend */}
                  <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-gray-800">Monthly Revenue Trend</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5"><div className="size-2 bg-green-400 rounded-sm" /><span className="text-xs text-gray-400">Above goal</span></div>
                        <div className="flex items-center gap-1.5"><div className="size-2 bg-rose-400 rounded-sm" /><span className="text-xs text-gray-400">Below goal</span></div>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 px-4 py-2 space-y-2">
                      {monthlyData.map(d => (
                        <div key={d.month}>
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-gray-500 font-medium w-7">{d.month}</span>
                            <span className="text-gray-400 text-[10px]">${d.revenue.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${d.revenue >= thresholds.revenueGoal ? 'bg-green-400' : 'bg-rose-400'}`} style={{ width: `${(d.revenue / 120000) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── User Groups & Seat stat spotlight + Utilization + Groups ── */}
            {currentSection === 'User Groups & Seat' && (() => {
              const statOptions = [
                { key: 'total',       label: 'Total Seats',     value: String(users.length),               sub: 'allocated',                       accent: 'text-slate-600', ring: 'bg-slate-500', bg: 'bg-slate-50', divider: 'bg-slate-200', activePill: 'bg-slate-100' },
                { key: 'active',      label: 'Active Seats',    value: String(activeUsers),                sub: 'in use',                          accent: 'text-teal-600',  ring: 'bg-teal-500',  bg: 'bg-teal-50',  divider: 'bg-teal-100',  activePill: 'bg-teal-100'  },
                { key: 'utilization', label: 'Utilization',     value: `${seatUtilization}%`,              sub: `min: ${thresholds.seatUtilMin}%`, accent: seatUtilization < thresholds.seatUtilMin ? 'text-red-500' : 'text-green-600', ring: seatUtilization < thresholds.seatUtilMin ? 'bg-red-500' : 'bg-green-500', bg: seatUtilization < thresholds.seatUtilMin ? 'bg-red-50' : 'bg-green-50', divider: seatUtilization < thresholds.seatUtilMin ? 'bg-red-100' : 'bg-green-100', activePill: seatUtilization < thresholds.seatUtilMin ? 'bg-red-100' : 'bg-green-100' },
                { key: 'available',   label: 'Available Seats', value: String(users.length - activeUsers),  sub: 'inactive / unused',               accent: 'text-gray-500',  ring: 'bg-gray-400',  bg: 'bg-gray-50',  divider: 'bg-gray-200',  activePill: 'bg-gray-100'  },
              ] as const;
              const active = statOptions.find(s => s.key === seatStat)!;
              const utilColor = seatUtilization < thresholds.seatUtilMin ? 'bg-red-400' : 'bg-teal-500';
              const utilTextColor = seatUtilization < thresholds.seatUtilMin ? 'text-red-500' : 'text-teal-600';
              return (
                <div className="flex gap-4 items-stretch h-44">
                  {/* Spotlight */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
                    <div className="flex items-stretch h-full">
                      <div className={`flex-1 px-5 py-4 flex flex-col justify-center transition-colors duration-300 ${active.bg}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors duration-300 ${active.accent}`}>{active.label}</p>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{active.value}</p>
                        <p className="text-xs text-gray-500 mt-1.5">{active.sub}</p>
                      </div>
                      <div className={`w-px my-3 transition-colors duration-300 ${active.divider}`} />
                      <div className="flex flex-col justify-center gap-0.5 px-3 py-3">
                        {statOptions.map(opt => (
                          <button key={opt.key} onClick={() => setSeatStat(opt.key)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors w-full ${seatStat === opt.key ? opt.activePill : 'hover:bg-gray-50'}`}>
                            <span className={`size-1.5 rounded-full flex-shrink-0 transition-colors ${seatStat === opt.key ? opt.ring : 'bg-gray-300'}`} />
                            <span className={`text-xs font-medium whitespace-nowrap ${seatStat === opt.key ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Seat Utilization + Groups */}
                  <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-gray-800">Seat Utilization</h3>
                      <span className={`text-sm font-bold ${utilTextColor}`}>{seatUtilization}%</span>
                    </div>
                    <div className="px-4 py-3 flex-shrink-0">
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${utilColor}`} style={{ width: `${seatUtilization}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                        <span>{activeUsers} active</span>
                        <span className="text-gray-300">{thresholds.seatUtilMin}% min</span>
                        <span>{users.length - activeUsers} inactive</span>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 border-t border-gray-50">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-gray-50"><th className="text-left px-4 py-2 font-semibold text-gray-400">Group</th><th className="text-right px-4 py-2 font-semibold text-gray-400">Members</th><th className="text-right px-4 py-2 font-semibold text-gray-400">Active</th><th className="text-right px-4 py-2 font-semibold text-gray-400">%</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {mockGroups.map(g => {
                            const pct = Math.round((g.active / g.count) * 100);
                            return (
                              <tr key={g.name} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-1.5 font-medium text-gray-800">{g.name}</td>
                                <td className="px-4 py-1.5 text-right text-gray-500">{g.count}</td>
                                <td className="px-4 py-1.5 text-right text-gray-500">{g.active}</td>
                                <td className="px-4 py-1.5 text-right"><span className={`font-semibold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Contextual filter panel ── */}
            {currentSection !== '__segment__' && (() => {
              const activeSubView =
                currentSection === 'User Progress' ? progressSubView
                : currentSection === 'User Activity' ? activitySubView
                : currentSection === 'Users Growth' ? growthSubView
                : currentSection === 'Users Engagement' ? engagementSubView
                : currentSection === 'Learning Performances' ? learningSubView
                : currentSection === 'Marketing Performance' ? marketingSubView
                : currentSection === 'User Groups & Seat' ? seatSubView
                : null;
              if (!activeSubView) return null;
              const tmpl = subOptionTemplate[activeSubView] ?? 'course-progress';
              const courseOpts = companyCourses.slice(0, 20).map(c => c.title);
              const iCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-400';
              const sCls = 'w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 appearance-none cursor-pointer';
              const lCls = 'block text-xs font-semibold text-gray-700 mb-1.5';
              const opCls = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 w-14 flex-shrink-0';
              return (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 px-1">
                    {(['select-users', 'advanced'] as const).map(tab => (
                      <button key={tab} onClick={() => setFilterTab(tab)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${filterTab === tab ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {tab === 'select-users' ? 'Select Users' : 'Advanced search'}
                      </button>
                    ))}
                  </div>
                  {filterTab === 'select-users' && (
                    <div className="p-5">

                      {/* ── User Activity: conversational filter builder ── */}
                      {tmpl === 'user-activity' ? (() => {
                        const dSel = "border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 appearance-none cursor-pointer";
                        const dInp = "border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 w-20 text-center";
                        return (
                          <div className="space-y-3">
                            {uaConditions.length === 0 && (
                              <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-3 border border-dashed border-gray-200">
                                <Filter className="size-4 flex-shrink-0 text-gray-300" />
                                No conditions added. Click <strong className="text-gray-500 mx-0.5">Add filter</strong> below to get started.
                              </div>
                            )}
                            {uaConditions.map((cond, idx) => {
                              const catDotColorsUA: Record<string, string> = {
                                user: 'bg-indigo-400', course: 'bg-teal-400',
                                activity: 'bg-amber-400', certificate: 'bg-green-400', group: 'bg-purple-400',
                              };
                              return (
                                <div key={cond.id} className="flex items-center gap-2 flex-wrap">
                                  {/* Prefix label */}
                                  <span className="text-sm text-gray-500 min-w-[90px]">
                                    {idx === 0
                                      ? 'Users who were'
                                      : cond.kind === 'catalog' ? 'and'
                                      : cond.kind === 'status' ? 'are'
                                      : cond.kind === 'platform' ? 'using'
                                      : 'logged in'}
                                  </span>

                                  {/* ── Named kind controls ── */}
                                  {cond.kind === 'activity' && (<>
                                    <div className="relative"><select value={cond.v1} onChange={e => updateUaCondition(cond.id, { v1: e.target.value })} className={dSel}><option>active</option><option>inactive</option><option>logged in</option><option>not enrolled</option></select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" /></div>
                                    <div className="relative"><select value={cond.v2} onChange={e => updateUaCondition(cond.id, { v2: e.target.value })} className={dSel}><option>exactly</option><option>at least</option><option>more than</option><option>less than</option></select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" /></div>
                                    <div className="relative"><select value={cond.v3} onChange={e => updateUaCondition(cond.id, { v3: e.target.value })} className={dSel}><option>this week</option><option>this month</option><option>last 7 days</option><option>last 14 days</option><option>last 30 days</option><option>last 60 days</option><option>last 90 days</option></select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" /></div>
                                  </>)}
                                  {cond.kind === 'status' && (<div className="relative"><select value={cond.v1} onChange={e => updateUaCondition(cond.id, { v1: e.target.value })} className={dSel}><option>active</option><option>inactive</option><option>not suspended</option><option>suspended</option></select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" /></div>)}
                                  {cond.kind === 'platform' && (<div className="relative"><select value={cond.v1} onChange={e => updateUaCondition(cond.id, { v1: e.target.value })} className={dSel}><option>web</option><option>mobile app</option><option>any platform</option></select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" /></div>)}
                                  {cond.kind === 'logins' && (<>
                                    <div className="relative"><select value={cond.v1} onChange={e => updateUaCondition(cond.id, { v1: e.target.value })} className={`${dSel} w-16`}><option>≥</option><option>≤</option><option>=</option></select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" /></div>
                                    <input type="number" value={cond.v2} onChange={e => updateUaCondition(cond.id, { v2: e.target.value })} min={0} className={dInp} />
                                    <span className="text-sm text-gray-500">times</span>
                                  </>)}

                                  {/* ── Catalog filter row ── */}
                                  {cond.kind === 'catalog' && (<>
                                    <span className={`size-2 rounded-full flex-shrink-0 ${catDotColorsUA[cond.category ?? ''] ?? 'bg-gray-300'}`} />
                                    <span className="text-sm font-medium text-gray-700 flex-shrink-0">{cond.label}</span>
                                    <div className="relative flex-shrink-0">
                                      <select value={cond.v1} onChange={e => updateUaCondition(cond.id, { v1: e.target.value })} className={dSel}>
                                        {uaGetOps(cond.inputType).map(op => <option key={op}>{op}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                    {cond.inputType === 'text' && (
                                      <input type="text" value={cond.v2} onChange={e => updateUaCondition(cond.id, { v2: e.target.value })} placeholder="value…" className={`${dSel} min-w-[100px]`} />
                                    )}
                                    {(cond.inputType === 'select' || cond.inputType === 'courseSelect') && (
                                      <div className="relative">
                                        <select value={cond.v2} onChange={e => updateUaCondition(cond.id, { v2: e.target.value })} className={dSel}>
                                          <option value="">Select…</option>
                                          {(cond.inputType === 'courseSelect' ? courses.map(c => c.title) : (cond.options ?? [])).map(o => <option key={o}>{o}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                                      </div>
                                    )}
                                    {cond.inputType === 'numberOp' && cond.v1 !== 'between' && (
                                      <input type="number" value={cond.v2} onChange={e => updateUaCondition(cond.id, { v2: e.target.value })} placeholder="0" className={`${dInp} w-20`} />
                                    )}
                                    {cond.inputType === 'numberOp' && cond.v1 === 'between' && (<>
                                      <input type="number" value={cond.v2} onChange={e => updateUaCondition(cond.id, { v2: e.target.value })} placeholder="Min" className={`${dInp} w-16`} />
                                      <span className="text-sm text-gray-400">–</span>
                                      <input type="number" value={cond.v3} onChange={e => updateUaCondition(cond.id, { v3: e.target.value })} placeholder="Max" className={`${dInp} w-16`} />
                                    </>)}
                                  </>)}

                                  {/* Remove ⊗ */}
                                  <button onClick={() => removeUaCondition(cond.id)}
                                    className="size-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors flex-shrink-0">
                                    <X className="size-3" />
                                  </button>

                                  {/* "and" connector */}
                                  {idx < uaConditions.length - 1 && (
                                    <span className="text-sm text-gray-400 font-medium">and</span>
                                  )}
                                </div>
                              );
                            })}

                            {/* Add filter button + full catalog picker */}
                            <div className="pt-1" data-ua-add>
                              <button onClick={() => { setShowUaAddMenu(v => !v); setUaPickerSearch(''); setUaPickerCat('all'); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${showUaAddMenu ? 'text-teal-700 bg-teal-50 border-teal-400' : 'text-teal-600 border-teal-300 hover:bg-teal-50'}`}>
                                <Plus className="size-4" />
                                Add filter
                                <ChevronDown className={`size-3.5 transition-transform ${showUaAddMenu ? 'rotate-180' : ''}`} />
                              </button>

                              {showUaAddMenu && (() => {
                                const pickerItems2 = ADV_FILTER_CATALOG.filter(d =>
                                  (uaPickerCat === 'all' || d.category === uaPickerCat) &&
                                  (!uaPickerSearch || d.label.toLowerCase().includes(uaPickerSearch.toLowerCase()))
                                );
                                const catDot: Record<string, string> = { user: 'bg-indigo-400', course: 'bg-teal-400', activity: 'bg-amber-400', certificate: 'bg-green-400', group: 'bg-purple-400' };
                                return (
                                  <div className="mt-2 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                                    {/* Search */}
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                                      <Search className="size-3.5 text-gray-400 flex-shrink-0" />
                                      <input autoFocus type="text" value={uaPickerSearch} onChange={e => setUaPickerSearch(e.target.value)}
                                        placeholder="Search filters…" className="flex-1 text-xs focus:outline-none placeholder:text-gray-400 bg-transparent" />
                                      {uaPickerSearch && <button onClick={() => setUaPickerSearch('')}><X className="size-3 text-gray-400 hover:text-gray-600" /></button>}
                                    </div>
                                    {/* Category chips */}
                                    <div className="flex flex-wrap gap-1 px-3 py-1.5 border-b border-gray-100">
                                      {(['all','user','course','activity','certificate','group'] as AdvFilterCat[]).map(cat => (
                                        <button key={cat} onClick={() => setUaPickerCat(cat)}
                                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${uaPickerCat === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                          {cat === 'all' ? `All ${ADV_FILTER_CATALOG.length}` : `${ADV_CAT_LABELS[cat]} ${ADV_FILTER_CATALOG.filter(d => d.category === cat).length}`}
                                        </button>
                                      ))}
                                    </div>
                                    {/* Filter list */}
                                    <div className="max-h-44 overflow-y-auto py-0.5">
                                      {pickerItems2.length === 0
                                        ? <p className="text-xs text-gray-400 text-center py-4">No filters found</p>
                                        : pickerItems2.map(def => {
                                          const already = uaConditions.some(c => c.field === def.key || (c.kind !== 'catalog' && def.key === `act_${c.kind}`));
                                          return (
                                            <button key={def.key} onClick={() => !already && addUaFromCatalog(def)} disabled={already}
                                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors group/item ${already ? 'opacity-40 cursor-default' : 'hover:bg-gray-50'}`}>
                                              <span className={`size-1.5 rounded-full flex-shrink-0 ${catDot[def.category] ?? 'bg-gray-300'}`} />
                                              <span className="text-sm text-gray-700 group-hover/item:text-gray-900 flex-1 truncate">{def.label}</span>
                                              {already ? <CheckCircle className="size-3.5 text-teal-400 flex-shrink-0" /> : <Plus className="size-3.5 text-gray-300 group-hover/item:text-teal-500 flex-shrink-0" />}
                                            </button>
                                          );
                                        })
                                      }
                                    </div>
                                  </div>
                                );
                              })()}

                              <p className="text-xs text-gray-400 mt-2">e.g. Users who are at risk</p>
                            </div>
                          </div>
                        );
                      })() : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                        {/* Left: context-specific filters */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-gray-800">
                            {tmpl === 'course-progress' && 'Select a course'}
                            {tmpl === 'registration' && 'Registration filters'}
                            {tmpl === 'enrollment' && 'Enrollment filters'}
                            {tmpl === 'score' && 'Score filters'}
                            {tmpl === 'community' && 'Community filters'}
                            {tmpl === 'device' && 'Device filters'}
                            {tmpl === 'campaign' && 'Campaign filters'}
                            {tmpl === 'seat' && 'Group & seat filters'}
                            {tmpl === 'certificate' && 'Certificate filters'}
                          </h3>
                          {tmpl === 'course-progress' && (<>
                            <div><label className={lCls}>Select <strong>a course</strong></label><div className="relative"><select value={fCourse} onChange={e => setFCourse(e.target.value)} className={sCls}><option value="" />{courseOpts.map(c => <option key={c}>{c}</option>)}</select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}>With <strong>average score</strong></label><div className="flex items-center gap-2"><select value={fScoreOp} onChange={e => setFScoreOp(e.target.value)} className={opCls}>{['≥','≤','='].map(o=><option key={o}>{o}</option>)}</select><input type="number" min={0} max={100} placeholder="e.g. 80" value={fScore} onChange={e=>setFScore(e.target.value)} className={`${iCls} flex-1`}/><span className="text-sm text-gray-500 flex-shrink-0">%</span></div></div>
                            <div><label className={lCls}>With <strong>progress</strong></label><div className="flex items-center gap-2"><select value={fProgressOp} onChange={e => setFProgressOp(e.target.value)} className={opCls}>{['≥','≤','='].map(o=><option key={o}>{o}</option>)}</select><input type="number" min={0} max={100} placeholder="e.g. 50" value={fProgress} onChange={e=>setFProgress(e.target.value)} className={`${iCls} flex-1`}/><span className="text-sm text-gray-500 flex-shrink-0">%</span></div></div>
                            <div><label className={lCls}>Is <strong>completed</strong></label><div className="relative"><select value={fCompleted} onChange={e => setFCompleted(e.target.value)} className={sCls}><option value="" /><option>Yes</option><option>No</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                          </>)}
                          {tmpl === 'registration' && (<>
                            <div><label className={lCls}><strong>Registration period</strong></label><div className="relative"><select value={fPeriod} onChange={e=>setFPeriod(e.target.value)} className={sCls}><option value="" /><option>Today</option><option>This week</option><option>This month</option><option>Last 3 months</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}>Registration <strong>source</strong></label><div className="relative"><select value={fPlatform} onChange={e=>setFPlatform(e.target.value)} className={sCls}><option value="" /><option>Direct</option><option>Campaign</option><option>Referral</option><option>Organic</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Account type</strong></label><div className="relative"><select value={fCompleted} onChange={e=>setFCompleted(e.target.value)} className={sCls}><option value="" /><option>Free</option><option>Paid</option><option>Trial</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>User role</strong></label><div className="relative"><select value={fCourse} onChange={e=>setFCourse(e.target.value)} className={sCls}><option value="" /><option>Learner</option><option>Manager</option><option>Admin</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                          </>)}
                          {tmpl === 'enrollment' && (<>
                            <div><label className={lCls}>Select <strong>a course</strong></label><div className="relative"><select value={fCourse} onChange={e=>setFCourse(e.target.value)} className={sCls}><option value="" />{courseOpts.map(c=><option key={c}>{c}</option>)}</select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Enrollment type</strong></label><div className="relative"><select value={fPlatform} onChange={e=>setFPlatform(e.target.value)} className={sCls}><option value="" /><option>Paid</option><option>Free</option><option>Seat</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Enrollment period</strong></label><div className="relative"><select value={fPeriod} onChange={e=>setFPeriod(e.target.value)} className={sCls}><option value="" /><option>This week</option><option>This month</option><option>Last 3 months</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}>Is <strong>completed</strong></label><div className="relative"><select value={fCompleted} onChange={e=>setFCompleted(e.target.value)} className={sCls}><option value="" /><option>Yes</option><option>No</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                          </>)}
                          {tmpl === 'score' && (<>
                            <div><label className={lCls}>Select <strong>a course</strong></label><div className="relative"><select value={fCourse} onChange={e=>setFCourse(e.target.value)} className={sCls}><option value="" />{courseOpts.map(c=><option key={c}>{c}</option>)}</select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Score</strong> from</label><input type="number" min={0} max={100} placeholder="e.g. 0" value={fScore} onChange={e=>setFScore(e.target.value)} className={iCls}/></div>
                            <div><label className={lCls}><strong>Score</strong> to</label><input type="number" min={0} max={100} placeholder="e.g. 100" value={fProgress} onChange={e=>setFProgress(e.target.value)} className={iCls}/></div>
                            <div><label className={lCls}><strong>Assessment type</strong></label><div className="relative"><select value={fCompleted} onChange={e=>setFCompleted(e.target.value)} className={sCls}><option value="" /><option>Quiz</option><option>Assignment</option><option>Final exam</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                          </>)}
                          {tmpl === 'community' && (<>
                            <div><label className={lCls}>Min <strong>post count</strong></label><div className="flex items-center gap-2"><select value={fScoreOp} onChange={e=>setFScoreOp(e.target.value)} className={opCls}>{['≥','≤','='].map(o=><option key={o}>{o}</option>)}</select><input type="number" min={0} placeholder="e.g. 10" value={fScore} onChange={e=>setFScore(e.target.value)} className={`${iCls} flex-1`}/></div></div>
                            <div><label className={lCls}><strong>Community type</strong></label><div className="relative"><select value={fPlatform} onChange={e=>setFPlatform(e.target.value)} className={sCls}><option value="" /><option>Course discussion</option><option>Forum</option><option>Q&amp;A</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Active within</strong></label><div className="relative"><select value={fPeriod} onChange={e=>setFPeriod(e.target.value)} className={sCls}><option value="" /><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Member role</strong></label><div className="relative"><select value={fCompleted} onChange={e=>setFCompleted(e.target.value)} className={sCls}><option value="" /><option>Member</option><option>Moderator</option><option>Top contributor</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                          </>)}
                          {tmpl === 'device' && (<>
                            <div><label className={lCls}><strong>Device type</strong></label><div className="relative"><select value={fPlatform} onChange={e=>setFPlatform(e.target.value)} className={sCls}><option value="" /><option>Mobile</option><option>Tablet</option><option>Desktop</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Operating system</strong></label><div className="relative"><select value={fCourse} onChange={e=>setFCourse(e.target.value)} className={sCls}><option value="" /><option>iOS</option><option>Android</option><option>Windows</option><option>macOS</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Session period</strong></label><div className="relative"><select value={fPeriod} onChange={e=>setFPeriod(e.target.value)} className={sCls}><option value="" /><option>This week</option><option>This month</option><option>Last 3 months</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}>Min <strong>sessions</strong></label><div className="flex items-center gap-2"><select value={fScoreOp} onChange={e=>setFScoreOp(e.target.value)} className={opCls}>{['≥','≤','='].map(o=><option key={o}>{o}</option>)}</select><input type="number" min={0} placeholder="e.g. 3" value={fScore} onChange={e=>setFScore(e.target.value)} className={`${iCls} flex-1`}/></div></div>
                          </>)}
                          {tmpl === 'campaign' && (<>
                            <div><label className={lCls}><strong>Campaign name</strong></label><input type="text" placeholder="e.g. Summer 2025" value={fCourse} onChange={e=>setFCourse(e.target.value)} className={iCls}/></div>
                            <div><label className={lCls}><strong>Attribution model</strong></label><div className="relative"><select value={fPlatform} onChange={e=>setFPlatform(e.target.value)} className={sCls}><option value="" /><option>First-click</option><option>Last-click</option><option>Linear</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Date range</strong></label><div className="relative"><select value={fPeriod} onChange={e=>setFPeriod(e.target.value)} className={sCls}><option value="" /><option>Today</option><option>This week</option><option>This month</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Conversion event</strong></label><div className="relative"><select value={fCompleted} onChange={e=>setFCompleted(e.target.value)} className={sCls}><option value="" /><option>Registration</option><option>Enrollment</option><option>Purchase</option><option>App install</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                          </>)}
                          {tmpl === 'seat' && (<>
                            <div><label className={lCls}><strong>User group</strong></label><div className="relative"><select value={fCourse} onChange={e=>setFCourse(e.target.value)} className={sCls}><option value="" />{mockGroups.map(g=><option key={g.name}>{g.name}</option>)}</select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Seat type</strong></label><div className="relative"><select value={fPlatform} onChange={e=>setFPlatform(e.target.value)} className={sCls}><option value="" /><option>Assigned</option><option>Unassigned</option><option>Any</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Period</strong></label><div className="relative"><select value={fPeriod} onChange={e=>setFPeriod(e.target.value)} className={sCls}><option value="" /><option>This month</option><option>Last 3 months</option><option>This year</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Status</strong></label><div className="relative"><select value={fCompleted} onChange={e=>setFCompleted(e.target.value)} className={sCls}><option value="" /><option>Active</option><option>Inactive</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                          </>)}
                          {tmpl === 'certificate' && (<>
                            <div><label className={lCls}><strong>Certificate type</strong></label><div className="relative"><select value={fCourse} onChange={e=>setFCourse(e.target.value)} className={sCls}><option value="" /><option>Course completion</option><option>Skill mastery</option><option>Certification exam</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}>Issued <strong>within</strong></label><div className="relative"><select value={fPeriod} onChange={e=>setFPeriod(e.target.value)} className={sCls}><option value="" /><option>Last 7 days</option><option>Last 30 days</option><option>Last 3 months</option><option>This year</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}><strong>Status</strong></label><div className="relative"><select value={fCompleted} onChange={e=>setFCompleted(e.target.value)} className={sCls}><option value="" /><option>Active</option><option>Expired</option><option>Revoked</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                            <div><label className={lCls}>Min <strong>certificates</strong></label><div className="flex items-center gap-2"><select value={fScoreOp} onChange={e=>setFScoreOp(e.target.value)} className={opCls}>{['≥','≤','='].map(o=><option key={o}>{o}</option>)}</select><input type="number" min={0} placeholder="e.g. 1" value={fScore} onChange={e=>setFScore(e.target.value)} className={`${iCls} flex-1`}/></div></div>
                          </>)}
                        </div>
                        {/* Right: user search filters (always the same) */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-gray-800">Select users</h3>
                          <div><label className={lCls}><strong>Email</strong> contains</label><input type="text" placeholder="e.g. gmail.com (min 3 characters)" value={fEmail} onChange={e=>setFEmail(e.target.value)} className={iCls}/></div>
                          <div><label className={lCls}><strong>User name</strong> contains</label><input type="text" placeholder="e.g. ite" value={fUsername} onChange={e=>setFUsername(e.target.value)} className={iCls}/></div>
                          <div><label className={lCls}>Have <strong>tag</strong></label><div className="relative"><select value={fTag} onChange={e=>setFTag(e.target.value)} className={sCls}><option value="" /><option>VIP</option><option>New user</option><option>At risk</option><option>High performer</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div>
                          <div><label className={lCls}><strong>Registered</strong></label><div className="flex items-center gap-2"><div className="relative flex-1"><select value={fRegPeriod} onChange={e=>setFRegPeriod(e.target.value)} className={sCls}><option value="" /><option>In the last</option><option>Before</option><option>After</option><option>Between</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div><div className="relative flex-1"><select value={fRegValue} onChange={e=>setFRegValue(e.target.value)} className={sCls}><option value="" /><option>7 days</option><option>30 days</option><option>3 months</option><option>6 months</option><option>1 year</option></select><ChevronDown className="absolute right-2.5 top-2 size-4 text-gray-400 pointer-events-none" /></div></div></div>
                        </div>
                      </div>
                      )} {/* end ternary else (non-user-activity) */}

                      {/* Footer */}
                      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                        <button className="px-5 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors">Apply filters</button>
                        <button onClick={tmpl === 'user-activity' ? () => setUaConditions([{ id: 'ua0', kind: 'activity', v1: 'active', v2: 'exactly', v3: 'this month' }]) : resetFilters}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          <RotateCcw className="size-3.5" />
                          Reset filters
                        </button>
                      </div>
                    </div>
                  )}
                  {filterTab === 'advanced' && (() => {
                    const pickerItems = ADV_FILTER_CATALOG.filter(d =>
                      (filterPickerCat === 'all' || d.category === filterPickerCat) &&
                      (!filterPickerSearch || d.label.toLowerCase().includes(filterPickerSearch.toLowerCase()))
                    );
                    const getOpsForType = (type: string) => {
                      if (type === 'text') return ['contains','does not contain','is','starts with','ends with'];
                      if (type === 'numberOp') return ['≥','≤','=','≠','between'];
                      return ['is','is not'];
                    };
                    const catColors: Record<string, string> = {
                      user: 'bg-indigo-100 text-indigo-700', course: 'bg-teal-100 text-teal-700',
                      activity: 'bg-amber-100 text-amber-700', certificate: 'bg-green-100 text-green-700',
                      group: 'bg-purple-100 text-purple-700',
                    };
                    const catDotColors: Record<string, string> = {
                      user: 'bg-indigo-400', course: 'bg-teal-400',
                      activity: 'bg-amber-400', certificate: 'bg-green-400',
                      group: 'bg-purple-400',
                    };
                    return (
                      <div className="flex h-52">

                        {/* ── Left: active filter conditions ── */}
                        <div className="flex-1 min-w-0 flex flex-col px-4 py-3 border-r border-gray-100 overflow-hidden">

                          {/* Match mode (only when 2+ filters) */}
                          {advFilters.length > 1 && (
                            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Match</span>
                              {(['all','any'] as const).map(m => (
                                <button key={m} onClick={() => setAdvMatchMode(m)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${advMatchMode === m ? 'bg-teal-500 text-white border-teal-500' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                                  {m === 'all' ? 'All' : 'Any'}
                                </button>
                              ))}
                              <span className="text-[10px] text-gray-400">of these rules</span>
                            </div>
                          )}

                          {/* Filter rows — scrollable */}
                          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                            {advFilters.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center">
                                <Filter className="size-5 text-gray-200 mb-2" />
                                <p className="text-xs text-gray-400">No filters yet</p>
                                <p className="text-[10px] text-gray-300 mt-0.5">Pick one from the list →</p>
                              </div>
                            ) : advFilters.map((f, idx) => {
                              const def = ADV_FILTER_CATALOG.find(d => d.key === f.field)!;
                              const ops = getOpsForType(f.type);
                              const courseOpts2 = courses.map(c => c.title);
                              const groupOpts = def?.options ?? [];
                              return (
                                <div key={f.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 group">
                                  <span className="text-[9px] font-bold text-gray-400 w-5 flex-shrink-0 text-center uppercase">
                                    {idx === 0 ? 'If' : advMatchMode}
                                  </span>
                                  <span className={`size-1.5 rounded-full flex-shrink-0 ${catDotColors[f.category] ?? 'bg-gray-300'}`} />
                                  <span className="text-[11px] font-semibold text-gray-700 flex-shrink-0 max-w-[80px] truncate">{f.label}</span>
                                  <div className="relative flex-shrink-0">
                                    <select value={f.operator} onChange={e => updateAdvFilter(f.id, { operator: e.target.value })}
                                      className="border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] text-gray-600 bg-white focus:outline-none appearance-none pr-4">
                                      {ops.map(op => <option key={op}>{op}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 size-2.5 text-gray-400 pointer-events-none" />
                                  </div>
                                  {f.type === 'text' && (
                                    <input type="text" value={f.value} onChange={e => updateAdvFilter(f.id, { value: e.target.value })} placeholder="value…"
                                      className="flex-1 min-w-0 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300" />
                                  )}
                                  {(f.type === 'select' || f.type === 'courseSelect') && (
                                    <div className="relative flex-1 min-w-0">
                                      <select value={f.value} onChange={e => updateAdvFilter(f.id, { value: e.target.value })}
                                        className="w-full border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] text-gray-600 bg-white focus:outline-none appearance-none pr-4">
                                        <option value="">Select…</option>
                                        {(f.type === 'courseSelect' ? courseOpts2 : groupOpts).map(o => <option key={o}>{o}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 size-2.5 text-gray-400 pointer-events-none" />
                                    </div>
                                  )}
                                  {f.type === 'numberOp' && f.operator !== 'between' && (
                                    <input type="number" value={f.value} onChange={e => updateAdvFilter(f.id, { value: e.target.value })} placeholder="0"
                                      className="w-16 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300" />
                                  )}
                                  {f.type === 'numberOp' && f.operator === 'between' && (
                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                      <input type="number" value={f.value} onChange={e => updateAdvFilter(f.id, { value: e.target.value })} placeholder="Min"
                                        className="w-12 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300" />
                                      <span className="text-[10px] text-gray-300">–</span>
                                      <input type="number" value={f.value2} onChange={e => updateAdvFilter(f.id, { value2: e.target.value })} placeholder="Max"
                                        className="w-12 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300" />
                                    </div>
                                  )}
                                  <button onClick={() => removeAdvFilter(f.id)}
                                    className="ml-auto flex-shrink-0 size-4 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                    <X className="size-2.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer */}
                          {advFilters.length > 0 && (
                            <div className="flex items-center gap-2.5 pt-2 mt-2 border-t border-gray-100 flex-shrink-0">
                              <button className="px-3 py-1 bg-teal-500 text-white text-[11px] font-semibold rounded-lg hover:bg-teal-600 transition-colors">
                                Apply {advFilters.length} filter{advFilters.length !== 1 ? 's' : ''}
                              </button>
                              <button onClick={resetAdvFilters} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="size-2.5" /> Clear all
                              </button>
                            </div>
                          )}
                        </div>

                        {/* ── Right: always-visible filter picker ── */}
                        <div className="w-48 flex-shrink-0 flex flex-col overflow-hidden">
                          {/* Search */}
                          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 flex-shrink-0">
                            <Search className="size-3 text-gray-400 flex-shrink-0" />
                            <input type="text" value={filterPickerSearch} onChange={e => setFilterPickerSearch(e.target.value)}
                              placeholder="Search…"
                              className="flex-1 min-w-0 text-xs focus:outline-none placeholder:text-gray-400 bg-transparent" />
                            {filterPickerSearch && (
                              <button onClick={() => setFilterPickerSearch('')}>
                                <X className="size-2.5 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                          {/* Category chips */}
                          <div className="flex flex-wrap gap-1 px-2.5 py-1.5 border-b border-gray-100 flex-shrink-0">
                            {(['all','user','course','activity','certificate','group'] as AdvFilterCat[]).map(cat => (
                              <button key={cat} onClick={() => setFilterPickerCat(cat)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${filterPickerCat === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {cat === 'all' ? 'All' : ADV_CAT_LABELS[cat]}
                              </button>
                            ))}
                          </div>
                          {/* Scrollable filter list */}
                          <div className="flex-1 overflow-y-auto py-0.5">
                            {pickerItems.length === 0
                              ? <p className="text-[11px] text-gray-400 text-center py-4">No filters found</p>
                              : pickerItems.map(def => {
                                const alreadyAdded = advFilters.some(f => f.field === def.key);
                                return (
                                  <button key={def.key} onClick={() => addAdvFilter(def)}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1 text-left transition-colors group/item ${alreadyAdded ? 'opacity-40 cursor-default' : 'hover:bg-gray-50'}`}
                                    disabled={alreadyAdded}>
                                    <span className={`size-1.5 rounded-full flex-shrink-0 ${catDotColors[def.category] ?? 'bg-gray-300'}`} />
                                    <span className="text-xs text-gray-600 group-hover/item:text-gray-900 flex-1 min-w-0 truncate">{def.label}</span>
                                    {alreadyAdded
                                      ? <CheckCircle className="size-2.5 text-teal-400 flex-shrink-0" />
                                      : <Plus className="size-2.5 text-gray-300 group-hover/item:text-teal-500 flex-shrink-0" />
                                    }
                                  </button>
                                );
                              })
                            }
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* ── Product Insights: Per-course radar grid ── */}
            {currentSection === 'product-radar' && (() => {
              const RADAR_METRICS = ['Avg Study Time', 'Social Interactions', 'Certificates Issued', 'Enrollments', 'Avg Score'];
              const courseRadars = courses.map((course, ci) => {
                const enrolled   = users.filter(u => u.enrolledCourses?.includes(course.id)).length || course.studentsEnrolled || 0;
                const totalMins  = (() => { const h = parseInt(course.duration?.match(/(\d+)\s*h/)?.[1] ?? '0'); const m = parseInt(course.duration?.match(/(\d+)\s*m/)?.[1] ?? '0'); return h * 60 + m || 45 + (ci * 20) % 90; })();
                const completion = Math.round(30 + (ci * 13) % 55);
                const maxMins    = 120;
                return {
                  course,
                  data: [
                    { subject: 'Avg Study Time',       value: Math.min(100, Math.round((totalMins * (completion / 100)) / maxMins * 100)) },
                    { subject: 'Social Interactions',  value: Math.round(25 + (ci * 19 + 7) % 55) },
                    { subject: 'Certificates Issued',  value: Math.round(completion * 0.75) },
                    { subject: 'Enrollments',          value: Math.min(100, Math.round((enrolled / (users.length || 1)) * 100)) },
                    { subject: 'Avg Score',            value: Math.round(50 + (ci * 11 + 3) % 45) },
                  ],
                  completion,
                  enrolled,
                };
              });
              const COLORS = ['#6366f1','#14b8a6','#f59e0b','#3b82f6','#ec4899','#10b981','#8b5cf6','#f97316','#06b6d4','#84cc16','#a855f7','#ef4444','#0ea5e9'];
              return (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center gap-3">
                    <BarChart2 className="size-4 text-indigo-400" />
                    <p className="text-sm text-gray-600">Radar shows 5 key metrics per course — normalised to 0–100 for comparison.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {courseRadars.map(({ course, data, completion, enrolled }, ci) => (
                      <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-start justify-between mb-1 gap-2">
                          <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{course.title}</p>
                          <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${course.level === 'Beginner' ? 'bg-green-50 text-green-600' : course.level === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                            {course.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><Users className="size-2.5" />{enrolled}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><Award className="size-2.5" />{completion}%</span>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <RadarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#9ca3af' }} />
                            <Radar dataKey="value" stroke={COLORS[ci % COLORS.length]} fill={COLORS[ci % COLORS.length]} fillOpacity={0.18} strokeWidth={1.5} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: any) => `${v}`} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Product Insights: Per-course bar chart grid ── */}
            {currentSection === 'product-bar' && (() => {
              const scale = prodBarRange / 365;
              const COLORS = ['#6366f1','#14b8a6','#f59e0b','#3b82f6','#ec4899','#10b981','#8b5cf6','#f97316','#06b6d4','#84cc16','#a855f7','#ef4444','#0ea5e9'];
              const rangeLabel = prodBarRange === 7 ? 'Last 7 days' : prodBarRange === 30 ? 'Last 30 days' : prodBarRange === 180 ? 'Last 6 months' : 'Last year';
              const perCourseData = courses.map((course, ci) => {
                const enrolled   = users.filter(u => u.enrolledCourses?.includes(course.id)).length || course.studentsEnrolled || 0;
                const completion = Math.round(30 + (ci * 13) % 55);
                const scaledEnrolled   = Math.max(1, Math.round(enrolled  * scale));
                const scaledCompleted  = Math.max(0, Math.round(scaledEnrolled * (completion / 100)));
                const scaledInProgress = Math.max(0, scaledEnrolled - scaledCompleted);
                return {
                  course,
                  ci,
                  color: COLORS[ci % COLORS.length],
                  completion,
                  barData: [{ name: rangeLabel, Enrolled: scaledEnrolled, Completed: scaledCompleted, 'In Progress': scaledInProgress }],
                };
              });
              return (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart2 className="size-4 text-indigo-400" />
                      <p className="text-sm text-gray-600">Enrollments, completions and in-progress learners per course — <span className="font-semibold text-gray-800">{rangeLabel}</span></p>
                    </div>
                    {/* Range picker in detail view too */}
                    <div className="relative">
                      <button onClick={() => setProdBarRangeOpen(v => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        {rangeLabel} <ChevronDown className={`size-3 transition-transform ${prodBarRangeOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {prodBarRangeOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                          {([{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 180, label: 'Last 6 months' }, { value: 365, label: 'Last year' }] as const).map(opt => (
                            <button key={opt.value} onClick={() => { setProdBarRange(opt.value); setProdBarRangeOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${prodBarRange === opt.value ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {perCourseData.map(({ course, ci, color, completion, barData: bd }) => (
                      <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{course.title}</p>
                          <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${course.level === 'Beginner' ? 'bg-green-50 text-green-600' : course.level === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                            {course.level}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-3">{course.category} · {completion}% completion</p>
                        <ResponsiveContainer width="100%" height={130}>
                          <BarChart data={bd} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#d1d5db' }} />
                            <YAxis tick={{ fontSize: 9, fill: '#d1d5db' }} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                            <Bar dataKey="Enrolled"    fill={color}    radius={[3,3,0,0]} fillOpacity={0.9} />
                            <Bar dataKey="Completed"   fill="#14b8a6"  radius={[3,3,0,0]} />
                            <Bar dataKey="In Progress" fill="#fbbf24"  radius={[3,3,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-2 mt-2 justify-center">
                          {[['Enrolled', color], ['Completed', '#14b8a6'], ['In Progress', '#fbbf24']].map(([lbl, clr]) => (
                            <span key={lbl} className="flex items-center gap-1 text-[9px] text-gray-400">
                              <span className="size-2 rounded-sm inline-block" style={{ background: clr }} />{lbl}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Product Insights: Hardest courses detail ── */}
            {currentSection === 'product-hardest' && (() => {
              const scale      = prodHardRange === 7 ? 0.72 : prodHardRange === 30 ? 0.88 : prodHardRange === 180 ? 0.95 : 1;
              const rangeLabel = prodHardRange === 7 ? 'Last 7 days' : prodHardRange === 30 ? 'Last 30 days' : prodHardRange === 180 ? 'Last 6 months' : 'Last year';
              const localMetrics = courses.map((course, ci) => {
                const enrollCt      = users.filter(u => u.enrolledCourses?.includes(course.id)).length || course.studentsEnrolled || 0;
                const completedCt   = users.filter(u => u.enrolledCourses?.includes(course.id) && course.modules?.every(m => m.lessons.every(l => u.completedLessons?.includes(l.id)))).length;
                const completionPct = enrollCt > 0 ? Math.round((completedCt / enrollCt) * 100) : Math.round(30 + (ci * 13) % 55);
                const droppedCt     = Math.round(enrollCt * ((100 - completionPct) / 100) * 0.4);
                const rating        = course.rating || (3.5 + (ci * 0.3) % 1.5);
                return { course, enrollCt, completionPct, droppedCt, rating };
              });
              const allSorted  = [...localMetrics].sort((a, b) => a.completionPct - b.completionPct);
              return (
                <div className="space-y-4">
                  {/* Info bar */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="size-4 text-rose-400" />
                      <p className="text-sm text-gray-600">All courses ranked by completion rate — <span className="font-semibold text-gray-800">{rangeLabel}</span></p>
                    </div>
                    <div className="relative">
                      <button onClick={() => setProdHardRangeOpen(v => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        {rangeLabel} <ChevronDown className={`size-3 transition-transform ${prodHardRangeOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {prodHardRangeOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                          {([{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 180, label: 'Last 6 months' }, { value: 365, label: 'Last year' }] as const).map(opt => (
                            <button key={opt.value} onClick={() => { setProdHardRange(opt.value); setProdHardRangeOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${prodHardRange === opt.value ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Course grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {allSorted.map(({ course, completionPct, enrollCt, droppedCt, rating }, i) => {
                      const pct        = Math.max(0, Math.round(completionPct * scale));
                      const scaledEnrl = Math.max(0, Math.round(enrollCt * scale));
                      const scaledDrop = Math.max(0, Math.round(droppedCt * scale));
                      const difficulty = pct < 20 ? { label: 'Very Hard', color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' }
                                       : pct < 40 ? { label: 'Hard',      color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' }
                                       : pct < 65 ? { label: 'Moderate',  color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-400' }
                                       :            { label: 'Easy',      color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-400' };
                      return (
                        <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{course.title}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{course.category}</p>
                            </div>
                            <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${difficulty.bg} ${difficulty.color}`}>
                              {difficulty.label}
                            </span>
                          </div>
                          {/* Completion bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-500">Completion rate</span>
                              <span className={`text-[11px] font-bold ${difficulty.color}`}>{pct}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${difficulty.bar}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          {/* Stats grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] font-bold text-gray-800">{scaledEnrl}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Enrolled</p>
                            </div>
                            <div className="bg-rose-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] font-bold text-rose-600">{scaledDrop}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Dropped</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] font-bold text-amber-600">{rating.toFixed(1)}★</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Rating</p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                            <span className={`text-[10px] font-medium ${course.level === 'Beginner' ? 'text-green-500' : course.level === 'Intermediate' ? 'text-amber-500' : 'text-rose-500'}`}>{course.level}</span>
                            <span className="text-[9px] text-gray-400">#{i + 1} hardest</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── Product Insights: Most dropped detail ── */}
            {currentSection === 'product-dropped' && (() => {
              const scale      = prodDropRange === 7 ? 0.72 : prodDropRange === 30 ? 0.88 : prodDropRange === 180 ? 0.95 : 1;
              const rangeLabel = prodDropRange === 7 ? 'Last 7 days' : prodDropRange === 30 ? 'Last 30 days' : prodDropRange === 180 ? 'Last 6 months' : 'Last year';
              const localMetrics = courses.map((course, ci) => {
                const enrollCt      = users.filter(u => u.enrolledCourses?.includes(course.id)).length || course.studentsEnrolled || 0;
                const completedCt   = users.filter(u => u.enrolledCourses?.includes(course.id) && course.modules?.every(m => m.lessons.every(l => u.completedLessons?.includes(l.id)))).length;
                const completionPct = enrollCt > 0 ? Math.round((completedCt / enrollCt) * 100) : Math.round(30 + (ci * 13) % 55);
                const droppedCt     = Math.round(enrollCt * ((100 - completionPct) / 100) * 0.4);
                const engagementPct = Math.round(40 + (ci * 17 + 11) % 50);
                const rating        = course.rating || (3.5 + (ci * 0.3) % 1.5);
                return { course, enrollCt, completionPct, droppedCt, engagementPct, rating };
              });
              const allSorted  = [...localMetrics].sort((a, b) => b.droppedCt - a.droppedCt);
              return (
                <div className="space-y-4">
                  {/* Info bar */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="size-4 text-amber-400" />
                      <p className="text-sm text-gray-600">All courses ranked by learner drop-off — <span className="font-semibold text-gray-800">{rangeLabel}</span></p>
                    </div>
                    <div className="relative">
                      <button onClick={() => setProdDropRangeOpen(v => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        {rangeLabel} <ChevronDown className={`size-3 transition-transform ${prodDropRangeOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {prodDropRangeOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                          {([{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 180, label: 'Last 6 months' }, { value: 365, label: 'Last year' }] as const).map(opt => (
                            <button key={opt.value} onClick={() => { setProdDropRange(opt.value); setProdDropRangeOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${prodDropRange === opt.value ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Course grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {allSorted.map(({ course, completionPct, enrollCt, droppedCt, rating, engagementPct }, i) => {
                      const scaledEnrl = Math.max(0, Math.round(enrollCt * scale));
                      const scaledDrop = Math.max(0, Math.round(droppedCt * scale));
                      const scaledCmp  = Math.max(0, Math.round(completionPct * scale));
                      const dropRate   = scaledEnrl > 0 ? Math.round((scaledDrop / scaledEnrl) * 100) : 0;
                      const risk       = dropRate > 50 ? { label: 'Critical', color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' }
                                       : dropRate > 30 ? { label: 'High',     color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-400' }
                                       : dropRate > 15 ? { label: 'Medium',   color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-400' }
                                       :                 { label: 'Low',      color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-400' };
                      return (
                        <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{course.title}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{course.category}</p>
                            </div>
                            <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${risk.bg} ${risk.color}`}>
                              {risk.label}
                            </span>
                          </div>
                          {/* Drop-off bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-gray-500">Drop-off rate</span>
                              <span className={`text-[11px] font-bold ${risk.color}`}>{dropRate}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${risk.bar}`} style={{ width: `${dropRate}%` }} />
                            </div>
                          </div>
                          {/* Stats grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] font-bold text-gray-800">{scaledEnrl}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Enrolled</p>
                            </div>
                            <div className="bg-rose-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] font-bold text-rose-600">{scaledDrop}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Dropped</p>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] font-bold text-indigo-600">{scaledCmp}%</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Completed</p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">{Math.round(engagementPct * scale)}% engagement</span>
                            <span className="text-[9px] text-gray-400">#{i + 1} most dropped</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── Product Insights: Per-course engagement vs completion line grid ── */}
            {currentSection === 'product-line' && (() => {
              const COLORS = ['#f59e0b','#6366f1','#14b8a6','#3b82f6','#ec4899','#10b981','#8b5cf6','#f97316','#06b6d4','#84cc16','#a855f7','#ef4444','#0ea5e9'];
              const rangeLabel = prodLineRange === 7 ? 'Last 7 days' : prodLineRange === 30 ? 'Last 30 days' : prodLineRange === 180 ? 'Last 6 months' : 'Last year';
              const points     = prodLineRange === 7 ? 7 : prodLineRange === 30 ? 6 : prodLineRange === 180 ? 6 : 12;
              const pointLabel = prodLineRange === 7 ? (i: number) => `Day ${i + 1}` : prodLineRange === 30 ? (i: number) => `Wk ${i + 1}` : prodLineRange === 180 ? (i: number) => ['Jan','Feb','Mar','Apr','May','Jun'][i] : (i: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i];
              const perCourseLines = courses.map((course, ci) => {
                const baseEng  = Math.round(40 + (ci * 17 + 11) % 50);
                const baseCmp  = Math.round(30 + (ci * 13) % 55);
                const lineScale = prodLineRange === 7 ? 0.72 : prodLineRange === 30 ? 0.88 : prodLineRange === 180 ? 0.95 : 1;
                const data = Array.from({ length: points }, (_, i) => {
                  const progress = i / (points - 1);
                  const noise    = (((ci * 7 + i * 13) % 20) - 10);
                  return {
                    name:       pointLabel(i),
                    Engagement: Math.min(100, Math.max(0, Math.round((baseEng  * lineScale) * (0.6 + progress * 0.4) + noise))),
                    Completion: Math.min(100, Math.max(0, Math.round((baseCmp  * lineScale) * (0.3 + progress * 0.7) + noise * 0.5))),
                  };
                });
                return { course, ci, color: COLORS[ci % COLORS.length], data };
              });
              return (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="size-4 text-amber-400" />
                      <p className="text-sm text-gray-600">Engagement start → completion rate per course — <span className="font-semibold text-gray-800">{rangeLabel}</span></p>
                    </div>
                    <div className="relative">
                      <button onClick={() => setProdLineRangeOpen(v => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        {rangeLabel} <ChevronDown className={`size-3 transition-transform ${prodLineRangeOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {prodLineRangeOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                          {([{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 180, label: 'Last 6 months' }, { value: 365, label: 'Last year' }] as const).map(opt => (
                            <button key={opt.value} onClick={() => { setProdLineRange(opt.value); setProdLineRangeOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${prodLineRange === opt.value ? 'text-teal-600 font-semibold bg-teal-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {perCourseLines.map(({ course, ci, color, data }) => {
                      const lastEng = data[data.length - 1].Engagement;
                      const lastCmp = data[data.length - 1].Completion;
                      const gap     = lastEng - lastCmp;
                      return (
                        <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{course.title}</p>
                            <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${course.level === 'Beginner' ? 'bg-green-50 text-green-600' : course.level === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                              {course.level}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Activity className="size-2.5 text-amber-400" />{lastEng}% eng</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Award className="size-2.5 text-indigo-400" />{lastCmp}% cmp</span>
                            <span className={`text-[10px] font-semibold ml-auto ${gap > 30 ? 'text-rose-500' : gap > 15 ? 'text-amber-500' : 'text-green-500'}`}>
                              {gap > 30 ? '⚠ High drop-off' : gap > 15 ? '~ Some drop-off' : '✓ Healthy'}
                            </span>
                          </div>
                          <ResponsiveContainer width="100%" height={120}>
                            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                              <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#d1d5db' }} />
                              <YAxis tick={{ fontSize: 8, fill: '#d1d5db' }} domain={[0, 100]} />
                              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} formatter={(v: any) => `${v}%`} />
                              <Line type="monotone" dataKey="Engagement" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                              <Line type="monotone" dataKey="Completion" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                          <div className="flex items-center gap-3 mt-1.5 justify-center">
                            <span className="flex items-center gap-1 text-[9px] text-gray-400"><span className="size-2 rounded-full bg-amber-400 inline-block" />Engagement</span>
                            <span className="flex items-center gap-1 text-[9px] text-gray-400"><span className="size-2 rounded-full bg-indigo-500 inline-block" />Completion</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── Create / Edit Segment slide-in form ── */}
            {currentSection === '__segment__' && (<>
              <div className="space-y-0 bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Step indicator bar */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step {segStep} of 2</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">{segStep === 1 ? 'Name & appearance' : 'Audience filters'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        {[1, 2].map(n => (
                          <div key={n} className={`h-1.5 rounded-full transition-all duration-300 w-8 ${n <= segStep ? 'bg-teal-500' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      {segStep === 2 && (
                        <button onClick={saveSegment}
                          className="px-4 py-1.5 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors">
                          {editingSegment ? 'Save changes' : 'Create segment'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <div className="p-6 space-y-5">
                  {segStep === 1 && (<>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Segment name <span className="text-red-400">*</span></label>
                      <input type="text" placeholder="e.g. At-risk learners" value={segName} onChange={e => setSegName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                      <textarea rows={2} placeholder="What does this segment represent?" value={segDesc} onChange={e => setSegDesc(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-gray-400 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Icon</label>
                      <div className="flex flex-wrap gap-2">
                        {/* No icon option */}
                        <button onClick={() => setSegIcon('')}
                          className={`size-10 rounded-lg border-2 transition-all flex items-center justify-center ${segIcon === '' ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                          title="No icon">
                          <X className={`size-4 ${segIcon === '' ? 'text-teal-500' : 'text-gray-300'}`} />
                        </button>
                        {SEGMENT_ICONS.map(ic => (
                          <button key={ic} onClick={() => setSegIcon(ic)}
                            className={`size-10 text-xl rounded-lg border-2 transition-all ${segIcon === ic ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Color</label>
                      <div className="flex gap-2.5">
                        {SEGMENT_COLORS.map((c, i) => (
                          <button key={i} onClick={() => setSegColor(i)}
                            className={`size-7 rounded-full ${c.bg} transition-transform ${segColor === i ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`} />
                        ))}
                      </div>
                    </div>
                    {/* Preview */}
                    {segName && (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${SEGMENT_COLORS[segColor].border} ${SEGMENT_COLORS[segColor].light}`}>
                        {segIcon && <span className="text-2xl">{segIcon}</span>}
                        <div>
                          <p className={`font-semibold text-sm ${SEGMENT_COLORS[segColor].text}`}>{segName}</p>
                          {segDesc && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{segDesc}</p>}
                        </div>
                      </div>
                    )}
                  </>)}

                  {segStep === 2 && (() => {
                    const segPickerItems = ADV_FILTER_CATALOG.filter(d =>
                      (segAdvPickerCat === 'all' || d.category === segAdvPickerCat) &&
                      (!segAdvPickerSearch || d.label.toLowerCase().includes(segAdvPickerSearch.toLowerCase()))
                    );
                    const segGetOps = (type: string) => {
                      if (type === 'text') return ['contains','does not contain','is','starts with','ends with'];
                      if (type === 'numberOp') return ['≥','≤','=','≠','between'];
                      return ['is','is not'];
                    };
                    const catDotColors: Record<string, string> = {
                      user: 'bg-indigo-400', course: 'bg-teal-400',
                      activity: 'bg-amber-400', certificate: 'bg-green-400',
                      group: 'bg-purple-400',
                    };
                    return (
                      <div className="flex h-64 -mx-6 border-b border-gray-100">
                        {/* ── Left: active filter rules ── */}
                        <div className="flex-1 min-w-0 flex flex-col px-4 py-3 border-r border-gray-100 overflow-hidden">
                          {/* Match mode toggle */}
                          {segAdvFilters.length > 1 && (
                            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Match</span>
                              {(['all','any'] as const).map(m => (
                                <button key={m} onClick={() => setSegAdvMatchMode(m)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${segAdvMatchMode === m ? 'bg-teal-500 text-white border-teal-500' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                                  {m === 'all' ? 'All' : 'Any'}
                                </button>
                              ))}
                              <span className="text-[10px] text-gray-400">of these rules</span>
                            </div>
                          )}

                          {/* Filter rows — scrollable */}
                          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                            {segAdvFilters.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center">
                                <Filter className="size-5 text-gray-200 mb-2" />
                                <p className="text-xs text-gray-400">No filters yet</p>
                                <p className="text-[10px] text-gray-300 mt-0.5">Pick one from the list →</p>
                              </div>
                            ) : segAdvFilters.map((f, idx) => {
                              const def = ADV_FILTER_CATALOG.find(d => d.key === f.field)!;
                              const ops = segGetOps(f.type);
                              const courseOpts2 = courses.map(c => c.title);
                              const groupOpts = def?.options ?? [];
                              return (
                                <div key={f.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 group">
                                  <span className="text-[9px] font-bold text-gray-400 w-5 flex-shrink-0 text-center uppercase">
                                    {idx === 0 ? 'If' : segAdvMatchMode}
                                  </span>
                                  <span className={`size-1.5 rounded-full flex-shrink-0 ${catDotColors[f.category] ?? 'bg-gray-300'}`} />
                                  <span className="text-[11px] font-semibold text-gray-700 flex-shrink-0 max-w-[80px] truncate">{f.label}</span>
                                  <div className="relative flex-shrink-0">
                                    <select value={f.operator} onChange={e => updateSegAdvFilter(f.id, { operator: e.target.value })}
                                      className="border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] text-gray-600 bg-white focus:outline-none appearance-none pr-4">
                                      {ops.map(op => <option key={op}>{op}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 size-2.5 text-gray-400 pointer-events-none" />
                                  </div>
                                  {f.type === 'text' && (
                                    <input type="text" value={f.value} onChange={e => updateSegAdvFilter(f.id, { value: e.target.value })} placeholder="value…"
                                      className="flex-1 min-w-0 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300" />
                                  )}
                                  {(f.type === 'select' || f.type === 'courseSelect') && (
                                    <div className="relative flex-1 min-w-0">
                                      <select value={f.value} onChange={e => updateSegAdvFilter(f.id, { value: e.target.value })}
                                        className="w-full border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] text-gray-600 bg-white focus:outline-none appearance-none pr-4">
                                        <option value="">Select…</option>
                                        {(f.type === 'courseSelect' ? courseOpts2 : groupOpts).map(o => <option key={o}>{o}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 size-2.5 text-gray-400 pointer-events-none" />
                                    </div>
                                  )}
                                  {f.type === 'numberOp' && f.operator !== 'between' && (
                                    <input type="number" value={f.value} onChange={e => updateSegAdvFilter(f.id, { value: e.target.value })} placeholder="0"
                                      className="w-16 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300" />
                                  )}
                                  {f.type === 'numberOp' && f.operator === 'between' && (
                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                      <input type="number" value={f.value} onChange={e => updateSegAdvFilter(f.id, { value: e.target.value })} placeholder="Min"
                                        className="w-12 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300" />
                                      <span className="text-[10px] text-gray-300">–</span>
                                      <input type="number" value={f.value2} onChange={e => updateSegAdvFilter(f.id, { value2: e.target.value })} placeholder="Max"
                                        className="w-12 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300" />
                                    </div>
                                  )}
                                  <button onClick={() => removeSegAdvFilter(f.id)}
                                    className="ml-auto flex-shrink-0 size-4 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                    <X className="size-2.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Apply / Clear footer */}
                          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100 flex-shrink-0">
                            {segAdvFilters.length > 0 ? (<>
                              <button onClick={() => { setSegFiltersApplied(true); setSegUsersPage(1); }}
                                className="px-3 py-1 bg-teal-500 text-white text-[11px] font-semibold rounded-lg hover:bg-teal-600 transition-colors">
                                Apply {segAdvFilters.length} filter{segAdvFilters.length !== 1 ? 's' : ''}
                              </button>
                              {segFiltersApplied && (
                                <span className="text-[10px] text-teal-600 font-medium flex items-center gap-0.5">
                                  <CheckCircle className="size-2.5" /> Applied
                                </span>
                              )}
                              <button onClick={() => { setSegAdvFilters([]); setSegAdvMatchMode('all'); setSegFiltersApplied(false); setSegUsersPage(1); }}
                                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors ml-auto">
                                <X className="size-2.5" /> Clear all
                              </button>
                            </>) : (
                              <span className="text-[11px] text-gray-300 italic">Add filters to narrow the list below</span>
                            )}
                          </div>
                        </div>

                        {/* ── Right: catalog picker ── */}
                        <div className="w-48 flex-shrink-0 flex flex-col overflow-hidden">
                          {/* Search */}
                          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 flex-shrink-0">
                            <Search className="size-3 text-gray-400 flex-shrink-0" />
                            <input type="text" value={segAdvPickerSearch} onChange={e => setSegAdvPickerSearch(e.target.value)}
                              placeholder="Search filters…"
                              className="flex-1 min-w-0 text-xs focus:outline-none placeholder:text-gray-400 bg-transparent" />
                            {segAdvPickerSearch && (
                              <button onClick={() => setSegAdvPickerSearch('')}>
                                <X className="size-2.5 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                          {/* Category chips */}
                          <div className="flex flex-wrap gap-1 px-2.5 py-1.5 border-b border-gray-100 flex-shrink-0">
                            {(['all','user','course','activity','certificate','group'] as AdvFilterCat[]).map(cat => (
                              <button key={cat} onClick={() => setSegAdvPickerCat(cat)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${segAdvPickerCat === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {cat === 'all' ? 'All' : ADV_CAT_LABELS[cat]}
                              </button>
                            ))}
                          </div>
                          {/* Scrollable list */}
                          <div className="flex-1 overflow-y-auto py-0.5">
                            {segPickerItems.length === 0
                              ? <p className="text-[11px] text-gray-400 text-center py-4">No filters found</p>
                              : segPickerItems.map(def => {
                                const alreadyAdded = segAdvFilters.some(f => f.field === def.key);
                                return (
                                  <button key={def.key} onClick={() => addSegAdvFilter(def)}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1 text-left transition-colors group/item ${alreadyAdded ? 'opacity-40 cursor-default' : 'hover:bg-gray-50'}`}
                                    disabled={alreadyAdded}>
                                    <span className={`size-1.5 rounded-full flex-shrink-0 ${catDotColors[def.category] ?? 'bg-gray-300'}`} />
                                    <span className="text-xs text-gray-600 group-hover/item:text-gray-900 flex-1 min-w-0 truncate">{def.label}</span>
                                    {alreadyAdded
                                      ? <CheckCircle className="size-2.5 text-teal-400 flex-shrink-0" />
                                      : <Plus className="size-2.5 text-gray-300 group-hover/item:text-teal-500 flex-shrink-0" />
                                    }
                                  </button>
                                );
                              })
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60">
                  {segStep === 2
                    ? <button onClick={() => setSegStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                        <ArrowLeft className="size-3.5" /> Back to step 1
                      </button>
                    : <button onClick={closeDetail} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
                        <ArrowLeft className="size-3.5" /> Go back
                      </button>
                  }
                  {segStep === 1 && (
                    <button disabled={!segName.trim()} onClick={() => setSegStep(2)}
                      className="px-5 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      Next: Add filters →
                    </button>
                  )}
                </div>
              </div>

              {/* ── Segment step-2 user preview table ── */}
              {segStep === 2 && (() => {
                const SEG_PER_PAGE = 15;
                const derivedRoles = ['Learner','Learner','Learner','Manager','Learner','Learner','Admin','Learner'];
                const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
                // Use the shared matched IDs computed by the useEffect
                const segDisplayUsers = users.filter(u => segMatchedUserIds.includes(u.id));
                const totalPages = Math.ceil(segDisplayUsers.length / SEG_PER_PAGE);
                const safeSegPage = Math.min(segUsersPage, Math.max(1, totalPages));
                const colors = ['bg-indigo-500','bg-teal-500','bg-amber-500','bg-rose-500','bg-green-500','bg-purple-500','bg-blue-500','bg-orange-500'];
                return (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">Matching Users</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {segFiltersApplied && segAdvFilters.length > 0
                            ? `Filtered from ${users.length} total`
                            : 'Preview of users that will be included in this segment'}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${segFiltersApplied && segAdvFilters.length > 0 ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        {segDisplayUsers.length} user{segDisplayUsers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap sticky left-0 bg-gray-50 z-10 min-w-[180px]">User</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Role</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Registered</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Last Activity</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Last Enrollment</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Study Time</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Total Time</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Courses</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Certificates</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Avg. Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {segDisplayUsers.slice((safeSegPage - 1) * SEG_PER_PAGE, safeSegPage * SEG_PER_PAGE).map((user, idx) => {
                            const i = users.indexOf(user); // original index for stable derived values
                            const color = colors[i % colors.length];
                            const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                            const enrolledCount = user.enrolledCourses.length;
                            const completedCount = user.completedLessons.length;
                            const role = derivedRoles[i % derivedRoles.length];
                            const registered = daysAgo(Math.floor(30 + (i * 47) % 400));
                            const lastActivity = completedCount > 0 ? daysAgo(Math.floor((i * 13) % 30)) : daysAgo(Math.floor(30 + (i * 11) % 90));
                            const lastEnrollment = enrolledCount > 0 ? daysAgo(Math.floor((i * 17) % 60)) : '—';
                            const studyMins = completedCount * Math.floor(12 + (i * 7) % 20);
                            const totalMins = studyMins + Math.floor((i * 31) % 120);
                            const fmtTime = (m: number) => m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;
                            const certs = Math.floor(completedCount / Math.max(enrolledCount, 1) * enrolledCount * 0.4);
                            const avgScore = completedCount > 0 ? Math.min(99, Math.floor(62 + (i * 13) % 35)) : 0;
                            return (
                              <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-4 py-3 sticky left-0 bg-white hover:bg-gray-50/80 z-10">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`size-7 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                                      <span className="text-xs font-semibold text-white leading-none">{initials}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-gray-900 truncate max-w-[130px]">{user.name}</p>
                                      <p className="text-gray-400 truncate max-w-[130px]">{user.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full font-medium ${role === 'Admin' ? 'bg-rose-100 text-rose-700' : role === 'Manager' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{role}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{registered}</td>
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lastActivity}</td>
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lastEnrollment}</td>
                                <td className="px-4 py-3 text-right text-gray-700 font-medium whitespace-nowrap">{fmtTime(studyMins)}</td>
                                <td className="px-4 py-3 text-right text-gray-700 font-medium whitespace-nowrap">{fmtTime(totalMins)}</td>
                                <td className="px-4 py-3 text-right"><span className="font-semibold text-gray-900">{enrolledCount}</span></td>
                                <td className="px-4 py-3 text-right"><span className={`font-semibold ${certs > 0 ? 'text-teal-600' : 'text-gray-400'}`}>{certs}</span></td>
                                <td className="px-4 py-3 text-right">
                                  {avgScore > 0
                                    ? <span className={`font-semibold ${avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{avgScore}%</span>
                                    : <span className="text-gray-300">—</span>
                                  }
                                </td>
                              </tr>
                            );
                          })}
                          {segDisplayUsers.length === 0 && (
                            <tr><td colSpan={10} className="px-5 py-10 text-center text-gray-400">No users match the current filters.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {segDisplayUsers.length > SEG_PER_PAGE && (
                      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          Showing <span className="font-medium text-gray-600">{(safeSegPage - 1) * SEG_PER_PAGE + 1}–{Math.min(safeSegPage * SEG_PER_PAGE, segDisplayUsers.length)}</span> of <span className="font-medium text-gray-600">{segDisplayUsers.length}</span> users
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSegUsersPage(p => Math.max(1, p - 1))} disabled={safeSegPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, n) => n + 1).map(page => (
                              <button key={page} onClick={() => setSegUsersPage(page)} className={`size-7 rounded-lg text-xs font-medium transition-colors ${page === safeSegPage ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
                            ))}
                          </div>
                          <button onClick={() => setSegUsersPage(p => Math.min(totalPages, p + 1))} disabled={safeSegPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>)}

            {/* ── Shared user table (all sections) ── */}
            {currentSection && currentSection !== '__segment__' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">All Users</h3>
                  <span className="text-xs text-gray-400 font-medium">{users.length} registered</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap sticky left-0 bg-gray-50 z-10 min-w-[180px]">User</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Role</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Registered</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Last Activity</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Last Enrollment</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Study Time</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Total Time</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Courses</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Certificates</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Avg. Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.slice((usersPage - 1) * USERS_PER_PAGE, usersPage * USERS_PER_PAGE).map((user, idx) => {
                        const i = (usersPage - 1) * USERS_PER_PAGE + idx;
                        const colors = ['bg-indigo-500','bg-teal-500','bg-amber-500','bg-rose-500','bg-green-500','bg-purple-500','bg-blue-500','bg-orange-500'];
                        const color = colors[i % colors.length];
                        const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                        const enrolledCount = user.enrolledCourses.length;
                        const completedCount = user.completedLessons.length;
                        const roles = ['Learner','Learner','Learner','Manager','Learner','Learner','Admin','Learner'];
                        const role = roles[i % roles.length];
                        const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
                        const registered = daysAgo(Math.floor(30 + (i * 47) % 400));
                        const lastActivity = completedCount > 0 ? daysAgo(Math.floor((i * 13) % 30)) : daysAgo(Math.floor(30 + (i * 11) % 90));
                        const lastEnrollment = enrolledCount > 0 ? daysAgo(Math.floor((i * 17) % 60)) : '—';
                        const studyMins = completedCount * Math.floor(12 + (i * 7) % 20);
                        const totalMins = studyMins + Math.floor((i * 31) % 120);
                        const fmtTime = (m: number) => m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;
                        const certs = Math.floor(completedCount / Math.max(enrolledCount, 1) * enrolledCount * 0.4);
                        const avgScore = completedCount > 0 ? Math.min(99, Math.floor(62 + (i * 13) % 35)) : 0;
                        const isExpanded = expandedUserId === user.id;
                        const enrolledCourseObjects = user.enrolledCourses
                          .map((cid: string) => courses.find(c => c.id === cid))
                          .filter(Boolean);
                        return (
                          <>
                            <tr key={user.id}
                              onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                              className={`cursor-pointer transition-colors ${isExpanded ? 'bg-teal-50/60' : 'hover:bg-gray-50/80'}`}>
                              <td className={`px-4 py-3 sticky left-0 z-10 transition-colors ${isExpanded ? 'bg-teal-50/60' : 'bg-white hover:bg-gray-50/80'}`}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <ChevronDown className={`size-3 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-teal-500' : ''}`} />
                                  <div className={`size-7 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                                    <span className="text-xs font-semibold text-white leading-none">{initials}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate max-w-[130px]">{user.name}</p>
                                    <p className="text-gray-400 truncate max-w-[130px]">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full font-medium ${role === 'Admin' ? 'bg-rose-100 text-rose-700' : role === 'Manager' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{role}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{registered}</td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lastActivity}</td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lastEnrollment}</td>
                              <td className="px-4 py-3 text-right text-gray-700 font-medium whitespace-nowrap">{fmtTime(studyMins)}</td>
                              <td className="px-4 py-3 text-right text-gray-700 font-medium whitespace-nowrap">{fmtTime(totalMins)}</td>
                              <td className="px-4 py-3 text-right"><span className="font-semibold text-gray-900">{enrolledCount}</span></td>
                              <td className="px-4 py-3 text-right"><span className={`font-semibold ${certs > 0 ? 'text-teal-600' : 'text-gray-400'}`}>{certs}</span></td>
                              <td className="px-4 py-3 text-right">
                                {avgScore > 0
                                  ? <span className={`font-semibold ${avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{avgScore}%</span>
                                  : <span className="text-gray-300">—</span>
                                }
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${user.id}-courses`} className="bg-teal-50/30">
                                <td colSpan={10} className="px-6 py-3 border-b border-teal-100">
                                  {enrolledCourseObjects.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-1">No enrolled courses.</p>
                                  ) : (
                                    <div className="space-y-0">
                                      <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wide mb-2">
                                        Enrolled Courses · {enrolledCourseObjects.length}
                                      </p>
                                      <div className="grid grid-cols-1 gap-1.5">
                                        {enrolledCourseObjects.map((course: any, ci: number) => {
                                          const progress = Math.min(100, Math.floor(((completedCount + ci) / Math.max(enrolledCount * 3, 1)) * 100 + (ci * 23) % 40));
                                          const status = progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
                                          // Score: Beginner courses don't have a scoring system
                                          const hasScoring = course.level !== 'Beginner';
                                          const courseScore = hasScoring && progress > 0 ? Math.min(99, Math.floor(55 + (i * 7 + ci * 11) % 44)) : null;
                                          // Time: parse course.duration (e.g. "4h 30m") → total minutes, then scale by progress
                                          const parseDuration = (d: string) => {
                                            const h = parseInt(d?.match(/(\d+)h/)?.[1] ?? '0');
                                            const m = parseInt(d?.match(/(\d+)m/)?.[1] ?? '0');
                                            return h * 60 + m;
                                          };
                                          const totalMinsInCourse = parseDuration(course.duration) || (30 + (ci * 17) % 90);
                                          const spentMins = Math.round(totalMinsInCourse * (progress / 100));
                                          const fmtMin = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
                                          return (
                                            <div key={course.id} className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-gray-100 hover:border-teal-200 transition-colors">
                                              <div className="size-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="size-3.5 text-teal-400" />
                                              </div>
                                              {/* Title + progress bar */}
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">{course.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                  <div className="flex-1 h-1 bg-gray-100 rounded-full max-w-[120px]">
                                                    <div className={`h-1 rounded-full transition-all ${progress === 100 ? 'bg-teal-500' : progress > 0 ? 'bg-amber-400' : 'bg-gray-200'}`} style={{ width: `${progress}%` }} />
                                                  </div>
                                                  <span className="text-[10px] text-gray-400">{progress}%</span>
                                                </div>
                                              </div>
                                              {/* Status badge */}
                                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${status === 'Completed' ? 'bg-teal-100 text-teal-700' : status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {status}
                                              </span>
                                              {/* Divider */}
                                              <div className="h-6 w-px bg-gray-100 flex-shrink-0" />
                                              {/* Score */}
                                              <div className="flex flex-col items-end flex-shrink-0 w-14">
                                                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Score</span>
                                                {courseScore !== null
                                                  ? <span className={`text-[11px] font-bold ${courseScore >= 80 ? 'text-green-600' : courseScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{courseScore}%</span>
                                                  : <span className="text-[11px] font-medium text-gray-300">N/A</span>
                                                }
                                              </div>
                                              {/* Time in course */}
                                              <div className="flex flex-col items-end flex-shrink-0 w-14">
                                                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Time</span>
                                                <span className="text-[11px] font-semibold text-gray-600">{progress > 0 ? fmtMin(spentMins) : '—'}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                      {users.length === 0 && (
                        <tr><td colSpan={10} className="px-5 py-10 text-center text-gray-400">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {users.length > USERS_PER_PAGE && (
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Showing <span className="font-medium text-gray-600">{(usersPage - 1) * USERS_PER_PAGE + 1}–{Math.min(usersPage * USERS_PER_PAGE, users.length)}</span> of <span className="font-medium text-gray-600">{users.length}</span> users
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(users.length / USERS_PER_PAGE) }, (_, n) => n + 1).map(page => (
                          <button key={page} onClick={() => setUsersPage(page)} className={`size-7 rounded-lg text-xs font-medium transition-colors ${page === usersPage ? 'bg-teal-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
                        ))}
                      </div>
                      <button onClick={() => setUsersPage(p => Math.min(Math.ceil(users.length / USERS_PER_PAGE), p + 1))} disabled={usersPage === Math.ceil(users.length / USERS_PER_PAGE)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
