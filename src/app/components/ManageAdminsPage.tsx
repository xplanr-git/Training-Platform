import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Mail, Calendar, ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '/utils/supabase/client';

interface Admin {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  isOwner: boolean;
}

interface ManageAdminsPageProps {
  currentUser: any;
  onNavigate: (page: any) => void;
  onSubPageChange: (subPage: string) => void;
}

export function ManageAdminsPage({ currentUser, onNavigate, onSubPageChange }: ManageAdminsPageProps) {
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  // ── Load: query profiles where role = 'platform_admin' ───────────────────────
  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError('');

      // profiles join auth.users is not possible from client, so we fetch profiles
      // and then resolve emails from the session user + any stored email field.
      const { data, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, company, role, created_at')
        .eq('role', 'platform_admin')
        .order('created_at', { ascending: true });

      if (profilesError) throw new Error(profilesError.message);

      const mapped: Admin[] = (data ?? []).map((p, idx) => ({
        id: p.id,
        name: p.name,
        // We can't read auth.users.email from the client — show what we know.
        // The current user's own email we always have; others show a placeholder.
        email: p.id === currentUser?.id ? currentUser.email : `(id: ${p.id.slice(0, 8)}…)`,
        createdAt: p.created_at,
        lastLogin: p.id === currentUser?.id ? 'Now' : 'Unknown',
        // First platform_admin created is treated as owner
        isOwner: idx === 0,
      }));

      setAdmins(mapped);
    } catch (err: any) {
      console.error('Load admins error:', err);
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  // ── Create: signUp + insert profile ──────────────────────────────────────────
  const handleAddAdmin = async () => {
    if (!newAdminName || !newAdminEmail || !newAdminPassword) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // 1. Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
      });

      if (signUpError) throw new Error(signUpError.message);
      if (!signUpData.user) throw new Error('Signup returned no user — check that "Confirm email" is OFF in Supabase Dashboard.');

      const userId = signUpData.user.id;

      // 2. Insert profile as platform_admin
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          name: newAdminName,
          company: 'Outdure',
          role: 'platform_admin',
          enrolled_courses: [],
          completed_lessons: [],
        },
        { onConflict: 'id' }
      );

      if (profileError) throw new Error(`Profile error: ${profileError.message}`);

      // 3. Add to local list
      const newAdmin: Admin = {
        id: userId,
        name: newAdminName,
        email: newAdminEmail,
        createdAt: new Date().toISOString(),
        lastLogin: 'Never',
        isOwner: false,
      };

      setAdmins(prev => [...prev, newAdmin]);
      setShowAddAdmin(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
    } catch (err: any) {
      console.error('Create admin error:', err);
      setError(err.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete: remove profile row (auth user stays — avoids needing service key) ─
  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
      setError('');

      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', adminId);

      if (deleteError) throw new Error(deleteError.message);

      setAdmins(prev => prev.filter(a => a.id !== adminId));
    } catch (err: any) {
      console.error('Delete admin error:', err);
      setError(err.message || 'Failed to remove admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('admin')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="size-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Platform Administrators</h1>
            <p className="text-gray-600 mt-1">Manage users who have full access to the platform</p>
          </div>
          <button
            onClick={() => setShowAddAdmin(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus className="size-5" />
            Add Admin
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Add Admin Form */}
        {showAddAdmin && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Administrator</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Enter admin name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleAddAdmin}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {saving && <Loader className="size-4 animate-spin" />}
                  {saving ? 'Creating…' : 'Create Admin'}
                </button>
                <button
                  onClick={() => {
                    setShowAddAdmin(false);
                    setNewAdminName('');
                    setNewAdminEmail('');
                    setNewAdminPassword('');
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admins List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Current Administrators</h2>
            <p className="text-sm text-gray-600 mt-1">{admins.length} total admin{admins.length !== 1 ? 's' : ''}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
              <Loader className="size-5 animate-spin" />
              Loading admins…
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="size-10 mx-auto mb-3 text-gray-300" />
              <p>No platform admins found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <div key={admin.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="size-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {admin.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{admin.name}</h3>
                          {admin.isOwner && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="size-4" />
                            {admin.email}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            Joined {new Date(admin.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Last login: {admin.lastLogin}</p>
                      </div>
                    </div>

                    {!admin.isOwner && admin.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove admin"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">About Platform Administrators</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                Platform administrators have full access to all companies, users, courses, and settings across Teachly.
                They can view detailed analytics, manage company accounts, and oversee the entire platform.
                Only grant admin access to trusted team members.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
