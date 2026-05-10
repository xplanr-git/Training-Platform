import { User, Course } from '@/app/types';
import { Users, BookOpen, TrendingUp, Award, BarChart3, Building2, Activity, Clock } from 'lucide-react';

interface CompanyAdminHomepageProps {
  currentUser: User;
  courses: Course[];
  companyId: string;
  companyUsers: User[];
  isCompanySubscriberView?: boolean; // True when a company subscriber is viewing their own page
}

export function CompanyAdminHomepage({ currentUser, courses, companyId, companyUsers, isCompanySubscriberView }: CompanyAdminHomepageProps) {
  // Get company name from company ID
  const getCompanyName = (id: string) => {
    const companyNames: Record<string, string> = {
      'tech-corp': 'TechCorp Solutions',
      'global-industries': 'Global Industries Ltd',
      'innovate-startup': 'Innovate Startup Inc',
      'enterprise-solutions': 'Enterprise Solutions Group',
      'digital-services': 'Digital Services Co'
    };
    return companyNames[id] || currentUser.company;
  };

  const companyName = getCompanyName(companyId);

  // Filter data for this company only
  const totalEmployees = companyUsers.length;
  const totalEnrollments = companyUsers.reduce((sum, user) => sum + user.enrolledCourses.length, 0);
  const averageProgress = companyUsers.length > 0
    ? Math.round(
        companyUsers.reduce((sum, user) => {
          const enrolledCourses = courses.filter(c => user.enrolledCourses.includes(c.id));
          const totalLessons = enrolledCourses.reduce((s, c) => 
            s + c.modules.reduce((ms, m) => ms + m.lessons.length, 0), 0);
          const progress = totalLessons > 0 ? (user.completedLessons.length / totalLessons) * 100 : 0;
          return sum + progress;
        }, 0) / companyUsers.length
      )
    : 0;

  // Get active courses for this company
  const activeCoursesForCompany = courses.filter(course => 
    companyUsers.some(user => user.enrolledCourses.includes(course.id))
  );

  // Calculate completion rate
  const completedCourses = companyUsers.reduce((sum, user) => {
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

  const completionRate = totalEnrollments > 0 
    ? Math.round((completedCourses / totalEnrollments) * 100) 
    : 0;

  // Get recent activity
  const recentlyActiveUsers = companyUsers
    .filter(user => user.completedLessons.length > 0)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        {!isCompanySubscriberView && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="size-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
                <p className="text-gray-600">Company Admin Dashboard</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
              </div>
              <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="size-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Course Enrollments</p>
                <p className="text-3xl font-bold text-gray-900">{totalEnrollments}</p>
              </div>
              <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="size-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Progress</p>
                <p className="text-3xl font-bold text-gray-900">{averageProgress}%</p>
              </div>
              <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="size-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-teal-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
              </div>
              <div className="size-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Award className="size-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Courses */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Courses</h2>
            <div className="space-y-4">
              {activeCoursesForCompany.slice(0, 5).map((course) => {
                const enrolledCount = companyUsers.filter(u => 
                  u.enrolledCourses.includes(course.id)
                ).length;
                return (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600">{enrolledCount} employees enrolled</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">{course.studentsEnrolled} total</div>
                    </div>
                  </div>
                );
              })}
              {activeCoursesForCompany.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="size-12 text-gray-400 mx-auto mb-2" />
                  <p>No active courses yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentlyActiveUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">
                      {user.completedLessons.length} lessons completed
                    </p>
                  </div>
                  <Activity className="size-5 text-green-600" />
                </div>
              ))}
              {recentlyActiveUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="size-12 text-gray-400 mx-auto mb-2" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Employee Progress Overview</h2>
          <div className="space-y-3">
            {companyUsers.slice(0, 10).map((user) => {
              const enrolledCourses = courses.filter(c => user.enrolledCourses.includes(c.id));
              const totalLessons = enrolledCourses.reduce((s, c) => 
                s + c.modules.reduce((ms, m) => ms + m.lessons.length, 0), 0);
              const progress = totalLessons > 0 
                ? Math.round((user.completedLessons.length / totalLessons) * 100) 
                : 0;

              return (
                <div key={user.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {companyUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="size-12 text-gray-400 mx-auto mb-2" />
                <p>No employees found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}