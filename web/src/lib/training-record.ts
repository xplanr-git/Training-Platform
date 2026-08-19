import { createHash } from 'node:crypto';

/**
 * Immutable completion snapshot — the authoritative historical record of what
 * curriculum a learner completed AT THE TIME their certificate was issued.
 *
 * Why this exists: the Academy has no curriculum-version model (no version field
 * on courses/lessons/quizzes). The public /verify page reads `courses.title`
 * live, and the credential JSON stores only the course title — nothing captures
 * which topics and items existed. So a Training Record generated later from the
 * CURRENT curriculum would misrepresent what an older learner actually did once
 * content changes. This snapshot is built once, at completion, and stored in the
 * append-only `certificates.credential` JSONB (no migration). The Training Record
 * (certificate pages 2/3) renders FROM this snapshot, never from the live course.
 *
 * Deliberately proportionate — NOT a general LMS version-management system. It
 * preserves display NAMES as well as ids, so later renaming never rewrites
 * historical evidence, plus a cheap structural version hash so Outdure can later
 * tell which curriculum shape a learner completed.
 *
 * These are pure functions (no db, no `server-only`) so the snapshot shape and
 * the hash are unit-testable without a database; the caller supplies the facts.
 */

export interface SnapshotItem {
  /** Lesson id as it existed at completion. */
  id: string;
  /** Lesson display name, verbatim, as it existed at completion. Never invented. */
  name: string;
  /** Lesson type (video | quiz | pdf | text | scorm | live). */
  type: string;
}

export interface SnapshotTopic {
  /** Section id as it existed at completion. */
  id: string;
  /** Section display name, verbatim, as it existed at completion. */
  name: string;
  /** Ordered learning items in this topic. */
  items: SnapshotItem[];
  /** Whether this topic contained a knowledge check (a quiz lesson). */
  hasKnowledgeCheck: boolean;
  /**
   * The warranty-critical competency area this topic teaches, if any (e.g.
   * "Critical fastening requirements"). Null for an ordinary topic. Recorded
   * because a passed critical check is the strongest completion evidence.
   */
  criticalArea: string | null;
}

export interface TrainingRecordSnapshot {
  /** Snapshot format version, so a future reader can migrate old snapshots. */
  schemaVersion: 1;
  course: { id: string; name: string };
  /** The certificate's verification code — ties the record to the credential. */
  certificateId: string;
  /** ISO timestamp the certificate was issued / course completed. */
  completedAt: string;
  /** Short structural hash of the ordered (topic, item) shape at completion. */
  curriculumVersionHash: string;
  topicsTotal: number;
  topicsCompleted: number;
  /** How many topics carried a knowledge check that had to be passed. */
  requiredKnowledgeChecks: number;
  /**
   * True when every required check was passed. At 100% course completion this is
   * guaranteed — a critical check only completes its lesson on a critical pass,
   * so a fully-complete course already implies every critical check passed (see
   * competency.ts). The caller may still pass it explicitly.
   */
  requiredKnowledgeChecksPassed: boolean;
  /** Ordered topics, each with its ordered items. */
  topics: SnapshotTopic[];
}

export interface TopicInput {
  id: string;
  title: string;
  criticalCompetency?: string | null;
  items: { id: string; title: string; type: string }[];
}

export interface SnapshotInput {
  course: { id: string; name: string };
  certificateId: string;
  /** ISO timestamp. */
  completedAt: string;
  /** Topics in curriculum order; each topic's items in order. */
  topics: TopicInput[];
  /**
   * Whether every required knowledge check was passed. Defaults to true because
   * this snapshot is only built at 100% completion, which implies it; pass it
   * explicitly if ever built in another context.
   */
  requiredChecksPassed?: boolean;
}

// ASCII control separators cannot appear in human curriculum titles, so the
// canonical string is unambiguous (no "a"+"bc" === "ab"+"c" collision).
const FIELD_SEP = String.fromCharCode(31); // unit separator
const ITEM_SEP = String.fromCharCode(30); // record separator
const TOPIC_SEP = String.fromCharCode(29); // group separator

/**
 * Deterministic canonical serialisation of the ordered curriculum shape.
 * Order-sensitive and name-sensitive: reordering topics/items or renaming any
 * of them yields a different string (and so a different version hash), which is
 * exactly what lets Outdure detect that the curriculum changed after issue.
 */
export function canonicalCurriculum(topics: readonly TopicInput[]): string {
  return topics
    .map((t) =>
      [
        t.id,
        t.title,
        t.items.map((i) => [i.id, i.title, i.type].join(FIELD_SEP)).join(ITEM_SEP),
      ].join(FIELD_SEP),
    )
    .join(TOPIC_SEP);
}

/** Short (12 hex char) structural version hash of the ordered curriculum. */
export function curriculumVersionHash(topics: readonly TopicInput[]): string {
  return createHash('sha256').update(canonicalCurriculum(topics)).digest('hex').slice(0, 12);
}

/**
 * Build the immutable training-record snapshot. Preserves ids, display names,
 * types and order exactly as supplied — it never invents or normalises a name
 * (a code-only lesson title stays code-only; content naming is a separate task).
 */
export function buildTrainingRecordSnapshot(input: SnapshotInput): TrainingRecordSnapshot {
  const topics: SnapshotTopic[] = input.topics.map((t) => ({
    id: t.id,
    name: t.title,
    items: t.items.map((i) => ({ id: i.id, name: i.title, type: i.type })),
    hasKnowledgeCheck: t.items.some((i) => i.type === 'quiz'),
    criticalArea: t.criticalCompetency ?? null,
  }));

  return {
    schemaVersion: 1,
    course: { id: input.course.id, name: input.course.name },
    certificateId: input.certificateId,
    completedAt: input.completedAt,
    curriculumVersionHash: curriculumVersionHash(input.topics),
    topicsTotal: topics.length,
    topicsCompleted: topics.length,
    requiredKnowledgeChecks: topics.filter((t) => t.hasKnowledgeCheck).length,
    requiredKnowledgeChecksPassed: input.requiredChecksPassed ?? true,
    topics,
  };
}
