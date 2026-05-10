import { useState } from 'react';
import { Building2, Mail, Phone, Users, Calendar, CheckCircle, XCircle, Eye, FileText, Clock, MapPin, Globe, DollarSign, Filter, Search, ArrowUpDown } from 'lucide-react';

interface CompanyApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  industry: string;
  companySize: string;
  expectedUsers: number;
  subscriptionPlan: 'Basic' | 'Professional' | 'Enterprise';
  message: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Mock data for pending applications
const mockApplications: CompanyApplication[] = [
  {
    id: 'app-001',
    companyName: 'TechCorp Solutions',
    contactName: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1 (555) 123-4567',
    website: 'www.techcorp.com',
    address: '123 Tech Street, San Francisco, CA 94105',
    industry: 'Technology',
    companySize: '50-200',
    expectedUsers: 150,
    subscriptionPlan: 'Professional',
    message: 'We are looking to onboard our entire engineering team for continuous learning and development.',
    appliedDate: '2026-01-25',
    status: 'pending'
  },
  {
    id: 'app-002',
    companyName: 'HealthPlus Medical',
    contactName: 'Dr. Michael Chen',
    email: 'michael.chen@healthplus.com',
    phone: '+1 (555) 234-5678',
    website: 'www.healthplus.com',
    address: '456 Medical Center Blvd, Boston, MA 02115',
    industry: 'Healthcare',
    companySize: '200-500',
    expectedUsers: 300,
    subscriptionPlan: 'Enterprise',
    message: 'Our medical staff needs ongoing training and certification programs. We require a robust platform with compliance tracking.',
    appliedDate: '2026-01-24',
    status: 'pending'
  },
  {
    id: 'app-003',
    companyName: 'Global Finance Group',
    contactName: 'Amanda Rodriguez',
    email: 'amanda.r@globalfinance.com',
    phone: '+1 (555) 345-6789',
    website: 'www.globalfinance.com',
    address: '789 Wall Street, New York, NY 10005',
    industry: 'Finance',
    companySize: '500+',
    expectedUsers: 500,
    subscriptionPlan: 'Enterprise',
    message: 'Looking for a comprehensive training platform for our financial advisors and support staff across multiple locations.',
    appliedDate: '2026-01-23',
    status: 'pending'
  },
  {
    id: 'app-004',
    companyName: 'GreenBuild Construction',
    contactName: 'Robert Taylor',
    email: 'rtaylor@greenbuild.com',
    phone: '+1 (555) 456-7890',
    address: '321 Construction Ave, Denver, CO 80202',
    industry: 'Construction',
    companySize: '20-50',
    expectedUsers: 45,
    subscriptionPlan: 'Basic',
    message: 'Need training platform for safety compliance and skills development for our construction teams.',
    appliedDate: '2026-01-22',
    status: 'pending'
  },
  {
    id: 'app-005',
    companyName: 'EduTech Innovations',
    contactName: 'Lisa Wang',
    email: 'lisa.wang@edutech.io',
    phone: '+1 (555) 567-8901',
    website: 'www.edutech.io',
    address: '555 Innovation Drive, Austin, TX 78701',
    industry: 'Education Technology',
    companySize: '50-200',
    expectedUsers: 120,
    subscriptionPlan: 'Professional',
    message: 'As an EdTech company, we want to provide professional development opportunities for our team.',
    appliedDate: '2026-01-26',
    status: 'pending'
  },
];

interface ApprovalsPageProps {
  onBack?: () => void;
}

export function ApprovalsPage({ onBack }: ApprovalsPageProps) {
  const [applications, setApplications] = useState<CompanyApplication[]>(mockApplications);
  const [selectedApplication, setSelectedApplication] = useState<CompanyApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'users'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
      const matchesSearch = 
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.industry.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
      } else if (sortBy === 'company') {
        comparison = a.companyName.localeCompare(b.companyName);
      } else if (sortBy === 'users') {
        comparison = a.expectedUsers - b.expectedUsers;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleApprove = (applicationId: string) => {
    setApplications(applications.map(app => 
      app.id === applicationId 
        ? { ...app, status: 'approved' as const }
        : app
    ));
    setSelectedApplication(null);
  };

  const handleReject = (applicationId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setApplications(applications.map(app => 
      app.id === applicationId 
        ? { ...app, status: 'rejected' as const }
        : app
    ));
    setShowRejectModal(false);
    setSelectedApplication(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center gap-1"><Clock className="size-3" />Pending Review</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1"><CheckCircle className="size-3" />Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1"><XCircle className="size-3" />Rejected</span>;
      default:
        return null;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      'Basic': 'bg-gray-100 text-gray-800',
      'Professional': 'bg-blue-100 text-blue-800',
      'Enterprise': 'bg-purple-100 text-purple-800'
    };
    
    return <span className={`px-3 py-1 ${colors[plan as keyof typeof colors]} text-xs font-medium rounded-full`}>{plan}</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const toggleSort = (field: 'date' | 'company' | 'users') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const stats = {
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    total: applications.length
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Company Approvals</h1>
            <p className="text-gray-600 mt-1">Review and approve company applications to join the platform</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 text-sm font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
              </div>
              <Clock className="size-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="size-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 text-sm font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{stats.rejected}</p>
              </div>
              <XCircle className="size-8 text-red-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 text-sm font-medium">Total Applications</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="size-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name, contact, email, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
            <div className="col-span-3 flex items-center gap-2 cursor-pointer" onClick={() => toggleSort('company')}>
              <span>Company</span>
              <ArrowUpDown className="size-4" />
            </div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-2">Industry</div>
            <div className="col-span-1 flex items-center gap-2 cursor-pointer" onClick={() => toggleSort('users')}>
              <span>Users</span>
              <ArrowUpDown className="size-4" />
            </div>
            <div className="col-span-1">Plan</div>
            <div className="col-span-2 flex items-center gap-2 cursor-pointer" onClick={() => toggleSort('date')}>
              <span>Applied Date</span>
              <ArrowUpDown className="size-4" />
            </div>
            <div className="col-span-1 text-center">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {filteredApplications.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <FileText className="size-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No applications found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search query</p>
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div key={app.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="col-span-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{app.companyName}</p>
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{app.contactName}</p>
                    <p className="text-xs text-gray-500">{app.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-700">{app.industry}</p>
                    <p className="text-xs text-gray-500">{app.companySize} employees</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-gray-900">{app.expectedUsers}</p>
                  </div>
                  <div className="col-span-1">
                    {getPlanBadge(app.subscriptionPlan)}
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-700">{formatDate(app.appliedDate)}</p>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => setSelectedApplication(app)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="size-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedApplication.companyName}</h2>
                <p className="text-sm text-gray-600 mt-1">Application Details</p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="size-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {getStatusBadge(selectedApplication.status)}
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="size-5 text-blue-600" />
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Company Name</p>
                    <p className="font-medium text-gray-900">{selectedApplication.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-medium text-gray-900">{selectedApplication.industry}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Company Size</p>
                    <p className="font-medium text-gray-900">{selectedApplication.companySize} employees</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expected Users</p>
                    <p className="font-medium text-gray-900">{selectedApplication.expectedUsers} users</p>
                  </div>
                  {selectedApplication.website && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Globe className="size-4" />
                        Website
                      </p>
                      <a href={`https://${selectedApplication.website}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                        {selectedApplication.website}
                      </a>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="size-4" />
                      Address
                    </p>
                    <p className="font-medium text-gray-900">{selectedApplication.address}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="size-5 text-green-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Contact Name</p>
                    <p className="font-medium text-gray-900">{selectedApplication.contactName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="size-4" />
                      Email
                    </p>
                    <a href={`mailto:${selectedApplication.email}`} className="font-medium text-blue-600 hover:underline">
                      {selectedApplication.email}
                    </a>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="size-4" />
                      Phone
                    </p>
                    <p className="font-medium text-gray-900">{selectedApplication.phone}</p>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="size-5 text-purple-600" />
                  Subscription Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Requested Plan</p>
                      <p className="font-medium text-gray-900 mt-1">{selectedApplication.subscriptionPlan}</p>
                    </div>
                    {getPlanBadge(selectedApplication.subscriptionPlan)}
                  </div>
                </div>
              </div>

              {/* Application Message */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="size-5 text-orange-600" />
                  Message from Company
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">{selectedApplication.message}</p>
                </div>
              </div>

              {/* Application Date */}
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="size-4" />
                  Applied on {formatDate(selectedApplication.appliedDate)}
                </p>
              </div>
            </div>

            {/* Modal Footer - Action Buttons */}
            {selectedApplication.status === 'pending' && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  className="px-6 py-2.5 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                >
                  <XCircle className="size-5" />
                  Reject Application
                </button>
                <button
                  onClick={() => handleApprove(selectedApplication.id)}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <CheckCircle className="size-5" />
                  Approve Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Application</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting <strong>{selectedApplication.companyName}</strong>'s application.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedApplication.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
