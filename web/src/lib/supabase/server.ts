import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Server-side Supabase client bound to the request's cookies. RLS-enforced:
 * every query runs with the caller's JWT (tenant_id + role claims). Use in
 * Server Components, Server Actions, and route handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookieOptions: { domain: env.cookieDomain() },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — safe to ignore; the
          // middleware refreshes the session cookie on the response.
        }
      },
    },
  });
}
