import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Set DATABASE_URL to the v2 (fresh) Supabase project's Postgres connection
    // string. Never the legacy project — v2 is applied to a clean database.
    url: process.env.DATABASE_URL ?? '',
  },
  // Keep generated SQL readable and reviewable.
  verbose: true,
  strict: true,
});
