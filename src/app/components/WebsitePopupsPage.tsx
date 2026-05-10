import { Maximize2, Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

interface WebsitePopupsPageProps {
  companyName?: string;
  companyId?: string | null;
}

export function WebsitePopupsPage({ companyName, companyId }: WebsitePopupsPageProps) {
  const isParentCompany = !companyId;
  const displayName = isParentCompany ? 'Outdure Edge (Parent Company)' : companyName;
  const [showLearnMore, setShowLearnMore] = useState(false);
  
  const popups = [
    {
      id: 1,
      name: 'Welcome New Visitors',
      type: 'Welcome',
      trigger: 'Page Load (5s delay)',
      active: true,
      conversions: 234,
    },
    {
      id: 2,
      name: 'Course Discount Offer',
      type: 'Promotional',
      trigger: 'Exit Intent',
      active: true,
      conversions: 156,
    },
    {
      id: 3,
      name: 'Newsletter Signup',
      type: 'Email Capture',
      trigger: 'Scroll 50%',
      active: false,
      conversions: 89,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Popup Management</h1>
            <button 
              onClick={() => setShowLearnMore(!showLearnMore)}
              className="hover:bg-blue-50 rounded-full p-1 transition-colors"
              title="Learn more about Popup Management"
            >
              <Info className="size-3.5 text-blue-600 cursor-pointer" />
            </button>
          </div>
          <p className="text-gray-600">Create and manage popups for {displayName}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="size-5" />
          Create Popup
        </button>
      </div>

      {/* Company Context Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Maximize2 className="size-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Managing Popups:</span>
          <span className="text-blue-600">{displayName}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Maximize2 className="size-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Total Popups</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <ToggleRight className="size-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Active Popups</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">2</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Eye className="size-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Total Conversions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">479</p>
        </div>
      </div>

      {/* Popups List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Trigger</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Conversions</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {popups.map((popup) => (
                <tr key={popup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Maximize2 className="size-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{popup.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {popup.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{popup.trigger}</td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-2">
                      {popup.active ? (
                        <ToggleRight className="size-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="size-6 text-gray-400" />
                      )}
                      <span className={popup.active ? 'text-green-600' : 'text-gray-400'}>
                        {popup.active ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{popup.conversions}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Eye className="size-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                        <Edit className="size-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Templates */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popup Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg h-32 mb-4 flex items-center justify-center">
              <span className="text-gray-400">Welcome Template</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Welcome Message</h3>
            <p className="text-sm text-gray-600 mb-4">Greet new visitors with a friendly message</p>
            <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Use Template
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg h-32 mb-4 flex items-center justify-center">
              <span className="text-gray-400">Discount Template</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Special Offer</h3>
            <p className="text-sm text-gray-600 mb-4">Promote discounts and special deals</p>
            <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Use Template
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg h-32 mb-4 flex items-center justify-center">
              <span className="text-gray-400">Email Template</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Capture</h3>
            <p className="text-sm text-gray-600 mb-4">Collect email addresses from visitors</p>
            <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Use Template
            </button>
          </div>
        </div>
      </div>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Popup Management</h2>
              <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setShowLearnMore(false)}>
                <X className="size-5" />
              </button>
            </div>
            <p className="text-gray-600">Popup Management allows you to create and manage popups for your website. Popups can be used to welcome new visitors, promote discounts, capture email addresses, and more.</p>
          </div>
        </div>
      )}
    </div>
  );
}