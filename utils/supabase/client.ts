import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Returns the current user's Supabase access token, or null if not signed in.
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Builds fetch headers authorized with the current user's session token.
// Falls back to the anon key when there is no session (e.g. public reads).
export async function authHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return { ...extra, Authorization: `Bearer ${token ?? publicAnonKey}` };
}
