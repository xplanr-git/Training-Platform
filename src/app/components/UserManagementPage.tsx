import { useState, useEffect } from 'react';
import { User, Course } from '@/app/types';
import { supabase } from '/utils/supabase/client';
import { Search, Mail, Building2, BookOpen, Award, Edit, Trash2, ArrowLeft, Filter, Download, X, ChevronDown, ChevronUp, UserPlus, Upload, BookMarked, Tag, BookX, Bell, Ban, AlertTriangle, ChevronRight } from 'lucide-react';
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

  // View Full Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'overview' | 'courses' | 'activity'>('overview');

  // Send Message modal
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: '', body: '', sendCopy: false });

  // Local users state — starts from the prop, allows adding new users
  const [localUsers, setLocalUsers] = useState<User[]>(users);

  // KV store prefixes for persistence
  const kvAdded   = `platform_user_added:${companyId || 'global'}:`;
  const kvDeleted = `platform_user_deleted:${companyId || 'global'}:`;

  // Load persisted added/deleted users from Supabase KV on mount
  useEffect(() => {
    const load = async () => {
      const [addedRes, deletedRes] = await Promise.all([
        supabase.from('kv_store_d60f2898').select('value').like('key', `${kvAdded}%`),
        supabase.from('kv_store_d60f2898').select('value').like('key', `${kvDeleted}%`),
      ]);
      const addedUsers: User[] = (addedRes.data ?? []).map((r: any) => r.value as User);
      const deletedIds: Set<string> = new Set((deletedRes.data ?? []).map((r: any) => (r.value as string)));
      setLocalUsers([
        ...addedUsers,
        ...users.filter(u => !deletedIds.has(u.id)),
      ]);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add New User modal tab
  const [addUserTab, setAddUserTab] = useState<'detail' | 'enrollment'>('detail');
  const [showCompanyDrop, setShowCompanyDrop] = useState(false);

  // Enrollment tab state
  const [enrollment, setEnrollment] = useState({
    productId: '',
    expirationDate: '',
    noExpiration: false,
    paymentMethod: 'free' as 'free' | 'stripe' | 'manual' | 'coupon',
    paymentAmount: '',
    paymentCurrency: 'USD',
    paymentNote: '',
    completionPreference: 'self-paced' as 'self-paced' | 'instructor-led' | 'deadline',
    deadlineDate: '',
    sendWelcomeEmail: true,
    markCompleted: false,
    additionalNotes: '',
  });

  // Edit User modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '', email: '', company: '', role: 'Employee', position: '',
    yearsInCompany: 0, tags: [] as string[], emailConsent: false,
  });
  const [editUserTab, setEditUserTab] = useState<'detail' | 'enrollment'>('detail');

  // Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const openDeleteConfirm = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingUser(user);
    setShowDeleteConfirm(true);
  };

  const openEditUser = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role || 'Employee',
      position: user.position || '',
      yearsInCompany: user.yearsInCompany ?? 0,
      tags: (user as any).tags ?? [],
      emailConsent: (user as any).emailConsent ?? false,
    });
    setEditUserTab('detail');
    setShowEditUserModal(true);
  };

  // Admin access check — only platform or company admins can edit users
  const isAdminUser = currentUser && (
    currentUser.role === 'platform_admin' ||
    currentUser.role === 'company_admin'
  );

  // Bulk action state
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  type BulkAction = 'import' | 'enroll' | 'import-enroll' | 'tag' | 'unenroll' | 'resend-activation' | 'suspend' | 'delete' | null;
  const [bulkModal, setBulkModal] = useState<BulkAction>(null);
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkCourse, setBulkCourse] = useState('');
  const [bulkTag, setBulkTag] = useState('');
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkConfirmText, setBulkConfirmText] = useState('');

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    company: '',
    role: 'Employee',
    position: '',
    yearsInCompany: 0,
    tags: [] as string[],
    emailConsent: false,
    validationRules: true,
  });

  const availableTags = ['Homeowner', 'Contractor', 'Installer', 'Architect', 'Engineer', 'Project Manager', 'Supplier', 'Consultant', 'Trainee', 'Executive'];

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

  // Use localUsers — allows newly added users to appear without a prop change
  const usersToDisplay = localUsers;

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
        <RolesPermissionsPage onBack={onBack} currentUser={currentUser} companyId={companyId} users={users} />
      ) : currentSubPage === 'approvals' ? (
        <ApprovalsPage onBack={onBack} />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                <p className="text-gray-600">{filteredUsers.length} users found</p>
              </div>

              {/* Actions — right-aligned, vertically centred with the heading */}
              <div className="flex gap-3 items-center">
                <button
                  onClick={handleExportUsers}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="size-4" />
                  Export Report
                </button>

                {/* Bulk Action dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowBulkMenu(v => !v)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    Bulk Action
                    <ChevronDown className="size-4" />
                  </button>
                  {showBulkMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                        {([
                          { key: 'import',            label: 'Import Users',           icon: Upload,      iconColor: 'text-gray-800' },
                          { key: 'enroll',            label: 'Enroll Users',           icon: BookMarked,  iconColor: 'text-gray-800' },
                          { key: 'import-enroll',     label: 'Import & Enroll Users',  icon: BookMarked,  iconColor: 'text-gray-800' },
                          { key: 'tag',               label: 'Tag Users',              icon: Tag,         iconColor: 'text-gray-800' },
                          { key: 'unenroll',          label: 'Unenroll Users',         icon: BookX,       iconColor: 'text-gray-800' },
                          { key: 'resend-activation', label: 'Resend Activation',      icon: Bell,        iconColor: 'text-gray-800' },
                          { key: 'suspend',           label: 'Suspend Users',          icon: Ban,         iconColor: 'text-gray-800' },
                          { key: 'delete',            label: 'Delete Users',           icon: Trash2,      iconColor: 'text-gray-800' },
                        ] as const).map(({ key, label, icon: Icon, iconColor }, i, arr) => (
                          <button key={key}
                            onClick={() => { setBulkModal(key); setShowBulkMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors ${i === arr.length - 2 ? 'border-t border-gray-100 mt-1 pt-3' : ''}`}
                          >
                            <Icon className={`size-4 shrink-0 ${iconColor}`} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

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
                    {/* Company Filter — hidden when already scoped to a company dashboard */}
                    {!companyId && (
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
                    )}

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
                          {isAdminUser && (
                            <button
                              onClick={(e) => openEditUser(user, e)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit user"
                            >
                              <Edit className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => openDeleteConfirm(user, e)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete user"
                          >
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
                    <button
                      onClick={() => { setProfileTab('overview'); setShowProfileModal(true); }}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Full Profile
                    </button>
                    <button
                      onClick={() => { setMessageForm({ subject: '', body: '', sendCopy: false }); setShowMessageModal(true); }}
                      className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Send Message
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedUser) return;
                        const progress = getUserProgress(selectedUser);
                        const enrolledTitles = selectedUser.enrolledCourses.map(id => courses.find(c => c.id === id)?.title || id);
                        const csv = [
                          ['Field', 'Value'],
                          ['Name', selectedUser.name],
                          ['Email', selectedUser.email],
                          ['Company', selectedUser.company],
                          ['Role', selectedUser.role || ''],
                          ['Position', selectedUser.position || ''],
                          ['Years in Company', String(selectedUser.yearsInCompany ?? '')],
                          ['Enrolled Courses', String(selectedUser.enrolledCourses.length)],
                          ['Completed Lessons', String(selectedUser.completedLessons.length)],
                          ['Overall Progress', `${progress}%`],
                          ['Courses', enrolledTitles.join('; ')],
                        ].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `${selectedUser.name.replace(/\s+/g, '_')}_report_${new Date().toISOString().split('T')[0]}.csv`;
                        link.click();
                      }}
                      className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
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

            {/* Header */}
            <div className="px-6 pt-6 pb-0 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserTab('detail');
                    setNewUserForm({ name: '', email: '', company: '', role: 'Employee', position: '', yearsInCompany: 0, tags: [], emailConsent: false, validationRules: true });
                    setEnrollment({ productId: '', expirationDate: '', noExpiration: false, paymentMethod: 'free', paymentAmount: '', paymentCurrency: 'USD', paymentNote: '', completionPreference: 'self-paced', deadlineDate: '', sendWelcomeEmail: true, markCompleted: false, additionalNotes: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>
              {/* Tabs */}
              <div className="flex gap-0">
                {([['detail', 'User Detail'], ['enrollment', 'Enrollment']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setAddUserTab(key)}
                    className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${addUserTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── User Detail Tab ── */}
            {addUserTab === 'detail' && <div className="p-6 space-y-6">
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
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={newUserForm.company}
                    onChange={(e) => setNewUserForm({ ...newUserForm, company: e.target.value })}
                    onFocus={() => setShowCompanyDrop(true)}
                    onBlur={() => setTimeout(() => setShowCompanyDrop(false), 150)}
                    placeholder="Company name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showCompanyDrop && (() => {
                    const adminCompany = currentUser?.company;
                    const filtered = [...new Set(usersToDisplay.map(u => u.company))]
                      .filter(c => c !== adminCompany && c.toLowerCase().includes(newUserForm.company.toLowerCase()))
                      .sort();
                    const showAdmin = adminCompany && adminCompany.toLowerCase().includes(newUserForm.company.toLowerCase());
                    if (!showAdmin && filtered.length === 0) return null;
                    return (
                      <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {showAdmin && (
                          <button type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { setNewUserForm(f => ({ ...f, company: adminCompany! })); setShowCompanyDrop(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-blue-50 border-b border-gray-100">
                            <Building2 className="size-4 text-blue-500 shrink-0" />
                            <span className="flex-1 font-medium text-gray-800">{adminCompany}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full uppercase tracking-wide">Your Company</span>
                          </button>
                        )}
                        {filtered.map(c => (
                          <button type="button" key={c}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { setNewUserForm(f => ({ ...f, company: c })); setShowCompanyDrop(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 text-gray-700">
                            <Building2 className="size-4 text-gray-400 shrink-0" />
                            {c}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
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

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags <span className="text-gray-400 font-normal">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const selected = newUserForm.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewUserForm(f => ({
                          ...f,
                          tags: selected ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
                        }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {selected && <span className="mr-1">✓</span>}{tag}
                      </button>
                    );
                  })}
                </div>
                {newUserForm.tags.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Selected: {newUserForm.tags.join(', ')}
                  </p>
                )}
              </div>

              {/* Validation Rules */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Validation Rules</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Respect user field validation rules when creating this user. Disable only if you need to bypass required field checks for this entry.
                  </p>
                </div>
                <div
                  className="cursor-pointer shrink-0 mt-0.5"
                  onClick={() => setNewUserForm(f => ({ ...f, validationRules: !f.validationRules }))}
                >
                  <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${newUserForm.validationRules ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${newUserForm.validationRules ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              </div>

              {/* Email Consent */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Email Consent</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    This user has granted permission to receive promotional emails sent from within the school. Only enable if the user has explicitly consented.
                  </p>
                </div>
                <div
                  className="cursor-pointer shrink-0 mt-0.5"
                  onClick={() => setNewUserForm(f => ({ ...f, emailConsent: !f.emailConsent }))}
                >
                  <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${newUserForm.emailConsent ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${newUserForm.emailConsent ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              </div>
            </div>}

            {/* ── Enrollment Tab ── */}
            {addUserTab === 'enrollment' && (
              <div className="p-6 space-y-5">

                {/* Select Product */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
                  <select value={enrollment.productId} onChange={e => setEnrollment(en => ({ ...en, productId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                    <option value="">— Choose a course or product —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                {/* Edit Expiration Date */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <p className="text-sm font-medium text-gray-800">Edit Expiration Date</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={enrollment.noExpiration}
                        onChange={() => setEnrollment(en => ({ ...en, noExpiration: !en.noExpiration, expirationDate: '' }))}
                        className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">No expiration date</span>
                    </label>
                  </div>
                  {!enrollment.noExpiration && (
                    <input type="date" value={enrollment.expirationDate}
                      onChange={e => setEnrollment(en => ({ ...en, expirationDate: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  )}
                </div>

                {/* Create a Payment Record */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <p className="text-sm font-medium text-gray-800">Create a Payment Record</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                      <select value={enrollment.paymentMethod} onChange={e => setEnrollment(en => ({ ...en, paymentMethod: e.target.value as typeof enrollment.paymentMethod }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                        <option value="free">Free / Complimentary</option>
                        <option value="stripe">Stripe</option>
                        <option value="manual">Manual / Offline</option>
                        <option value="coupon">Coupon / Discount Code</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                      <select value={enrollment.paymentCurrency} onChange={e => setEnrollment(en => ({ ...en, paymentCurrency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                        {['USD','AUD','GBP','EUR','CAD','NZD'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  {enrollment.paymentMethod !== 'free' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                        <input type="number" min="0" step="0.01" value={enrollment.paymentAmount}
                          onChange={e => setEnrollment(en => ({ ...en, paymentAmount: e.target.value }))}
                          className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Note</label>
                    <input type="text" value={enrollment.paymentNote} onChange={e => setEnrollment(en => ({ ...en, paymentNote: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Invoice #1234, paid via bank transfer" />
                  </div>
                </div>

                {/* Enrollment and Completion Preference */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <p className="text-sm font-medium text-gray-800">Enrollment & Completion Preference</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([['self-paced','Self-paced'],['instructor-led','Instructor-led'],['deadline','Has Deadline']] as const).map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => setEnrollment(en => ({ ...en, completionPreference: val }))}
                        className={`py-2 rounded-lg border text-xs font-medium transition-colors ${enrollment.completionPreference === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  {enrollment.completionPreference === 'deadline' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Deadline Date</label>
                      <input type="date" value={enrollment.deadlineDate} onChange={e => setEnrollment(en => ({ ...en, deadlineDate: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={enrollment.sendWelcomeEmail}
                        onChange={() => setEnrollment(en => ({ ...en, sendWelcomeEmail: !en.sendWelcomeEmail }))}
                        className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Send welcome / enrollment email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={enrollment.markCompleted}
                        onChange={() => setEnrollment(en => ({ ...en, markCompleted: !en.markCompleted }))}
                        className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Mark as completed immediately</span>
                    </label>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                  <textarea value={enrollment.additionalNotes} onChange={e => setEnrollment(en => ({ ...en, additionalNotes: e.target.value }))}
                    rows={3} placeholder="Any notes about this enrollment (internal use only)…"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>

              </div>
            )}

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-between items-center">
              <div className="flex gap-2">
                {addUserTab === 'detail' && (
                  <button onClick={() => setAddUserTab('enrollment')}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2">
                    Next: Enrollment <ChevronRight className="size-4" />
                  </button>
                )}
                {addUserTab === 'enrollment' && (
                  <button onClick={() => setAddUserTab('detail')}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    ← Back
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserTab('detail');
                    setNewUserForm({ name: '', email: '', company: '', role: 'Employee', position: '', yearsInCompany: 0, tags: [], emailConsent: false, validationRules: true });
                    setEnrollment({ productId: '', expirationDate: '', noExpiration: false, paymentMethod: 'free', paymentAmount: '', paymentCurrency: 'USD', paymentNote: '', completionPreference: 'self-paced', deadlineDate: '', sendWelcomeEmail: true, markCompleted: false, additionalNotes: '' });
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const newUser: User = {
                      id: `user-${Date.now()}`,
                      name: newUserForm.name,
                      email: newUserForm.email,
                      company: newUserForm.company,
                      role: newUserForm.role,
                      position: newUserForm.position || undefined,
                      yearsInCompany: newUserForm.yearsInCompany,
                      enrolledCourses: enrollment.productId ? [enrollment.productId] : [],
                      completedLessons: [],
                    };
                    setLocalUsers(prev => [newUser, ...prev]);
                    await supabase.from('kv_store_d60f2898').upsert({ key: `${kvAdded}${newUser.id}`, value: newUser });
                    setShowAddUserModal(false);
                    setAddUserTab('detail');
                    setNewUserForm({ name: '', email: '', company: '', role: 'Employee', position: '', yearsInCompany: 0, tags: [], emailConsent: false, validationRules: true });
                    setEnrollment({ productId: '', expirationDate: '', noExpiration: false, paymentMethod: 'free', paymentAmount: '', paymentCurrency: 'USD', paymentNote: '', completionPreference: 'self-paced', deadlineDate: '', sendWelcomeEmail: true, markCompleted: false, additionalNotes: '' });
                  }}
                  disabled={!newUserForm.name || !newUserForm.email || !newUserForm.company}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="size-4" />
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Full Profile Modal ── */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 pt-6 pb-0 border-b border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    {selectedUser.role && <span className="mt-1 inline-block text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{selectedUser.role}</span>}
                  </div>
                </div>
                <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
              </div>
              <div className="flex gap-0">
                {([['overview','Overview'],['courses','Courses'],['activity','Activity']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setProfileTab(key)}
                    className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${profileTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">

              {profileTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Company',          value: selectedUser.company },
                      { label: 'Position',         value: selectedUser.position || '—' },
                      { label: 'Years in Company', value: selectedUser.yearsInCompany === 0.5 ? '6 months' : `${selectedUser.yearsInCompany ?? '—'} yrs` },
                      { label: 'Role',             value: selectedUser.role || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                        <p className="text-sm font-semibold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedUser.enrolledCourses.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Enrolled Courses</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedUser.completedLessons.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Completed Lessons</p>
                    </div>
                    <div className="p-4 bg-violet-50 rounded-xl text-center">
                      <p className="text-2xl font-bold text-violet-600">{getUserProgress(selectedUser)}%</p>
                      <p className="text-xs text-gray-500 mt-1">Overall Progress</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Progress</p>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${getUserProgress(selectedUser)}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'courses' && (
                <div className="space-y-3">
                  {selectedUser.enrolledCourses.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No courses enrolled.</p>}
                  {selectedUser.enrolledCourses.map(courseId => {
                    const course = courses.find(c => c.id === courseId);
                    if (!course) return null;
                    return (
                      <div key={courseId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <img src={course.imageUrl} alt={course.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                          <p className="text-xs text-gray-500">{course.instructor}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium shrink-0">Enrolled</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {profileTab === 'activity' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Recent Activity</p>
                  {selectedUser.completedLessons.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet.</p>}
                  {selectedUser.completedLessons.slice(0, 15).map((lessonId, i) => (
                    <div key={lessonId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Award className="size-3.5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">Completed lesson <span className="font-medium">{lessonId}</span></p>
                        <p className="text-xs text-gray-400">{i === 0 ? 'Recently' : `${i + 1} lessons ago`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowProfileModal(false)} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Close</button>
              <button onClick={() => { setShowProfileModal(false); setMessageForm({ subject: '', body: '', sendCopy: false }); setShowMessageModal(true); }}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Message Modal ── */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Send Message</h2>
                  <p className="text-xs text-gray-500">To: {selectedUser.name} &lt;{selectedUser.email}&gt;</p>
                </div>
              </div>
              <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" value={messageForm.subject} onChange={e => setMessageForm(m => ({ ...m, subject: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Message subject…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={messageForm.body} onChange={e => setMessageForm(m => ({ ...m, body: e.target.value }))}
                  rows={6} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder={`Hi ${selectedUser.name.split(' ')[0]},\n\n`} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={messageForm.sendCopy} onChange={() => setMessageForm(m => ({ ...m, sendCopy: !m.sendCopy }))}
                  className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-600">Send a copy to myself</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowMessageModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                disabled={!messageForm.subject.trim() || !messageForm.body.trim()}
                onClick={() => { alert(`Message sent to ${selectedUser.name}!`); setShowMessageModal(false); }}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                <Mail className="size-4" /> Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">Delete User</h2>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
              <button onClick={() => { setShowDeleteConfirm(false); setDeletingUser(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg shrink-0">
                <X className="size-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {deletingUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{deletingUser.name}</p>
                    <p className="text-xs text-gray-500">{deletingUser.email}</p>
                    <p className="text-xs text-gray-500">{deletingUser.company}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Are you sure you want to permanently delete <span className="font-semibold text-gray-900">{deletingUser.name}</span>?
              </p>
              <p className="text-xs text-gray-400">
                All their progress, enrollments, and data will be removed from the platform.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletingUser(null); }}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={async () => {
                  setLocalUsers(prev => prev.filter(u => u.id !== deletingUser.id));
                  // If it's a KV-added user, remove from KV; otherwise mark as deleted
                  const isKvUser = deletingUser.id.startsWith('user-');
                  if (isKvUser) {
                    await supabase.from('kv_store_d60f2898').delete().eq('key', `${kvAdded}${deletingUser.id}`);
                  } else {
                    await supabase.from('kv_store_d60f2898').upsert({ key: `${kvDeleted}${deletingUser.id}`, value: deletingUser.id });
                  }
                  setShowDeleteConfirm(false);
                  setDeletingUser(null);
                  if (selectedUser?.id === deletingUser.id) setSelectedUser(null);
                }}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2">
                <Trash2 className="size-4" /> Delete User
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 pt-6 pb-0 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                    {editingUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                    <p className="text-xs text-gray-500">{editingUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setShowEditUserModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="size-5 text-gray-400" />
                </button>
              </div>
              {/* Tabs */}
              <div className="flex gap-0">
                {([['detail', 'User Detail'], ['enrollment', 'Enrollment']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setEditUserTab(key)}
                    className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${editUserTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto flex-1">

              {/* ── Detail Tab ── */}
              {editUserTab === 'detail' && (
                <div className="p-6 space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={editUserForm.name}
                        onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" value={editUserForm.email}
                        onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company <span className="text-red-500">*</span></label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                        <select value={editUserForm.company}
                          onChange={e => setEditUserForm(f => ({ ...f, company: e.target.value }))}
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                          {/* Current company first */}
                          {editingUser && (
                            <option value={editingUser.company}>{editingUser.company} (current)</option>
                          )}
                          {/* All other unique companies */}
                          {[...new Set(usersToDisplay.map(u => u.company))]
                            .filter(c => c !== editingUser?.company)
                            .sort()
                            .map(c => <option key={c} value={c}>{c}</option>)
                          }
                        </select>
                      </div>
                      {editUserForm.company !== editingUser?.company && (
                        <button type="button"
                          onClick={() => setEditUserForm(f => ({ ...f, company: editingUser?.company ?? f.company }))}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                          ↩ Reset to current: {editingUser?.company}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                      <select value={editUserForm.role}
                        onChange={e => setEditUserForm(f => ({ ...f, role: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="Company Admin">Company Admin</option>
                        <option value="Parent Admin">Parent Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Years in Company</label>
                      <input type="number" min="0" step="0.5" value={editUserForm.yearsInCompany}
                        onChange={e => setEditUserForm(f => ({ ...f, yearsInCompany: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Position / Job Title</label>
                    <input type="text" value={editUserForm.position}
                      onChange={e => setEditUserForm(f => ({ ...f, position: e.target.value }))}
                      placeholder="e.g. Senior Developer, Marketing Manager"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => {
                        const selected = editUserForm.tags.includes(tag);
                        return (
                          <button key={tag} type="button"
                            onClick={() => setEditUserForm(f => ({ ...f, tags: selected ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}>
                            {selected && <span className="mr-1">✓</span>}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Email Consent toggle */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Email Consent</p>
                      <p className="text-xs text-gray-500 mt-0.5">User has granted permission to receive promotional emails.</p>
                    </div>
                    <div className="cursor-pointer shrink-0 mt-0.5"
                      onClick={() => setEditUserForm(f => ({ ...f, emailConsent: !f.emailConsent }))}>
                      <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${editUserForm.emailConsent ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${editUserForm.emailConsent ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ── Enrollment Tab ── */}
              {editUserTab === 'enrollment' && (
                <div className="p-6 space-y-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Currently Enrolled Courses</p>
                  {editingUser.enrolledCourses.length === 0
                    ? <p className="text-sm text-gray-400 py-4 text-center">No courses enrolled.</p>
                    : editingUser.enrolledCourses.map(courseId => {
                        const course = courses.find(c => c.id === courseId);
                        if (!course) return null;
                        return (
                          <div key={courseId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                            <img src={course.imageUrl} alt={course.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                              <p className="text-xs text-gray-500">{course.instructor}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium shrink-0">Enrolled</span>
                          </div>
                        );
                      })
                  }
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Enroll in Additional Course</p>
                    <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                      <option value="">— Select a course —</option>
                      {courses.filter(c => !editingUser.enrolledCourses.includes(c.id)).map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {editUserTab === 'detail' && (
                  <button onClick={() => setEditUserTab('enrollment')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5">
                    Next: Enrollment <ChevronRight className="size-4" />
                  </button>
                )}
                {editUserTab === 'enrollment' && (
                  <button onClick={() => setEditUserTab('detail')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                    ← Back
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEditUserModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  disabled={!editUserForm.name.trim() || !editUserForm.email.trim() || !editUserForm.company.trim()}
                  onClick={() => {
                    alert(`User "${editUserForm.name}" has been updated successfully!`);
                    setShowEditUserModal(false);
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  <Edit className="size-4" /> Save Changes
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Bulk Action Modals ── */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* ── Import Users ── */}
            {bulkModal === 'import' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Upload className="size-5 text-blue-600" /></div>
                    <div><h2 className="text-lg font-semibold text-gray-900">Import Users</h2><p className="text-xs text-gray-500">Upload a CSV file to bulk-add users</p></div>
                  </div>
                  <button onClick={() => setBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="size-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">{bulkImportFile ? bulkImportFile.name : 'Click to upload CSV'}</span>
                    <span className="text-xs text-gray-400 mt-1">Columns: name, email, role, company</span>
                    <input type="file" className="hidden" accept=".csv" onChange={e => setBulkImportFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <a href="#" className="flex items-center gap-2 text-xs text-blue-600 hover:underline"><Download className="size-3.5" /> Download CSV template</a>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setBulkModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button disabled={!bulkImportFile} onClick={() => { alert(`Importing users from "${bulkImportFile?.name}"…`); setBulkModal(null); setBulkImportFile(null); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Upload className="size-4" /> Import Users
                  </button>
                </div>
              </>
            )}

            {/* ── Enroll Users ── */}
            {bulkModal === 'enroll' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center"><BookMarked className="size-5 text-teal-600" /></div>
                    <div><h2 className="text-lg font-semibold text-gray-900">Enroll Users</h2><p className="text-xs text-gray-500">Enroll a group of users into a course</p></div>
                  </div>
                  <button onClick={() => setBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                    <select value={bulkCourse} onChange={e => setBulkCourse(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="">— Choose a course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Emails <span className="text-gray-400 font-normal">(one per line)</span></label>
                    <textarea value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} rows={5}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                      placeholder={"user1@example.com\nuser2@example.com"} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setBulkModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button disabled={!bulkCourse || !bulkEmails.trim()} onClick={() => { alert(`Enrolling users into course…`); setBulkModal(null); setBulkEmails(''); setBulkCourse(''); }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <BookMarked className="size-4" /> Enroll Users
                  </button>
                </div>
              </>
            )}

            {/* ── Import & Enroll Users ── */}
            {bulkModal === 'import-enroll' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center"><BookMarked className="size-5 text-indigo-600" /></div>
                    <div><h2 className="text-lg font-semibold text-gray-900">Import & Enroll Users</h2><p className="text-xs text-gray-500">Upload a CSV and enroll into a course in one step</p></div>
                  </div>
                  <button onClick={() => setBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                    <select value={bulkCourse} onChange={e => setBulkCourse(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">— Choose a course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                    <Upload className="size-7 text-gray-400 mb-1" />
                    <span className="text-sm font-medium text-gray-600">{bulkImportFile ? bulkImportFile.name : 'Click to upload CSV'}</span>
                    <input type="file" className="hidden" accept=".csv" onChange={e => setBulkImportFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setBulkModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button disabled={!bulkCourse || !bulkImportFile} onClick={() => { alert(`Importing and enrolling users…`); setBulkModal(null); setBulkImportFile(null); setBulkCourse(''); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Upload className="size-4" /> Import & Enroll
                  </button>
                </div>
              </>
            )}

            {/* ── Tag Users ── */}
            {bulkModal === 'tag' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center"><Tag className="size-5 text-violet-600" /></div>
                    <div><h2 className="text-lg font-semibold text-gray-900">Tag Users</h2><p className="text-xs text-gray-500">Apply a tag to multiple users at once</p></div>
                  </div>
                  <button onClick={() => setBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                    <input type="text" value={bulkTag} onChange={e => setBulkTag(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      placeholder="e.g. VIP, Onboarding, Needs Follow-up" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Emails <span className="text-gray-400 font-normal">(one per line)</span></label>
                    <textarea value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} rows={5}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                      placeholder={"user1@example.com\nuser2@example.com"} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setBulkModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button disabled={!bulkTag.trim() || !bulkEmails.trim()} onClick={() => { alert(`Tag "${bulkTag}" applied to users.`); setBulkModal(null); setBulkTag(''); setBulkEmails(''); }}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Tag className="size-4" /> Apply Tag
                  </button>
                </div>
              </>
            )}

            {/* ── Unenroll Users ── */}
            {bulkModal === 'unenroll' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center"><BookX className="size-5 text-orange-600" /></div>
                    <div><h2 className="text-lg font-semibold text-gray-900">Unenroll Users</h2><p className="text-xs text-gray-500">Remove users from a course</p></div>
                  </div>
                  <button onClick={() => setBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                    <select value={bulkCourse} onChange={e => setBulkCourse(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                      <option value="">— Choose a course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Emails <span className="text-gray-400 font-normal">(one per line)</span></label>
                    <textarea value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                      placeholder={"user1@example.com\nuser2@example.com"} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setBulkModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button disabled={!bulkCourse || !bulkEmails.trim()} onClick={() => { alert(`Users unenrolled from course.`); setBulkModal(null); setBulkEmails(''); setBulkCourse(''); }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <BookX className="size-4" /> Unenroll Users
                  </button>
                </div>
              </>
            )}

            {/* ── Resend Activation ── */}
            {bulkModal === 'resend-activation' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center"><Bell className="size-5 text-yellow-600" /></div>
                    <div><h2 className="text-lg font-semibold text-gray-900">Resend Activation</h2><p className="text-xs text-gray-500">Re-send account activation emails</p></div>
                  </div>
                  <button onClick={() => setBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    An activation email will be sent to each address listed below. Only users who haven't yet activated their account will receive the email.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Emails <span className="text-gray-400 font-normal">(one per line)</span></label>
                    <textarea value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} rows={5}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                      placeholder={"user1@example.com\nuser2@example.com"} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setBulkModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button disabled={!bulkEmails.trim()} onClick={() => { alert(`Activation emails sent.`); setBulkModal(null); setBulkEmails(''); }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Bell className="size-4" /> Send Activation
                  </button>
                </div>
              </>
            )}

            {/* ── Suspend Users ── */}
            {bulkModal === 'suspend' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><Ban className="size-5 text-red-500" /></div>
                    <div><h2 className="text-lg font-semibold text-gray-900">Suspend Users</h2><p className="text-xs text-gray-500">Block access for multiple users</p></div>
                  </div>
                  <button onClick={() => setBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    Suspended users will immediately lose access to the platform. Their data and progress will be preserved.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Emails <span className="text-gray-400 font-normal">(one per line)</span></label>
                    <textarea value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} rows={5}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                      placeholder={"user1@example.com\nuser2@example.com"} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setBulkModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button disabled={!bulkEmails.trim()} onClick={() => { alert(`Users suspended.`); setBulkModal(null); setBulkEmails(''); }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Ban className="size-4" /> Suspend Users
                  </button>
                </div>
              </>
            )}

            {/* ── Delete Users ── */}
            {bulkModal === 'delete' && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="size-5 text-red-700" /></div>
                    <div><h2 className="text-lg font-semibold text-gray-900">Delete Users</h2><p className="text-xs text-red-500 font-medium">This action is permanent and cannot be undone</p></div>
                  </div>
                  <button onClick={() => setBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="size-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700 font-medium">
                    ⚠️ All user data, progress, and enrollments will be permanently deleted. This cannot be reversed.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Emails <span className="text-gray-400 font-normal">(one per line)</span></label>
                    <textarea value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                      placeholder={"user1@example.com\nuser2@example.com"} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="font-mono bg-red-100 px-1 rounded text-red-700">DELETE</span> to confirm</label>
                    <input type="text" value={bulkConfirmText} onChange={e => setBulkConfirmText(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="DELETE" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => { setBulkModal(null); setBulkConfirmText(''); setBulkEmails(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button disabled={bulkConfirmText !== 'DELETE' || !bulkEmails.trim()}
                    onClick={() => { alert(`Users permanently deleted.`); setBulkModal(null); setBulkEmails(''); setBulkConfirmText(''); }}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Trash2 className="size-4" /> Permanently Delete
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}