/**
 * Learning-unit derivation (V2). Storage keeps a video/content lesson and its
 * directly-associated check as separate `lessons` rows; the learner should see
 * ONE learning item. This turns ordered lesson rows + the authored
 * `assessmentForLessonId` link into the learner-facing model.
 *
 * Two curriculum patterns are preserved:
 *  - PER-SUBJECT: a content lesson with a paired check (quiz.assessmentForLessonId
 *    === content.id) → ONE item ("A201 — 90 Bracket", video + knowledge check).
 *  - TOPIC-SUMMARY: a check with assessmentForLessonId === null → its OWN item, a
 *    distinct end-of-topic knowledge check.
 *
 * Completion is honest (§8/§10): a per-subject item is complete only when BOTH
 * its content and its check are complete; if the content is done but the check
 * is not, the item is `check_remaining`, NOT complete. This is a DISPLAY model —
 * the authoritative all-lessons-done completion that drives the certificate is
 * unchanged (see progress-derive / completion).
 */

export type LessonRow = {
  id: string;
  sectionId: string;
  position: number;
  type: string; // 'video' | 'pdf' | 'text' | 'quiz' | ...
  title: string;
  estimatedMinutes: number | null;
  assessmentForLessonId: string | null;
};

export type ItemState = 'not_started' | 'in_progress' | 'check_remaining' | 'complete';

export interface LearningItem {
  /** Stable key: the content lesson id, or the topic-check quiz id. */
  key: string;
  kind: 'lesson' | 'topic_check';
  sectionId: string;
  title: string;
  /** The lesson a learner opens for this item (content lesson, or the check). */
  openLessonId: string;
  /** Content lesson id (kind 'lesson') else null. */
  contentLessonId: string | null;
  /** Paired check id (kind 'lesson' with a check), or the check itself (topic_check). */
  checkLessonId: string | null;
  hasCheck: boolean;
  /** Content type for the icon: 'video' | 'pdf' | 'text' | 'quiz'. */
  contentType: string;
  /** Estimated minutes for the whole item (content + paired check), or null. */
  minutes: number | null;
  state: ItemState;
}

function orderRows(lessons: LessonRow[], sectionOrder: Map<string, number>): LessonRow[] {
  return [...lessons].sort((a, b) => {
    const sa = sectionOrder.get(a.sectionId) ?? 0;
    const sb = sectionOrder.get(b.sectionId) ?? 0;
    return sa - sb || a.position - b.position;
  });
}

/**
 * Derive the ordered learner-facing items for a course.
 *
 * @param lessons all lesson rows for the course
 * @param sectionOrder sectionId → ordering index (section position)
 * @param completed set of completed lesson ids (from the append-only log)
 * @param started optional set of lesson ids with partial progress (e.g. video
 *   watched but not finished) — only used to show `in_progress`.
 */
export function deriveLearningItems(
  lessons: LessonRow[],
  sectionOrder: Map<string, number>,
  completed: ReadonlySet<string>,
  started: ReadonlySet<string> = new Set(),
): LearningItem[] {
  // content lesson id → its paired check row (if any).
  const checkFor = new Map<string, LessonRow>();
  for (const l of lessons) {
    if (l.type === 'quiz' && l.assessmentForLessonId) {
      checkFor.set(l.assessmentForLessonId, l);
    }
  }

  const items: LearningItem[] = [];
  for (const l of orderRows(lessons, sectionOrder)) {
    if (l.type === 'quiz') {
      // Paired per-subject checks are folded into their content lesson below.
      if (l.assessmentForLessonId) continue;
      // Topic-summary check → its own item.
      items.push({
        key: l.id,
        kind: 'topic_check',
        sectionId: l.sectionId,
        title: l.title || 'Knowledge check',
        openLessonId: l.id,
        contentLessonId: null,
        checkLessonId: l.id,
        hasCheck: true,
        contentType: 'quiz',
        minutes: l.estimatedMinutes ?? null,
        state: completed.has(l.id) ? 'complete' : started.has(l.id) ? 'in_progress' : 'not_started',
      });
      continue;
    }
    // Content lesson (video/pdf/text/…), possibly with a paired check.
    const check = checkFor.get(l.id) ?? null;
    const contentDone = completed.has(l.id);
    const checkDone = check ? completed.has(check.id) : true;
    let state: ItemState;
    if (contentDone && checkDone) state = 'complete';
    else if (contentDone && !checkDone) state = 'check_remaining';
    else if (started.has(l.id) || (check && started.has(check.id))) state = 'in_progress';
    else state = 'not_started';

    const mins = (l.estimatedMinutes ?? 0) + (check?.estimatedMinutes ?? 0) || null;
    items.push({
      key: l.id,
      kind: 'lesson',
      sectionId: l.sectionId,
      title: l.title || 'Untitled',
      openLessonId: l.id,
      contentLessonId: l.id,
      checkLessonId: check?.id ?? null,
      hasCheck: !!check,
      contentType: l.type,
      minutes: mins,
      state,
    });
  }
  return items;
}

export interface ItemProgress {
  totalItems: number;
  doneItems: number;
  percent: number;
  itemsLeft: number;
  minutesLeft: number | null;
  minutesLeftIsPartial: boolean;
}

/** Learner-facing counts/%/time over ITEMS, not storage rows. */
export function itemProgress(items: LearningItem[]): ItemProgress {
  const totalItems = items.length;
  const doneItems = items.filter((i) => i.state === 'complete').length;
  const percent = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);
  const remaining = items.filter((i) => i.state !== 'complete');
  const ests = remaining
    .map((i) => i.minutes)
    .filter((m): m is number => typeof m === 'number' && Number.isFinite(m) && m > 0);
  const minutesLeft = ests.length ? ests.reduce((a, b) => a + b, 0) : null;
  const minutesLeftIsPartial = ests.length > 0 && ests.length < remaining.length;
  return {
    totalItems,
    doneItems,
    percent,
    itemsLeft: totalItems - doneItems,
    minutesLeft,
    minutesLeftIsPartial,
  };
}

/** Per-section item counts + minutes, for the course-map topic headers. */
export function sectionItemMeta(
  items: LearningItem[],
): Map<string, { count: number; minutes: number | null; partial: boolean; done: number }> {
  const m = new Map<
    string,
    { count: number; minutes: number | null; partial: boolean; done: number }
  >();
  for (const it of items) {
    const cur = m.get(it.sectionId) ?? { count: 0, minutes: null, partial: false, done: 0 };
    cur.count += 1;
    if (it.state === 'complete') cur.done += 1;
    m.set(it.sectionId, cur);
  }
  // minutes per section (with partial flag)
  const bySec = new Map<string, LearningItem[]>();
  for (const it of items) {
    const arr = bySec.get(it.sectionId) ?? [];
    arr.push(it);
    bySec.set(it.sectionId, arr);
  }
  for (const [sid, arr] of bySec) {
    const ests = arr
      .map((i) => i.minutes)
      .filter((x): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0);
    const rec = m.get(sid)!;
    rec.minutes = ests.length ? ests.reduce((a, b) => a + b, 0) : null;
    rec.partial = ests.length > 0 && ests.length < arr.length;
  }
  return m;
}

/** Learner-facing noun for the workload count. */
export function itemsLabel(n: number): string {
  return n === 1 ? 'item' : 'items';
}

/**
 * Learner-facing heading for a standalone knowledge-check lesson. Storage titles
 * were authored as internal labels ("A201 - Quiz", "Knowledge Quiz A200", "T Clip
 * - Quiz"); the learner should never see the word "Quiz" (the surface calls these
 * "knowledge check" everywhere else). Normalises the wording while preserving the
 * subject code/name, and is idempotent so it stays safe if the data is later
 * cleaned up (a title already reading "Knowledge check …" is returned unchanged).
 */
export function checkLessonHeading(title: string): string {
  const t = (title ?? '').trim();
  if (!t) return 'Knowledge check';
  // "Knowledge Quiz A200" -> "Knowledge check A200"
  let s = t.replace(/knowledge\s+quiz/i, 'Knowledge check');
  // Strip a trailing "- Quiz" / "– Quiz" / "Quiz": "A201 - Quiz" -> "A201".
  s = s.replace(/\s*[-–—]?\s*quiz\s*$/i, '').trim();
  if (!s) return 'Knowledge check';
  if (/knowledge check/i.test(s)) return s;
  return `Knowledge check — ${s}`;
}

/**
 * Learner-facing topic heading. Strips the internal "EP N —" episode-number
 * prefix that leaked from the import ("EP 1 — Qwickbuild Overview and A100" ->
 * "Qwickbuild Overview and A100"); topics are already ordered, so the episode
 * number is redundant internal labelling. Only an unambiguous leading prefix is
 * removed; if nothing meaningful remains, the original title is kept so a bare
 * "EP 1" never becomes empty. Idempotent.
 */
export function topicHeading(title: string): string {
  const t = (title ?? '').trim();
  const stripped = t.replace(/^EP\s*\d+\s*[—–-]\s*/i, '').trim();
  return stripped.length > 0 ? stripped : t;
}
