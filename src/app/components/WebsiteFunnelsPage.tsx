import { GitBranch, Plus, Edit, Trash2, Eye, ArrowRight, MousePointer, ExternalLink, CheckCircle, GripVertical, Settings } from 'lucide-react';
import { Info, X } from 'lucide-react';
import { useState } from 'react';

interface WebsiteFunnelsPageProps {
  companyName?: string;
  companyId?: string | null;
}

interface FunnelStep {
  id: string;
  type: 'page' | 'action' | 'conversion';
  title: string;
  description: string;
  url?: string;
  actionType?: string;
}

interface Funnel {
  id: number;
  name: string;
  description: string;
  steps: FunnelStep[];
  active: boolean;
}

export function WebsiteFunnelsPage({ companyName, companyId }: WebsiteFunnelsPageProps) {
  const isParentCompany = !companyId;
  const displayName = isParentCompany ? 'Outdure Edge (Parent Company)' : companyName;
  
  const [selectedFunnel, setSelectedFunnel] = useState<number | null>(1);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [funnels] = useState<Funnel[]>([
    {
      id: 1,
      name: 'Course Enrollment Flow',
      description: 'Guide visitors from landing page to course enrollment',
      active: true,
      steps: [
        {
          id: 'step-1',
          type: 'page',
          title: 'Visit Site',
          description: 'User lands on homepage',
          url: '/'
        },
        {
          id: 'step-2',
          type: 'page',
          title: 'Read Landing Page',
          description: 'Browse courses and benefits',
          url: '/'
        },
        {
          id: 'step-3',
          type: 'action',
          title: 'Click "Start Learning"',
          description: 'User clicks CTA button',
          actionType: 'button_click'
        },
        {
          id: 'step-4',
          type: 'page',
          title: 'Sign Up Page',
          description: 'Fill out registration form',
          url: '/signup'
        },
        {
          id: 'step-5',
          type: 'action',
          title: 'Submit Registration',
          description: 'Complete account creation',
          actionType: 'form_submit'
        },
        {
          id: 'step-6',
          type: 'conversion',
          title: 'Enrollment Complete',
          description: 'User successfully enrolled',
          url: '/dashboard'
        }
      ]
    },
    {
      id: 2,
      name: 'Free Trial to Subscriber',
      description: 'Convert free trial users to paid subscribers',
      active: true,
      steps: [
        {
          id: 'step-1',
          type: 'page',
          title: 'Landing Page',
          description: 'View pricing and features',
          url: '/pricing'
        },
        {
          id: 'step-2',
          type: 'action',
          title: 'Click "Get Started"',
          description: 'Start free trial',
          actionType: 'button_click'
        },
        {
          id: 'step-3',
          type: 'page',
          title: 'Trial Dashboard',
          description: 'Explore platform features',
          url: '/dashboard'
        },
        {
          id: 'step-4',
          type: 'action',
          title: 'Upgrade to Pro',
          description: 'Choose subscription plan',
          actionType: 'button_click'
        },
        {
          id: 'step-5',
          type: 'conversion',
          title: 'Payment Complete',
          description: 'Successful subscription',
          url: '/welcome'
        }
      ]
    },
    {
      id: 3,
      name: 'Blog to Newsletter',
      description: 'Convert blog readers into newsletter subscribers',
      active: false,
      steps: [
        {
          id: 'step-1',
          type: 'page',
          title: 'Visit Blog Post',
          description: 'Read article content',
          url: '/blog/post'
        },
        {
          id: 'step-2',
          type: 'action',
          title: 'Scroll to Bottom',
          description: 'Reach newsletter form',
          actionType: 'scroll'
        },
        {
          id: 'step-3',
          type: 'action',
          title: 'Enter Email',
          description: 'Fill subscription form',
          actionType: 'form_input'
        },
        {
          id: 'step-4',
          type: 'conversion',
          title: 'Subscribed',
          description: 'Newsletter signup complete',
          url: '/thank-you'
        }
      ]
    }
  ]);

  const activeFunnel = funnels.find(f => f.id === selectedFunnel);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'page':
        return ExternalLink;
      case 'action':
        return MousePointer;
      case 'conversion':
        return CheckCircle;
      default:
        return ExternalLink;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'page':
        return 'blue';
      case 'action':
        return 'purple';
      case 'conversion':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Funnel Builder</h1>
            <button 
              onClick={() => setShowLearnMore(!showLearnMore)}
              className="hover:bg-blue-50 rounded-full p-1 transition-colors"
              title="Learn more about Funnel Builder"
            >
              <Info className="size-3.5 text-blue-600 cursor-pointer" />
            </button>
          </div>
          <p className="text-gray-600">Create conversion paths for {displayName}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="size-5" />
          Create Funnel
        </button>
      </div>

      {/* Company Context Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <GitBranch className="size-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Managing Funnels:</span>
          <span className="text-blue-600">{displayName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel List Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Funnels</h2>
            <div className="space-y-2">
              {funnels.map((funnel) => (
                <button
                  key={funnel.id}
                  onClick={() => setSelectedFunnel(funnel.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedFunnel === funnel.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="size-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{funnel.name}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        funnel.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {funnel.active ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{funnel.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{funnel.steps.length} steps</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Funnel Builder */}
        <div className="lg:col-span-8">
          {activeFunnel ? (
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Funnel Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{activeFunnel.name}</h2>
                    <p className="text-gray-600">{activeFunnel.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Settings className="size-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="size-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded">
                      <ExternalLink className="size-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">Page Visit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 rounded">
                      <MousePointer className="size-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">User Action</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-50 rounded">
                      <CheckCircle className="size-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Conversion</span>
                  </div>
                </div>
              </div>

              {/* Funnel Steps */}
              <div className="p-6">
                <div className="space-y-4">
                  {activeFunnel.steps.map((step, index) => {
                    const StepIcon = getStepIcon(step.type);
                    const color = getStepColor(step.type);
                    const isLast = index === activeFunnel.steps.length - 1;

                    return (
                      <div key={step.id}>
                        <div className="flex items-start gap-4 group">
                          {/* Drag Handle */}
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                            <GripVertical className="size-5 text-gray-400" />
                          </div>

                          {/* Step Card */}
                          <div className="flex-1 bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 bg-${color}-50 rounded-lg`}>
                                  <StepIcon className={`size-5 text-${color}-600`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-500">
                                      STEP {index + 1}
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${color}-100 text-${color}-800`}
                                    >
                                      {step.type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {step.title}
                                  </h3>
                                  <p className="text-sm text-gray-600">{step.description}</p>
                                  {step.url && (
                                    <div className="mt-2 flex items-center gap-1 text-sm text-blue-600">
                                      <ExternalLink className="size-3" />
                                      <span className="font-mono">{step.url}</span>
                                    </div>
                                  )}
                                  {step.actionType && (
                                    <div className="mt-2 text-sm text-gray-500">
                                      Action: <span className="font-medium">{step.actionType.replace('_', ' ')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                                  <Edit className="size-4" />
                                </button>
                                <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Arrow Between Steps */}
                        {!isLast && (
                          <div className="flex items-center justify-center my-2 ml-12">
                            <ArrowRight className="size-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Step Button */}
                <div className="mt-6 ml-12">
                  <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                    <Plus className="size-5" />
                    <span className="font-medium">Add Step</span>
                  </button>
                </div>
              </div>

              {/* Funnel Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Preview
                    </button>
                    <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Duplicate
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Save Draft
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Publish Funnel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <GitBranch className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Funnel Selected</h3>
              <p className="text-gray-600">Select a funnel from the list to view and edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Learn More About Funnel Builder</h2>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setShowLearnMore(false)}>
                <X className="size-5" />
              </button>
            </div>
            <p className="text-gray-600">The Funnel Builder is a powerful tool designed to help you create and manage conversion paths for your website. With a user-friendly interface, you can easily add, edit, and rearrange steps to guide visitors through your sales process.</p>
            <p className="text-gray-600 mt-4">Key Features:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2">
              <li>Drag-and-drop step rearrangement</li>
              <li>Multiple step types: pages, actions, and conversions</li>
              <li>Preview and test your funnels</li>
              <li>Save drafts and publish active funnels</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}