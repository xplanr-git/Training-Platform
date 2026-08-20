import type { Audience } from '@/lib/audience';

/**
 * The context attached to a help request so Outdure knows what the learner was
 * looking at without them reconstructing it — tenant, who they are, and where
 * in the training they were. Deliberately ONE small abstraction so a future
 * "Ask BART" consumes exactly the same object with no page rewrites (BART is
 * NOT built here). Carries no sensitive data beyond identity + location.
 */
export interface LearnerContext {
  tenantSlug: string;
  userId: string;
  email: string;
  audience: Audience | null;
  courseSlug?: string | null;
  courseTitle?: string | null;
  topicTitle?: string | null;
  learningItem?: string | null;
  path: string;
  progressPercent?: number | null;
}

export function buildLearnerContext(input: LearnerContext): LearnerContext {
  return input;
}

/** A compact, human-readable one-liner of the context for the support email/UI. */
export function summariseContext(c: LearnerContext): string {
  const bits = [
    c.courseTitle && `Course: ${c.courseTitle}`,
    c.topicTitle && `Topic: ${c.topicTitle}`,
    c.learningItem && `Item: ${c.learningItem}`,
    c.audience && `Audience: ${c.audience}`,
    typeof c.progressPercent === 'number' && `Progress: ${c.progressPercent}%`,
    `Page: ${c.path}`,
  ].filter(Boolean);
  return bits.join(' · ');
}
