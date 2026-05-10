import { FileText, Plus, Edit, Trash2, Eye, Calendar, User } from 'lucide-react';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

interface WebsiteBlogPageProps {
  companyName?: string;
  companyId?: string | null;
}

export function WebsiteBlogPage({ companyName, companyId }: WebsiteBlogPageProps) {
  const isParentCompany = !companyId;
  const displayName = isParentCompany ? 'Outdure Edge (Parent Company)' : companyName;
  const [showLearnMore, setShowLearnMore] = useState(false);
  
  const blogPosts = [
    {
      id: 1,
      title: 'Getting Started with Outdure Edge',
      author: 'Admin Team',
      date: '2024-01-15',
      status: 'Published',
      views: 1243,
    },
    {
      id: 2,
      title: 'Top 10 Training Tips for Remote Teams',
      author: 'Sarah Johnson',
      date: '2024-01-10',
      status: 'Published',
      views: 856,
    },
    {
      id: 3,
      title: 'Upcoming Platform Features',
      author: 'Product Team',
      date: '2024-01-08',
      status: 'Draft',
      views: 0,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
            <button 
              onClick={() => setShowLearnMore(!showLearnMore)}
              className="hover:bg-blue-50 rounded-full p-1 transition-colors"
              title="Learn more about Blog Management"
            >
              <Info className="size-3.5 text-blue-600 cursor-pointer" />
            </button>
          </div>
          <p className="text-gray-600">Create and manage blog posts for {displayName}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="size-5" />
          New Post
        </button>
      </div>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLearnMore(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
              <button 
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowLearnMore(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                The Blog Management tool allows you to create, edit, and publish blog content to engage with your audience and share updates about your training programs, industry insights, and company news.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Features:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Rich text editor with formatting options</li>
                  <li>Schedule posts for future publication</li>
                  <li>Add featured images and media to your posts</li>
                  <li>Organize content with categories and tags</li>
                  <li>SEO optimization tools for better search visibility</li>
                  <li>Draft, publish, or archive posts</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>Tip:</strong> Regular blog posts improve your site's SEO and help establish your company as a thought leader in your industry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company Context Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Managing Blog:</span>
          <span className="text-blue-600">{displayName}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="size-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Total Posts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Eye className="size-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Published</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">2</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Edit className="size-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-600">Drafts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">1</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <User className="size-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">2,099</p>
        </div>
      </div>

      {/* Blog Posts Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Author</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Views</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blogPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{post.author}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="size-4" />
                      {post.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'Published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{post.views.toLocaleString()}</td>
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

      {/* Blog Settings */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Blog Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posts per page
            </label>
            <input
              type="number"
              defaultValue={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Enable comments on blog posts</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Show author information</span>
            </label>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}