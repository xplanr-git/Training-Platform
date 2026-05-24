import { ArrowLeft, Users, Settings, Plus, Search, X, Mail, Tag, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { User } from '@/app/types';

interface RolesPermissionsPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  currentUser?: User | null;
  companyId?: string | null;
  users?: User[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const ROLES: Role[] = [
  { id: 'company-admin',  name: 'Company Admin',    description: 'Full control over company instance and all sub-roles',       permissions: ['All Permissions'] },
  { id: 'developer',      name: 'Developer',         description: 'Technical role with course creation and editing capabilities', permissions: ['Create Courses', 'Edit Courses', 'View Analytics'] },
  { id: 'sales-manager',  name: 'Sales Manager',     description: 'View business analytics and sales metrics',                    permissions: ['View Analytics', 'Export Reports'] },
  { id: 'user-manager',   name: 'User Manager',      description: 'Manage employee accounts and enrollments',                     permissions: ['Manage Users', 'Enroll Users', 'View Progress'] },
  { id: 'instructor',     name: 'Instructor',         description: 'Create and manage courses and lessons',                        permissions: ['Create Courses', 'Edit Courses', 'Manage Content', 'View Course Analytics'] },
  { id: 'user',           name: 'User (Employee)',    description: 'Regular employee with course access',                          permissions: ['Take Courses', 'View Progress', 'Download Certificates'] },
];

const ROLE_COLORS: Record<string, string> = {
  'company-admin': 'bg-blue-100 text-blue-700',
  'developer':     'bg-green-100 text-green-700',
  'sales-manager': 'bg-violet-100 text-violet-700',
  'user-manager':  'bg-orange-100 text-orange-700',
  'instructor':    'bg-teal-100 text-teal-700',
  'user':          'bg-gray-100 text-gray-700',
  'manager':       'bg-yellow-100 text-yellow-700',
  'parent admin':  'bg-purple-100 text-purple-700',
  'employee':      'bg-gray-100 text-gray-600',
};

const availableTags = ['Homeowner', 'Contractor', 'Installer', 'Architect', 'Engineer', 'Project Manager', 'Supplier', 'Consultant', 'Trainee', 'Executive'];

const defaultCustomRoleForm = {
  name: '', email: '', company: '', position: '',
  role: 'user' as string, description: '',
  tags: [] as string[], emailConsent: false, validationRules: true,
};

export function RolesPermissionsPage({ onBack, onNavigate, currentUser, companyId, users = [] }: RolesPermissionsPageProps) {
  // Filter states
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterDate, setFilterDate]       = useState('all');
  const [filterRole, setFilterRole]       = useState('all');
  const [filterStatus, setFilterStatus]   = useState('all');

  // Add Custom Role modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm]                 = useState(defaultCustomRoleForm);

  // Inline role editing for user rows
  const [userRoles, setUserRoles]               = useState<Record<string, string>>({});
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

  // Pagination
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const resetForm = () => setForm(defaultCustomRoleForm);
  const closeModal = () => { setShowAddModal(false); resetForm(); };

  const getUserRole = (user: User) => userRoles[user.id] ?? user.role ?? 'Employee';

  const handleRoleChange = (userId: string, newRole: string) => {
    setUserRoles(prev => ({ ...prev, [userId]: newRole }));
    setOpenRoleDropdown(null);
  };

  // Derive distinct roles that actually exist among the users (including any overrides)
  const distinctRoles = useMemo(() => {
    const seen = new Set<string>();
    users.forEach(u => seen.add(getUserRole(u)));
    return Array.from(seen).sort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, userRoles]);

  // Build the role filter options dynamically from real data
  const roleFilterOptions: [string, string][] = [
    ['all', 'All Roles'],
    ...distinctRoles.map(r => [r, r] as [string, string]),
  ];

  // Filtered users — reacts to all filter controls
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const role = getUserRole(user);

      // Search: name, email, company
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hit = user.name.toLowerCase().includes(q)
          || user.email.toLowerCase().includes(q)
          || user.company.toLowerCase().includes(q)
          || role.toLowerCase().includes(q);
        if (!hit) return false;
      }

      // Role filter — value is the role name directly
      if (filterRole !== 'all') {
        if (role.toLowerCase() !== filterRole.toLowerCase()) return false;
      }

      // Status filter — treat users with enrolledCourses > 0 as active
      if (filterStatus === 'active'   && user.enrolledCourses.length === 0) return false;
      if (filterStatus === 'inactive' && user.enrolledCourses.length  >  0) return false;

      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchQuery, filterRole, filterStatus, userRoles]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  // Reset page when filters change
  const updateFilter = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setCurrentPage(1); };

  const handleBack = () => { if (onBack) onBack(); else if (onNavigate) onNavigate('admin'); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="size-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-1">Configure user roles and their permissions across the platform</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus className="size-5" />
            Add Custom Role
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text" placeholder="Search by name, email or company…" value={searchQuery}
                onChange={e => updateFilter(setSearchQuery)(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button onClick={() => updateFilter(setSearchQuery)('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {[
              { value: filterProduct, set: updateFilter(setFilterProduct), options: [['all','All Products'],['lms','LMS'],['analytics','Analytics'],['content','Content']], min: 'min-w-[130px]' },
              { value: filterDate,    set: updateFilter(setFilterDate),    options: [['all','All Dates'],['today','Today'],['this-week','This Week'],['this-month','This Month'],['last-3-months','Last 3 Months']], min: 'min-w-[130px]' },
              { value: filterRole,    set: updateFilter(setFilterRole),    options: roleFilterOptions, min: 'min-w-[130px]' },
              { value: filterStatus,  set: updateFilter(setFilterStatus),  options: [['all','All Statuses'],['active','Active'],['inactive','Inactive']], min: 'min-w-[120px]' },
            ].map(({ value, set, options, min }, i) => (
              <select key={i} value={value} onChange={e => set(e.target.value)}
                className={`px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-700 ${min}`}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
            {(searchQuery || filterProduct !== 'all' || filterDate !== 'all' || filterRole !== 'all' || filterStatus !== 'all') && (
              <button onClick={() => { updateFilter(setSearchQuery)(''); updateFilter(setFilterProduct)('all'); updateFilter(setFilterDate)('all'); updateFilter(setFilterRole)('all'); updateFilter(setFilterStatus)('all'); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="size-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Manage Roles — Users Table ── */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Manage Roles</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Configure permissions for each role type</p>
          </div>

          {/* ── Users in this Company ── */}
          {users.length > 0 && (
            <>
              {/* Sub-header with result count */}
              <div className="px-6 py-3 bg-gray-50 border-t border-b border-gray-200 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Users &amp; Their Roles</p>
                <p className="text-xs text-gray-400">{filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found</p>
              </div>

              {/* Click-outside overlay for dropdowns */}
              {openRoleDropdown && (
                <div className="fixed inset-0 z-10" onClick={() => setOpenRoleDropdown(null)} />
              )}

              {/* User rows */}
              {pagedUsers.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-gray-400">No users match the current filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pagedUsers.map(user => {
                    const currentRole = getUserRole(user);
                    const chipColor   = ROLE_COLORS[currentRole.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
                    const isOpen      = openRoleDropdown === user.id;

                    return (
                      <div key={user.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Name / email */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>

                        {/* Company */}
                        <p className="text-xs text-gray-400 hidden sm:block truncate max-w-[160px]">{user.company}</p>

                        {/* Role dropdown */}
                        <div className="relative shrink-0">
                          <button
                            onClick={() => setOpenRoleDropdown(isOpen ? null : user.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-transparent border transition-colors ${chipColor} hover:opacity-80`}
                          >
                            {currentRole}
                            <ChevronDown className="size-3" />
                          </button>

                          {isOpen && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                              {ROLES.map(r => (
                                <button
                                  key={r.id}
                                  onClick={() => handleRoleChange(user.id, r.name)}
                                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <span className={`px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[r.id] ?? 'bg-gray-100 text-gray-600'}`}>{r.name}</span>
                                  {currentRole === r.name && <Check className="size-3.5 text-blue-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage === 1}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                      .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '…' ? (
                          <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-gray-400">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => goToPage(p as number)}
                            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                              safePage === p
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage === totalPages}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="size-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Configuration Coming Soon</h3>
              <p className="text-sm text-gray-700 mt-1">
                Role permission management will be available in a future update. You'll be able to customize permissions,
                create custom roles, and configure access levels for each role type.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Custom Role Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
                  <Plus className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Custom Role</h2>
                  <p className="text-xs text-gray-500">Define a new role with custom settings</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="size-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-7">

              {/* 1 — User Details */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">1</div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">User Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Enter full name"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="user@company.com"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                      <input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        placeholder="Company name"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Position / Job Title</label>
                      <input type="text" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                        placeholder="e.g. Senior Developer"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 2 — User Role */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">2</div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">User Role</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign Role <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ROLES.map(r => (
                        <button key={r.id} type="button" onClick={() => setForm(f => ({ ...f, role: r.id }))}
                          className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                            form.role === r.id
                              ? `${ROLE_COLORS[r.id] ?? 'bg-gray-100 text-gray-700'} ring-2 ring-offset-1 ring-blue-400 border-transparent`
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                          }`}>
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={2} placeholder="Describe what this custom role can do…"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </div>
              </section>

              {/* 3 — User Tags */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">3</div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">User Tags</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">Select all tags that apply to this role</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const selected = form.tags.includes(tag);
                    return (
                      <button key={tag} type="button"
                        onClick={() => setForm(f => ({ ...f, tags: selected ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                        }`}>
                        {selected && <Tag className="size-3" />}{tag}
                      </button>
                    );
                  })}
                </div>
                {form.tags.length > 0 && <p className="mt-2 text-xs text-gray-400">Selected: {form.tags.join(', ')}</p>}
              </section>

              {/* 4 — Email Consent */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">4</div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Email Consent</h3>
                </div>
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Allow Promotional Emails</p>
                    <p className="text-xs text-gray-500 mt-0.5">The user has granted permission to receive promotional emails sent from within the school. Only enable if the user has explicitly consented.</p>
                  </div>
                  <div className="cursor-pointer shrink-0 mt-0.5" onClick={() => setForm(f => ({ ...f, emailConsent: !f.emailConsent }))}>
                    <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.emailConsent ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${form.emailConsent ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </div>
              </section>

              {/* 5 — Validation Rules */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">5</div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Validation Rules</h3>
                </div>
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Respect Field Validation Rules</p>
                    <p className="text-xs text-gray-500 mt-0.5">Enforce user field validation rules when creating this role. Disable only if you need to bypass required field checks for this entry.</p>
                  </div>
                  <div className="cursor-pointer shrink-0 mt-0.5" onClick={() => setForm(f => ({ ...f, validationRules: !f.validationRules }))}>
                    <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.validationRules ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${form.validationRules ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </div>
              </section>

            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={closeModal}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                disabled={!form.name.trim() || !form.email.trim()}
                onClick={() => { alert(`Custom role created for "${form.name}" with role: ${ROLES.find(r => r.id === form.role)?.name}`); closeModal(); }}
                className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                <Plus className="size-4" /> Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
