import { User, Course } from '@/app/types';
import { Users, BookOpen, TrendingUp, Award, BarChart3, Settings, ArrowLeft, Building2, CheckCircle, Clock, AlertCircle, Info, X } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminPageProps {
  currentUser: User;
  courses: Course[];
  onNavigate: (page: 'admin' | 'admin-courses' | 'user-management' | 'admin-analytics' | 'admin-communications' | 'admin-settings') => void;
  onBackToCompanyList?: () => void;
  selectedCompanyId?: string | null;
  onSubPageChange?: (subPage: string) => void;
  isCompanySubscriberView?: boolean; // True when a company subscriber is viewing their own page
  hideStats?: boolean; // Hide stats cards (e.g., when in Settings pages)
}

export function AdminPage({ currentUser, courses, onNavigate, onBackToCompanyList, selectedCompanyId, onSubPageChange, isCompanySubscriberView = false, hideStats = false }: AdminPageProps) {
  // State for managing popover visibility
  const [activePopover, setActivePopover] = useState<string | null>(null);

  // Mock company data - in production this would come from props or API
  const getCompanyName = (companyId: string | null | undefined) => {
    if (!companyId) return null;
    const companyNames: Record<string, string> = {
      'tech-corp': 'TechCorp Solutions',
      'global-industries': 'Global Industries Ltd',
      'innovate-startup': 'Innovate Startup Inc',
      'enterprise-solutions': 'Enterprise Solutions Group',
      'digital-services': 'Digital Services Co'
    };
    return companyNames[companyId] || 'Unknown Company';
  };

  const companyName = getCompanyName(selectedCompanyId);

  // Calculate statistics
  const totalCourses = courses.length;
  const totalStudents = courses.reduce((sum, course) => sum + course.studentsEnrolled, 0);
  const averageRating = (courses.reduce((sum, course) => sum + course.rating, 0) / courses.length).toFixed(1);

  // Mock company performance data
  const companiesData = [
    {
      id: 'tech-corp',
      name: 'TechCorp Solutions',
      totalUsers: 145,
      activeUsers: 128,
      coursesEnrolled: 24,
      avgProgress: 72,
      completionRate: 68,
      avgRating: 4.6,
      status: 'excellent' as const,
    },
    {
      id: 'global-industries',
      name: 'Global Industries Ltd',
      totalUsers: 98,
      activeUsers: 89,
      coursesEnrolled: 18,
      avgProgress: 65,
      completionRate: 61,
      avgRating: 4.4,
      status: 'good' as const,
    },
    {
      id: 'innovate-startup',
      name: 'Innovate Startup Inc',
      totalUsers: 67,
      activeUsers: 45,
      coursesEnrolled: 12,
      avgProgress: 48,
      completionRate: 42,
      avgRating: 4.1,
      status: 'needs-attention' as const,
    },
    {
      id: 'enterprise-solutions',
      name: 'Enterprise Solutions Group',
      totalUsers: 203,
      activeUsers: 187,
      coursesEnrolled: 31,
      avgProgress: 78,
      completionRate: 75,
      avgRating: 4.7,
      status: 'excellent' as const,
    },
    {
      id: 'digital-services',
      name: 'Digital Services Co',
      totalUsers: 56,
      activeUsers: 52,
      coursesEnrolled: 15,
      avgProgress: 58,
      completionRate: 55,
      avgRating: 4.3,
      status: 'good' as const,
    },
  ];

  // Calculate total courses enrolled across all companies
  const totalCompanyCoursesEnrolled = companiesData.reduce((sum, company) => sum + company.coursesEnrolled, 0);
  
  // Calculate total students across all companies
  const totalCompanyStudents = companiesData.reduce((sum, company) => sum + company.totalUsers, 0);

  // Calculate average rating across all companies
  const avgCompanyRating = (companiesData.reduce((sum, company) => sum + company.avgRating, 0) / companiesData.length).toFixed(1);

  // Calculate average completion rate across all companies
  const avgCompanyCompletionRate = Math.round(companiesData.reduce((sum, company) => sum + company.completionRate, 0) / companiesData.length);

  // Handle add course button click
  const handleAddCourse = () => {
    // Navigate to admin-courses page
    onNavigate('admin-courses');
    // Set subpage to add-course
    if (onSubPageChange) {
      onSubPageChange('add-course');
    }
  };

  const handleViewCompanyDetails = (companyId: string) => {
    // This would trigger navigation to the company-specific admin page
    if (onSubPageChange) {
      onSubPageChange('company-subscribers');
    }
    onNavigate('user-management');
  };

  // Mock data for enrollment trends (line chart)
  const enrollmentTrends = [
    { month: 'Jan', enrollments: 320, completions: 245 },
    { month: 'Feb', enrollments: 385, completions: 298 },
    { month: 'Mar', enrollments: 420, completions: 315 },
    { month: 'Apr', enrollments: 478, completions: 362 },
    { month: 'May', enrollments: 525, completions: 425 },
    { month: 'Jun', enrollments: 569, completions: 478 },
  ];

  // Mock data for company comparison (bar chart)
  const companyComparison = companiesData.map(company => ({
    name: company.name.split(' ')[0], // Short name
    users: company.totalUsers,
    courses: company.coursesEnrolled,
    completion: company.completionRate,
  }));

  // Mock data for course distribution (pie chart)
  const courseDistribution = [
    { name: 'Leadership', value: 28, color: '#3B82F6' },
    { name: 'Technology', value: 22, color: '#10B981' },
    { name: 'Marketing', value: 18, color: '#8B5CF6' },
    { name: 'Finance', value: 15, color: '#F59E0B' },
    { name: 'Operations', value: 12, color: '#EF4444' },
    { name: 'Other', value: 5, color: '#6B7280' },
  ];

  // Mock data for student activity (area chart)
  const studentActivity = [
    { week: 'Week 1', active: 385, inactive: 84 },
    { week: 'Week 2', active: 412, inactive: 57 },
    { week: 'Week 3', active: 445, inactive: 44 },
    { week: 'Week 4', active: 498, inactive: 71 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        {/* Header section removed - no longer needed */}



        {/* Visual Analytics Charts - Only show for parent admin */}
        {!companyName && (
          <>
            {/* Enrollment Trends & Course Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enrollment Trends - Line Chart */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 relative">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Enrollment Trends</h2>
                    <button 
                      onClick={() => setActivePopover(activePopover === 'enrollment-trends' ? null : 'enrollment-trends')}
                      className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                    >
                      <Info className="size-4 text-gray-400 cursor-pointer" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Monthly enrollments and completions over time</p>
                </div>
                {activePopover === 'enrollment-trends' && (
                  <div className="absolute top-20 left-6 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Enrollment Trends</h4>
                      <button 
                        onClick={() => setActivePopover(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      This line chart tracks the monthly progression of course enrollments and completions across all company subscribers. The blue line represents new enrollments, while the green line shows completed courses. Monitor these trends to identify growth patterns, seasonal variations, and the effectiveness of your training programs over time.
                    </p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={enrollmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="enrollments" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Enrollments"
                      dot={{ fill: '#3B82F6', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completions" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="Completions"
                      dot={{ fill: '#10B981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Course Distribution - Pie Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Course Categories</h2>
                    <button 
                      onClick={() => setActivePopover(activePopover === 'course-categories' ? null : 'course-categories')}
                      className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                    >
                      <Info className="size-4 text-gray-400 cursor-pointer" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Distribution by subject</p>
                </div>
                {activePopover === 'course-categories' && (
                  <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Course Categories</h4>
                      <button 
                        onClick={() => setActivePopover(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      This pie chart visualizes how your course catalog is distributed across different subject categories. Each slice represents the percentage of courses in areas like Leadership, Technology, Marketing, Finance, and Operations. Use this to ensure a balanced curriculum that meets diverse training needs across your company subscribers.
                    </p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={courseDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 25;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#1F2937"
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            style={{ fontSize: '13px', fontWeight: '600' }}
                          >
                            {`${name} ${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {courseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Company Comparison & Student Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Comparison - Bar Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Company Performance</h2>
                    <button 
                      onClick={() => setActivePopover(activePopover === 'company-performance' ? null : 'company-performance')}
                      className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                    >
                      <Info className="size-4 text-gray-400 cursor-pointer" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Compare metrics across companies</p>
                </div>
                {activePopover === 'company-performance' && (
                  <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Company Performance</h4>
                      <button 
                        onClick={() => setActivePopover(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      This bar chart compares key performance metrics across all your company subscribers. Blue bars show total users per company, while green bars indicate courses enrolled. Quickly identify which companies are most engaged with your platform and which may need additional support or encouragement to maximize their subscription value.
                    </p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={companyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="users" fill="#3B82F6" name="Total Users" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="courses" fill="#10B981" name="Courses Enrolled" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Student Activity - Area Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 relative">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Student Activity</h2>
                    <button 
                      onClick={() => setActivePopover(activePopover === 'student-activity' ? null : 'student-activity')}
                      className="hover:bg-gray-100 rounded-full p-1 transition-colors"
                    >
                      <Info className="size-4 text-gray-400 cursor-pointer" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Active vs inactive students by week</p>
                </div>
                {activePopover === 'student-activity' && (
                  <div className="absolute top-20 left-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Student Activity</h4>
                      <button 
                        onClick={() => setActivePopover(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      This stacked area chart shows weekly student engagement levels across your platform. The green area represents active students who are currently engaging with courses, while the red area shows inactive students. Track engagement trends week-over-week to identify patterns and take proactive measures to re-engage inactive learners.
                    </p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={studentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="week" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="active" 
                      stackId="1"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Active Students"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="inactive" 
                      stackId="1"
                      stroke="#EF4444" 
                      fill="#EF4444"
                      fillOpacity={0.6}
                      name="Inactive Students"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Companies Overview - Only show for parent admin (when no company is selected) */}
        {!companyName && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Company Subscribers Overview</h2>
                <p className="text-sm text-gray-600 mt-1">Monitor course performance across all company subscribers</p>
              </div>
              <button
                onClick={() => {
                  onNavigate('user-management');
                  onSubPageChange?.('company-subscribers');
                }}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
              >
                View All Companies →
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {companiesData.map((company) => (
                <div
                  key={company.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{company.name}</h3>
                        <p className="text-sm text-gray-600">{company.totalUsers} users • {company.coursesEnrolled} courses enrolled</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {company.status === 'excellent' && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="size-3" />
                          Excellent
                        </div>
                      )}
                      {company.status === 'good' && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Clock className="size-3" />
                          Good
                        </div>
                      )}
                      {company.status === 'needs-attention' && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          <AlertCircle className="size-3" />
                          Needs Attention
                        </div>
                      )}
                      <button
                        onClick={() => handleViewCompanyDetails(company.id)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="size-4 text-gray-600" />
                        <p className="text-xs text-gray-600">Active Users</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{company.activeUsers}</p>
                      <p className="text-xs text-gray-500">of {company.totalUsers}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="size-4 text-gray-600" />
                        <p className="text-xs text-gray-600">Courses</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{company.coursesEnrolled}</p>
                      <p className="text-xs text-gray-500">enrolled</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="size-4 text-gray-600" />
                        <p className="text-xs text-gray-600">Avg Progress</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{company.avgProgress}%</p>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${company.avgProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="size-4 text-gray-600" />
                        <p className="text-xs text-gray-600">Completion</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{company.completionRate}%</p>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            company.completionRate >= 70 ? 'bg-green-600' :
                            company.completionRate >= 50 ? 'bg-blue-600' :
                            'bg-orange-600'
                          }`}
                          style={{ width: `${company.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
      </div>
    </div>
  );
}