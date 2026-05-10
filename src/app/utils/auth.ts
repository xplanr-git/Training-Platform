/**
 * auth.ts — Authentication via Supabase Auth + profiles table.
 *
 * Credentials are NEVER stored in app code. All authentication is
 * delegated to Supabase Auth. User roles and company data live in
 * the `profiles` table in the database.
 *
 * Required Supabase setup:
 * ─────────────────────────────────────────────────────────────────
 * 1. Create demo users in Supabase Dashboard → Authentication → Users
 * 2. Create a `profiles` table:
 *
 *    create table profiles (
 *      id          uuid primary key references auth.users(id) on delete cascade,
 *      name        text not null,
 *      company     text not null default '',
 *      role        text not null default 'employee',   -- 'platform_admin' | 'company_admin' | 'employee'
 *      enrolled_courses  text[] default '{}',
 *      completed_lessons text[] default '{}'
 *    );
 *
 *    alter table profiles enable row level security;
 *
 *    -- Users can read/update their own profile
 *    create policy "own profile" on profiles
 *      for all using (auth.uid() = id);
 *
 * 3. After creating each user in the Auth dashboard, insert their
 *    profile row in the Table Editor with the correct role/company.
 * ─────────────────────────────────────────────────────────────────
 */

import { supabase } from '/utils/supabase/client';
import { suspendedCompaniesStore } from '@/app/utils/suspendedCompanies';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  company: string;
  role: string;
  enrolledCourses: string[];
  completedLessons: string[];
}

export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  user?: AuthUser;
  error?: string;
}

/** Fetch the profile row that pairs with a Supabase Auth user. */
async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, company, role, enrolled_courses, completed_lessons')
    .eq('id', userId)
    .single();

  if (error || !data) {
    const msg = error?.message ?? '';
    if (msg.includes('infinite recursion')) {
      console.error(
        '🔴 RLS infinite recursion on profiles table.',
        'Run /supabase/migrations/002_fix_rls.sql in the Supabase SQL Editor to fix this.'
      );
      throw new Error('Database policy error — please contact your administrator. (RLS recursion)');
    }
    console.warn('⚠️ No profile found for user:', userId, msg);
    return null;
  }

  return {
    id: data.id,
    email: '',           // filled in by the caller from auth session
    name: data.name,
    company: data.company,
    role: data.role,
    enrolledCourses: data.enrolled_courses ?? [],
    completedLessons: data.completed_lessons ?? [],
  };
}

// ─── Sign up ──────────────────────────────────────────────────────────────────

export async function signup(
  name: string,
  email: string,
  password: string,
  company: string
): Promise<AuthResponse> {
  try {
    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Signup failed');
    }

    // 2. Create the profile row via SECURITY DEFINER RPC (bypasses RLS)
    const { error: profileError } = await supabase.rpc('create_user_profile', {
      p_id:      authData.user.id,
      p_name:    name,
      p_company: company,
      p_role:    'company_admin',
    });

    if (profileError) {
      console.error('Profile create error:', profileError.message);
      // Still proceed — admin can fix the profile row later
    }

    // 3. Sign in immediately to get a valid session
    return await signin(email, password);
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(friendlyError(error));
  }
}

// ─── Sign in ──────────────────────────────────────────────────────────────────

export async function signin(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      // Supabase returns "Invalid login credentials" for both wrong password
      // AND non-existent users — surface a clean message.
      throw new Error(error?.message || 'Invalid email or password');
    }

    let profile: AuthUser | null = null;
    try {
      profile = await fetchProfile(data.user.id);
    } catch (profileErr: any) {
      // Sign the user back out so they're not stuck in a broken session
      await supabase.auth.signOut();
      throw profileErr;
    }

    // ── Auto-provision a profile row if none exists ───────────────────────────
    // This handles users created directly in the Supabase Dashboard or via
    // other flows that didn't insert a profiles row at sign-up time.
    if (!profile) {
      const meta = data.user.user_metadata ?? {};
      const derivedName: string =
        meta.name ??
        meta.full_name ??
        (data.user.email ?? email).split('@')[0];
      const derivedCompany: string = meta.company ?? '';
      const derivedRole: string =
        meta.role && ['platform_admin', 'company_admin', 'employee'].includes(meta.role)
          ? meta.role
          : 'employee';

      // Use the SECURITY DEFINER RPC (migration 005_profile_helpers.sql).
      // This bypasses RLS entirely, so the missing INSERT policy can't block us.
      const { error: rpcErr } = await supabase.rpc('create_user_profile', {
        p_id:      data.user.id,
        p_name:    derivedName,
        p_company: derivedCompany,
        p_role:    derivedRole,
      });

      if (rpcErr) {
        await supabase.auth.signOut();
        const isMissing = rpcErr.message?.includes('function') || (rpcErr as any).code === '42883';
        throw new Error(
          isMissing
            ? 'Database setup incomplete. Please run migration 005_profile_helpers.sql ' +
              'in Supabase Dashboard → SQL Editor, then try again.'
            : `Could not create your profile: ${rpcErr.message}`
        );
      }

      // Re-fetch so the rest of the function works normally
      profile = await fetchProfile(data.user.id);

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('Profile was inserted but could not be read back. Please try signing in again.');
      }

      console.log('✅ Auto-provisioned profile for', data.user.email, '— role:', derivedRole);
    }

    const user: AuthUser = {
      ...profile,
      email: data.user.email ?? email,
    };

    // Block suspended companies (platform admins are exempt)
    if (user.role !== 'platform_admin') {
      if (suspendedCompaniesStore.isCompanySuspended(user.company)) {
        await supabase.auth.signOut();
        throw new Error(
          'Your company account has been suspended. Please contact the platform administrator.'
        );
      }
    }

    return {
      success: true,
      accessToken: data.session.access_token,
      user,
    };
  } catch (error: any) {
    console.error('Signin error:', error);
    throw new Error(friendlyError(error));
  }
}

// ─── Get current user (session restore on page load) ─────────────────────────

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return null;
    }

    let profile = await fetchProfile(session.user.id);

    // Auto-provision a profile row if none exists (same logic as signin)
    if (!profile) {
      const meta = session.user.user_metadata ?? {};
      const derivedName: string =
        meta.name ?? meta.full_name ?? (session.user.email ?? '').split('@')[0];
      const derivedCompany: string = meta.company ?? '';
      const derivedRole: string =
        meta.role && ['platform_admin', 'company_admin', 'employee'].includes(meta.role)
          ? meta.role
          : 'employee';

      const { error: rpcErr } = await supabase.rpc('create_user_profile', {
        p_id:      session.user.id,
        p_name:    derivedName,
        p_company: derivedCompany,
        p_role:    derivedRole,
      });

      if (rpcErr) {
        console.warn('Auto-provision failed on session restore:', rpcErr.message);
        return null;
      }

      profile = await fetchProfile(session.user.id);
      if (!profile) return null;
      console.log('✅ Auto-provisioned profile on session restore for', session.user.email);
    }

    const user: AuthUser = {
      ...profile,
      email: session.user.email ?? '',
    };

    // Block suspended companies on session restore
    if (user.role !== 'platform_admin') {
      if (suspendedCompaniesStore.isCompanySuspended(user.company)) {
        await supabase.auth.signOut();
        return null;
      }
    }

    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signout(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Access token (for legacy API calls that still need it) ───────────────────

export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function friendlyError(error: any): string {
  const msg: string = error?.message ?? '';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Unable to reach the authentication server. Please check your internet connection.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  return msg || 'An unexpected error occurred. Please try again.';
}