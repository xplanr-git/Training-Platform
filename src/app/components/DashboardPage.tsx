import { useState } from 'react';
import { User, Course } from '@/app/types';
import { TrendingUp, Award, Clock, Target, User as UserIcon, Mail, Building2, Briefcase, Calendar, BookOpen, LayoutDashboard, Inbox, Star, ShoppingBag, ChevronRight, Settings, Bell, Lock, Globe } from 'lucide-react';

interface DashboardPageProps {
  currentUser: User;
  courses: Course[];
  onCourseClick: (courseId: string) => void;
  onContinueLearning: (courseId: string) => void;
}

export function DashboardPage({ currentUser, courses, onCourseClick, onContinueLearning }: DashboardPageProps) {
  const [activeMenu, setActiveMenu] = useState('dashboard');

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center gap-4">
          <div className="size-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
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
                {[
                  { id: 'dashboard',        label: 'Dashboard',        icon: <LayoutDashboard className="size-4" /> },
                  { id: 'my-profile',       label: 'My Profile',       icon: <UserIcon className="size-4" /> },
                  { id: 'inbox',            label: 'Inbox',            icon: <Inbox className="size-4" /> },
                  { id: 'enrolled-courses', label: 'Enrolled Courses', icon: <BookOpen className="size-4" /> },
                  { id: 'reviews',          label: 'Reviews',          icon: <Star className="size-4" /> },
                  { id: 'order-history',    label: 'Order History',    icon: <ShoppingBag className="size-4" /> },
                  { id: 'settings',         label: 'Settings',         icon: <Settings className="size-4" /> },
                ].map((item, i, arr) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                      i < arr.length - 1 ? 'border-b border-gray-100' : ''
                    } ${
                      activeMenu === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={activeMenu === item.id ? 'text-blue-600' : 'text-gray-400'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </span>
                    <ChevronRight className={`size-3.5 ${activeMenu === item.id ? 'text-blue-400' : 'text-gray-300'}`} />
                  </button>
                ))}
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">My Profile</h3>
                  <div className="space-y-5">
                    {[
                      { label: 'Full Name',     value: currentUser.name,    icon: <UserIcon className="size-4 text-gray-500" /> },
                      { label: 'Email Address', value: currentUser.email,   icon: <Mail className="size-4 text-gray-500" /> },
                      { label: 'Company',       value: currentUser.company, icon: <Building2 className="size-4 text-gray-500" /> },
                      { label: 'Role',          value: currentUser.role?.replace(/_/g, ' '), icon: <Briefcase className="size-4 text-gray-500" /> },
                      ...(currentUser.position ? [{ label: 'Position', value: currentUser.position, icon: <Briefcase className="size-4 text-gray-500" /> }] : []),
                      ...(currentUser.yearsInCompany !== undefined ? [{ label: 'Years at Company', value: `${currentUser.yearsInCompany} ${currentUser.yearsInCompany === 1 ? 'year' : 'years'}`, icon: <Calendar className="size-4 text-gray-500" /> }] : []),
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                        <div className="size-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">{row.icon}</div>
                        <div>
                          <p className="text-xs text-gray-400">{row.label}</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{row.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Inbox ── */}
              {activeMenu === 'inbox' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Inbox</h3>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Inbox className="size-12 text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Notifications and messages from your company will appear here.</p>
                  </div>
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Reviews</h3>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Star className="size-12 text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-1">Complete a course to leave a review.</p>
                  </div>
                </div>
              )}

              {/* ── Order History ── */}
              {activeMenu === 'order-history' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Order History</h3>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingBag className="size-12 text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">No orders yet</p>
                    <p className="text-sm text-gray-400 mt-1">Your course purchases will appear here.</p>
                  </div>
                </div>
              )}

              {/* ── Settings ── */}
              {activeMenu === 'settings' && (
                <div className="flex flex-col gap-5">
                  {/* Notifications */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Bell className="size-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Course updates',       sub: 'Get notified when a course you enrolled in is updated' },
                        { label: 'New messages',         sub: 'Receive alerts for new inbox messages' },
                        { label: 'Certificate earned',   sub: 'Notify me when I earn a certificate' },
                        { label: 'Weekly progress report', sub: 'A weekly summary of your learning activity' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-400">{item.sub}</p>
                          </div>
                          {/* Toggle */}
                          <button className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent bg-blue-600 transition-colors focus:outline-none">
                            <span className="translate-x-4 inline-block size-4 rounded-full bg-white shadow transition-transform" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privacy & Security */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <Lock className="size-4 text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-700">Privacy & Security</h3>
                    </div>
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                        Change Password
                        <ChevronRight className="size-4 text-gray-300" />
                      </button>
                      <button className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                        Two-Factor Authentication
                        <ChevronRight className="size-4 text-gray-300" />
                      </button>
                      <button className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                        Connected Accounts
                        <ChevronRight className="size-4 text-gray-300" />
                      </button>
                    </div>
                  </div>

                  {/* Language & Region */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
  );
}
