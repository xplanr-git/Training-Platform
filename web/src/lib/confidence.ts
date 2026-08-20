/**
 * Installation-confidence model — a CORE Academy outcome and product signal.
 *
 * Confidence is self-reported and ordinal. It is NOT competency, Trained status,
 * verified status, or warranty eligibility, and it never confers or changes any
 * of them. It is captured to answer real Outdure decisions (where do installers
 * feel unready? does the training move readiness?) and, later and INTERNALLY, to
 * compare felt confidence against demonstrated knowledge.
 *
 * Confidence is asked ONLY at meaningful practical-capability boundaries, never
 * per lesson — that would be survey fatigue. The capabilities below are grouped
 * from the REAL curriculum (the A-series component ranges), not invented buckets.
 * Note there is deliberately NO standalone "bracing" checkpoint: bracing appears
 * only as a component (A207 Brace Plate Bracket) inside the structural range, so
 * it lives under `structural`.
 */

export type ConfidenceLevel = 'not_yet' | 'somewhat' | 'confident' | 'very';

/** One small, consistent, ordinal scale (low → high). No numbers/stars/emoji/colour. */
export const CONFIDENCE_LEVELS: { key: ConfidenceLevel; label: string }[] = [
  { key: 'not_yet', label: 'Not confident yet' },
  { key: 'somewhat', label: 'Somewhat confident' },
  { key: 'confident', label: 'Confident' },
  { key: 'very', label: 'Very confident' },
];

/** Levels that earn the optional "what would help?" follow-up. */
export const LOW_LEVELS: ConfidenceLevel[] = ['not_yet', 'somewhat'];

/** Optional, structured follow-up reasons — never required, never blocking. */
export const FOLLOWUP_REASONS: { key: string; label: string }[] = [
  { key: 'more_practice', label: 'More hands-on practice' },
  { key: 'see_on_site', label: 'Seeing it done on a real site' },
  { key: 'unclear', label: 'Something wasn’t clear' },
  { key: 'tools_parts', label: 'Having the right tools or parts' },
];

export function isConfidenceLevel(v: unknown): v is ConfidenceLevel {
  return v === 'not_yet' || v === 'somewhat' || v === 'confident' || v === 'very';
}

/**
 * Practical capabilities, in curriculum order. `sections` are matched by the real
 * section titles; a capability's confidence question fires once, at the end of the
 * LAST contributing topic the course actually contains (so a capability split
 * across early and late episodes is asked only after all its content is seen).
 */
export type Capability = {
  key: string;
  /** Short internal label (used in the learner overview later, and in analytics). */
  label: string;
  /** Contextual, job-shaped prompt worded from the topic content. */
  prompt: string;
  /** Real section titles that make up this capability. */
  sections: string[];
};

export const CAPABILITIES: Capability[] = [
  {
    key: 'structural',
    label: 'Structural connections',
    prompt:
      'How confident are you selecting and installing the correct brackets for the joist and beam connections on a real project?',
    // A300 (EP 4) is the same brackets in the A110-profile variants — the same
    // capability, not a distinct one — so it folds in here rather than earning a
    // seventh checkpoint. This also moves the checkpoint to after the A300 check.
    sections: [
      'EP 2 — Qwickbuild Most Common Brackets',
      'EP 3 — A200 Range',
      'EP 4 — A300 Range (for A110)',
    ],
  },
  {
    key: 'deck_clips',
    label: 'Deck-board fixing',
    prompt:
      'How confident are you fixing the deck boards with the correct clips on a real project?',
    sections: ['EP 6 — A500 Clips'],
  },
  {
    key: 'fasteners',
    label: 'Fasteners',
    // Kept general: not every project uses bolts (they're rare on QwickBuild
    // decks), so name the category — "fasteners" — rather than list components.
    prompt: 'How confident are you choosing and using the correct fasteners on a real project?',
    sections: ['EP 5 — A400 Fasteners', 'EP 7 — A600 Screws for Hardwood'],
  },
  {
    key: 'tile',
    label: 'Tile system',
    prompt: 'How confident are you installing the tile system on a real project?',
    sections: ['EP 8 — A700 Tile System'],
  },
  {
    key: 'turf',
    label: 'Turf system',
    prompt: 'How confident are you installing the turf system on a real project?',
    sections: ['EP 9 — A800 Turf System', 'EP 10 — Additional A800 Items'],
  },
  {
    key: 'supports',
    label: 'Supports & setout',
    prompt:
      'How confident are you setting out and installing the supports correctly on a real project?',
    sections: ['EP 1 — Qwickbuild Overview and A100', 'EP 11 — A900 Supports'],
  },
];

type SectionLite = { id: string; position: number; title: string };
type LessonLite = { id: string; sectionId: string; type: string };

/**
 * The lesson at which a capability's confidence question appears: the LAST lesson
 * of the highest-positioned section the capability contains — i.e. after the
 * learner has both learned AND been tested. For five of six capabilities that
 * last lesson is the terminal knowledge check, so confidence lands on the check
 * page once it's answered ("just tested — how do you feel about doing it for
 * real?"). For turf, whose final section ends on a video with its checks earlier,
 * it lands on that last video — still after every turf check. Returns null if the
 * course has none of the capability's sections.
 */
export function triggerLessonId(
  cap: Capability,
  sections: SectionLite[],
  orderedLessons: LessonLite[],
): string | null {
  const present = sections
    .filter((s) => cap.sections.includes(s.title))
    .sort((a, b) => b.position - a.position);
  const last = present[0];
  if (!last) return null;
  const inSection = orderedLessons.filter((l) => l.sectionId === last.id);
  return inSection.at(-1)?.id ?? null;
}

/** capabilityKey → its trigger lessonId, for the whole course. */
export function capabilityTriggers(
  sections: SectionLite[],
  orderedLessons: LessonLite[],
): { key: string; label: string; prompt: string; lessonId: string }[] {
  return CAPABILITIES.map((cap) => {
    const lessonId = triggerLessonId(cap, sections, orderedLessons);
    return lessonId ? { key: cap.key, label: cap.label, prompt: cap.prompt, lessonId } : null;
  }).filter((x): x is { key: string; label: string; prompt: string; lessonId: string } => !!x);
}
