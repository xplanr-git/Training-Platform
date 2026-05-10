import { Layout, Check, Eye, Download } from 'lucide-react';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

interface WebsiteDesignTemplatePageProps {
  companyName?: string;
  companyId?: string | null;
}

export function WebsiteDesignTemplatePage({ companyName, companyId }: WebsiteDesignTemplatePageProps) {
  const isParentCompany = !companyId;
  const displayName = isParentCompany ? 'Outdure Edge (Parent Company)' : companyName;
  const [showLearnMore, setShowLearnMore] = useState(false);
  
  const templates = [
    {
      id: 1,
      name: 'Modern Professional',
      description: 'Clean and modern design perfect for corporate training platforms',
      preview: 'modern-corporate.jpg',
      active: true,
    },
    {
      id: 2,
      name: 'Creative Learning',
      description: 'Vibrant and engaging design for creative courses',
      preview: 'creative-learning.jpg',
      active: false,
    },
    {
      id: 3,
      name: 'Tech Academy',
      description: 'Minimalist tech-focused design for IT training',
      preview: 'tech-academy.jpg',
      active: false,
    },
    {
      id: 4,
      name: 'Classic Education',
      description: 'Traditional academic style for professional development',
      preview: 'classic-education.jpg',
      active: false,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Design Templates</h1>
          <button 
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="hover:bg-blue-50 rounded-full p-1 transition-colors"
            title="Learn more about Design Templates"
          >
            <Info className="size-3.5 text-blue-600 cursor-pointer" />
          </button>
        </div>
        <p className="text-gray-600">
          Choose a template to customize {displayName}'s website appearance
        </p>
      </div>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLearnMore(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Design Templates</h2>
              <button 
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowLearnMore(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                Design Templates provide pre-built website layouts that you can customize to match your brand. Each template includes professional design elements, color schemes, and layout structures.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Features:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Multiple professionally designed templates to choose from</li>
                  <li>Preview templates before applying them to your site</li>
                  <li>Customizable colors, fonts, and layout options</li>
                  <li>Responsive designs that work on all devices</li>
                  <li>Easy one-click template switching</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>Tip:</strong> After selecting a template, use the Design Explorer to fine-tune colors, typography, and other design elements to perfectly match your brand.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company Context Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Layout className="size-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Managing Website:</span>
          <span className="text-blue-600">{displayName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-lg border-2 p-6 transition-all ${
              template.active
                ? 'border-blue-600 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Layout className="size-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  {template.active && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      <Check className="size-3" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{template.description}</p>

            <div className="bg-gray-100 h-48 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Template Preview</span>
            </div>

            <div className="flex gap-2">
              <button
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  template.active
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={template.active}
              >
                {template.active ? 'Current Template' : 'Activate'}
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Eye className="size-4" />
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Download className="size-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Custom Templates</h3>
            <p className="text-gray-600 text-sm">
              Want to create your own custom template? Contact our support team to discuss custom design options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}