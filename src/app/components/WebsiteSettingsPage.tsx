import { useState, useEffect } from 'react';
import { Save, Globe, Search, Palette, Image as ImageIcon, Upload, X, Loader2, LogIn, ShieldCheck, Bot, Eye, EyeOff, Monitor, ChevronDown, ChevronRight, Settings2, Users, Link2, KeyRound, Fingerprint, Cpu } from 'lucide-react';
import { supabase } from '/utils/supabase/client';
import { toast } from 'sonner';

interface WebsiteSettingsPageProps {
  companyName: string;
}

type SettingsTab = 'general' | 'domains' | 'seo' | 'branding' | 'signin-form' | 'authentication' | 'recaptcha';

export function WebsiteSettingsPage({ companyName }: WebsiteSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Derive company ID
  const companyId = companyName.replace(/\s+/g, '-').toLowerCase();

  // Sign-in form settings
  const [signinForm, setSigninForm] = useState({
    formTitle: 'Welcome back',
    welcomeMessage: `Sign in to your ${companyName} account`,
    showLogo: true,
    background: 'white' as 'white' | 'tinted' | 'image',
    redirectAfterLogin: '/dashboard',
    redirectAfterSignup: '/dashboard',
    showForgotPassword: true,
    termsUrl: '',
    privacyUrl: '',
    allowSignup: true,
  });

  // Authentication settings
  const [authSettings, setAuthSettings] = useState({
    emailPasswordEnabled: true,
    signupsEnabled: true,
    googleOAuthEnabled: false,
    googleClientId: '',
    ssoEnabled: false,
    ssoMetadataUrl: '',
    sessionDuration: '30d' as '1d' | '7d' | '30d' | '1y',
    mfaEnabled: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: false,
  });

  // reCAPTCHA settings
  const [recaptcha, setRecaptcha] = useState({
    enabled: false,
    version: 'v3' as 'v2-checkbox' | 'v2-invisible' | 'v3',
    siteKey: '',
    secretKey: '',
    v3ScoreThreshold: 0.5,
    applyToLogin: true,
    applyToSignup: true,
    applyToContact: false,
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showFormPreview, setShowFormPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'signin' | 'signup'>('signin');

  // Authentication sub-navigation
  type AuthSubTab = 'general' | 'teachly' | 'social' | 'custom-sso' | 'saml' | 'oidc';
  const [authExpanded, setAuthExpanded] = useState(false);
  const [authSubTab, setAuthSubTab] = useState<AuthSubTab>('general');

  // Social providers state
  const [socialProviders, setSocialProviders] = useState({
    github:   { enabled: false, clientId: '', clientSecret: '' },
    facebook: { enabled: false, clientId: '', clientSecret: '' },
    linkedin: { enabled: false, clientId: '', clientSecret: '' },
    apple:    { enabled: false, clientId: '', clientSecret: '' },
  });
  const [showSocialSecrets, setShowSocialSecrets] = useState<Record<string, boolean>>({});

  // Whitelabel social providers state
  const [whitelabelProviders, setWhitelabelProviders] = useState({
    google:   { enabled: false, clientId: '', clientSecret: '' },
    github:   { enabled: false, clientId: '', clientSecret: '' },
    facebook: { enabled: false, clientId: '', clientSecret: '' },
    linkedin: { enabled: false, clientId: '', clientSecret: '' },
    apple:    { enabled: false, clientId: '', clientSecret: '' },
  });
  const [showWhitelabelSecrets, setShowWhitelabelSecrets] = useState<Record<string, boolean>>({});

  // Custom SSO state
  const [customSso, setCustomSso] = useState({
    enabled: false, providerName: '', clientId: '', clientSecret: '',
    authorizationUrl: '', tokenUrl: '', userInfoUrl: '', scope: 'openid email profile',
  });
  const [showCustomSsoSecret, setShowCustomSsoSecret] = useState(false);

  // SAML state
  const [saml, setSaml] = useState({
    enabled: false, entityId: '', metadataUrl: '', certificate: '',
    attributeEmail: 'email', attributeFirstName: 'firstName', attributeLastName: 'lastName',
    signRequests: true, forceAuthn: false,
  });

  // OIDC state
  const [oidc, setOidc] = useState({
    enabled: false, issuerUrl: '', clientId: '', clientSecret: '',
    scopes: 'openid email profile', redirectUri: '', pkce: true,
  });
  const [showOidcSecret, setShowOidcSecret] = useState(false);

  // Teachly options state
  const [teachlyOptions, setTeachlyOptions] = useState({
    emailVerificationRequired: true,
    loginNotifications: false,
    suspiciousLoginDetection: true,
    maxLoginAttempts: 5,
    lockoutDuration: '15m' as '5m' | '15m' | '30m' | '1h',
    allowedEmailDomains: '',
  });

  // Form states
  const [settings, setSettings] = useState({
    siteName: companyName,
    siteDescription: '',
    primaryColor: '#0d9488', // teal-600
    secondaryColor: '#1f2937', // gray-800
    fontFamily: 'Inter',
    logo: null as File | string | null,
    favicon: null as File | string | null,
    metaTitle: '',
    metaDescription: '',
    customDomain: '',
  });

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: row, error } = await supabase
          .from('website_settings')
          .select('*')
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching settings:', error.message);
        } else if (row) {
          setSettings(prev => ({
            ...prev,
            siteName: row.site_name || prev.siteName,
            siteDescription: row.site_description || prev.siteDescription,
            primaryColor: row.primary_color || prev.primaryColor,
            secondaryColor: row.secondary_color || prev.secondaryColor,
            fontFamily: row.font_family || prev.fontFamily,
            logo: row.logo || prev.logo,
            favicon: row.favicon || prev.favicon,
            metaTitle: row.meta_title || prev.metaTitle,
            metaDescription: row.meta_description || prev.metaDescription,
            customDomain: row.custom_domain || prev.customDomain,
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [companyId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert(
          {
            company_id: companyId,
            site_name: settings.siteName,
            site_description: settings.siteDescription,
            primary_color: settings.primaryColor,
            secondary_color: settings.secondaryColor,
            font_family: settings.fontFamily,
            logo: typeof settings.logo === 'string' ? settings.logo : null,
            favicon: typeof settings.favicon === 'string' ? settings.favicon : null,
            meta_title: settings.metaTitle,
            meta_description: settings.metaDescription,
            custom_domain: settings.customDomain,
          },
          { onConflict: 'company_id' }
        );

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, logo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, favicon: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
          <p className="text-gray-500 mt-1">Manage your website's general configuration and appearance</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white border-r border-gray-200 py-6">
          <nav className="space-y-1 px-4">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'general'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Globe className="size-5" />
              General
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'branding'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Palette className="size-5" />
              Branding
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'domains'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Globe className="size-5" />
              Domains
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'seo'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Search className="size-5" />
              SEO
            </button>

            {/* Divider */}
            <div className="my-3 mx-2 border-t border-gray-100" />
            <p className="px-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Access & Security</p>

            <button
              onClick={() => setActiveTab('signin-form')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'signin-form'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LogIn className="size-5" />
              Sign in/up Form
            </button>
            {/* Authentication expandable */}
            <button
              onClick={() => { setActiveTab('authentication'); setAuthExpanded(v => !v); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'authentication'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="size-5" />
              <span className="flex-1 text-left">Authentication</span>
              {authExpanded ? <ChevronDown className="size-4 opacity-60" /> : <ChevronRight className="size-4 opacity-60" />}
            </button>
            {(activeTab === 'authentication' || authExpanded) && (
              <div className="ml-3 pl-3 border-l-2 border-teal-100 space-y-0.5">
                {([
                  { key: 'general'    as AuthSubTab, label: 'General',           icon: Settings2   },
                  { key: 'teachly'    as AuthSubTab, label: 'Teachly',            icon: Cpu         },
                  { key: 'social'     as AuthSubTab, label: 'Social',            icon: Users       },
                  { key: 'custom-sso' as AuthSubTab, label: 'Custom SSO',        icon: Link2       },
                  { key: 'saml'       as AuthSubTab, label: 'SAML',              icon: KeyRound    },
                  { key: 'oidc'       as AuthSubTab, label: 'OpenID Connect',    icon: Fingerprint },
                ]).map(({ key, label, icon: Icon }) => (
                  <button key={key}
                    onClick={() => { setActiveTab('authentication'); setAuthSubTab(key); setAuthExpanded(true); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activeTab === 'authentication' && authSubTab === key
                        ? 'bg-teal-100 text-teal-800'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setActiveTab('recaptcha')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'recaptcha'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Bot className="size-5" />
              reCAPTCHA
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="My Awesome School"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
                        placeholder="Describe your site..."
                      />
                      <p className="mt-1 text-xs text-gray-500">This description will be used for search engines if no meta description is provided.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Assets</h3>
                  
                  <div className="space-y-6">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                      <div className="flex items-start gap-6">
                        <div className="size-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group">
                          {settings.logo ? (
                            <>
                              <img src={settings.logo as string} alt="Logo" className="w-full h-full object-contain p-2" />
                              <button 
                                onClick={() => setSettings({ ...settings, logo: null })}
                                className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="size-3" />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon className="size-8 text-gray-400 mx-auto mb-2" />
                              <span className="text-xs text-gray-500">No logo</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-3">Upload your company logo. Recommended size: 512x512px. Supported formats: PNG, JPG, SVG.</p>
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                            <Upload className="size-4" />
                            Upload Logo
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gray-200" />

                    {/* Favicon Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                      <div className="flex items-start gap-6">
                        <div className="size-16 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group">
                          {settings.favicon ? (
                            <>
                              <img src={settings.favicon as string} alt="Favicon" className="w-8 h-8 object-contain" />
                              <button 
                                onClick={() => setSettings({ ...settings, favicon: null })}
                                className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="size-3" />
                              </button>
                            </>
                          ) : (
                            <Globe className="size-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-3">Upload your site favicon. Recommended size: 32x32px or 64x64px. Supported formats: ICO, PNG.</p>
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                            <Upload className="size-4" />
                            Upload Favicon
                            <input type="file" className="hidden" accept="image/x-icon,image/png" onChange={handleFaviconUpload} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Colors & Fonts</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.secondaryColor}
                          onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.secondaryColor}
                          onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={settings.fontFamily}
                        onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Montserrat">Montserrat</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'domains' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Domain</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Domain Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.customDomain}
                          onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                          placeholder="www.yourdomain.com"
                        />
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                          Verify
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        To connect your domain, create a CNAME record in your DNS settings pointing to <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">sites.teachly.com</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                      <input
                        type="text"
                        value={settings.metaTitle}
                        onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Page Title | Brand Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                      <textarea
                        value={settings.metaDescription}
                        onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
                        placeholder="A brief summary of your page content..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Sign in/up Form ── */}
            {activeTab === 'signin-form' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Appearance */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">Form Appearance</h3>
                    <button
                      onClick={() => setShowFormPreview(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <Monitor className="size-3.5" />
                      Preview
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-5">Customise how the login and signup pages look to your users.</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
                        <input type="text" value={signinForm.formTitle}
                          onChange={e => setSigninForm({ ...signinForm, formTitle: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="Welcome back" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                        <input type="text" value={signinForm.welcomeMessage}
                          onChange={e => setSigninForm({ ...signinForm, welcomeMessage: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="Sign in to your account" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Style</label>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { key: 'white',   label: 'White',   preview: 'bg-white border-2 border-gray-200'       },
                          { key: 'tinted',  label: 'Tinted',  preview: 'bg-teal-50 border-2 border-teal-200'     },
                          { key: 'image',   label: 'Image',   preview: 'bg-gradient-to-br from-teal-500 to-teal-700 border-2 border-teal-500' },
                        ] as const).map(({ key, label, preview }) => (
                          <button key={key} onClick={() => setSigninForm({ ...signinForm, background: key })}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${signinForm.background === key ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className={`w-full h-10 rounded ${preview}`} />
                            <span className="text-xs font-medium text-gray-700">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Show logo on form</p>
                        <p className="text-xs text-gray-500 mt-0.5">Display your company logo above the form</p>
                      </div>
                      <div className="cursor-pointer" onClick={() => setSigninForm({ ...signinForm, showLogo: !signinForm.showLogo })}>
                        <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${signinForm.showLogo ? 'bg-teal-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${signinForm.showLogo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Redirects & Options */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Redirects & Options</h3>
                  <p className="text-sm text-gray-500 mb-5">Control where users land after signing in or signing up.</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">After Login</label>
                        <input type="text" value={signinForm.redirectAfterLogin}
                          onChange={e => setSigninForm({ ...signinForm, redirectAfterLogin: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="/dashboard" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">After Sign Up</label>
                        <input type="text" value={signinForm.redirectAfterSignup}
                          onChange={e => setSigninForm({ ...signinForm, redirectAfterSignup: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                          placeholder="/dashboard" />
                      </div>
                    </div>
                    {[
                      { key: 'allowSignup'        as const, label: 'Allow new sign-ups',      sub: 'Let new users create an account'            },
                      { key: 'showForgotPassword' as const, label: 'Show "Forgot password"',  sub: 'Display the forgot password link on the form' },
                    ].map(({ key, label, sub }) => (
                      <div key={key} className="flex items-center justify-between py-3 border-t border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                        </div>
                        <div className="cursor-pointer" onClick={() => setSigninForm({ ...signinForm, [key]: !signinForm[key] })}>
                          <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${signinForm[key] ? 'bg-teal-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${signinForm[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Service URL</label>
                        <input type="text" value={signinForm.termsUrl}
                          onChange={e => setSigninForm({ ...signinForm, termsUrl: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                          placeholder="https://yoursite.com/terms" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy URL</label>
                        <input type="text" value={signinForm.privacyUrl}
                          onChange={e => setSigninForm({ ...signinForm, privacyUrl: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                          placeholder="https://yoursite.com/privacy" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Authentication sub-tabs ── */}
            {activeTab === 'authentication' && (
              <div className="space-y-6 animate-in fade-in duration-300">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck className="size-3.5" />
                  <span>Authentication</span>
                  <ChevronRight className="size-3" />
                  <span className="text-gray-700 font-medium capitalize">
                    {authSubTab === 'general' ? 'General' : authSubTab === 'teachly' ? 'Teachly' : authSubTab === 'social' ? 'Social' : authSubTab === 'custom-sso' ? 'Custom SSO' : authSubTab === 'saml' ? 'SAML' : 'OpenID Connect'}
                  </span>
                </div>

                {/* ── General ── */}
                {authSubTab === 'general' && (
                  <>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Login Methods</h3>
                      <p className="text-sm text-gray-500 mb-5">Enable or disable how users can authenticate.</p>
                      <div className="divide-y divide-gray-100">
                        <div className="flex items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"><LogIn className="size-4" /></div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">Email & Password</p>
                              <p className="text-xs text-gray-500 mt-0.5">Standard email/password authentication</p>
                            </div>
                          </div>
                          <div className="cursor-pointer" onClick={() => setAuthSettings({ ...authSettings, emailPasswordEnabled: !authSettings.emailPasswordEnabled })}>
                            <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${authSettings.emailPasswordEnabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${authSettings.emailPasswordEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Allow new sign-ups</p>
                            <p className="text-xs text-gray-500 mt-0.5">Let new users create accounts via email</p>
                          </div>
                          <div className="cursor-pointer" onClick={() => setAuthSettings({ ...authSettings, signupsEnabled: !authSettings.signupsEnabled })}>
                            <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${authSettings.signupsEnabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${authSettings.signupsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Session & MFA</h3>
                      <p className="text-sm text-gray-500 mb-5">Configure session duration and multi-factor authentication.</p>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Session Duration</label>
                          <div className="grid grid-cols-4 gap-2">
                            {([['1d','1 Day'],['7d','7 Days'],['30d','30 Days'],['1y','1 Year']] as const).map(([val, lbl]) => (
                              <button key={val} onClick={() => setAuthSettings({ ...authSettings, sessionDuration: val })}
                                className={`py-2 rounded-lg border text-xs font-medium transition-colors ${authSettings.sessionDuration === val ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{lbl}</button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Multi-Factor Authentication (MFA)</p>
                            <p className="text-xs text-gray-500 mt-0.5">Require TOTP app verification on login</p>
                          </div>
                          <div className="cursor-pointer" onClick={() => setAuthSettings({ ...authSettings, mfaEnabled: !authSettings.mfaEnabled })}>
                            <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${authSettings.mfaEnabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${authSettings.mfaEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Password Requirements</h3>
                      <p className="text-sm text-gray-500 mb-5">Set minimum standards for user passwords.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Length</label>
                          <select value={authSettings.passwordMinLength}
                            onChange={e => setAuthSettings({ ...authSettings, passwordMinLength: +e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                            {[6,8,10,12].map(n => <option key={n} value={n}>{n} characters</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2.5 justify-center">
                          {([
                            { key: 'passwordRequireUppercase' as const, label: 'Uppercase letter'  },
                            { key: 'passwordRequireNumbers'   as const, label: 'Number'            },
                            { key: 'passwordRequireSpecial'   as const, label: 'Special character' },
                          ]).map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={authSettings[key]}
                                onChange={() => setAuthSettings({ ...authSettings, [key]: !authSettings[key] })}
                                className="rounded text-teal-600 focus:ring-teal-500" />
                              <span className="text-sm text-gray-700">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Teachly Options ── */}
                {authSubTab === 'teachly' && (
                  <>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Teachly-Specific Options</h3>
                      <p className="text-sm text-gray-500 mb-5">Platform-level authentication controls for your Teachly site.</p>
                      <div className="divide-y divide-gray-100">
                        {([
                          { key: 'emailVerificationRequired' as const, label: 'Email verification required',   sub: 'Users must verify their email before accessing the platform' },
                          { key: 'loginNotifications'        as const, label: 'Login notifications',           sub: 'Send an email to users when a new login is detected'         },
                          { key: 'suspiciousLoginDetection'  as const, label: 'Suspicious login detection',    sub: 'Flag and notify admins of unusual login activity'             },
                        ]).map(({ key, label, sub }) => (
                          <div key={key} className="flex items-center justify-between py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                            </div>
                            <div className="cursor-pointer shrink-0 ml-6" onClick={() => setTeachlyOptions({ ...teachlyOptions, [key]: !teachlyOptions[key] })}>
                              <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${teachlyOptions[key] ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${teachlyOptions[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Brute Force Protection</h3>
                      <p className="text-sm text-gray-500 mb-5">Limit login attempts to protect against brute force attacks.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                          <select value={teachlyOptions.maxLoginAttempts}
                            onChange={e => setTeachlyOptions({ ...teachlyOptions, maxLoginAttempts: +e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                            {[3,5,10,20].map(n => <option key={n} value={n}>{n} attempts</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lockout Duration</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {([['5m','5 min'],['15m','15 min'],['30m','30 min'],['1h','1 hour']] as const).map(([val, lbl]) => (
                              <button key={val} onClick={() => setTeachlyOptions({ ...teachlyOptions, lockoutDuration: val })}
                                className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${teachlyOptions.lockoutDuration === val ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{lbl}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Allowed Email Domains</h3>
                      <p className="text-sm text-gray-500 mb-4">Restrict sign-ups to specific email domains. Leave blank to allow all.</p>
                      <input type="text" value={teachlyOptions.allowedEmailDomains}
                        onChange={e => setTeachlyOptions({ ...teachlyOptions, allowedEmailDomains: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                        placeholder="e.g. company.com, myorg.net" />
                      <p className="mt-1.5 text-xs text-gray-400">Separate multiple domains with commas.</p>
                    </div>
                  </>
                )}

                {/* ── Social ── */}
                {authSubTab === 'social' && (() => {
                  const providerMeta: Record<string, { label: string; color: string; icon: JSX.Element }> = {
                    google:   { label: 'Google',   color: 'bg-red-50',     icon: <svg className="size-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
                    github:   { label: 'GitHub',   color: 'bg-gray-900',   icon: <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg> },
                    facebook: { label: 'Facebook', color: 'bg-blue-600',   icon: <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                    linkedin: { label: 'LinkedIn', color: 'bg-blue-700',   icon: <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                    apple:    { label: 'Apple',    color: 'bg-gray-900',   icon: <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
                  };

                  const renderProviderRow = (
                    provider: string,
                    enabled: boolean,
                    clientId: string,
                    clientSecret: string,
                    onToggle: () => void,
                    onClientIdChange: (v: string) => void,
                    onClientSecretChange: (v: string) => void,
                    secretVisible: boolean,
                    onToggleSecret: () => void,
                    showCredentials = true,
                  ) => {
                    const m = providerMeta[provider];
                    return (
                      <div key={provider} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.color}`}>{m.icon}</div>
                            <div><p className="text-sm font-medium text-gray-800">{m.label}</p><p className="text-xs text-gray-500">OAuth 2.0</p></div>
                          </div>
                          <div className="cursor-pointer" onClick={onToggle}>
                            <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                          </div>
                        </div>
                        {enabled && showCredentials && (
                          <div className="mt-3 ml-12 grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Client ID</label>
                              <input type="text" value={clientId} onChange={e => onClientIdChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Client ID" /></div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Client Secret</label>
                              <div className="relative">
                                <input type={secretVisible ? 'text' : 'password'} value={clientSecret} onChange={e => onClientSecretChange(e.target.value)}
                                  className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Client Secret" />
                                <button type="button" onClick={onToggleSecret} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                  {secretVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <>
                      {/* Card 1 — Sign in/up with Social Media */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Sign in/up with Social Media</h3>
                        <p className="text-sm text-gray-500 mb-5">Allow users to authenticate using their existing social accounts via standard OAuth redirect.</p>
                        <div className="divide-y divide-gray-100">
                          {/* Google (uses authSettings) */}
                          {renderProviderRow(
                            'google',
                            authSettings.googleOAuthEnabled,
                            authSettings.googleClientId,
                            '',
                            () => setAuthSettings(s => ({ ...s, googleOAuthEnabled: !s.googleOAuthEnabled })),
                            v => setAuthSettings(s => ({ ...s, googleClientId: v })),
                            () => {},
                            false,
                            () => {},
                            false,
                          )}
                          {/* GitHub, Facebook, LinkedIn, Apple */}
                          {(['github','facebook','linkedin','apple'] as const).map(provider =>
                            renderProviderRow(
                              provider,
                              socialProviders[provider].enabled,
                              socialProviders[provider].clientId,
                              socialProviders[provider].clientSecret,
                              () => setSocialProviders(sp => ({ ...sp, [provider]: { ...sp[provider], enabled: !sp[provider].enabled } })),
                              v => setSocialProviders(sp => ({ ...sp, [provider]: { ...sp[provider], clientId: v } })),
                              v => setSocialProviders(sp => ({ ...sp, [provider]: { ...sp[provider], clientSecret: v } })),
                              !!showSocialSecrets[provider],
                              () => setShowSocialSecrets(s => ({ ...s, [provider]: !s[provider] })),
                              false,
                            )
                          )}
                        </div>
                      </div>

                      {/* Card 2 — Whitelabel Sign in/up with Social Media */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Whitelabel Sign in/up with Social Media
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">Pro</span>
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">Host the social login flow entirely on your own domain with your branding — no redirects to third-party consent screens.</p>
                        <div className="divide-y divide-gray-100">
                          {(['google','github','facebook','linkedin','apple'] as const).map(provider =>
                            renderProviderRow(
                              provider,
                              whitelabelProviders[provider].enabled,
                              whitelabelProviders[provider].clientId,
                              whitelabelProviders[provider].clientSecret,
                              () => setWhitelabelProviders(wp => ({ ...wp, [provider]: { ...wp[provider], enabled: !wp[provider].enabled } })),
                              v => setWhitelabelProviders(wp => ({ ...wp, [provider]: { ...wp[provider], clientId: v } })),
                              v => setWhitelabelProviders(wp => ({ ...wp, [provider]: { ...wp[provider], clientSecret: v } })),
                              !!showWhitelabelSecrets[provider],
                              () => setShowWhitelabelSecrets(s => ({ ...s, [provider]: !s[provider] })),
                            )
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* ── Custom SSO ── */}
                {authSubTab === 'custom-sso' && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Custom SSO <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Enterprise</span></h3>
                        <p className="text-sm text-gray-500">Configure a custom OAuth 2.0 identity provider.</p>
                      </div>
                      <div className="cursor-pointer shrink-0" onClick={() => setCustomSso(s => ({ ...s, enabled: !s.enabled }))}>
                        <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${customSso.enabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${customSso.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </div>
                    <div className={`space-y-4 transition-opacity ${customSso.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                          <input type="text" value={customSso.providerName} onChange={e => setCustomSso(s => ({ ...s, providerName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Okta" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                          <input type="text" value={customSso.clientId} onChange={e => setCustomSso(s => ({ ...s, clientId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Client ID" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                          <div className="relative">
                            <input type={showCustomSsoSecret ? 'text' : 'password'} value={customSso.clientSecret} onChange={e => setCustomSso(s => ({ ...s, clientSecret: e.target.value }))}
                              className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Client Secret" />
                            <button type="button" onClick={() => setShowCustomSsoSecret(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showCustomSsoSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                          <input type="text" value={customSso.scope} onChange={e => setCustomSso(s => ({ ...s, scope: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="openid email profile" /></div>
                      </div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Authorization URL</label>
                        <input type="text" value={customSso.authorizationUrl} onChange={e => setCustomSso(s => ({ ...s, authorizationUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://your-idp.com/oauth/authorize" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Token URL</label>
                        <input type="text" value={customSso.tokenUrl} onChange={e => setCustomSso(s => ({ ...s, tokenUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://your-idp.com/oauth/token" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">User Info URL</label>
                        <input type="text" value={customSso.userInfoUrl} onChange={e => setCustomSso(s => ({ ...s, userInfoUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://your-idp.com/oauth/userinfo" /></div>
                    </div>
                  </div>
                )}

                {/* ── SAML ── */}
                {authSubTab === 'saml' && (
                  <>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">SAML 2.0 <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Enterprise</span></h3>
                          <p className="text-sm text-gray-500">Connect an identity provider using SAML 2.0.</p>
                        </div>
                        <div className="cursor-pointer shrink-0" onClick={() => setSaml(s => ({ ...s, enabled: !s.enabled }))}>
                          <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${saml.enabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${saml.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </div>
                        </div>
                      </div>
                      <div className={`space-y-4 transition-opacity ${saml.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-sm font-medium text-gray-700 mb-1">Entity ID (SP)</label>
                            <input type="text" value={saml.entityId} onChange={e => setSaml(s => ({ ...s, entityId: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://yourapp.com/saml/metadata" /></div>
                          <div><label className="block text-sm font-medium text-gray-700 mb-1">IdP Metadata URL</label>
                            <input type="text" value={saml.metadataUrl} onChange={e => setSaml(s => ({ ...s, metadataUrl: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://your-idp.com/saml/metadata" /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">X.509 Certificate</label>
                          <textarea value={saml.certificate} onChange={e => setSaml(s => ({ ...s, certificate: e.target.value }))} rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none font-mono"
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----" /></div>
                        <div className="flex gap-6">
                          {([
                            { key: 'signRequests' as const, label: 'Sign AuthN requests' },
                            { key: 'forceAuthn'   as const, label: 'Force re-authentication' },
                          ]).map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={saml[key]} onChange={() => setSaml(s => ({ ...s, [key]: !s[key] }))}
                                className="rounded text-teal-600 focus:ring-teal-500" />
                              <span className="text-sm text-gray-700">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-opacity ${saml.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">Attribute Mapping</h3>
                      <p className="text-sm text-gray-500 mb-4">Map SAML assertion attributes to Teachly user fields.</p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { key: 'attributeEmail'     as const, label: 'Email'      },
                          { key: 'attributeFirstName' as const, label: 'First Name' },
                          { key: 'attributeLastName'  as const, label: 'Last Name'  },
                        ]).map(({ key, label }) => (
                          <div key={key}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <input type="text" value={saml[key]} onChange={e => setSaml(s => ({ ...s, [key]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── OpenID Connect ── */}
                {authSubTab === 'oidc' && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">OpenID Connect <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Enterprise</span></h3>
                        <p className="text-sm text-gray-500">Connect an OIDC-compatible identity provider.</p>
                      </div>
                      <div className="cursor-pointer shrink-0" onClick={() => setOidc(s => ({ ...s, enabled: !s.enabled }))}>
                        <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${oidc.enabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${oidc.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </div>
                    <div className={`space-y-4 transition-opacity ${oidc.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Issuer URL</label>
                        <input type="text" value={oidc.issuerUrl} onChange={e => setOidc(s => ({ ...s, issuerUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://accounts.google.com" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                          <input type="text" value={oidc.clientId} onChange={e => setOidc(s => ({ ...s, clientId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Client ID" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                          <div className="relative">
                            <input type={showOidcSecret ? 'text' : 'password'} value={oidc.clientSecret} onChange={e => setOidc(s => ({ ...s, clientSecret: e.target.value }))}
                              className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Client Secret" />
                            <button type="button" onClick={() => setShowOidcSecret(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showOidcSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Scopes</label>
                          <input type="text" value={oidc.scopes} onChange={e => setOidc(s => ({ ...s, scopes: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="openid email profile" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
                          <input type="text" value={oidc.redirectUri} onChange={e => setOidc(s => ({ ...s, redirectUri: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://yourapp.com/auth/callback" /></div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Use PKCE</p>
                          <p className="text-xs text-gray-500 mt-0.5">Recommended for public clients (no client secret)</p>
                        </div>
                        <div className="cursor-pointer" onClick={() => setOidc(s => ({ ...s, pkce: !s.pkce }))}>
                          <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${oidc.pkce ? 'bg-teal-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${oidc.pkce ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── reCAPTCHA ── */}
            {activeTab === 'recaptcha' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">reCAPTCHA Protection</h3>
                      <p className="text-sm text-gray-500">Protect your forms from spam and automated abuse using Google reCAPTCHA.</p>
                    </div>
                    <div className="cursor-pointer shrink-0 mt-1" onClick={() => setRecaptcha({ ...recaptcha, enabled: !recaptcha.enabled })}>
                      <div className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${recaptcha.enabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${recaptcha.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  </div>

                  <div className={`space-y-5 transition-opacity ${recaptcha.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">reCAPTCHA Version</label>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { key: 'v2-checkbox',  label: 'v2 Checkbox',   sub: '"I\'m not a robot"'     },
                          { key: 'v2-invisible', label: 'v2 Invisible',  sub: 'Silent background check' },
                          { key: 'v3',           label: 'v3 Score',      sub: 'Risk score (0.0–1.0)'    },
                        ] as const).map(({ key, label, sub }) => (
                          <button key={key} onClick={() => setRecaptcha({ ...recaptcha, version: key })}
                            className={`flex flex-col items-start gap-0.5 p-3 rounded-lg border text-left transition-colors ${recaptcha.version === key ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20' : 'border-gray-200 hover:border-gray-300'}`}>
                            <span className={`text-xs font-semibold ${recaptcha.version === key ? 'text-teal-700' : 'text-gray-800'}`}>{label}</span>
                            <span className="text-[10px] text-gray-400">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Site Key</label>
                        <input type="text" value={recaptcha.siteKey}
                          onChange={e => setRecaptcha({ ...recaptcha, siteKey: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                          placeholder="6Lc..." />
                        <p className="mt-1 text-xs text-gray-400">Used in the frontend widget</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                        <div className="relative">
                          <input type={showSecretKey ? 'text' : 'password'} value={recaptcha.secretKey}
                            onChange={e => setRecaptcha({ ...recaptcha, secretKey: e.target.value })}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                            placeholder="6Lc..." />
                          <button type="button" onClick={() => setShowSecretKey(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showSecretKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">Used server-side for verification</p>
                      </div>
                    </div>

                    {recaptcha.version === 'v3' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Score Threshold <span className="text-gray-400 font-normal">({recaptcha.v3ScoreThreshold.toFixed(1)})</span>
                        </label>
                        <input type="range" min="0" max="1" step="0.1" value={recaptcha.v3ScoreThreshold}
                          onChange={e => setRecaptcha({ ...recaptcha, v3ScoreThreshold: +e.target.value })}
                          className="w-full accent-teal-500" />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>0.0 — Always allow</span>
                          <span>1.0 — Strict</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-opacity ${recaptcha.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Apply reCAPTCHA To</h3>
                  <p className="text-sm text-gray-500 mb-4">Choose which forms are protected by reCAPTCHA.</p>
                  <div className="space-y-3">
                    {([
                      { key: 'applyToLogin'   as const, label: 'Login form',           sub: 'Protect the sign-in page'         },
                      { key: 'applyToSignup'  as const, label: 'Sign-up form',          sub: 'Protect new account registration' },
                      { key: 'applyToContact' as const, label: 'Contact / lead forms',  sub: 'Protect public-facing forms'      },
                    ]).map(({ key, label, sub }) => (
                      <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={recaptcha[key]}
                          onChange={() => setRecaptcha({ ...recaptcha, [key]: !recaptcha[key] })}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sign-in Form Preview Modal ── */}
      {showFormPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowFormPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <Monitor className="size-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Form Preview</span>
                {/* Sign in / Sign up toggle */}
                <div className="flex items-center p-0.5 bg-gray-200 rounded-lg ml-2">
                  {(['signin', 'signup'] as const).map(m => (
                    <button key={m} onClick={() => setPreviewMode(m)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${previewMode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {m === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowFormPreview(false)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="size-4" />
              </button>
            </div>

            {/* Preview canvas */}
            <div className={`flex items-center justify-center min-h-[520px] p-8 ${
              signinForm.background === 'tinted'
                ? 'bg-teal-50'
                : signinForm.background === 'image'
                  ? 'bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900'
                  : 'bg-gray-50'
            }`}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
                {/* Logo placeholder */}
                {signinForm.showLogo && (
                  <div className="flex justify-center mb-6">
                    <div className="h-10 w-28 rounded-lg bg-teal-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold tracking-wide">{companyName}</span>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {previewMode === 'signin' ? signinForm.formTitle || 'Welcome back' : 'Create an account'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {previewMode === 'signin'
                      ? signinForm.welcomeMessage || `Sign in to your ${companyName} account`
                      : `Join ${companyName} today`}
                  </p>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  {previewMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-400">John Smith</div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-400">you@example.com</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-400 flex items-center justify-between">
                      <span>••••••••</span>
                      <Eye className="size-3.5 text-gray-300" />
                    </div>
                  </div>
                  {previewMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-400 flex items-center justify-between">
                        <span>••••••••</span>
                        <Eye className="size-3.5 text-gray-300" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Forgot password */}
                {previewMode === 'signin' && signinForm.showForgotPassword && (
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-teal-600 font-medium cursor-pointer hover:underline">Forgot password?</span>
                  </div>
                )}

                {/* CTA button */}
                <button className="w-full mt-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors" style={{ backgroundColor: settings.primaryColor }}>
                  {previewMode === 'signin' ? 'Sign in' : 'Create account'}
                </button>

                {/* Switch mode link */}
                <p className="text-center text-xs text-gray-500 mt-4">
                  {previewMode === 'signin'
                    ? signinForm.allowSignup
                      ? <>Don't have an account? <span className="text-teal-600 font-medium cursor-pointer">Sign up</span></>
                      : null
                    : <>Already have an account? <span className="text-teal-600 font-medium cursor-pointer">Sign in</span></>
                  }
                </p>

                {/* Terms */}
                {previewMode === 'signup' && (signinForm.termsUrl || signinForm.privacyUrl) && (
                  <p className="text-center text-[10px] text-gray-400 mt-3">
                    By signing up you agree to our{' '}
                    {signinForm.termsUrl && <span className="text-teal-600">Terms of Service</span>}
                    {signinForm.termsUrl && signinForm.privacyUrl && ' & '}
                    {signinForm.privacyUrl && <span className="text-teal-600">Privacy Policy</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Footer note */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">This is a preview — actual form may vary slightly based on your theme</p>
              <button onClick={() => setShowFormPreview(false)} className="px-4 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}