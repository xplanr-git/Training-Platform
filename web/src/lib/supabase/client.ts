'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

/** Browser-side Supabase client (RLS-enforced via the user's session). */
export function createClient() {
  return createBrowserClient(env.supabaseUrl(), env.supabaseAnonKey());
}
