import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Service-role Supabase client — bypasses RLS and can call auth.admin.*.
 * Server-only; never import into client components. Use for trusted operations
 * like creating auth users during tenant provisioning.
 */
export function createAdminClient() {
  return createClient(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
