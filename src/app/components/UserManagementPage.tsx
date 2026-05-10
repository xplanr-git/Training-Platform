import { useState } from 'react';
import { User, Course } from '@/app/types';
import { Search, Mail, Building2, BookOpen, Award, Edit, Trash2, ArrowLeft, Filter, Download, X, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { CompanySubscribers } from '@/app/components/CompanySubscribers';
import { RolesPermissionsPage } from '@/app/components/RolesPermissionsPage';
import { ApprovalsPage } from '@/app/components/ApprovalsPage';

interface UserManagementPageProps {
  users: User[];
  courses: Course[];
  onBack: () => void;
  onViewCompanyAdmin?: (companyId: string) => void;
  currentSubPage?: string;
  currentUser?: User | null;
  companyId?: string | null;
}

export function UserManagementPage({ users, courses, onBack, onViewCompanyAdmin, currentSubPage = 'all-users', currentUser, companyId }: UserManagementPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // Advanced filter states
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState<string>('all');
  const [coursesCountFilter, setCoursesCountFilter] = useState<string>('all');
  const [searchField, setSearchField] = useState<string>('all');

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    company: '',
    role: 'Employee',
    position: '',
    yearsInCompany: 0
  });

  // Parent admin emails
  const parentAdminEmails = ['abram.jamorabo@outdure.com', 'curtis.matthews@outdure.com.au'];

  // Map companyId to company name
  const getCompanyNameById = (id: string | null): string | null => {
    if (!id) return null;
    
    const companyMap: Record<string, string> = {
      'outdure': 'Outdure (Parent Company)',
      'tech-corp': 'TechCorp Solutions',
      'global-industries': 'Global Industries Ltd',
      'innovate-startup': 'Innovate Startup Inc',
      'enterprise-solutions': 'Enterprise Solutions Group',
      'digital-services': 'Digital Services Co'
    };
    
    return companyMap[id] || null;
  };

  // Filter users based on companyId
  const usersToDisplay = companyId 
    ? users.filter(user => {
        // Exclude parent admins
        if (parentAdminEmails.includes(user.email.toLowerCase())) {
          return false;
        }
        
        // Filter by company
        const companyName = getCompanyNameById(companyId);
        if (companyName) {
          return user.company === companyName;
        }
        
        return true;
      })
    : users;

  // Get unique companies from filtered users
  const companies = ['all', ...new Set(usersToDisplay.map(user => user.company))];

  // Filter users based on search and company filter
  const filteredUsers = usersToDisplay.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCompany = filterCompany === 'all' || user.company === filterCompany;
    
    return matchesSearch && matchesCompany;
  });

  // Calculate user progress
  const getUserProgress = (user: User) => {
    const enrolledCourses = courses.filter(course => user.enrolledCourses.includes(course.id));
    const totalLessons = enrolledCourses.reduce((sum, course) => {
      return sum + course.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0);
    }, 0);
    
    const completedLessons = user.completedLessons.length;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Export users to CSV
  const handleExportUsers = () => {
    // Prepare CSV headers
    const headers = ['Name', 'Email', 'Company', 'Enrolled Courses', 'Completed Lessons', 'Progress (%)'];
    
    // Prepare CSV rows
    const rows = filteredUsers.map(user => {
      const progress = getUserProgress(user);
      return [
        user.name,
        user.email,
        user.company,
        user.enrolledCourses.length.toString(),
        user.completedLessons.length.toString(),
        progress.toString()
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `users_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCompany('all');
    setProgressFilter('all');
    setEnrollmentFilter('all');
    setCoursesCountFilter('all');
    setSearchField('all');
  };

  // Count active filters
  const activeFiltersCount = [
    filterCompany !== 'all',
    progressFilter !== 'all',
    enrollmentFilter !== 'all',
    coursesCountFilter !== 'all',
    searchQuery !== ''
  ].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      {/* Show Company Subscribers View */}
      {currentSubPage === 'company-subscribers' && onViewCompanyAdmin ? (
        <CompanySubscribers onViewCompanyAdmin={onViewCompanyAdmin} />
      ) : currentSubPage === 'user-roles' ? (
        <RolesPermissionsPage onBack={onBack} currentUser={currentUser} companyId={companyId} />
      ) : currentSubPage === 'approvals' ? (
        <ApprovalsPage onBack={onBack} />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="size-5" />
                Back to Admin Dashboard
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={handleExportUsers}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="size-4" />
                  Export Report
                </button>
                {currentSubPage !== 'user-activity' && (
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add New User
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                <p className="text-gray-600">{filteredUsers.length} users found</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              {/* Basic Search Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">Search All Fields</option>
                  <option value="name">Name Only</option>
                  <option value="email">Email Only</option>
                  <option value="company">Company Only</option>
                </select>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="flex items-center justify-between border-t pt-4">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Filter className="size-5" />
                  Advanced Filters
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                  {showAdvancedFilters ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  >
                    <X className="size-4" />
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Advanced Filters Section */}
              {showAdvancedFilters && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Company Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        {companies.map(company => (
                          <option key={company} value={company}>
                            {company === 'all' ? 'All Companies' : company}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Progress Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Progress Level
                      </label>
                      <select
                        value={progressFilter}
                        onChange={(e) => setProgressFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="all">All Progress Levels</option>
                        <option value="not-started">Not Started (0%)</option>
                        <option value="in-progress">In Progress (1-99%)</option>
                        <option value="completed">Completed (100%)</option>
                        <option value="low">Low Progress (&lt;30%)</option>
                        <option value="medium">Medium Progress (30-70%)</option>
                        <option value="high">High Progress (&gt;70%)</option>
                      </select>
                    </div>

                    {/* Enrollment Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enrollment Status
                      </label>
                      <select
                        value={enrollmentFilter}
                        onChange={(e) => setEnrollmentFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="all">All Users</option>
                        <option value="enrolled">Has Enrollments</option>
                        <option value="not-enrolled">No Enrollments</option>
                      </select>
                    </div>

                    {/* Courses Count Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Courses
                      </label>
                      <select
                        value={coursesCountFilter}
                        onChange={(e) => setCoursesCountFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="all">Any Number</option>
                        <option value="1-2">1-2 Courses</option>
                        <option value="3-5">3-5 Courses</option>
                        <option value="5+">5+ Courses</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-sm text-gray-600">Active filters:</span>
                      {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          Search: "{searchQuery}"
                          <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                            <X className="size-3" />
                          </button>
                        </span>
                      )}
                      {filterCompany !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          Company: {filterCompany}
                          <button onClick={() => setFilterCompany('all')} className="hover:text-blue-900">
                            <X className="size-3" />
                          </button>
                        </span>
                      )}
                      {progressFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          Progress: {progressFilter.replace('-', ' ')}
                          <button onClick={() => setProgressFilter('all')} className="hover:text-blue-900">
                            <X className="size-3" />
                          </button>
                        </span>
                      )}
                      {enrollmentFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          Status: {enrollmentFilter}
                          <button onClick={() => setEnrollmentFilter('all')} className="hover:text-blue-900">
                            <X className="size-3" />
                          </button>
                        </span>
                      )}
                      {coursesCountFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          Courses: {coursesCountFilter}
                          <button onClick={() => setCoursesCountFilter('all')} className="hover:text-blue-900">
                            <X className="size-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User List */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">All Users</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((user) => {
                  const progress = getUserProgress(user);
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedUser?.id === user.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{user.name}</h3>
                            {user.role && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                {user.role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="size-4" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="size-4" />
                              {user.company}
                            </div>
                          </div>
                          {user.position && (
                            <div className="mt-1 text-sm text-gray-700 font-medium">
                              {user.position}
                              {user.yearsInCompany !== undefined && (
                                <span className="text-gray-500 font-normal ml-2">
                                  • {user.yearsInCompany === 0.5 ? '6 months' : `${user.yearsInCompany} ${user.yearsInCompany === 1 ? 'yr' : 'yrs'}`}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              {user.enrolledCourses.length} courses enrolled
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-gray-600">{progress}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Edit className="size-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Details Sidebar */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedUser ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedUser.name}</h2>
                    <p className="text-gray-600 text-sm">{selectedUser.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Company</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Building2 className="size-4" />
                        {selectedUser.company}
                      </div>
                    </div>

                    {/* Professional Information */}
                    {(selectedUser.role || selectedUser.position || selectedUser.yearsInCompany !== undefined) && (
                      <div className="border-t pt-4">
                        <label className="text-sm font-medium text-gray-600 block mb-3">Professional Information</label>
                        <div className="space-y-3">
                          {selectedUser.role && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Role</span>
                              <span className="text-sm font-medium text-gray-900 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {selectedUser.role}
                              </span>
                            </div>
                          )}
                          {selectedUser.position && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Position</span>
                              <span className="text-sm font-medium text-gray-900">{selectedUser.position}</span>
                            </div>
                          )}
                          {selectedUser.yearsInCompany !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Years in Company</span>
                              <span className="text-sm font-medium text-gray-900">
                                {selectedUser.yearsInCompany === 0.5 ? '6 months' : `${selectedUser.yearsInCompany} ${selectedUser.yearsInCompany === 1 ? 'year' : 'years'}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-gray-600 block mb-1">Progress Overview</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Overall Progress</span>
                          <span className="font-medium text-gray-900">{getUserProgress(selectedUser)}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${getUserProgress(selectedUser)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-2">Statistics</label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <BookOpen className="size-5 text-blue-600" />
                            <span className="text-sm text-gray-900">Enrolled Courses</span>
                          </div>
                          <span className="font-medium text-blue-600">{selectedUser.enrolledCourses.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Award className="size-5 text-green-600" />
                            <span className="text-sm text-gray-900">Completed Lessons</span>
                          </div>
                          <span className="font-medium text-green-600">{selectedUser.completedLessons.length}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-2">Enrolled Courses</label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {selectedUser.enrolledCourses.map((courseId) => {
                          const course = courses.find(c => c.id === courseId);
                          if (!course) return null;
                          return (
                            <div key={courseId} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                              <img
                                src={course.imageUrl}
                                alt={course.title}
                                className="size-10 rounded object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                                <p className="text-xs text-gray-600">{course.instructor}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Full Profile
                    </button>
                    <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Send Message
                    </button>
                    <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="size-4" />
                      Download Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="size-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Select a user to view details</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserForm({
                      name: '',
                      email: '',
                      company: '',
                      role: 'Employee',
                      position: '',
                      yearsInCompany: 0
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="user@company.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Company Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="text"
                    value={newUserForm.company}
                    onChange={(e) => setNewUserForm({ ...newUserForm, company: e.target.value })}
                    placeholder="Company name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Company Admin">Company Admin</option>
                    <option value="Parent Admin">Parent Admin</option>
                  </select>
                </div>

                {/* Years in Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years in Company
                  </label>
                  <input
                    type="number"
                    value={newUserForm.yearsInCompany}
                    onChange={(e) => setNewUserForm({ ...newUserForm, yearsInCompany: parseFloat(e.target.value) })}
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Position Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position/Job Title
                </label>
                <input
                  type="text"
                  value={newUserForm.position}
                  onChange={(e) => setNewUserForm({ ...newUserForm, position: e.target.value })}
                  placeholder="e.g. Senior Developer, Marketing Manager"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserForm({
                    name: '',
                    email: '',
                    company: '',
                    role: 'Employee',
                    position: '',
                    yearsInCompany: 0
                  });
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // In a real app, this would save the user to the database
                  console.log('Creating new user:', newUserForm);
                  alert(`User "${newUserForm.name}" has been added successfully!`);
                  setShowAddUserModal(false);
                  setNewUserForm({
                    name: '',
                    email: '',
                    company: '',
                    role: 'Employee',
                    position: '',
                    yearsInCompany: 0
                  });
                }}
                disabled={!newUserForm.name || !newUserForm.email || !newUserForm.company}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="size-5" />
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}