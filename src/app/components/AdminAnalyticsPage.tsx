import { Course, User } from '@/app/types';
import { TrendingUp, Users, BookOpen, Award, Calendar, DollarSign, MousePointer, LogIn, Eye, Activity, Info, X, Building2, Clock, Target, Zap, Server, AlertCircle, CheckCircle, XCircle, Wifi, WifiOff, Database } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

export function AdminAnalyticsPage({ courses, users, analyticsView, setAnalyticsView, companyName, isCompanyView = false, companyId, isCompanySubscriberView = false }: AdminAnalyticsPageProps) {
  // State for popover management
  const [activePopover, setActivePopover] = useState<string | null>(null);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {analyticsView === 'overview-analytics' && 'Analytics Dashboard'}
          {analyticsView === 'revenue' && 'Revenue Reports'}
          {analyticsView === 'traffic' && 'Traffic Analysis'}
          {analyticsView === 'user-behavior' && 'User Behavior'}
          {analyticsView === 'login-stats' && 'Login Statistics'}
          {analyticsView === 'system-health' && 'System Health & Platform Status'}
        </h1>
        <p className="text-gray-600">
          {analyticsView === 'overview-analytics' && 'Platform performance and insights'}
          {analyticsView === 'revenue' && 'Revenue and enrollment trends'}
          {analyticsView === 'traffic' && 'Website traffic and visitor metrics'}
          {analyticsView === 'user-behavior' && 'User interactions and behavior patterns'}
          {analyticsView === 'login-stats' && 'Login activity and user authentication metrics'}
          {analyticsView === 'system-health' && 'Monitor platform infrastructure and integrations'}
        </p>
      </div>

      {/* System Health - Show only when system-health view is selected */}
      {analyticsView === 'system-health' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">System Health & Platform Status</h2>
              <p className="text-sm text-gray-600 mt-1">Monitor platform infrastructure and integrations</p>
            </div>
            <Server className="size-6 text-gray-600" />
          </div>

          {/* System Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Server Uptime */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-900 font-medium">Server Uptime</p>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'server-uptime' ? null : 'server-uptime')}
                    className="hover:bg-white/50 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-green-700 cursor-pointer" />
                  </button>
                </div>
                <CheckCircle className="size-5 text-green-600" />
              </div>
              {activePopover === 'server-uptime' && (
                <div className="absolute top-14 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Server Uptime</h4>
                    <button 
                      onClick={() => setActivePopover(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The percentage of time the platform servers have been operational and accessible over the last 30 days. High uptime (99%+) ensures reliable service delivery and minimal disruptions to users.
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-green-900">{systemUptime}%</p>
              <p className="text-xs text-green-700 mt-1">Last 30 days</p>
            </div>

            {/* Error Rate */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-yellow-900 font-medium">Error Rate</p>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'error-rate' ? null : 'error-rate')}
                    className="hover:bg-white/50 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-yellow-700 cursor-pointer" />
                  </button>
                </div>
                <AlertCircle className="size-5 text-yellow-600" />
              </div>
              {activePopover === 'error-rate' && (
                <div className="absolute top-14 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Error Rate</h4>
                    <button 
                      onClick={() => setActivePopover(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The percentage of requests that resulted in server errors (5xx) or failed operations. A lower error rate indicates better system stability and code quality. Rates below 0.5% are considered excellent.
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-yellow-900">{errorRate}%</p>
              <p className="text-xs text-yellow-700 mt-1">Within normal range</p>
            </div>

            {/* Failed Transactions */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-blue-900 font-medium">Failed Transactions</p>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'failed-transactions' ? null : 'failed-transactions')}
                    className="hover:bg-white/50 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-blue-700 cursor-pointer" />
                  </button>
                </div>
                <Database className="size-5 text-blue-600" />
              </div>
              {activePopover === 'failed-transactions' && (
                <div className="absolute top-14 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Failed Transactions</h4>
                    <button 
                      onClick={() => setActivePopover(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The number of payment or enrollment transactions that failed in the last 24 hours. This includes payment gateway rejections, timeout errors, and processing failures. Monitor to ensure revenue loss is minimized.
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-blue-900">{failedTransactions}</p>
              <p className="text-xs text-blue-700 mt-1">Last 24 hours</p>
            </div>

            {/* Overall System Status */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-900 font-medium">System Status</p>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'system-status' ? null : 'system-status')}
                    className="hover:bg-white/50 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-green-700 cursor-pointer" />
                  </button>
                </div>
                <Wifi className="size-5 text-green-600" />
              </div>
              {activePopover === 'system-status' && (
                <div className="absolute top-14 left-0 right-0 mx-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">System Status</h4>
                    <button 
                      onClick={() => setActivePopover(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Overall health indicator aggregating server uptime, error rates, and critical service availability. Green indicates all systems operational, yellow means degraded performance, red signals major issues requiring immediate attention.
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-green-900">Operational</p>
              <p className="text-xs text-green-700 mt-1">All systems normal</p>
            </div>
          </div>

          {/* API & Integration Status */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wifi className="size-5 text-gray-600" />
              API & Integration Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apiIntegrations.map((integration) => (
                <div 
                  key={integration.name} 
                  className={`border rounded-lg p-4 relative ${
                    integration.status === 'operational' 
                      ? 'bg-green-50 border-green-200' 
                      : integration.status === 'degraded' 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 text-sm">{integration.name}</h4>
                        <button 
                          onClick={() => setActivePopover(activePopover === `api-${integration.name}` ? null : `api-${integration.name}`)}
                          className="hover:bg-white/50 rounded-full p-1 transition-colors"
                        >
                          <Info className="size-3.5 text-gray-600 cursor-pointer" />
                        </button>
                      </div>
                      {activePopover === `api-${integration.name}` && (
                        <div className="absolute top-12 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-30">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                            <button 
                              onClick={() => setActivePopover(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {integration.name === 'Payment Gateway' && 
                              "Manages all payment processing and transaction handling. Critical for course purchases and subscription billing. Response times under 300ms ensure smooth checkout experience."
                            }
                            {integration.name === 'Video CDN' && 
                              "Content delivery network for streaming course videos. Optimized for low latency and high availability. Fast response times ensure smooth video playback without buffering."
                            }
                            {integration.name === 'Email Service' && 
                              "Handles all transactional and marketing emails including enrollment confirmations, password resets, and course updates. Response times vary based on email queue size."
                            }
                            {integration.name === 'Analytics API' && 
                              "Collects and processes platform analytics data including user behavior, engagement metrics, and performance statistics. Higher response times may indicate heavy data processing."
                            }
                            {integration.name === 'User Authentication' && 
                              "Manages user login, registration, and session handling. Critical for platform access. Fast response times are essential for seamless user experience."
                            }
                            {integration.name === 'Cloud Storage' && 
                              "Stores course materials, user uploads, and platform assets. Response times affect file upload/download speeds and content access."
                            }
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {integration.status === 'operational' && (
                          <>
                            <CheckCircle className="size-4 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Operational</span>
                          </>
                        )}
                        {integration.status === 'degraded' && (
                          <>
                            <AlertCircle className="size-4 text-yellow-600" />
                            <span className="text-xs text-yellow-700 font-medium">Degraded</span>
                          </>
                        )}
                        {integration.status === 'down' && (
                          <>
                            <XCircle className="size-4 text-red-600" />
                            <span className="text-xs text-red-700 font-medium">Down</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Response Time</span>
                      <span className={`font-medium ${
                        integration.responseTime < 200 
                          ? 'text-green-600' 
                          : integration.responseTime < 1000 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                      }`}>
                        {integration.responseTime}ms
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          integration.responseTime < 200 
                            ? 'bg-green-500' 
                            : integration.responseTime < 1000 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((integration.responseTime / 2000) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Last check: {integration.lastCheck}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics - Show for overview and revenue views */}
      {(analyticsView === 'overview-analytics' || analyticsView === 'revenue') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <button 
                  onClick={() => setActivePopover(activePopover === 'total-revenue' ? null : 'total-revenue')}
                  className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <Info className="size-3.5 text-gray-400 cursor-pointer" />
                </button>
              </div>
              <DollarSign className="size-5 text-blue-600" />
            </div>
            {activePopover === 'total-revenue' && (
              <div className="absolute top-16 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Total Revenue</h4>
                  <button 
                    onClick={() => setActivePopover(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The total revenue generated from all course enrollments across all company subscribers. This includes all paid courses that users have enrolled in, calculated from actual enrollment data on the platform.
                </p>
              </div>
            )}
            <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-2">↑ 12% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Total Enrollments</p>
                <button 
                  onClick={() => setActivePopover(activePopover === 'total-enrollments' ? null : 'total-enrollments')}
                  className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <Info className="size-3.5 text-gray-400 cursor-pointer" />
                </button>
              </div>
              <BookOpen className="size-5 text-green-600" />
            </div>
            {activePopover === 'total-enrollments' && (
              <div className="absolute top-16 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Total Enrollments</h4>
                  <button 
                    onClick={() => setActivePopover(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The total number of course enrollments across all users and companies. This metric counts every course enrollment, including multiple courses per user. Track this to measure platform adoption and training participation rates.
                </p>
              </div>
            )}
            <p className="text-3xl font-bold text-gray-900">{totalEnrollments.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-2">↑ 8% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Active Users</p>
                <button 
                  onClick={() => setActivePopover(activePopover === 'active-users' ? null : 'active-users')}
                  className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <Info className="size-3.5 text-gray-400 cursor-pointer" />
                </button>
              </div>
              <Users className="size-5 text-purple-600" />
            </div>
            {activePopover === 'active-users' && (
              <div className="absolute top-16 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Active Users</h4>
                  <button 
                    onClick={() => setActivePopover(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Users who have completed at least one lesson on the platform. This indicates meaningful engagement beyond just enrollment. Active users represent those truly utilizing your training resources and progressing through course content.
                </p>
              </div>
            )}
            <p className="text-3xl font-bold text-gray-900">{activeUsers}</p>
            <p className="text-sm text-green-600 mt-2">↑ 5% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-600 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Completion Rate</p>
                <button 
                  onClick={() => setActivePopover(activePopover === 'completion-rate' ? null : 'completion-rate')}
                  className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <Info className="size-3.5 text-gray-400 cursor-pointer" />
                </button>
              </div>
              <Award className="size-5 text-orange-600" />
            </div>
            {activePopover === 'completion-rate' && (
              <div className="absolute top-16 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Completion Rate</h4>
                  <button 
                    onClick={() => setActivePopover(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The percentage of enrolled courses that users have completed in full. Calculated by dividing completed courses by total enrollments. A higher completion rate indicates better course quality, relevance, and learner engagement.
                </p>
              </div>
            )}
            <p className="text-3xl font-bold text-gray-900">{avgCompletionRate}%</p>
            <p className="text-sm text-green-600 mt-2">↑ 3% from last month</p>
          </div>
        </div>
      )}

      {/* Traffic & Login Metrics */}
      {(analyticsView === 'overview-analytics' || analyticsView === 'traffic' || analyticsView === 'login-stats' || analyticsView === 'user-behavior') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(analyticsView === 'overview-analytics' || analyticsView === 'traffic') && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-blue-900 font-medium">Daily Avg Visits</p>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'daily-visits' ? null : 'daily-visits')}
                    className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-blue-600 cursor-pointer" />
                  </button>
                </div>
                <Eye className="size-5 text-blue-600" />
              </div>
              {activePopover === 'daily-visits' && (
                <div className="absolute top-16 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Daily Avg Visits</h4>
                    <button 
                      onClick={() => setActivePopover(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The average number of visits to your platform per day, calculated over the last 30 days. Each visit represents a user session on the platform, regardless of duration. Monitor this to understand daily traffic patterns and platform reach.
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-blue-900">{avgDailyVisits.toLocaleString()}</p>
              <p className="text-sm text-blue-700 mt-2">↑ 14% from last month</p>
            </div>
          )}

          {(analyticsView === 'overview-analytics' || analyticsView === 'login-stats') && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-900 font-medium">Daily Avg Logins</p>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'daily-logins' ? null : 'daily-logins')}
                    className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-green-600 cursor-pointer" />
                  </button>
                </div>
                <LogIn className="size-5 text-green-600" />
              </div>
              {activePopover === 'daily-logins' && (
                <div className="absolute top-16 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Daily Avg Logins</h4>
                    <button 
                      onClick={() => setActivePopover(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The average number of user authentication events per day over the last 30 days. This includes both new and returning users logging into their accounts. Track login frequency to measure user engagement and platform stickiness.
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-green-900">{avgDailyLogins.toLocaleString()}</p>
              <p className="text-sm text-green-700 mt-2">↑ 11% from last month</p>
            </div>
          )}

          {(analyticsView === 'overview-analytics' || analyticsView === 'user-behavior') && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-purple-900 font-medium">Total Interactions</p>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'total-interactions' ? null : 'total-interactions')}
                    className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-purple-600 cursor-pointer" />
                  </button>
                </div>
                <MousePointer className="size-5 text-purple-600" />
              </div>
              {activePopover === 'total-interactions' && (
                <div className="absolute top-16 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Total Interactions</h4>
                    <button 
                      onClick={() => setActivePopover(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The total number of user interactions (clicks, video plays, searches, etc.) across the platform in the last 30 days. This metric aggregates all measurable user actions to gauge overall platform engagement and activity levels.
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-purple-900">{totalClicks.toLocaleString()}</p>
              <p className="text-sm text-purple-700 mt-2">Last 30 days</p>
            </div>
          )}

          {(analyticsView === 'overview-analytics' || analyticsView === 'traffic') && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-orange-900 font-medium">Bounce Rate</p>
                  <button 
                    onClick={() => setActivePopover(activePopover === 'bounce-rate' ? null : 'bounce-rate')}
                    className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                  >
                    <Info className="size-3.5 text-orange-600 cursor-pointer" />
                  </button>
                </div>
                <Activity className="size-5 text-orange-600" />
              </div>
              {activePopover === 'bounce-rate' && (
                <div className="absolute top-16 left-0 right-0 mx-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Bounce Rate</h4>
                    <button 
                      onClick={() => setActivePopover(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The percentage of visitors who leave the platform after viewing only one page without taking any action. A lower bounce rate indicates better user engagement and more effective landing pages that encourage exploration.
                  </p>
                </div>
              )}
              <p className="text-3xl font-bold text-orange-900">32%</p>
              <p className="text-sm text-orange-700 mt-2">↓ 5% improvement</p>
            </div>
          )}
        </div>
      )}

      {/* Website Traffic Trends */}
      {(analyticsView === 'overview-analytics' || analyticsView === 'traffic') && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Website Traffic</h2>
              <p className="text-sm text-gray-600 mt-1">Visits and page views over time</p>
            </div>
            <Eye className="size-6 text-blue-600" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Total Visits</h3>
              {trafficData.map((data) => (
                <div key={data.month}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{data.month}</span>
                    <span className="font-medium text-gray-900">{data.visits.toLocaleString()} visits</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${(data.visits / 6000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Unique Visitors</h3>
              {trafficData.map((data) => (
                <div key={data.month}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{data.month}</span>
                    <span className="font-medium text-gray-900">{data.uniqueVisitors.toLocaleString()} unique</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${(data.uniqueVisitors / 4500) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Login Activity Trends */}
      {(analyticsView === 'overview-analytics' || analyticsView === 'login-stats') && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Login Activity</h2>
              <p className="text-sm text-gray-600 mt-1">New vs returning users</p>
            </div>
            <LogIn className="size-6 text-green-600" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Total Logins</h3>
              {loginData.map((data) => (
                <div key={data.month}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{data.month}</span>
                    <span className="font-medium text-gray-900">{data.logins.toLocaleString()} logins</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${(data.logins / 1800) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">New vs Returning</h3>
              {loginData.map((data) => (
                <div key={data.month}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{data.month}</span>
                    <span className="text-xs text-gray-600">
                      {data.newUsers} new | {data.returningUsers} returning
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(data.newUsers / data.logins) * 100}%` }}
                      title="New Users"
                    />
                    <div
                      className="h-full bg-teal-600"
                      style={{ width: `${(data.returningUsers / data.logins) * 100}%` }}
                      title="Returning Users"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-center justify-around">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <div className="size-3 bg-emerald-500 rounded"></div>
                <span className="text-sm font-medium text-gray-900">New Users</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{loginData[loginData.length - 1].newUsers}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <div className="size-3 bg-teal-600 rounded"></div>
                <span className="text-sm font-medium text-gray-900">Returning Users</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{loginData[loginData.length - 1].returningUsers}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Click/Interaction Data */}
      {(analyticsView === 'overview-analytics' || analyticsView === 'user-behavior') && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">User Interactions</h2>
              <p className="text-sm text-gray-600 mt-1">Most popular actions in the last 30 days</p>
            </div>
            <MousePointer className="size-6 text-purple-600" />
          </div>
          <div className="space-y-4">
            {clickData.map((item, index) => (
              <div key={item.action} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{item.action}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{item.clicks.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">{item.percentage}% of total</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${item.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Activity Feed */}
      {(analyticsView === 'overview-analytics' || analyticsView === 'user-behavior') && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600 mt-1">Live user actions on the platform</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`size-2 rounded-full mt-2 ${
                  activity.type === 'enrollment' ? 'bg-blue-500' :
                  activity.type === 'completion' ? 'bg-green-500' :
                  activity.type === 'login' ? 'bg-purple-500' :
                  activity.type === 'click' ? 'bg-orange-500' :
                  activity.type === 'search' ? 'bg-pink-500' :
                  activity.type === 'video' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Courses */}
      {(analyticsView === 'overview-analytics' || analyticsView === 'revenue') && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Courses</h2>
          <div className="space-y-4">
            {topCourses.map((course, index) => (
              <div key={course.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <img
                  src={course.imageUrl}
                  alt={course.title}
                  className="size-14 rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.instructor}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{(course.studentsEnrolled || 0).toLocaleString()} students</p>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm text-gray-600">{course.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Performance */}
      {(analyticsView === 'overview-analytics' || analyticsView === 'revenue') && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Category Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from(new Set(courses.map(c => c.category))).map(category => {
              const categoryCourses = courses.filter(c => c.category === category);
              const totalStudents = categoryCourses.reduce((sum, c) => sum + (c.studentsEnrolled || 0), 0);
              
              return (
                <div key={category} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{category}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{totalStudents.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{categoryCourses.length} courses</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}