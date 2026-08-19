import { db, eq, and, inArray, progressEvents } from '@training-platform/db';

/**
 * What confidence a learner has already answered — so we never re-ask. Reads the
 * append-only log once and folds it into a small state object: whether the
 * course baseline / outcome are done, and which practical-capability checkpoints
 * are done. Server-only (imports db) — never import from a client component.
 */
export async function getConfidenceState(enrollmentId: string): Promise<{
  baseline: boolean;
  outcome: boolean;
  topics: Set<string>;
}> {
  const rows = await db
    .select({ eventType: progressEvents.eventType, payload: progressEvents.payload })
    .from(progressEvents)
    .where(
      and(
        eq(progressEvents.enrollmentId, enrollmentId),
        inArray(progressEvents.eventType, ['course_confidence', 'topic_confidence']),
      ),
    );

  let baseline = false;
  let outcome = false;
  const topics = new Set<string>();
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    if (r.eventType === 'course_confidence') {
      if (p.phase === 'baseline') baseline = true;
      else if (p.phase === 'outcome') outcome = true;
    } else if (r.eventType === 'topic_confidence' && typeof p.capabilityKey === 'string') {
      topics.add(p.capabilityKey);
    }
  }
  return { baseline, outcome, topics };
}
