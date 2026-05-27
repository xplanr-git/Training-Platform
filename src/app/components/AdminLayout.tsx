import { ReactNode } from 'react';
import { AdminSidebar } from '@/app/components/AdminSidebar';
import { User } from '@/app/types';

interface AdminLayoutProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: 'admin' | 'admin-courses' | 'user-management' | 'admin-analytics' | 'admin-communications' | 'admin-settings') => void;
  onLogout: () => void;
  children: ReactNode;
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

export function AdminLayout({ currentUser, currentPage, onNavigate, onLogout, children, analyticsView, onAnalyticsViewChange, currentSubPage, onSubPageChange, isCompanyAdmin = false, isViewingCompanyPage = false, isParentAdmin = false, onBackToParentAdmin, companyName }: AdminLayoutProps) {
  // Hide sidebar for platform admin dashboard and manage admins pages
  const hideSidebar = currentPage === 'admin' || currentPage === 'manage-admins' || currentPage === 'roles-permissions';
  
  if (hideSidebar) {
    return (
      <div className="h-screen bg-gray-50 overflow-y-auto">
        {children}
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        userName={currentUser.name}
        analyticsView={analyticsView}
        onAnalyticsViewChange={onAnalyticsViewChange}
        currentSubPage={currentSubPage}
        onSubPageChange={onSubPageChange}
        isCompanyAdmin={isCompanyAdmin}
        isViewingCompanyPage={isViewingCompanyPage}
        isParentAdmin={isParentAdmin}
        onBackToParentAdmin={onBackToParentAdmin}
        companyName={companyName}
      />
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {children}
      </div>
    </div>
  );
}