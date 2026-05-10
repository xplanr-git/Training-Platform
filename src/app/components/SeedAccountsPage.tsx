/**
 * SeedAccountsPage — One-time demo account creator.
 * Access via: add ?seed=1 to the URL, e.g. https://yourapp.com?seed=1
 * Uses supabase.auth.signUp() (the official API) so credentials are
 * always stored correctly — no raw SQL inserts needed.
 *
 * Run this ONCE. After both accounts show ✅ you can remove ?seed=1.
 *
 * IMPORTANT: Before running, go to:
 *   Supabase Dashboard → Authentication → Providers → Email
 *   and turn OFF "Confirm email" so accounts are active immediately.
 */

import { useState } from 'react';
import { supabase } from '/utils/supabase/client';
import { CheckCircle, XCircle, Loader, ShieldCheck, ArrowRight } from 'lucide-react';

interface AccountDef {
  email: string;
  password: string;
  name: string;
  company: string;
  role: 'platform_admin' | 'company_admin' | 'employee';
}

const DEMO_ACCOUNTS: AccountDef[] = [
  {
    email: 'curtis@outdure.com',
    password: 'outdure',
    name: 'Curtis',
    company: 'Outdure',
    role: 'platform_admin',
  },
  {
    email: 'admin@democompany.com',
    password: 'outdure',
    name: 'Demo Admin',
    company: 'Demo Company',
    role: 'company_admin',
  },
];

type Status = 'idle' | 'running' | 'ok' | 'exists' | 'error';

interface AccountStatus {
  status: Status;
  message: string;
}

export function SeedAccountsPage({ onDone }: { onDone: () => void }) {
  const [statuses, setStatuses] = useState<AccountStatus[]>(
    DEMO_ACCOUNTS.map(() => ({ status: 'idle', message: '' }))
  );
  const [running, setRunning] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const setStatus = (i: number, status: Status, message: string) => {
    setStatuses(prev => {
      const next = [...prev];
      next[i] = { status, message };
      return next;
    });
  };

  const seedAccount = async (account: AccountDef, i: number) => {
    setStatus(i, 'running', 'Creating account…');

    try {
      // 1 — Try sign-up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      });

      let userId: string | null = null;

      if (signUpError) {
        // "User already registered" → try signing in instead to get the ID
        if (signUpError.message.toLowerCase().includes('already registered') ||
            signUpError.message.toLowerCase().includes('already exists')) {
          setStatus(i, 'running', 'Account exists — verifying…');

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.password,
          });

          if (signInError || !signInData.user) {
            throw new Error(`Account exists but sign-in failed: ${signInError?.message}`);
          }

          userId = signInData.user.id;
          await supabase.auth.signOut();
        } else {
          throw new Error(signUpError.message);
        }
      } else if (signUpData.user) {
        userId = signUpData.user.id;
      } else {
        // Email confirmation is ON — we can't get the ID yet
        throw new Error(
          'Email confirmation is enabled. Please turn it OFF in Supabase Dashboard → ' +
          'Authentication → Providers → Email → "Confirm email" toggle.'
        );
      }

      if (!userId) throw new Error('Could not resolve user ID.');

      // 2 — Upsert the profile row
      setStatus(i, 'running', 'Writing profile…');

      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          name: account.name,
          company: account.company,
          role: account.role,
          enrolled_courses: [],
          completed_lessons: [],
        },
        { onConflict: 'id' }
      );

      if (profileError) {
        throw new Error(`Profile error: ${profileError.message}`);
      }

      setStatus(i, 'ok', 'Ready ✓');
    } catch (err: any) {
      console.error(`Seed error for ${account.email}:`, err);
      setStatus(i, 'error', err.message || 'Unknown error');
    }
  };

  const runSeed = async () => {
    setRunning(true);
    for (let i = 0; i < DEMO_ACCOUNTS.length; i++) {
      await seedAccount(DEMO_ACCOUNTS[i], i);
    }
    setRunning(false);
    setAllDone(true);
  };

  const allOk = statuses.every(s => s.status === 'ok' || s.status === 'exists');

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">Demo Account Setup</h1>
            <p className="text-gray-400 text-sm">One-time seed for Teachly demo accounts</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <p className="text-amber-300 text-sm">
            <strong>Before running:</strong> Go to{' '}
            <span className="font-mono text-amber-200">
              Supabase Dashboard → Authentication → Providers → Email
            </span>{' '}
            and turn <strong>OFF</strong> "Confirm email", then come back here.
          </p>
        </div>

        {/* Account rows */}
        <div className="space-y-3 mb-6">
          {DEMO_ACCOUNTS.map((account, i) => {
            const s = statuses[i];
            return (
              <div
                key={account.email}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{account.email}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {account.role.replace('_', ' ')} · {account.company}
                  </p>
                  {s.message && (
                    <p
                      className={`text-xs mt-1 ${
                        s.status === 'error' ? 'text-red-400' : 'text-gray-400'
                      }`}
                    >
                      {s.message}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {s.status === 'idle' && (
                    <div className="size-6 rounded-full border-2 border-gray-700" />
                  )}
                  {s.status === 'running' && (
                    <Loader className="size-5 text-blue-400 animate-spin" />
                  )}
                  {s.status === 'ok' && (
                    <CheckCircle className="size-6 text-green-400" />
                  )}
                  {s.status === 'exists' && (
                    <CheckCircle className="size-6 text-blue-400" />
                  )}
                  {s.status === 'error' && (
                    <XCircle className="size-6 text-red-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {!allDone ? (
          <button
            onClick={runSeed}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors"
          >
            {running ? (
              <>
                <Loader className="size-4 animate-spin" />
                Creating accounts…
              </>
            ) : (
              <>
                Create Demo Accounts
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            {allOk ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <CheckCircle className="size-6 text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-medium">All accounts ready!</p>
                <p className="text-green-400/70 text-sm mt-1">
                  You can now sign in with <span className="font-mono">curtis@outdure.com</span> / <span className="font-mono">outdure</span>
                </p>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <XCircle className="size-6 text-red-400 mx-auto mb-2" />
                <p className="text-red-300 font-medium">Some accounts failed</p>
                <p className="text-red-400/70 text-sm mt-1">Check the errors above and try again.</p>
              </div>
            )}

            <button
              onClick={onDone}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-3 transition-colors"
            >
              Go to Login
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {/* Credentials reminder */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Demo credentials</p>
          <div className="space-y-1">
            <p className="text-gray-300 text-sm font-mono">curtis@outdure.com / outdure</p>
            <p className="text-gray-300 text-sm font-mono">admin@democompany.com / outdure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
