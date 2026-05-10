import { Home, BookOpen, Users, BarChart3, Settings, GraduationCap, LogOut, ChevronDown, ChevronRight, LayoutDashboard, TrendingUp, DollarSign, Award, FolderOpen, Plus, Edit, Eye, UserPlus, Shield, Search, Bell, Globe, Lock, CreditCard, Activity, MousePointer, LogIn, MessageSquare, Mail, Send, Inbox, Users2, Check, Building2, ChevronLeft, Server, Layout, Compass, FileText, Maximize2, GitBranch, Menu, Package, ClipboardList, Grid3x3, Star, HelpCircle, FileCheck2, Tag, Zap, Layers, MessageCircle, Mails, BellRing, Plug, ShoppingCart, Gift, Key, Handshake, LayoutList, ShoppingBag, Megaphone, Share2, FileInput, CheckSquare, ThumbsUp, Sparkles, Clock, ScrollText, Smartphone, Palette, Sliders, Store, Rocket, Repeat, FolderTree, BookMarked, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import logoImage from 'figma:asset/4d915a981a9217f9ee2238527a51376f1592134f.png';

interface AdminSidebarProps {
  currentPage: string;
  onNavigate: (page: 'admin' | 'admin-courses' | 'user-management' | 'admin-analytics' | 'admin-communications' | 'admin-settings') => void;
  onLogout: () => void;
  userName: string;
  analyticsView?: string;
  onAnalyticsViewChange?: (view: string) => void;
  currentSubPage?: string;
  onSubPageChange?: (subPage: string) => void;
  isCompanyAdmin?: boolean;
  isViewingCompanyPage?: boolean;
  isParentAdmin?: boolean;
  onBackToParentAdmin?: () => void;
  companyName?: string;
}

export function AdminSidebar({ currentPage, onNavigate, onLogout, userName, analyticsView, onAnalyticsViewChange, currentSubPage, onSubPageChange, isCompanyAdmin = false, isViewingCompanyPage = false, isParentAdmin = false, onBackToParentAdmin, companyName }: AdminSidebarProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-expand Homepage when user is on admin page and auto-select Dashboard Overview
  useEffect(() => {
    if (currentPage === 'admin' || currentPage === 'company-admin') {
      setExpandedMenu('admin');
      if (!currentSubPage && onSubPageChange) {
        onSubPageChange('overview');
      }
    } else if (currentPage === 'admin-website') {
      setExpandedMenu('admin-website');
    } else if (currentPage === 'admin-courses') {
      setExpandedMenu('admin-courses');
    } else if (currentPage === 'user-management') {
      setExpandedMenu('user-management');
    } else if (currentPage === 'admin-analytics') {
      setExpandedMenu('admin-analytics');
    } else if (currentPage === 'admin-communications') {
      setExpandedMenu('admin-communications');
    } else if (currentPage === 'admin-settings') {
      setExpandedMenu('admin-settings');
    }
  }, [currentPage]);

  const menuItems = [
    { 
      id: 'admin', 
      label: 'Homepage', 
      icon: Home,
      subItems: [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
      ]
    },
    { 
      id: 'admin-courses', 
      label: 'Courses & Programs', 
      icon: BookOpen,
      subItems: [
        { id: 'course-catalog', label: 'Course', icon: GraduationCap },
        { id: 'certificates', label: 'Certificates', icon: Award },
        { id: 'review-center', label: 'Review Center', icon: Star },
      ]
    },
    { 
      id: 'admin-website', 
      label: 'Website', 
      icon: Globe,
      subItems: [
        { id: 'website-builder', label: 'Landing Page Builder', icon: Layout },
        { id: 'website-pages', label: 'Pages', icon: FileText },
        { id: 'website-settings', label: 'Settings', icon: Settings },
      ]
    },
    { 
      id: 'user-management', 
      label: 'Users', 
      icon: Users,
      subItems: [
        { id: 'all-users', label: 'All Users', icon: Users },
        { id: 'user-roles', label: 'User Roles', icon: Shield },
        { id: 'leads', label: 'Leads', icon: UserPlus },
        { id: 'user-groups', label: 'User Groups', icon: Users2 },
        { id: 'multiple-seats', label: 'Multiple Seats', icon: Layers },
        { id: 'automations', label: 'Automations', icon: Zap },
        { id: 'tags', label: 'Tags', icon: Tag },
        { id: 'user-fields', label: 'User Fields', icon: ClipboardList },
        { id: 'approvals', label: 'Approvals', icon: Check },
        { id: 'company-subscribers', label: 'Company Subscribers', icon: Building2 },
        { id: 'user-activity', label: 'User Activity', icon: Activity },
      ]
    },
    { 
      id: 'admin-communications', 
      label: 'Communications', 
      icon: MessageSquare,
      subItems: [
        { id: 'community', label: 'Community', icon: MessageCircle },
        { id: 'inbox', label: 'Inbox', icon: Inbox },
        { id: 'mass-emails', label: 'Mass Emails', icon: Mails },
        { id: 'push-notifications', label: 'Push Notifications', icon: BellRing },
        { id: 'school-emails', label: 'School Emails', icon: GraduationCap },
        { id: 'email-integration', label: 'Email Integration', icon: Plug },
        { id: 'send-email', label: 'Send Email', icon: Send },
        { id: 'email-templates', label: 'Email Templates', icon: Mail },
      ]
    },
    { 
      id: 'admin-ecommerce', 
      label: 'E-commerce', 
      icon: ShoppingCart,
      subItems: [
        { id: 'offers', label: 'Offers', icon: Tag },
        { id: 'gifts', label: 'Gifts', icon: Gift },
        { id: 'licenses', label: 'Licenses', icon: Key },
        { id: 'custom-deals', label: 'Custom Deals', icon: Handshake },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'plans', label: 'Plans', icon: LayoutList },
        { id: 'cart-checkout', label: 'Cart & Checkout Flow', icon: ShoppingBag },
      ]
    },
    { 
      id: 'admin-marketing', 
      label: 'Marketing', 
      icon: Megaphone,
      subItems: [
        { id: 'affiliate-program', label: 'Affiliate Program', icon: Share2 },
        { id: 'marketing-forms', label: 'Marketing Forms', icon: FileInput },
        { id: 'qualification-forms', label: 'Qualification Forms', icon: CheckSquare },
        { id: 'nps', label: 'NPS', icon: ThumbsUp },
      ]
    },
    { 
      id: 'admin-analytics', 
      label: 'Reports', 
      icon: BarChart3,
      subItems: [
        { id: 'overview-analytics', label: 'Overview', icon: BarChart3 },
        { id: 'revenue', label: 'Revenue Reports', icon: DollarSign },
        { id: 'traffic', label: 'Traffic Analysis', icon: Eye },
        { id: 'user-behavior', label: 'User Behavior', icon: MousePointer },
        { id: 'login-stats', label: 'Login Statistics', icon: LogIn },
        { id: 'system-health', label: 'System Health', icon: Server },
        { id: 'report-center', label: 'Report Center', icon: FileText },
        { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
        { id: 'training-matrix', label: 'Training Matrix', icon: Grid3x3 },
        { id: 'product-insights', label: 'Product Insights', icon: Package },
        { id: 'scheduled-reports', label: 'Scheduled Reports', icon: Clock },
        { id: 'report-log', label: 'Report Log', icon: ScrollText },
        { id: 'activity-log', label: 'Activity Log', icon: Activity },
      ]
    },
    { 
      id: 'admin-mobile-app', 
      label: 'Mobile App', 
      icon: Smartphone,
      subItems: [
        { id: 'mobile-design', label: 'Design', icon: Palette },
        { id: 'app-settings', label: 'App Settings', icon: Sliders },
        { id: 'in-app-products', label: 'In-app Products', icon: Package },
        { id: 'stores-setup', label: 'Stores Set Up', icon: Store },
        { id: 'launch', label: 'Launch', icon: Rocket },
        { id: 'mobile-analytics', label: 'Analytics', icon: TrendingUp },
      ]
    },
    { 
      id: 'admin-settings', 
      label: 'Settings', 
      icon: Settings,
      subItems: [
        { id: 'company-profile', label: 'Company Profile', icon: Building2 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'team-management', label: 'Team Management', icon: Users },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'preferences', label: 'Preferences', icon: Settings },
      ]
    },
  ] as const;

  const toggleMenu = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Logo/Brand */}
      {!isCollapsed && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img src={logoImage} alt="Outdure Edge Logo" className="h-12 w-auto" />
              <div className="absolute -top-1.5 left-0">
                <GraduationCap className="size-4 text-black -rotate-12" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-gray-900">Teachly</h1>
              <span className="text-xs text-gray-500">{companyName || 'Platform Admin'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Logo */}
      {isCollapsed && (
        <div className="p-4 border-b border-gray-200 flex justify-center">
          <GraduationCap className="size-8 text-blue-600" />
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          
          // Determine if this menu item is active
          let isActive = false;
          if (isViewingCompanyPage) {
            // When viewing a company page, check the current subpage to determine active state
            if (item.id === 'admin' && currentSubPage === 'overview') {
              isActive = true;
            } else if (item.id === 'admin-website' && (currentSubPage?.includes('website'))) {
              isActive = true;
            } else if (item.id === 'admin-courses' && (currentSubPage?.includes('course') || currentSubPage === 'all-courses' || currentSubPage === 'add-course' || currentSubPage === 'manage-courses' || currentSubPage === 'course-analytics')) {
              isActive = true;
            } else if (item.id === 'user-management' && (currentSubPage === 'all-users' || currentSubPage === 'approvals' || currentSubPage === 'user-roles' || currentSubPage === 'user-activity')) {
              isActive = true;
            } else if (item.id === 'admin-analytics' && currentSubPage?.includes('analytics')) {
              isActive = true;
            } else if (item.id === 'admin-communications' && (currentSubPage === 'email-templates' || currentSubPage === 'send-email' || currentSubPage === 'inbox')) {
              isActive = true;
            } else if (item.id === 'admin-settings' && currentSubPage === 'settings') {
              isActive = true;
            }
          } else {
            // Parent admin - check current page
            isActive = currentPage === item.id || (currentPage === 'company-admin' && item.id === 'admin');
          }
          
          const isExpanded = expandedMenu === item.id;
          
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  // When viewing a company page, stay in company context and only change subpage
                  if (isViewingCompanyPage) {
                    if (item.subItems.length > 0) {
                      // Always open menu (don't toggle)
                      setExpandedMenu(item.id);
                      // Auto-select first submenu item when clicking any parent option
                      if (item.id === 'admin-analytics' && onAnalyticsViewChange) {
                        onAnalyticsViewChange(item.subItems[0].id);
                      }
                      // Always update subpage to ensure content renders
                      if (onSubPageChange) {
                        onSubPageChange(item.subItems[0].id);
                      }
                    }
                  } else {
                    // Parent admin navigation
                    if (item.subItems.length > 0) {
                      // Always open menu (don't toggle)
                      setExpandedMenu(item.id);
                      // Only navigate if not the Website, E-commerce, Marketing, or Mobile App menu (to prevent redirect to main website)
                      if (item.id !== 'admin-website' && item.id !== 'admin-ecommerce' && item.id !== 'admin-marketing' && item.id !== 'admin-mobile-app') {
                        onNavigate(item.id as any);
                      }
                      // Auto-select first submenu item
                      if (item.id === 'admin-analytics' && onAnalyticsViewChange) {
                        onAnalyticsViewChange(item.subItems[0].id);
                      } else if (onSubPageChange) {
                        onSubPageChange(item.subItems[0].id);
                      }
                    } else {
                      // No submenu, just navigate
                      onNavigate(item.id as any);
                    }
                  }
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                {isCollapsed ? (
                  <Icon className="size-5" />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className="size-5" />
                      <span className="font-medium text-left">{item.label}</span>
                      {isActive && <div className="size-2 bg-teal-500 rounded-full ml-auto" />}
                    </div>
                    {item.subItems.length > 0 && (
                      isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )
                    )}
                  </>
                )}
              </button>
              
              {/* Submenu - Only show when not collapsed */}
              {!isCollapsed && isExpanded && item.subItems.length > 0 && (
                <div className="mt-1 ml-4 space-y-1">
                  {item.subItems
                    .filter(subItem => {
                      // Hide Company Subscribers when viewing a company page OR if user is a company admin
                      if (subItem.id === 'company-subscribers' && (isCompanyAdmin || isViewingCompanyPage)) {
                        return false;
                      }
                      // Hide Approvals when viewing a company page OR if user is a company admin
                      if (subItem.id === 'approvals' && (isCompanyAdmin || isViewingCompanyPage)) {
                        return false;
                      }
                      return true;
                    })
                    .map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubItemActive = (item.id === 'admin-analytics' && analyticsView === subItem.id) || 
                                           (item.id !== 'admin-analytics' && currentSubPage === subItem.id);
                    return subItem.id !== 'website-pages' ? (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          // Handle submenu item clicks
                          if (!isViewingCompanyPage) {
                            // Parent admin: ensure we're on the correct parent page first
                            // Navigate to the section if we aren't there already
                            if (currentPage !== item.id) {
                              onNavigate(item.id as any);
                            }
                          }
                          
                          // Then update the subpage/analytics view
                          if (item.id === 'admin-analytics' && onAnalyticsViewChange) {
                            onAnalyticsViewChange(subItem.id);
                          } else if (onSubPageChange) {
                            onSubPageChange(subItem.id);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                          isSubItemActive 
                            ? 'bg-blue-50 text-blue-600 font-medium' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <SubIcon className="size-4" />
                        <span className="flex-1 text-left">{subItem.id === 'website-builder' ? 'Design' : subItem.label}</span>
                        {isSubItemActive && <div className="size-2 bg-teal-500 rounded-full" />}
                      </button>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse/Expand Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={toggleCollapse}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors`}
          title={isCollapsed ? (isCollapsed ? 'Expand Menu' : 'Collapse Menu') : ''}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <>
              <PanelLeftClose className="size-5" />
              <span className="font-medium">Collapse Menu</span>
            </>
          )}
        </button>
      </div>

      {/* User Info & Logout */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-600">Administrator</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="size-5" />
              <span className="font-medium">Logout</span>
            </button>
            
            {/* Back to Platform Overview Button - Only show for parent admins */}
            {isParentAdmin && onBackToParentAdmin && (
              <button
                onClick={onBackToParentAdmin}
                className="w-3 h-3 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors flex-shrink-0"
                title="Back to Platform Overview"
              >
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapsed Logout */}
      {isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}