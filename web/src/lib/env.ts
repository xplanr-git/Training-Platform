/** Centralised, validated access to environment variables. */

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: () =>
    required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  serviceRoleKey: () =>
    required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  databaseUrl: () => required('DATABASE_URL', process.env.DATABASE_URL),
  rootDomain: () => process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000',
  stripeSecretKey: () => required('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: () =>
    required('STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET),
  appOrigin: () => {
    const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000';
    return root.startsWith('localhost') ? `http://${root}` : `https://${root}`;
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
  // api.video. The base URL is required rather than defaulted so a key can
  // never silently hit the billed production environment: sandbox is
  // https://sandbox.api.video, production https://ws.api.video.
  apiVideoKey: () => process.env.APIVIDEO_API_KEY ?? null,
  apiVideoBaseUrl: () => process.env.APIVIDEO_BASE_URL ?? 'https://sandbox.api.video',
  emailFrom: () =>
    process.env.EMAIL_FROM ??
    `noreply@${(process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost').split(':')[0]}`,
} as const;
