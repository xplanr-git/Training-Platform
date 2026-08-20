import { db, eq, and, memberships } from '@training-platform/db';
import type { Audience } from '@/lib/audience';

/**
 * The learner's audience for this tenant, or null when unknown/unset. Server-only
 * (imports db) — never import from a client component; the client-safe constants
 * and helpers live in `@/lib/audience`.
 */
export async function getAudience(userId: string, tenantId: string): Promise<Audience | null> {
  const [row] = await db
    .select({ audience: memberships.audience })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)))
    .limit(1);
  return (row?.audience as Audience | null) ?? null;
}
