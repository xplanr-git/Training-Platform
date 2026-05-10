import { useState, useEffect } from 'react';
import { Save, Globe, Search, Palette, Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '/utils/supabase/client';
import { toast } from 'sonner';

interface WebsiteSettingsPageProps {
  companyName: string;
}

type SettingsTab = 'general' | 'domains' | 'seo' | 'branding';

export function WebsiteSettingsPage({ companyName }: WebsiteSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Derive company ID
  const companyId = companyName.replace(/\s+/g, '-').toLowerCase();

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
          </div>
        </div>
      </div>
    </div>
  );
}