/**
 * Drizzle client for the v2 schema.
 *
 * IMPORTANT: this is a DIRECT Postgres connection. It connects as the database
 * role in DATABASE_URL (service/owner), so it BYPASSES row-level security. RLS
 * protects the Supabase-JS / PostGREST path (browser + session-scoped server
 * queries); it does NOT constrain this connection.
 *
 * Use `db` only in trusted server-only code — tenant provisioning, Stripe
 * webhooks, Inngest jobs, aggregations, migrations — and ALWAYS scope queries by
 * `tenant_id` yourself.
 *
 * Authorization comes from the guards in web/src/lib/tenant.ts:
 * `requireAdmin()` for Server Actions and `requireAdminForSlug(slug)` for pages.
 * Both resolve the caller's role from `memberships` rather than from the JWT
 * claim, and both return a context whose `tenantId` is the one to filter on.
 * (This comment used to point at `withTenant()`, which was removed months ago
 * because its verification was an argument nobody passed.)
 *
 * There is no "use the Supabase client instead" alternative for data: since
 * migration 0014 the `authenticated` role has no write access through PostgREST
 * at all, and the app makes zero data calls that way. Everything goes through
 * here, which is exactly why the tenant scoping has to be deliberate.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// Reuse a single postgres-js pool across HMR reloads / module re-evaluation
// (otherwise dev leaks a pool per reload and exhausts the pooler's client
// limit). Point DATABASE_URL at Supabase's TRANSACTION pooler (port 6543) for
// app runtime; `prepare: false` is required for transaction-mode pooling. Keep
// per-instance connections small (DB_POOL_MAX, default 5).
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};
const client =
  globalForDb.__pgClient ??
  postgres(url, { prepare: false, max: Number(process.env.DB_POOL_MAX ?? 5) });
if (process.env.NODE_ENV !== 'production') globalForDb.__pgClient = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export { schema };
