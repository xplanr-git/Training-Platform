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
  resendApiKey: () => process.env.RESEND_API_KEY ?? null,
  emailFrom: () =>
    process.env.EMAIL_FROM ??
    `noreply@${(process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost').split(':')[0]}`,
} as const;
