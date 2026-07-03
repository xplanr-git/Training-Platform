/**
 * Audit-log helper. Every mutation on tenants, memberships, roles, courses,
 * enrollments, and certificates must route through this (CLAUDE.md §7.11).
 *
 * The per-tenant hash chain is computed and enforced by a DB trigger
 * (audit_log_hash_chain in 0001_rls_and_policies.sql) — callers never set
 * `hash`/`prev_hash`. This helper just records the intent (what changed, by
 * whom) inside the same transaction as the mutation.
 */
import { auditLog } from './schema';
import type { Db } from './client';

export interface AuditEntry {
  tenantId: string | null;
  actorUserId: string | null;
  action: string; // e.g. 'course.create', 'membership.role_change'
  resourceType: string; // e.g. 'course', 'membership'
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Append an audit row. Pass the transaction handle so the audit write commits
 * atomically with the mutation it describes.
 *
 *   await db.transaction(async (tx) => {
 *     const [row] = await tx.update(courses)...returning();
 *     await audited(tx, { tenantId, actorUserId, action: 'course.update',
 *                         resourceType: 'course', resourceId: row.id,
 *                         before, after: row });
 *   });
 */
export async function audited(tx: Db, entry: AuditEntry): Promise<void> {
  await tx.insert(auditLog).values({
    tenantId: entry.tenantId,
    actorUserId: entry.actorUserId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId ?? null,
    before: entry.before === undefined ? null : (entry.before as object),
    after: entry.after === undefined ? null : (entry.after as object),
    ip: entry.ip ?? null,
    userAgent: entry.userAgent ?? null,
    // hash is required by the schema but overwritten by the BEFORE INSERT
    // trigger; supply a placeholder so the typed insert compiles.
    hash: '',
  });
}
