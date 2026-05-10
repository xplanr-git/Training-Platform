import { useState, useEffect } from 'react';
import { Save, Bell, Lock, Globe, Mail, CreditCard, Users as UsersIcon, Shield, Download, CheckCircle2, Calendar, Eye, EyeOff, Trash2, FileText, Monitor, Moon, Sun, Languages, Palette, Layout, Clock, Zap, UserPlus, MoreVertical, Edit, X } from 'lucide-react';
import { supabase } from '/utils/supabase/client';

interface AdminSettingsPageProps {
  activeSection?: 'company-profile' | 'notifications' | 'security' | 'team-management' | 'billing' | 'privacy' | 'preferences';
  companyId?: string | null;
  companyName?: string;
}

interface CompanyDetails {
  id: string;
  name: string;
  description: string;
  email: string;
  adminEmail: string;
  adminName: string;
  createdAt: string;
  settings: any;
}

export function AdminSettingsPage({ activeSection = 'company-profile', companyId, companyName }: AdminSettingsPageProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [publicSignup, setPublicSignup] = useState(false);

  // Company details state
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Notification preferences state
  const [courseEnrollments, setCourseEnrollments] = useState(true);
  const [courseCompletions, setCourseCompletions] = useState(true);
  const [newUsers, setNewUsers] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  // Privacy preferences state
  const [dataCollection, setDataCollection] = useState(true);
  const [analyticsTracking, setAnalyticsTracking] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(true);
  const [thirdPartySharing, setThirdPartySharing] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);

  // Preferences state
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [timezone, setTimezone] = useState('America/New_York');
  const [dashboardLayout, setDashboardLayout] = useState('grid');
  const [compactMode, setCompactMode] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);

  // Fetch company details when companyId is available
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!companyId) return;

      try {
        setIsLoadingCompany(true);
        setCompanyError(null);

        // Derive the company name from the slug or use the companyName prop directly
        const nameToMatch = companyName
          || companyId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

        // Pull all profiles belonging to this company
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, company, role, created_at')
          .ilike('company', nameToMatch)
          .order('created_at', { ascending: true });

        if (profilesError) throw new Error(profilesError.message);
        if (!profiles || profiles.length === 0) throw new Error('No profiles found for this company.');

        // Use the company_admin row as the primary record, fall back to first profile
        const adminProfile = profiles.find((p: any) => p.role === 'company_admin') ?? profiles[0];

        setCompanyDetails({
          id: companyId,
          name: adminProfile.company,
          description: '',
          email: '',
          adminEmail: '',
          adminName: adminProfile.name,
          createdAt: adminProfile.created_at,
          settings: {},
        });
      } catch (err) {
        console.error('Error fetching company details:', err);
        setCompanyError(err instanceof Error ? err.message : 'Failed to load company details');
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompanyDetails();
  }, [companyId, companyName]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Settings</h1>
        <p className="text-gray-600">Manage your platform configuration and preferences</p>
      </div>

      {/* Settings Content - Full Width */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeSection === 'company-profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {companyId ? 'Company Profile' : 'General Settings'}
            </h2>
            <div className="space-y-6">
              {isLoadingCompany && companyId && (
                <div className="text-center py-8">
                  <div className="inline-block size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading company details...</p>
                </div>
              )}

              {companyError && companyId && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-900 font-medium">Failed to load company details</p>
                  <p className="text-red-700 text-sm mt-1">{companyError}</p>
                </div>
              )}

              {!isLoadingCompany && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {companyId ? 'Company Name' : 'Platform Name'}
                    </label>
                    <input
                      type="text"
                      value={companyId && companyDetails ? companyDetails.name : (companyId ? (companyName || '') : 'Teachly')}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    />
                    {companyId && companyDetails && (
                      <p className="text-xs text-gray-500 mt-1">
                        Registered on {new Date(companyDetails.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {companyId ? 'Company Description' : 'Platform Description'}
                    </label>
                    <textarea
                      rows={4}
                      defaultValue={companyId && companyDetails ? companyDetails.description : (companyId ? '' : 'A comprehensive learning platform for businesses to train and develop their teams.')}
                      placeholder={companyId ? "Add a description for your company..." : ""}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {companyId && companyDetails && companyDetails.adminEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        value={companyDetails.adminEmail}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      />
                      {companyDetails.adminName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Registered by {companyDetails.adminName}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {companyId ? 'Company Email' : 'Support Email'}
                    </label>
                    <input
                      type="email"
                      defaultValue={companyId && companyDetails ? companyDetails.email : (companyId ? '' : 'support@teachly.com')}
                      placeholder={companyId ? "contact@yourcompany.com" : ""}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                      <option>UTC (GMT+0)</option>
                      <option>EST (GMT-5)</option>
                      <option>PST (GMT-8)</option>
                      <option>CET (GMT+1)</option>
                      <option>JST (GMT+9)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeSection === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive push notifications for important updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email updates about platform activity</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Course Enrollments</p>
                  <p className="text-sm text-gray-600">Notify when new users enroll in courses</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseEnrollments}
                    onChange={(e) => setCourseEnrollments(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Course Completions</p>
                  <p className="text-sm text-gray-600">Notify when users complete courses</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseCompletions}
                    onChange={(e) => setCourseCompletions(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">New Users</p>
                  <p className="text-sm text-gray-600">Notify when new users sign up</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUsers}
                    onChange={(e) => setNewUsers(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Payment Alerts</p>
                  <p className="text-sm text-gray-600">Notify about payment transactions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentAlerts}
                    onChange={(e) => setPaymentAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">System Updates</p>
                  <p className="text-sm text-gray-600">Notify about system updates and maintenance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemUpdates}
                    onChange={(e) => setSystemUpdates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Weekly Reports</p>
                  <p className="text-sm text-gray-600">Receive weekly activity reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyReports}
                    onChange={(e) => setWeeklyReports(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Monthly Reports</p>
                  <p className="text-sm text-gray-600">Receive monthly activity reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={monthlyReports}
                    onChange={(e) => setMonthlyReports(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Security Alerts</p>
                  <p className="text-sm text-gray-600">Notify about security incidents</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securityAlerts}
                    onChange={(e) => setSecurityAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeSection === 'security' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Public Sign Up</p>
                  <p className="text-sm text-gray-600">Allow new users to register without invitation</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicSignup}
                    onChange={(e) => setPublicSignup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">Change Password</p>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Update Password →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Management Settings */}
        {activeSection === 'team-management' && (
          <>
            {/* Team Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {companyId ? `${companyName || 'Company'} Team Management` : 'Parent Platform Team Management'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {companyId ? 'Manage your company administrators and team members' : 'Manage parent platform administrators and team members'}
                  </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium">
                  <UserPlus className="size-4" />
                  {companyId ? 'Invite Team Member' : 'Invite Parent Admin'}
                </button>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    {companyId ? 'Total Team Members' : 'Total Parent Admins'}
                  </p>
                  <p className="text-2xl font-bold text-blue-900">{companyId ? '12' : '8'}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900 font-medium mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-900">{companyId ? '11' : '7'}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-900 font-medium mb-1">Pending Invites</p>
                  <p className="text-2xl font-bold text-yellow-900">{companyId ? '1' : '2'}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-900 font-medium mb-1">{companyId ? 'Admins' : 'Super Admins'}</p>
                  <p className="text-2xl font-bold text-purple-900">{companyId ? '3' : '2'}</p>
                </div>
              </div>

              {/* Team Members Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {companyId ? `${companyName || 'Company'} Team` : 'Parent Platform Team'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={companyId ? 'Search team members...' : 'Search admins...'}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(companyId ? [
                    { name: 'Sarah Johnson', email: 'sarah.johnson@techcorp.com', role: 'Company Admin', status: 'Active', joinedDate: 'Feb 2024' },
                    { name: 'Michael Chen', email: 'michael.chen@techcorp.com', role: 'Manager', status: 'Active', joinedDate: 'Mar 2024' },
                    { name: 'Emily Davis', email: 'emily.davis@techcorp.com', role: 'Manager', status: 'Active', joinedDate: 'Apr 2024' },
                    { name: 'James Wilson', email: 'james.wilson@techcorp.com', role: 'Team Lead', status: 'Active', joinedDate: 'May 2024' },
                    { name: 'Lisa Martinez', email: 'lisa.martinez@techcorp.com', role: 'Team Lead', status: 'Active', joinedDate: 'Jun 2024' },
                    { name: 'David Brown', email: 'david.brown@techcorp.com', role: 'Trainer', status: 'Active', joinedDate: 'Jul 2024' },
                    { name: 'Jennifer Taylor', email: 'jennifer.taylor@techcorp.com', role: 'HR Manager', status: 'Active', joinedDate: 'Aug 2024' },
                  ] : [
                    { name: 'Abram Jamorabo', email: 'abram.jamorabo@outdure.com', role: 'Super Admin', status: 'Active', joinedDate: 'Jan 2023' },
                    { name: 'Curtis Matthews', email: 'curtis.matthews@outdure.com.au', role: 'Super Admin', status: 'Active', joinedDate: 'Jan 2023' },
                    { name: 'Jennifer Clark', email: 'jennifer.clark@outdureedge.com', role: 'Platform Admin', status: 'Active', joinedDate: 'Mar 2023' },
                    { name: 'Robert Kim', email: 'robert.kim@outdureedge.com', role: 'Platform Admin', status: 'Active', joinedDate: 'Jun 2023' },
                    { name: 'Amanda Zhang', email: 'amanda.zhang@outdureedge.com', role: 'Support Admin', status: 'Active', joinedDate: 'Sep 2023' },
                    { name: 'Michael Torres', email: 'michael.torres@outdureedge.com', role: 'Support Admin', status: 'Active', joinedDate: 'Nov 2023' },
                    { name: 'Lisa Anderson', email: 'lisa.anderson@outdureedge.com', role: 'Content Admin', status: 'Active', joinedDate: 'Dec 2023' },
                  ]).map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="size-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{member.role}</p>
                          <p className="text-xs text-gray-600">Joined {member.joinedDate}</p>
                        </div>
                        <div>
                          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                            member.status === 'Active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                        <div className="relative">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="size-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Invitations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Pending Invitations</h2>
              <div className="space-y-3">
                {(companyId ? [
                  { email: 'new.member@techcorp.com', role: 'Team Member', sentDate: '2 days ago', sentBy: 'Sarah Johnson' },
                ] : [
                  { email: 'david.wilson@outdureedge.com', role: 'Platform Admin', sentDate: '3 days ago', sentBy: 'Abram Jamorabo' },
                  { email: 'sophia.martinez@outdureedge.com', role: 'Support Admin', sentDate: '1 week ago', sentBy: 'Curtis Matthews' },
                ]).map((invite, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <Mail className="size-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        <p className="text-sm text-gray-600">Invited by {invite.sentBy} • {invite.sentDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {invite.role}
                      </span>
                      <button className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Resend
                      </button>
                      <button className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roles & Permissions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {companyId ? `${companyName || 'Company'} Roles & Permissions` : 'Parent Platform Roles & Permissions'}
              </h2>
              <div className="space-y-4">
                {(companyId ? [
                  { 
                    role: 'Company Admin', 
                    count: 1, 
                    color: 'purple',
                    permissions: ['Manage company settings', 'Invite team members', 'View company analytics', 'Configure courses']
                  },
                  { 
                    role: 'Manager', 
                    count: 2, 
                    color: 'blue',
                    permissions: ['Manage team learning', 'Assign courses', 'View team reports', 'Approve course requests']
                  },
                  { 
                    role: 'Team Lead', 
                    count: 2, 
                    color: 'green',
                    permissions: ['Monitor team progress', 'Assign learning paths', 'Generate team reports', 'Access course library']
                  },
                  { 
                    role: 'Team Member', 
                    count: 7, 
                    color: 'gray',
                    permissions: ['Enroll in courses', 'Track own progress', 'Access assigned courses', 'View certificates']
                  },
                ] : [
                  { 
                    role: 'Super Admin', 
                    count: 2, 
                    color: 'purple',
                    permissions: ['Full platform access', 'Manage all companies', 'Access all company admin pages', 'Platform configuration']
                  },
                  { 
                    role: 'Platform Admin', 
                    count: 2, 
                    color: 'blue',
                    permissions: ['Manage platform settings', 'View all analytics', 'Manage parent courses', 'Monitor system health']
                  },
                  { 
                    role: 'Support Admin', 
                    count: 2, 
                    color: 'green',
                    permissions: ['View company data', 'Assist company admins', 'Generate reports', 'Handle support tickets']
                  },
                  { 
                    role: 'Content Admin', 
                    count: 1, 
                    color: 'orange',
                    permissions: ['Create platform content', 'Manage course library', 'Update resources', 'Review submissions']
                  },
                ]).map((roleItem, index) => (
                  <div key={index} className={`p-5 border rounded-lg bg-${roleItem.color}-50 border-${roleItem.color}-200`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Shield className={`size-5 text-${roleItem.color}-600`} />
                        <div>
                          <h3 className="font-semibold text-gray-900">{roleItem.role}</h3>
                          <p className="text-sm text-gray-600">{roleItem.count} {roleItem.count === 1 ? 'admin' : 'admins'}</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <Edit className="size-3.5" />
                        Edit
                      </button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700 mb-2">Permissions:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {roleItem.permissions.map((permission, permIndex) => (
                          <div key={permIndex} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className={`size-3.5 text-${roleItem.color}-600`} />
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Activity Log */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Team Activity</h2>
              <div className="space-y-3">
                {(companyId ? [
                  { action: 'Sarah Johnson granted Manager access to Emily Davis', time: '1 hour ago', type: 'permission' },
                  { action: 'Michael Chen invited new.member@techcorp.com', time: '2 days ago', type: 'invite' },
                  { action: 'James Wilson added as Team Lead', time: '4 days ago', type: 'user-add' },
                  { action: 'Emily Davis updated Team Lead permissions', time: '6 days ago', type: 'role-change' },
                  { action: 'Lisa Martinez accepted invitation as Team Lead', time: '1 week ago', type: 'accept' },
                ] : [
                  { action: 'Curtis Matthews granted Platform Admin access to Jennifer Clark', time: '2 hours ago', type: 'permission' },
                  { action: 'Abram Jamorabo invited david.wilson@outdureedge.com', time: '3 days ago', type: 'invite' },
                  { action: 'Lisa Anderson added as Content Admin', time: '5 days ago', type: 'user-add' },
                  { action: 'Robert Kim updated Support Admin permissions', time: '1 week ago', type: 'role-change' },
                  { action: 'Amanda Zhang accepted invitation as Support Admin', time: '2 weeks ago', type: 'accept' },
                ]).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`size-2 rounded-full mt-2 ${
                      activity.type === 'user-add' ? 'bg-green-500' :
                      activity.type === 'permission' ? 'bg-blue-500' :
                      activity.type === 'invite' ? 'bg-yellow-500' :
                      activity.type === 'role-change' ? 'bg-orange-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Billing Settings */}
        {activeSection === 'billing' && (
          <>
            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Current Plan</h2>
              <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50/30">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">Enterprise Plan</h3>
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">Active</span>
                    </div>
                    <p className="text-gray-600">Unlimited users and courses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">$499</p>
                    <p className="text-sm text-gray-600">per month</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar className="size-4" />
                  <span>Next billing date: February 28, 2026</span>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Upgrade Plan
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                      <CreditCard className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Visa ending in 4242</p>
                      <p className="text-sm text-gray-600">Expires 12/2027</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-600" />
                    <span className="text-sm text-gray-600">Default</span>
                  </div>
                </div>
                <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  + Add New Payment Method
                </button>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Billing History</h2>
              <div className="space-y-3">
                {[
                  { date: 'Jan 28, 2026', amount: '$499.00', status: 'Paid', invoice: 'INV-2026-001' },
                  { date: 'Dec 28, 2025', amount: '$499.00', status: 'Paid', invoice: 'INV-2025-012' },
                  { date: 'Nov 28, 2025', amount: '$499.00', status: 'Paid', invoice: 'INV-2025-011' },
                  { date: 'Oct 28, 2025', amount: '$499.00', status: 'Paid', invoice: 'INV-2025-010' },
                ].map((invoice, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <CreditCard className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoice}</p>
                        <p className="text-sm text-gray-600">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{invoice.amount}</p>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">{invoice.status}</span>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="size-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Billing Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Outdure Corporation"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    defaultValue="billing@outdure.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    defaultValue="123 Business Street, Suite 100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      defaultValue="San Francisco"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      defaultValue="94102"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID / VAT Number
                  </label>
                  <input
                    type="text"
                    defaultValue="US123456789"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Privacy Settings */}
        {activeSection === 'privacy' && (
          <>
            {/* Privacy Preferences */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Data Collection</p>
                    <p className="text-sm text-gray-600">Allow the collection of user data for analytics and improvement</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dataCollection}
                      onChange={(e) => setDataCollection(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Analytics Tracking</p>
                    <p className="text-sm text-gray-600">Enable tracking to analyze user behavior and improve the platform</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsTracking}
                      onChange={(e) => setAnalyticsTracking(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Cookie Consent</p>
                    <p className="text-sm text-gray-600">Require users to consent to the use of cookies</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cookieConsent}
                      onChange={(e) => setCookieConsent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Third-Party Sharing</p>
                    <p className="text-sm text-gray-600">Allow sharing of user data with third-party services</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={thirdPartySharing}
                      onChange={(e) => setThirdPartySharing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Marketing Emails</p>
                    <p className="text-sm text-gray-600">Send marketing emails to users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingEmails}
                      onChange={(e) => setMarketingEmails(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Profile Visibility</p>
                    <p className="text-sm text-gray-600">Allow users to make their profiles visible to others</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileVisibility}
                      onChange={(e) => setProfileVisibility(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Data Retention</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Data Retention Period
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                    <option>30 days after account deletion</option>
                    <option>90 days after account deletion</option>
                    <option>1 year after account deletion</option>
                    <option>2 years after account deletion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Log Retention
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                    <option>3 months</option>
                    <option>6 months</option>
                    <option>1 year</option>
                    <option>2 years</option>
                    <option>Indefinitely</option>
                  </select>
                </div>
              </div>
            </div>

            {/* GDPR Compliance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">GDPR Compliance</h2>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="size-5 text-blue-600" />
                    <p className="font-medium text-gray-900">Privacy Policy</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Last updated: January 1, 2026</p>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      View Policy
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Edit Policy
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="size-5 text-blue-600" />
                    <p className="font-medium text-gray-900">Terms of Service</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Last updated: January 1, 2026</p>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      View Terms
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Edit Terms
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="size-5 text-green-600" />
                    <p className="font-medium text-gray-900">Data Processing Agreement</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">GDPR-compliant data processing agreement</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Download DPA
                  </button>
                </div>
              </div>
            </div>

            {/* Data Requests */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">User Data Requests</h2>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Eye className="size-5 text-blue-600" />
                      <p className="font-medium text-gray-900">Data Export Requests</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">3 Pending</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Users can request a copy of all their data</p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Requests →
                  </button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Trash2 className="size-5 text-red-600" />
                      <p className="font-medium text-gray-900">Data Deletion Requests</p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">1 Pending</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Users can request permanent deletion of their data</p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Requests →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Preferences Settings */}
        {activeSection === 'preferences' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Theme</p>
                  <p className="text-sm text-gray-600">Choose your preferred theme</p>
                </div>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Language</p>
                  <p className="text-sm text-gray-600">Select your preferred language</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Date Format</p>
                  <p className="text-sm text-gray-600">Choose your preferred date format</p>
                </div>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Time Format</p>
                  <p className="text-sm text-gray-600">Choose your preferred time format</p>
                </div>
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="12h">12-hour</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Time Zone</p>
                  <p className="text-sm text-gray-600">Select your preferred time zone</p>
                </div>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Dashboard Layout</p>
                  <p className="text-sm text-gray-600">Choose your preferred dashboard layout</p>
                </div>
                <select
                  value={dashboardLayout}
                  onChange={(e) => setDashboardLayout(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Compact Mode</p>
                  <p className="text-sm text-gray-600">Enable compact mode for a more streamlined interface</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Show Animations</p>
                  <p className="text-sm text-gray-600">Enable animations for a more dynamic experience</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAnimations}
                    onChange={(e) => setShowAnimations(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Auto Save</p>
                  <p className="text-sm text-gray-600">Automatically save changes to your settings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Keyboard Shortcuts</p>
                  <p className="text-sm text-gray-600">Enable keyboard shortcuts for faster navigation</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keyboardShortcuts}
                    onChange={(e) => setKeyboardShortcuts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Save className="size-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}