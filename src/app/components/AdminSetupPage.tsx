import { useState } from 'react';
import { Shield, Mail, Lock, User, GraduationCap } from 'lucide-react';
import { supabase } from '/utils/supabase/client';

interface AdminSetupPageProps {
  onBack: () => void;
  onAdminCreated: () => void;
}

export function AdminSetupPage({ onBack, onAdminCreated }: AdminSetupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    console.log('🔧 Creating platform admin:', email);

    try {
      // 1. Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw new Error(signUpError.message);
      if (!signUpData.user) throw new Error('Signup returned no user — ensure "Confirm email" is OFF in Supabase Auth settings.');

      const userId = signUpData.user.id;

      // 2. Insert profile row as platform_admin
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            name,
            company: 'Outdure',
            role: 'platform_admin',
            enrolled_courses: [],
            completed_lessons: [],
          },
          { onConflict: 'id' }
        );
      if (profileError) throw new Error(`Profile error: ${profileError.message}`);

      console.log('✅ Platform admin created successfully');
      setSuccess(`Admin account created successfully! You can now log in with ${email}`);
      
      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Notify parent component
      setTimeout(() => {
        onAdminCreated();
      }, 2000);
    } catch (err: any) {
      console.error('❌ Admin creation error:', err);
      setError(err.message || 'Failed to create admin account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-white hover:opacity-80 transition-opacity mb-4"
          >
            <GraduationCap className="size-7" />
            <span className="text-2xl font-bold">Teachly</span>
          </button>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="size-8 text-yellow-300" />
            <h1 className="text-3xl font-bold text-white">Platform Admin Setup</h1>
          </div>
          <p className="text-purple-100">Create your first platform administrator account</p>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>Note:</strong> This will create a platform administrator account with full access to all features and company management.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Curtis Matthews"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="curtis@outdure.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Creating Admin Account...'
              ) : (
                <>
                  <Shield className="size-5" />
                  Create Platform Admin
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an admin account?{' '}
              <button
                onClick={onBack}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Back to login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
