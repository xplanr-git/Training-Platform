/* Supabase connection details, read from environment variables.
   Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !anonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

// Project ref is the first label of the Supabase hostname: https://<ref>.supabase.co
export const projectId = new URL(supabaseUrl).hostname.split('.')[0];
export const publicAnonKey = anonKey;
export const supabaseUrl_ = supabaseUrl;
