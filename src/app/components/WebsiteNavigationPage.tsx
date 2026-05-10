import { Menu, Plus, Edit, Trash2, GripVertical, ChevronRight } from 'lucide-react';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

interface WebsiteNavigationPageProps {
  companyName?: string;
  companyId?: string | null;
}

export function WebsiteNavigationPage({ companyName, companyId }: WebsiteNavigationPageProps) {
  const isParentCompany = !companyId;
  const displayName = isParentCompany ? 'Outdure Edge (Parent Company)' : companyName;
  const [showLearnMore, setShowLearnMore] = useState(false);
  
  const mainMenuItems = [
    { id: 1, label: 'Home', url: '/', order: 1, visible: true },
    { id: 2, label: 'Courses', url: '/courses', order: 2, visible: true },
    { id: 3, label: 'About Us', url: '/about', order: 3, visible: true },
    { id: 4, label: 'Blog', url: '/blog', order: 4, visible: true },
    { id: 5, label: 'Contact', url: '/contact', order: 5, visible: true },
  ];

  const footerMenuItems = [
    { id: 1, label: 'Privacy Policy', url: '/privacy', visible: true },
    { id: 2, label: 'Terms of Service', url: '/terms', visible: true },
    { id: 3, label: 'Support', url: '/support', visible: true },
    { id: 4, label: 'FAQ', url: '/faq', visible: true },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Navigation Management</h1>
          <button 
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="hover:bg-blue-50 rounded-full p-1 transition-colors"
            title="Learn more about Navigation Management"
          >
            <Info className="size-3.5 text-blue-600 cursor-pointer" />
          </button>
        </div>
        <p className="text-gray-600">Configure {displayName}'s navigation menus</p>
      </div>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLearnMore(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Navigation Management</h2>
              <button 
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowLearnMore(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                Navigation Management lets you customize your website's menu structure, creating an intuitive browsing experience for your visitors. Build primary navigation, footer menus, and mobile navigation layouts.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Features:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Drag-and-drop menu item organization</li>
                  <li>Create nested dropdown menus and submenus</li>
                  <li>Customize menu labels and link destinations</li>
                  <li>Add custom links to external sites or resources</li>
                  <li>Separate configurations for header, footer, and mobile menus</li>
                  <li>Preview changes before publishing</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>Tip:</strong> Keep your main navigation simple with 5-7 items for the best user experience. Use dropdown menus to organize additional pages.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company Context Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Menu className="size-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Managing Navigation:</span>
          <span className="text-blue-600">{displayName}</span>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Menu className="size-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Main Navigation</h2>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="size-4" />
            Add Item
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            {mainMenuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <button className="cursor-move text-gray-400 hover:text-gray-600">
                  <GripVertical className="size-5" />
                </button>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-600">{item.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.visible} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <button className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors">
                    <Edit className="size-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation Menu */}
      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Menu className="size-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Footer Navigation</h2>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="size-4" />
            Add Item
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {footerMenuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-600">{item.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors">
                    <Edit className="size-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Navigation Style
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>Horizontal (Default)</option>
              <option>Vertical Sidebar</option>
              <option>Mega Menu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Menu Style
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option>Slide-in Drawer</option>
              <option>Full Screen Overlay</option>
              <option>Dropdown</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Show search icon in navigation</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm text-gray-700">Enable sticky navigation on scroll</span>
            </label>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Navigation Preview</h2>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="font-bold text-lg text-gray-900">{displayName}</div>
            <div className="flex items-center gap-6">
              {mainMenuItems.filter(item => item.visible).map((item) => (
                <div key={item.id} className="flex items-center gap-1 text-gray-700 hover:text-blue-600 cursor-pointer">
                  <span>{item.label}</span>
                  {item.id === 2 && <ChevronRight className="size-4" />}
                </div>
              ))}
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                Get Started
              </button>
            </div>
          </div>
          <div className="text-center text-gray-400 py-8">
            Website Content Area
          </div>
        </div>
      </div>
    </div>
  );
}