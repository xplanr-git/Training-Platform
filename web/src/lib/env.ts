/** Centralised, validated access to environment variables. */

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  serviceRoleKey: () =>
    required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  databaseUrl: () => required('DATABASE_URL', process.env.DATABASE_URL),
  rootDomain: () => process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000',
  // Single-tenant mode: serve one academy straight from the apex, so `/admin`
  // works without a subdomain. Unset = multi-tenant subdomain routing only.
  // Server-only on purpose — no client code needs it (admin links are already
  // written as bare `/admin/*` paths and resolved by the rewrite).
  defaultTenantSlug: () => process.env.DEFAULT_TENANT_SLUG?.trim() || null,
  stripeSecretKey: () => required('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: () => required('STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET),
  appOrigin: () => {
    const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000';
    // Compare the HOST, not a string prefix: startsWith('localhost') also
    // matched real domains like localhost.example.com and served them http://.
    const host = root.split(':')[0];
    const loopback = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    return `${loopback ? 'http' : 'https'}://${root}`;
  },
  // Cookie domain so the auth session is shared across tenant subdomains
  // (e.g. `.outdure.app`). Returns undefined on localhost/IP where a leading-dot
  // domain isn't valid — sessions there stay host-only (local dev limitation).
  cookieDomain: () => {
    const host = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000').split(':')[0];
    if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return undefined;
    }
    return `.${host}`;
  },
  resendApiKey: () => process.env.RESEND_API_KEY ?? null,
  // Bunny Stream. Library id + per-library access key; the CDN hostname is only
  // needed for direct HLS (the iframe embed is keyed on the library id).
  bunnyApiKey: () => process.env.BUNNY_API_KEY ?? null,
  bunnyLibraryId: () => process.env.BUNNY_LIBRARY_ID ?? null,
  bunnyCdnHostname: () => process.env.BUNNY_CDN_HOSTNAME ?? null,
  emailFrom: () =>
    process.env.EMAIL_FROM ??
    `noreply@${(process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost').split(':')[0]}`,
} as const;
