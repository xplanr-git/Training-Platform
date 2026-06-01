import { useState, useEffect } from 'react';
import { Page, User, CourseCategory, Course } from '@/app/types';
import { courses as defaultCourses } from '@/app/data/courses';
import { courseCategories } from '@/app/data/categories';
import { mockUsers } from '@/app/data/mockUsers';
import { supabase } from '/utils/supabase/client';
import { Header } from '@/app/components/Header';
import { HomePage } from '@/app/components/HomePage';
import { CourseDetailPage } from '@/app/components/CourseDetailPage';
import { LearningPage } from '@/app/components/LearningPage';
import { DashboardPage } from '@/app/components/DashboardPage';
import { LoginPage } from '@/app/components/LoginPage';
import { SignupPage } from '@/app/components/SignupPage';
import { AdminLayout } from '@/app/components/AdminLayout';
import { PlatformAdminDashboard } from '@/app/components/PlatformAdminDashboard';
import { ManageAdminsPage } from '@/app/components/ManageAdminsPage';
import { RolesPermissionsPage } from '@/app/components/RolesPermissionsPage';
import { AdminPage } from '@/app/components/AdminPage';
import { UserManagementPage } from '@/app/components/UserManagementPage';
import { AdminCoursesPage } from '@/app/components/AdminCoursesPage';
import { AdminAnalyticsPage } from '@/app/components/AdminAnalyticsPage';
import { AdminSettingsPage } from '@/app/components/AdminSettingsPage';
import { AdminCommunicationsPage, ComingSoonPage } from '@/app/components/AdminCommunicationsPage';
import { CompanySubscribers } from '@/app/components/CompanySubscribers';
import { CompanyAdminHomepage } from '@/app/components/CompanyAdminHomepage';
import { AdminSetupPage } from '@/app/components/AdminSetupPage';
import { WebsiteDesignTemplatePage } from '@/app/components/WebsiteDesignTemplatePage';
import { WebsiteDesignExplorerPage } from '@/app/components/WebsiteDesignExplorerPage';
import { WebsiteBlogPage } from '@/app/components/WebsiteBlogPage';
import { WebsitePopupsPage } from '@/app/components/WebsitePopupsPage';
import { WebsiteFunnelsPage } from '@/app/components/WebsiteFunnelsPage';
import { WebsiteNavigationPage } from '@/app/components/WebsiteNavigationPage';
import { WebsiteSettingsPage } from '@/app/components/WebsiteSettingsPage';
import { WebsiteBuilder } from '@/app/components/WebsiteBuilder';
import { LeadsPage } from '@/app/components/LeadsPage';
import { UserGroupsPage } from '@/app/components/UserGroupsPage';
import { MultipleSeatsPage } from '@/app/components/MultipleSeatsPage';
import { TagsPage } from '@/app/components/TagsPage';
import { UserFieldsPage } from '@/app/components/UserFieldsPage';
import { ApprovalsPage } from '@/app/components/ApprovalsPage';
import { SeedAccountsPage } from '@/app/components/SeedAccountsPage';
import * as auth from '@/app/utils/auth';

// Evaluated once at load time — never changes, so hooks order is always consistent
const isSeedMode = new URLSearchParams(window.location.search).get('seed') === '1';

export default function App() {
  // Render seed page before any hooks when ?seed=1 is in the URL
  if (isSeedMode) {
    return (
      <SeedAccountsPage
        onDone={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'courses' | 'dashboard' | 'login' | 'signup' | 'admin-setup' | 'course-detail' | 'learn' | 'admin' | 'manage-admins' | 'roles-permissions' | 'admin-courses' | 'user-management' | 'admin-analytics' | 'admin-settings' | 'admin-communications' | 'company-subscribers' | 'company-admin'>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<string>('overview-analytics');
  const [currentSubPage, setCurrentSubPage] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CourseCategory[]>(courseCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>(defaultCourses);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      console.log('🔍 Checking session...');
      try {
        const user = await auth.getCurrentUser();
        if (user) {
          console.log('✅ User session found:', user.email);
          // Convert auth user to app user format
          const appUser: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            company: user.company,
            role: user.role,
            enrolledCourses: user.enrolledCourses || [],
            completedLessons: user.completedLessons || [],
          };
          setCurrentUser(appUser);
          
          // Navigate to appropriate page based on role
          if (user.role === 'platform_admin') {
            setCurrentPage('admin');
            setCurrentSubPage('overview');
            setSelectedCompanyId(null);
          } else if (user.role === 'company_admin') {
            setCurrentPage('company-admin');
            setCurrentSubPage('overview');
            setSelectedCompanyId(user.company.toLowerCase().replace(/\s+/g, '-'));
          } else {
            setCurrentPage('dashboard');
          }
        } else {
          console.log('ℹ️ No user session found');
        }
      } catch (error) {
        console.error('❌ Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Function to fetch company-specific courses
  const fetchCompanyCourses = async () => {
    if (!selectedCompanyId) {
      // No company selected, use default courses
      setCourses(defaultCourses);
      return;
    }

    try {
      setIsLoadingCourses(true);

      const { data: dbCourses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (dbCourses && dbCourses.length > 0) {
        // Map DB columns → Course interface, then merge with default courses
        const mappedCourses: Course[] = dbCourses.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          instructor: c.instructor,
          duration: c.duration,
          level: c.level,
          difficulty: c.level,
          category: c.category,
          categoryId: c.category_id,
          imageUrl: c.image_url,
          thumbnail: c.image_url,
          rating: c.rating,
          studentsEnrolled: c.students_enrolled,
          modules: [],
          price: c.price,
          featured: c.featured,
          companyId: c.company_id,
          isPrivate: c.is_private,
          language: c.language,
          certificateEnabled: c.certificate_enabled,
          allowComments: c.allow_comments,
          allowReviews: c.allow_reviews,
          accessType: c.access_type,
          enrollmentType: c.enrollment_type,
          maxStudents: c.max_students,
          prerequisiteCourses: c.prerequisite_courses,
          startDate: c.start_date,
          endDate: c.end_date,
          pricingModel: c.pricing_model,
          currency: c.currency,
          discountEnabled: c.discount_enabled,
          discountPrice: c.discount_price,
          authors: c.authors,
          tags: c.tags,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        setCourses([...defaultCourses, ...mappedCourses]);
      } else {
        setCourses(defaultCourses);
      }
    } catch (error) {
      console.error('Error fetching company courses:', error);
      // Fall back to default courses on error
      setCourses(defaultCourses);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Fetch company-specific courses when selectedCompanyId changes
  useEffect(() => {
    fetchCompanyCourses();
  }, [selectedCompanyId]);

  const handleUpdateCategories = (newCategories: CourseCategory[]) => {
    setCategories(newCategories);
  };

  const handleUpdateCourseAssignments = (updates: { id: string; categoryId?: string }[]) => {
    setCourses(prev =>
      prev.map(course => {
        const update = updates.find(u => u.id === course.id);
        return update ? { ...course, categoryId: update.categoryId } : course;
      })
    );
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await auth.signin(email, password);
      
      console.log('Login response:', response); // Debug log
      
      if (response.success && response.user) {
        console.log('User role:', response.user.role); // Debug log
        
        const appUser: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          company: response.user.company,
          role: response.user.role,
          enrolledCourses: response.user.enrolledCourses || [],
          completedLessons: response.user.completedLessons || [],
        };
        setCurrentUser(appUser);
        
        // Navigate based on user role
        if (response.user.role === 'platform_admin') {
          // Platform admin goes to main admin panel
          console.log('Routing to admin panel'); // Debug log
          setCurrentPage('admin');
          setCurrentSubPage('overview');
          setSelectedCompanyId(null);
        } else if (response.user.role === 'company_admin') {
          // Company admin goes to their company dashboard
          console.log('Routing to company admin'); // Debug log
          setCurrentPage('company-admin');
          setCurrentSubPage('overview');
          setSelectedCompanyId(response.user.company.toLowerCase().replace(/\s+/g, '-'));
        } else {
          // Regular employees go to dashboard
          console.log('Routing to employee dashboard'); // Debug log
          setCurrentPage('dashboard');
        }
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleSignup = async (name: string, email: string, password: string, company: string) => {
    try {
      const response = await auth.signup(name, email, password, company);
      
      if (response.success && response.user) {
        const appUser: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          company: response.user.company,
          role: response.user.role,
          enrolledCourses: response.user.enrolledCourses || [],
          completedLessons: response.user.completedLessons || [],
        };
        setCurrentUser(appUser);
        
        // New signups become company admins
        setCurrentPage('company-admin');
        setCurrentSubPage('overview');
        setSelectedCompanyId(company.toLowerCase().replace(/\s+/g, '-'));
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    auth.signout();
    setCurrentUser(null);
    setCurrentPage('home');
    setSelectedCompanyId(null);
  };

  const handleCourseClick = (courseId: string) => {
    if (!courseId) {
      // "Browse Courses" from empty state → go to home and scroll to the courses section
      setCurrentPage('home');
      setTimeout(() => {
        document.getElementById('all-courses')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return;
    }
    setSelectedCourseId(courseId);
    setCurrentPage('course-detail');
  };

  const handleEnroll = (courseId: string) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        enrolledCourses: [...currentUser.enrolledCourses, courseId],
      });
    }
  };

  const handleStartLearning = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentPage('learn');
  };

  const handleLessonComplete = (lessonId: string) => {
    if (currentUser && !currentUser.completedLessons.includes(lessonId)) {
      setCurrentUser({
        ...currentUser,
        completedLessons: [...currentUser.completedLessons, lessonId],
      });
    }
  };

  const handleNavigate = (page: 'home' | 'dashboard' | 'login' | 'signup') => {
    if (page === 'dashboard' && !currentUser) {
      setCurrentPage('login');
    } else if (page === 'signup') {
      setCurrentPage('signup');
    } else {
      setCurrentPage(page);
    }
  };

  const handleNavigateToUserManagement = () => {
    setCurrentPage('user-management');
  };

  const handleBackToAdmin = () => {
    setCurrentPage('admin');
  };

  const handleBackFromCourse = () => {
    setCurrentPage('home');
    setSelectedCourseId(null);
  };

  const handleBackFromLearning = () => {
    setCurrentPage('course-detail');
  };

  const selectedCourse = selectedCourseId ? courses.find(c => c.id === selectedCourseId) : null;

  // Courses visible to the current user — employees only see their company's courses
  const visibleCourses = (() => {
    if (!currentUser || currentUser.role === 'platform_admin' || currentUser.role === 'company_admin') {
      return courses;
    }
    // Regular employees: show courses matching their company OR universal (no companyId) courses
    const userCompanyId = currentUser.company.toLowerCase().replace(/\s+/g, '-');
    return courses.filter(c => !c.companyId || c.companyId === userCompanyId);
  })();

  // Check if current page is an admin page
  const isAdminPage = ['admin', 'manage-admins', 'roles-permissions', 'admin-courses', 'user-management', 'admin-analytics', 'admin-settings', 'admin-communications', 'company-subscribers', 'company-admin'].includes(currentPage);

  // Determine user roles from current user
  const isParentAdmin = currentUser?.role === 'platform_admin';
  const isCompanyAdmin = currentUser?.role === 'company_admin';

  // Get company-specific users for filtering
  const getCompanyUsers = (companyId: string | null) => {
    if (!companyId) return mockUsers;

    // Parent company sees all users across every company
    if (companyId === 'outdure') return mockUsers;

    // Get the company name from companyId
    const companyNames: Record<string, string> = {
      'tech-corp': 'TechCorp Solutions',
      'global-industries': 'Global Industries Ltd',
      'innovate-startup': 'Innovate Startup Inc',
      'enterprise-solutions': 'Enterprise Solutions Group',
      'digital-services': 'Digital Services Co'
    };

    const companyName = companyNames[companyId];
    if (!companyName) return mockUsers;

    // Filter users by matching company name
    return mockUsers.filter(user => user.company === companyName);
  };

  // Get company name from company ID
  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return currentUser?.company || '';
    const companyNames: Record<string, string> = {
      'tech-corp': 'TechCorp Solutions',
      'global-industries': 'Global Industries Ltd',
      'innovate-startup': 'Innovate Startup Inc',
      'enterprise-solutions': 'Enterprise Solutions Group',
      'digital-services': 'Digital Services Co'
    };
    return companyNames[companyId] || currentUser?.company || '';
  };

  const handleAdminNavigate = (page: 'admin' | 'manage-admins' | 'admin-courses' | 'user-management' | 'admin-analytics' | 'admin-settings' | 'admin-communications' | 'company-subscribers' | 'company-admin') => {
    setCurrentPage(page);
  };

  const handleNavigateToEmailTemplates = () => {
    setCurrentPage('admin-communications');
    setCurrentSubPage('email-templates');
  };

  const handleNavigateToPushNotifications = () => {
    setCurrentPage('admin-communications');
    setCurrentSubPage('push-notifications');
  };

  const handleViewCompanyAdmin = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setCurrentPage('company-admin');
    setCurrentSubPage('overview'); // Set to homepage/dashboard overview
  };

  const handleBackToCompanyList = () => {
    setSelectedCompanyId(null);
    setCurrentPage('user-management');
    setCurrentSubPage('company-subscribers');
  };

  const handleBackToParentAdmin = () => {
    setSelectedCompanyId(null);
    setCurrentPage('admin');
    setCurrentSubPage('overview');
  };

  return (
    <div className="size-full flex flex-col bg-gray-50">
      {!isAdminPage && currentPage !== 'login' && currentPage !== 'signup' && currentPage !== 'learn' && (
        <Header 
          currentUser={currentUser} 
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Regular user pages */}
      {currentPage === 'home' && (
        <HomePage
          courses={visibleCourses}
          onCourseClick={handleCourseClick}
          enrolledCourseIds={currentUser?.enrolledCourses || []}
          isLoggedIn={!!currentUser}
          onSignUpClick={() => setCurrentPage('signup')}
        />
      )}

      {currentPage === 'course-detail' && selectedCourse && (
        <CourseDetailPage
          course={selectedCourse}
          currentUser={currentUser}
          onEnroll={handleEnroll}
          onStartLearning={handleStartLearning}
          onBack={handleBackFromCourse}
        />
      )}

      {currentPage === 'learn' && selectedCourse && currentUser && (
        <LearningPage
          course={selectedCourse}
          currentUser={currentUser}
          onLessonComplete={handleLessonComplete}
          onBack={handleBackFromLearning}
        />
      )}

      {currentPage === 'dashboard' && currentUser && (
        <DashboardPage
          currentUser={currentUser}
          courses={visibleCourses}
          onCourseClick={handleCourseClick}
          onContinueLearning={handleStartLearning}
        />
      )}

      {currentPage === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onNavigateToSignup={() => setCurrentPage('signup')}
          onNavigateToAdminSetup={() => setCurrentPage('admin-setup')}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'signup' && (
        <SignupPage
          onSignup={handleSignup}
          onNavigateToLogin={() => setCurrentPage('login')}
          onBack={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'admin-setup' && (
        <AdminSetupPage
          onBack={() => setCurrentPage('login')}
          onAdminCreated={() => setCurrentPage('login')}
        />
      )}

      {/* Admin pages with sidebar layout */}
      {isAdminPage && currentUser && (
        <AdminLayout
          currentUser={currentUser}
          currentPage={currentPage}
          onNavigate={handleAdminNavigate}
          onLogout={handleLogout}
          analyticsView={analyticsView}
          onAnalyticsViewChange={setAnalyticsView}
          currentSubPage={currentSubPage}
          onSubPageChange={setCurrentSubPage}
          isCompanyAdmin={isCompanyAdmin && !isParentAdmin}
          isViewingCompanyPage={currentPage === 'company-admin'}
          isParentAdmin={isParentAdmin}
          onBackToParentAdmin={handleBackToParentAdmin}
          companyName={getCompanyName(selectedCompanyId)}
        >
          {currentPage === 'admin' && (
            <PlatformAdminDashboard
              onViewCompany={handleViewCompanyAdmin}
              onManageAdmins={() => handleAdminNavigate('manage-admins')}
              onManageRoles={() => setCurrentPage('roles-permissions')}
              onLogout={handleLogout}
            />
          )}

          {currentPage === 'manage-admins' && (
            <ManageAdminsPage
              currentUser={currentUser}
              onNavigate={handleAdminNavigate}
              onSubPageChange={setCurrentSubPage}
            />
          )}

          {currentPage === 'roles-permissions' && (
            <RolesPermissionsPage
              onNavigate={(page: string) => setCurrentPage(page as any)}
            />
          )}

          {currentPage === 'admin-courses' && (
            <AdminCoursesPage 
              courses={courses} 
              categories={categories} 
              companyId={currentPage === 'company-admin' ? selectedCompanyId : null} 
              currentSubPage={currentSubPage}
              onSubPageChange={setCurrentSubPage}
              onCourseClick={handleCourseClick}
              onUpdateCategories={handleUpdateCategories}
              onUpdateCourseAssignments={handleUpdateCourseAssignments}
              onCoursesRefresh={fetchCompanyCourses}
              onNavigateToEmailTemplates={handleNavigateToEmailTemplates}
              onNavigateToPushNotifications={handleNavigateToPushNotifications}
            />
          )}

          {currentPage === 'user-management' && (
            <UserManagementPage
              users={getCompanyUsers(selectedCompanyId)}
              courses={courses}
              onBack={handleBackToAdmin}
              onViewCompanyAdmin={handleViewCompanyAdmin}
              currentSubPage={currentSubPage}
              currentUser={currentUser}
            />
          )}

          {currentPage === 'admin-analytics' && (
            <AdminAnalyticsPage
              courses={courses}
              users={getCompanyUsers(selectedCompanyId)}
              analyticsView={analyticsView}
              setAnalyticsView={setAnalyticsView}
              companyName={getCompanyName(selectedCompanyId)}
              isCompanyView={true}
              companyId={selectedCompanyId}
              isCompanySubscriberView={isCompanyAdmin && !isParentAdmin}
            />
          )}

          {currentPage === 'admin-settings' && (
            <AdminSettingsPage activeSection={currentSubPage as any} companyId={selectedCompanyId} companyName={getCompanyName(selectedCompanyId)} />
          )}

          {currentPage === 'admin-communications' && (
            <AdminCommunicationsPage users={getCompanyUsers(selectedCompanyId)} currentSubPage={currentSubPage} onNavigate={handleAdminNavigate} onSubPageChange={setCurrentSubPage} />
          )}
          
          {currentPage === 'company-admin' && selectedCompanyId && (
            <>
              {currentSubPage === 'overview' && (
                <CompanyAdminHomepage
                  currentUser={currentUser}
                  courses={courses}
                  companyId={selectedCompanyId}
                  companyUsers={getCompanyUsers(selectedCompanyId)}
                  isCompanySubscriberView={isCompanyAdmin && !isParentAdmin}
                />
              )}
              
              {currentSubPage && currentSubPage.includes('analytics') && (
                <AdminAnalyticsPage
                  courses={courses}
                  users={getCompanyUsers(selectedCompanyId)}
                  analyticsView={analyticsView}
                  setAnalyticsView={setAnalyticsView}
                  companyName={getCompanyName(selectedCompanyId)}
                  isCompanyView={true}
                  companyId={selectedCompanyId}
                  isCompanySubscriberView={isCompanyAdmin && !isParentAdmin}
                />
              )}

              {currentSubPage && (currentSubPage.includes('course') || currentSubPage === 'all-courses' || currentSubPage === 'add-course' || currentSubPage === 'manage-courses' || currentSubPage === 'course-analytics' || currentSubPage === 'programs-subscription' || currentSubPage === 'gradebook' || currentSubPage === 'activity-matrix' || currentSubPage === 'certificates' || currentSubPage === 'review-center' || currentSubPage === 'question-banks') && (
                <AdminCoursesPage 
                  courses={courses} 
                  categories={categories}
                  companyId={selectedCompanyId} 
                  currentSubPage={currentSubPage}
                  onSubPageChange={setCurrentSubPage}
                  onCourseClick={handleCourseClick}
                  onUpdateCategories={handleUpdateCategories}
                  onUpdateCourseAssignments={handleUpdateCourseAssignments}
                  onCoursesRefresh={fetchCompanyCourses}
                  onNavigateToEmailTemplates={handleNavigateToEmailTemplates}
              onNavigateToPushNotifications={handleNavigateToPushNotifications}
                />
              )}

              {currentSubPage === 'user-activity' && (
                <ApprovalsPage users={getCompanyUsers(selectedCompanyId)} companyId={selectedCompanyId} />
              )}

              {currentSubPage && (currentSubPage === 'all-users' || currentSubPage === 'approvals' || currentSubPage === 'add-user' || currentSubPage === 'user-roles') && (
                <UserManagementPage
                  users={getCompanyUsers(selectedCompanyId)}
                  courses={courses}
                  onBack={handleBackToAdmin}
                  onViewCompanyAdmin={handleViewCompanyAdmin}
                  currentSubPage={currentSubPage}
                  currentUser={currentUser}
                  companyId={selectedCompanyId}
                />
              )}

              {currentSubPage && (currentSubPage === 'email-templates' || currentSubPage === 'send-email' || currentSubPage === 'inbox' || currentSubPage === 'users2' || currentSubPage === 'push-notifications' || currentSubPage === 'community' || currentSubPage === 'mass-emails' || currentSubPage === 'school-emails' || currentSubPage === 'email-integration') && (
                <AdminCommunicationsPage users={getCompanyUsers(selectedCompanyId)} currentSubPage={currentSubPage} onNavigate={handleAdminNavigate} onSubPageChange={setCurrentSubPage} />
              )}

              {currentSubPage && ['company-profile','community-access','notifications','security','team-management','billing','privacy','preferences','school-info','site-domain-email','site-language','copyright-protection','privacy-gdpr'].includes(currentSubPage) && (
                <AdminSettingsPage activeSection={currentSubPage as any} companyId={selectedCompanyId} companyName={getCompanyName(selectedCompanyId)} />
              )}

              {currentSubPage && (currentSubPage === 'website-builder' || currentSubPage === 'website-pages') && (
                <WebsiteBuilder 
                  companyName={getCompanyName(selectedCompanyId)} 
                  courses={courses}
                  companyId={selectedCompanyId || undefined}
                />
              )}
              
              {currentSubPage === 'website-settings' && (
                <WebsiteSettingsPage companyName={getCompanyName(selectedCompanyId)} />
              )}

              {currentSubPage === 'leads' && (
                <LeadsPage
                  onNavigateToWebsite={() => setCurrentSubPage('website-builder')}
                  companyId={selectedCompanyId}
                />
              )}

              {currentSubPage === 'user-groups' && (
                <UserGroupsPage users={getCompanyUsers(selectedCompanyId)} companyId={selectedCompanyId} />
              )}

              {currentSubPage === 'multiple-seats' && (
                <MultipleSeatsPage users={getCompanyUsers(selectedCompanyId)} />
              )}

              {currentSubPage === 'tags' && (
                <TagsPage users={getCompanyUsers(selectedCompanyId)} companyId={selectedCompanyId} />
              )}

              {currentSubPage === 'user-fields' && (
                <UserFieldsPage companyId={selectedCompanyId} />
              )}

              {currentSubPage && ['offers','gifts','licenses','custom-deals','payments','plans','cart-checkout'].includes(currentSubPage) && (
                <ComingSoonPage section="ecommerce" />
              )}

              {currentSubPage && ['affiliate-program','marketing-forms','qualification-forms','nps'].includes(currentSubPage) && (
                <ComingSoonPage section="marketing" />
              )}

              {currentSubPage && ['mobile-design','app-settings','in-app-products','stores-setup','launch','mobile-analytics'].includes(currentSubPage) && (
                <ComingSoonPage section="mobile" />
              )}

              {currentSubPage === 'automations' && (
                <ComingSoonPage section="automations" />
              )}

              {currentSubPage && !currentSubPage.includes('analytics') && !currentSubPage.includes('course') && !currentSubPage.includes('website') && currentSubPage !== 'overview' && currentSubPage !== 'all-courses' && currentSubPage !== 'add-course' && currentSubPage !== 'manage-courses' && currentSubPage !== 'course-analytics' && currentSubPage !== 'all-users' && currentSubPage !== 'add-user' && currentSubPage !== 'user-roles' && currentSubPage !== 'user-activity' && currentSubPage !== 'certificates' && currentSubPage !== 'review-center' && currentSubPage !== 'gradebook' && currentSubPage !== 'activity-matrix' && currentSubPage !== 'question-banks' && currentSubPage !== 'programs-subscription' && currentSubPage !== 'leads' && currentSubPage !== 'user-groups' && currentSubPage !== 'multiple-seats' && currentSubPage !== 'tags' && currentSubPage !== 'user-fields' && currentSubPage !== 'user-activity' && currentSubPage !== 'approvals' && currentSubPage !== 'email-templates' && currentSubPage !== 'send-email' && currentSubPage !== 'inbox' && currentSubPage !== 'users2' && currentSubPage !== 'push-notifications' && currentSubPage !== 'community' && currentSubPage !== 'mass-emails' && currentSubPage !== 'school-emails' && currentSubPage !== 'email-integration' && currentSubPage !== 'settings' && currentSubPage !== 'company-profile' && currentSubPage !== 'notifications' && currentSubPage !== 'security' && currentSubPage !== 'team-management' && currentSubPage !== 'billing' && currentSubPage !== 'privacy' && currentSubPage !== 'preferences' && (
                <AdminPage
                  currentUser={currentUser}
                  courses={courses}
                  onNavigate={handleAdminNavigate}
                  onBackToCompanyList={isParentAdmin ? handleBackToCompanyList : undefined}
                  selectedCompanyId={selectedCompanyId}
                  onSubPageChange={setCurrentSubPage}
                  isCompanySubscriberView={isCompanyAdmin && !isParentAdmin}
                />
              )}
            </>
          )}
        </AdminLayout>
      )}
    </div>
  );
}