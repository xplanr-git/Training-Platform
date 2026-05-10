import { Building2, Users, BookOpen, TrendingUp, ArrowUpRight, Search, Filter, MoreVertical, Eye, AlertCircle, Ban, CheckCircle, LogOut, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { suspendedCompaniesStore } from '@/app/utils/suspendedCompanies';
import { signout } from '@/app/utils/auth';
import { supabase } from '/utils/supabase/client';

interface Company {
  id: string;
  name: string;
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  completionRate: number;
  avgProgress: number;
  joinedDate: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'trial' | 'suspended';
  isSuspended?: boolean;
}

interface PlatformAdminDashboardProps {
  onViewCompany: (companyId: string) => void;
  onManageAdmins: () => void;
  onLogout: () => void;
  onManageRoles?: () => void;
}

export function PlatformAdminDashboard({ onViewCompany, onManageAdmins, onLogout, onManageRoles }: PlatformAdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'trial' | 'suspended'>('all');
  const [confirmSuspend, setConfirmSuspend] = useState<{ companyId: string; companyName: string; isSuspended: boolean } | null>(null);
  const [companiesData, setCompaniesData] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies from backend
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query profiles table directly — no edge function needed.
        // Group by company to build the companies list.
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, company, role, created_at');

        if (profilesError) throw new Error(profilesError.message);

        // Aggregate profiles into companies
        const companyMap = new Map<string, {
          id: string;
          name: string;
          users: typeof profiles;
          createdAt: string;
        }>();

        for (const profile of profiles ?? []) {
          const companyName = profile.company || 'Unknown';
          const companyId = companyName.toLowerCase().replace(/\s+/g, '-');

          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              id: companyId,
              name: companyName,
              users: [],
              createdAt: profile.created_at,
            });
          }
          companyMap.get(companyId)!.users.push(profile);
        }

        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        const derived: Company[] = Array.from(companyMap.values()).map(c => {
          const totalUsers = c.users.length;
          const activeUsers = c.users.filter(
            u => new Date(u.created_at).getTime() > thirtyDaysAgo
          ).length;

          const daysSince = Math.floor(
            (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );

          let lastActive = 'Today';
          if (daysSince === 1) lastActive = '1 day ago';
          else if (daysSince < 7) lastActive = `${daysSince} days ago`;
          else if (daysSince < 30) lastActive = `${Math.floor(daysSince / 7)} weeks ago`;
          else lastActive = `${Math.floor(daysSince / 30)} months ago`;

          let status: Company['status'] = 'active';
          if (totalUsers === 0) status = 'inactive';
          else if (daysSince < 30) status = 'trial';

          const isSuspended = suspendedCompaniesStore.isCompanySuspended(c.name);

          return {
            id: c.id,
            name: c.name,
            totalUsers,
            activeUsers,
            totalCourses: 0,      // extend later via courses table
            completionRate: 0,
            avgProgress: 0,
            joinedDate: c.createdAt,
            lastActive,
            status: isSuspended ? 'suspended' : status,
            isSuspended,
          };
        });

        setCompaniesData(derived);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError(err instanceof Error ? err.message : 'Failed to load companies');
        setCompaniesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleToggleSuspension = (companyId: string) => {
    const company = companiesData.find(c => c.id === companyId);
    if (company) {
      setConfirmSuspend({
        companyId: company.id,
        companyName: company.name,
        isSuspended: !!company.isSuspended,
      });
    }
  };

  const confirmToggleSuspension = () => {
    if (!confirmSuspend) return;

    setCompaniesData(prevCompanies =>
      prevCompanies.map(company => {
        if (company.id === confirmSuspend.companyId) {
          const newIsSuspended = !company.isSuspended;
          
          // Update localStorage
          if (newIsSuspended) {
            suspendedCompaniesStore.suspendCompany(company.id, company.name, 'curtis@outdure.com');
          } else {
            suspendedCompaniesStore.unsuspendCompany(company.id);
          }
          
          return {
            ...company,
            isSuspended: newIsSuspended,
            status: newIsSuspended ? 'suspended' : 'active',
          };
        }
        return company;
      })
    );

    setConfirmSuspend(null);
  };

  // Calculate platform-wide stats
  const totalCompanies = companiesData.length;
  const totalUsers = companiesData.reduce((sum, c) => sum + c.totalUsers, 0);
  const totalActiveUsers = companiesData.reduce((sum, c) => sum + c.activeUsers, 0);
  const totalCourses = companiesData.reduce((sum, c) => sum + c.totalCourses, 0);
  const avgCompletionRate = companiesData.length > 0 
    ? Math.round(companiesData.reduce((sum, c) => sum + c.completionRate, 0) / companiesData.length)
    : 0;
  const userEngagementRate = totalUsers > 0 
    ? Math.round((totalActiveUsers / totalUsers) * 100)
    : 0;

  // Filter companies
  const filteredCompanies = companiesData.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
      case 'trial':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Trial</span>;
      case 'suspended':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Suspended</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all businesses using Teachly</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onManageAdmins}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Manage Admins
            </button>
            {onManageRoles && (
              <button
                onClick={onManageRoles}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <Shield className="size-4" />
                Roles & Permissions
              </button>
            )}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading companies...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-6 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Failed to load companies</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!isLoading && (
          <>
            {/* Platform-Wide Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 font-medium">Total Companies</p>
                  <Building2 className="size-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalCompanies}</p>
                <p className="text-xs text-gray-500 mt-1">Active businesses</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 font-medium">Total Users</p>
                  <Users className="size-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">{totalActiveUsers} active users</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-purple-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 font-medium">Total Courses</p>
                  <BookOpen className="size-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
                <p className="text-xs text-gray-500 mt-1">Across all companies</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-orange-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 font-medium">Avg Completion</p>
                  <TrendingUp className="size-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{avgCompletionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Platform average</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-pink-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 font-medium">User Engagement</p>
                  <ArrowUpRight className="size-5 text-pink-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{userEngagementRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Active user rate</p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="size-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Companies Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Courses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="size-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {company.name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                              <p className="text-xs text-gray-500">Joined {new Date(company.joinedDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{company.totalUsers}</div>
                          <div className="text-xs text-gray-500">{company.activeUsers} active</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{company.totalCourses}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{company.lastActive}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(company.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onViewCompany(company.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="size-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleToggleSuspension(company.id)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                company.isSuspended
                                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              }`}
                            >
                              {company.isSuspended ? (
                                <>
                                  <CheckCircle className="size-4" />
                                  Unsuspend
                                </>
                              ) : (
                                <>
                                  <Ban className="size-4" />
                                  Suspend
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="size-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No companies found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmSuspend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              {confirmSuspend.isSuspended ? (
                <div className="size-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="size-6 text-green-600" />
                </div>
              ) : (
                <div className="size-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Ban className="size-6 text-red-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmSuspend.isSuspended ? 'Unsuspend Company' : 'Suspend Company'}
                </h3>
                <p className="text-sm text-gray-600">
                  {confirmSuspend.companyName}
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {confirmSuspend.isSuspended ? (
                <>
                  Are you sure you want to <strong>unsuspend</strong> this company? All users from <strong>{confirmSuspend.companyName}</strong> will be able to log in and access their courses again.
                </>
              ) : (
                <>
                  Are you sure you want to <strong>suspend</strong> this company? All users from <strong>{confirmSuspend.companyName}</strong> will be immediately logged out and unable to access the platform.
                </>
              )}
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmSuspend(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleSuspension}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  confirmSuspend.isSuspended
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {confirmSuspend.isSuspended ? 'Yes, Unsuspend' : 'Yes, Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}