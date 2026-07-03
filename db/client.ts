/**
 * Database client for the v2 schema.
 *
 * Two connection modes:
 *  - `db`        — request-scoped, RLS-enforced. Use in Server Actions / route
 *                  handlers where the caller's JWT is present. All tenant scoping
 *                  is handled by RLS from the JWT claims.
 *  - `serviceDb` — service-role, bypasses RLS. Use ONLY in trusted server code
 *                  (webhooks, Inngest jobs, tenant provisioning). Never expose.
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
