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
  // Cookie domain for the auth session.
  //
  // Defaults to undefined — HOST-ONLY cookies — which is deterministic and, most
  // importantly, IDENTICAL on the client and the server: both scope the cookie to
  // the exact host, so a token rotation replaces it in place. That is the whole
  // point of the default.
  //
  // The previous version derived `.${NEXT_PUBLIC_ROOT_DOMAIN}`. Because
  // NEXT_PUBLIC_* is inlined into the client bundle at BUILD time but read by the
  // server at RUNTIME, a deployment where those disagreed wrote the cookie at two
  // different scopes (host-only vs `.host`). That left two `sb-*-auth-token`
  // cookies whose refresh tokens rotated out of sync, so every refresh failed
  // with `refresh_token_not_found` and the session bounced login -> dashboard ->
  // login. Host-only removes that whole failure class, and needs no env at all.
  //
  // Set NEXT_PUBLIC_COOKIE_DOMAIN only for a MULTI-TENANT subdomain deployment
  // where one session must be shared across `<tenant>.<root>` hosts — e.g.
  // `.outdure.app`. A single-tenant deployment on one host must leave it UNSET:
  // a shared-domain cookie there gains nothing and reintroduces the split-scope
  // bug. Deliberately independent of NEXT_PUBLIC_ROOT_DOMAIN (which is for
  // host->tenant ROUTING, a separate concern from cookie scope).
  cookieDomain: () => process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim() || undefined,
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
