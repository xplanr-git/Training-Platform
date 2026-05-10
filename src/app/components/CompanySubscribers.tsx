import { Building2, Users, BookOpen, TrendingUp, ChevronRight, Search, ChevronDown, ChevronUp, Shield, Mail, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { mockUsers } from '@/app/data/mockUsers';
import { User } from '@/app/types';

interface Company {
  id: string;
  name: string;
  adminEmail: string;
  employeeCount: number;
  coursesEnrolled: number;
  status: 'active' | 'inactive';
  joinDate: string;
}

interface ParentCompany {
  id: string;
  name: string;
  adminEmail: string;
  totalEmployees: number;
  totalCourses: number;
  status: 'active' | 'inactive';
  joinDate: string;
  subscriberCount: number;
  subscribers: Company[];
}

interface CompanySubscribersProps {
  onViewCompanyAdmin: (companyId: string) => void;
}

export function CompanySubscribers({ onViewCompanyAdmin }: CompanySubscribersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  // Mock data for company subscribers
  const parentCompanies: ParentCompany[] = [
    {
      id: 'outdure',
      name: 'Outdure (Parent Company)',
      adminEmail: 'abram.jamorabo@outdure.com',
      totalEmployees: 2,
      totalCourses: 0,
      status: 'active',
      joinDate: '2023-06-15',
      subscriberCount: 5,
      subscribers: [
        {
          id: 'tech-corp',
          name: 'TechCorp Solutions',
          adminEmail: 'admin@techcorp.com',
          employeeCount: 145,
          coursesEnrolled: 12,
          status: 'active',
          joinDate: '2024-01-15'
        },
        {
          id: 'global-industries',
          name: 'Global Industries Ltd',
          adminEmail: 'admin@globalind.com',
          employeeCount: 320,
          coursesEnrolled: 18,
          status: 'active',
          joinDate: '2024-02-20'
        },
        {
          id: 'innovate-startup',
          name: 'Innovate Startup Inc',
          adminEmail: 'admin@innovate.com',
          employeeCount: 45,
          coursesEnrolled: 8,
          status: 'active',
          joinDate: '2024-03-10'
        },
        {
          id: 'enterprise-solutions',
          name: 'Enterprise Solutions Group',
          adminEmail: 'admin@enterprise.com',
          employeeCount: 500,
          coursesEnrolled: 25,
          status: 'active',
          joinDate: '2023-11-05'
        },
        {
          id: 'digital-services',
          name: 'Digital Services Co',
          adminEmail: 'admin@digitalserv.com',
          employeeCount: 89,
          coursesEnrolled: 10,
          status: 'inactive',
          joinDate: '2024-04-18'
        }
      ]
    },
    {
      id: 'tech-corp',
      name: 'TechCorp Solutions',
      adminEmail: 'admin@techcorp.com',
      totalEmployees: 145,
      totalCourses: 12,
      status: 'active',
      joinDate: '2024-01-15',
      subscriberCount: 0,
      subscribers: []
    },
    {
      id: 'global-industries',
      name: 'Global Industries Ltd',
      adminEmail: 'admin@globalind.com',
      totalEmployees: 320,
      totalCourses: 18,
      status: 'active',
      joinDate: '2024-02-20',
      subscriberCount: 0,
      subscribers: []
    },
    {
      id: 'innovate-startup',
      name: 'Innovate Startup Inc',
      adminEmail: 'admin@innovate.com',
      totalEmployees: 45,
      totalCourses: 8,
      status: 'active',
      joinDate: '2024-03-10',
      subscriberCount: 0,
      subscribers: []
    },
    {
      id: 'enterprise-solutions',
      name: 'Enterprise Solutions Group',
      adminEmail: 'admin@enterprise.com',
      totalEmployees: 500,
      totalCourses: 25,
      status: 'active',
      joinDate: '2023-11-05',
      subscriberCount: 0,
      subscribers: []
    },
    {
      id: 'digital-services',
      name: 'Digital Services Co',
      adminEmail: 'admin@digitalserv.com',
      totalEmployees: 89,
      totalCourses: 10,
      status: 'inactive',
      joinDate: '2024-04-18',
      subscriberCount: 0,
      subscribers: []
    }
  ];

  // Get employees for a specific company
  const getCompanyEmployees = (companyName: string): User[] => {
    return mockUsers.filter(user => user.company.toLowerCase() === companyName.toLowerCase());
  };

  const toggleCompanyExpansion = (companyId: string) => {
    setExpandedParent(expandedParent === companyId ? null : companyId);
  };

  const filteredCompanies = parentCompanies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.adminEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Subscribers</h1>
        <p className="text-gray-600">Manage and access company subscriber admin dashboards</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="size-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Companies</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{parentCompanies.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="size-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Employees</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {parentCompanies.reduce((sum, c) => sum + c.totalEmployees, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="size-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Course Enrollments</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {parentCompanies.reduce((sum, c) => sum + c.totalCourses, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-100 rounded-lg">
              <TrendingUp className="size-5 text-teal-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Active Companies</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {parentCompanies.filter(c => c.status === 'active').length}
          </p>
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">All Companies</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredCompanies.map((company) => {
            const companyEmployees = getCompanyEmployees(company.name);
            const isExpanded = expandedParent === company.id;
            
            return (
            <div
              key={company.id}
              className="transition-colors"
            >
              <div className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="size-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          company.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {company.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{company.adminEmail}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="size-4" />
                        {company.totalEmployees} employees
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="size-4" />
                        {company.totalCourses} courses
                      </span>
                      <span>Joined {new Date(company.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onViewCompanyAdmin(company.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="font-medium">View Admin Dashboard</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
              </div>

              {/* Expandable Employee List */}
              {isExpanded && (
                <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Employees ({companyEmployees.length})
                    </h4>
                    {companyEmployees.length > 0 ? (
                      <div className="space-y-2">
                        {companyEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium text-gray-900">{employee.name}</h5>
                                  {employee.role && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                      {employee.role}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Mail className="size-3.5" />
                                    {employee.email}
                                  </div>
                                  {employee.position && (
                                    <div className="flex items-center gap-1">
                                      <Briefcase className="size-3.5" />
                                      {employee.position}
                                    </div>
                                  )}
                                  {employee.yearsInCompany !== undefined && (
                                    <span className="text-gray-500">
                                      • {employee.yearsInCompany === 0.5 ? '6 months' : `${employee.yearsInCompany} ${employee.yearsInCompany === 1 ? 'yr' : 'yrs'}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Users className="size-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No employees found for this company</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="size-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}