import { Compass, Palette, Type, Image, Layout } from 'lucide-react';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

interface WebsiteDesignExplorerPageProps {
  companyName?: string;
  companyId?: string | null;
}

export function WebsiteDesignExplorerPage({ companyName, companyId }: WebsiteDesignExplorerPageProps) {
  const isParentCompany = !companyId;
  const displayName = isParentCompany ? 'Outdure Edge (Parent Company)' : companyName;
  
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout' | 'images'>('colors');
  const [showLearnMore, setShowLearnMore] = useState(false);

  const colorPalettes = [
    { name: 'Primary', color: '#2563EB', usage: 'Buttons, links, active states' },
    { name: 'Secondary', color: '#10B981', usage: 'Success messages, badges' },
    { name: 'Accent', color: '#F59E0B', usage: 'Highlights, warnings' },
    { name: 'Background', color: '#F9FAFB', usage: 'Page backgrounds' },
  ];

  const typography = [
    { element: 'Headings', font: 'Inter', weight: 'Bold', size: '32px - 48px' },
    { element: 'Body Text', font: 'Inter', weight: 'Regular', size: '16px' },
    { element: 'Buttons', font: 'Inter', weight: 'Medium', size: '14px - 16px' },
    { element: 'Captions', font: 'Inter', weight: 'Regular', size: '12px - 14px' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Design Explorer</h1>
          <button 
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="hover:bg-blue-50 rounded-full p-1 transition-colors"
            title="Learn more about Design Explorer"
          >
            <Info className="size-3.5 text-blue-600 cursor-pointer" />
          </button>
        </div>
        <p className="text-gray-600">Explore and customize {displayName}'s design elements</p>
      </div>

      {/* Company Context Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Compass className="size-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Managing Website:</span>
          <span className="text-blue-600">{displayName}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'colors'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="size-5" />
            Colors
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'typography'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Type className="size-5" />
            Typography
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'layout'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layout className="size-5" />
            Layout
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'images'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Image className="size-5" />
            Images
          </button>
        </div>

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Color Palette</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorPalettes.map((palette) => (
                <div key={palette.name} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div
                      className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: palette.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{palette.name}</h3>
                      <p className="text-sm text-gray-600 font-mono">{palette.color}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{palette.usage}</p>
                </div>
              ))}
            </div>
            <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Customize Colors
            </button>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Typography System</h2>
            <div className="space-y-4">
              {typography.map((type) => (
                <div key={type.element} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{type.element}</h3>
                      <p className="text-sm text-gray-600">
                        {type.font} • {type.weight} • {type.size}
                      </p>
                    </div>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Layout Options</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Container Width</h3>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Full Width</option>
                  <option>Boxed (1200px)</option>
                  <option>Narrow (960px)</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Spacing Scale</h3>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>Default</option>
                  <option>Compact</option>
                  <option>Comfortable</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Image Settings</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Image Style</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="imageStyle" defaultChecked />
                    <span>Rounded Corners</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="imageStyle" />
                    <span>Sharp Corners</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="imageStyle" />
                    <span>Circular</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Compass className="size-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Preview Changes</h3>
            <p className="text-gray-600 text-sm mb-3">
              See how your design changes look on the live website before publishing.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Preview Website
            </button>
          </div>
        </div>
      </div>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Learn More About Design Explorer</h2>
              <button
                className="p-1.5 text-gray-500 hover:text-gray-700"
                onClick={() => setShowLearnMore(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-gray-600">
              The Design Explorer is a tool that allows you to customize the design elements of your website, such as colors, typography, layout, and images. You can preview your changes before publishing them to the live website.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}