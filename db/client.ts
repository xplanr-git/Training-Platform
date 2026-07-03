/**
 * Drizzle client for the v2 schema.
 *
 * IMPORTANT: this is a DIRECT Postgres connection. It connects as the database
 * role in DATABASE_URL (service/owner), so it BYPASSES row-level security. RLS
 * protects the Supabase-JS / PostGREST path (browser + session-scoped server
 * queries); it does NOT constrain this connection.
 *
 * Use `db` only in trusted server-only code — tenant provisioning, Stripe
 * webhooks, Inngest jobs, aggregations, migrations — and ALWAYS scope queries
 * by `tenant_id` yourself (call withTenant() first to resolve/verify the
 * tenant). For request-scoped, RLS-enforced reads/writes on behalf of a user,
 * use the Supabase client instead.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
export type Db = typeof db;
export { schema };
