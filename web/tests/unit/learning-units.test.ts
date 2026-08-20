import { describe, it, expect } from 'vitest';
import {
  deriveLearningItems,
  itemProgress,
  sectionItemMeta,
  checkLessonHeading,
  type LessonRow,
} from '@/lib/learning-units';

/**
 * The learner-facing model: a content lesson + its directly-paired check is ONE
 * item; a topic-summary check (no pairing) is its own item. Completion is honest
 * — an item with a paired check is complete only when BOTH parts are done.
 */

// EP with 2 subjects (each video + paired quiz) and 1 topic-summary check.
const S = 'sec-1';
const order = new Map([[S, 0]]);
const rows: LessonRow[] = [
  {
    id: 'v1',
    sectionId: S,
    position: 0,
    type: 'video',
    title: 'A201 — 90 Bracket',
    estimatedMinutes: 4,
    assessmentForLessonId: null,
  },
  {
    id: 'q1',
    sectionId: S,
    position: 1,
    type: 'quiz',
    title: 'A201 - Quiz',
    estimatedMinutes: null,
    assessmentForLessonId: 'v1',
  },
  {
    id: 'v2',
    sectionId: S,
    position: 2,
    type: 'video',
    title: 'A202 — Joiner Bracket',
    estimatedMinutes: 6,
    assessmentForLessonId: null,
  },
  {
    id: 'q2',
    sectionId: S,
    position: 3,
    type: 'quiz',
    title: 'A202 - Quiz',
    estimatedMinutes: null,
    assessmentForLessonId: 'v2',
  },
  {
    id: 'qs',
    sectionId: S,
    position: 4,
    type: 'quiz',
    title: 'Knowledge Quiz A200',
    estimatedMinutes: null,
    assessmentForLessonId: null,
  },
];

describe('deriveLearningItems groups a subject video + its check into one item', () => {
  it('collapses 5 storage rows into 3 learner-facing items', () => {
    const items = deriveLearningItems(rows, order, new Set());
    expect(items.map((i) => i.title)).toEqual([
      'A201 — 90 Bracket',
      'A202 — Joiner Bracket',
      'Knowledge Quiz A200',
    ]);
  });

  it('a paired check is folded in, not shown as its own item', () => {
    const items = deriveLearningItems(rows, order, new Set());
    expect(items.find((i) => i.key === 'q1')).toBeUndefined();
    const a201 = items.find((i) => i.key === 'v1')!;
    expect(a201.hasCheck).toBe(true);
    expect(a201.checkLessonId).toBe('q1');
    expect(a201.contentType).toBe('video');
  });

  it('a topic-summary check stays a distinct end-of-topic item', () => {
    const items = deriveLearningItems(rows, order, new Set());
    const topic = items.find((i) => i.key === 'qs')!;
    expect(topic.kind).toBe('topic_check');
    expect(topic.contentType).toBe('quiz');
  });
});

describe('completion is honest across a unit', () => {
  it('content done but check not = check_remaining, NOT complete', () => {
    const items = deriveLearningItems(rows, order, new Set(['v1']));
    expect(items.find((i) => i.key === 'v1')!.state).toBe('check_remaining');
  });

  it('content + check done = complete', () => {
    const items = deriveLearningItems(rows, order, new Set(['v1', 'q1']));
    expect(items.find((i) => i.key === 'v1')!.state).toBe('complete');
  });

  it('a content lesson with no check completes on the content alone', () => {
    const noCheck: LessonRow[] = [
      {
        id: 'v9',
        sectionId: S,
        position: 0,
        type: 'video',
        title: 'Overview',
        estimatedMinutes: 2,
        assessmentForLessonId: null,
      },
    ];
    const items = deriveLearningItems(noCheck, order, new Set(['v9']));
    expect(items[0].state).toBe('complete');
  });

  it('topic-summary check completes when passed', () => {
    const items = deriveLearningItems(rows, order, new Set(['qs']));
    expect(items.find((i) => i.key === 'qs')!.state).toBe('complete');
  });
});

describe('item-based counts and time', () => {
  it('counts items, not storage rows, and sums content + check minutes', () => {
    const items = deriveLearningItems(rows, order, new Set());
    const p = itemProgress(items);
    expect(p.totalItems).toBe(3);
    expect(p.doneItems).toBe(0);
    expect(p.percent).toBe(0);
    // v1 (4) + v2 (6) + topic check (no estimate) → 10, partial because the check has none
    expect(p.minutesLeft).toBe(10);
    expect(p.minutesLeftIsPartial).toBe(true);
  });

  it('percent reflects completed items', () => {
    const items = deriveLearningItems(rows, order, new Set(['v1', 'q1']));
    const p = itemProgress(items);
    expect(p.doneItems).toBe(1);
    expect(p.percent).toBe(33);
    expect(p.itemsLeft).toBe(2);
  });

  it('checkLessonHeading never shows "Quiz" to the learner', () => {
    expect(checkLessonHeading('A201 - Quiz')).toBe('Knowledge check — A201');
    expect(checkLessonHeading('T Clip - Quiz')).toBe('Knowledge check — T Clip');
    expect(checkLessonHeading('A831 / A832 - Quiz')).toBe('Knowledge check — A831 / A832');
    // "Knowledge Quiz A200" normalises in place (idempotent, no double label).
    expect(checkLessonHeading('Knowledge Quiz A200')).toBe('Knowledge check A200');
    expect(checkLessonHeading('Knowledge check A200')).toBe('Knowledge check A200');
    // Degenerate titles fall back cleanly.
    expect(checkLessonHeading('Quiz')).toBe('Knowledge check');
    expect(checkLessonHeading('')).toBe('Knowledge check');
  });

  it('sectionItemMeta reports per-topic item count + done', () => {
    const items = deriveLearningItems(rows, order, new Set(['v1', 'q1']));
    const meta = sectionItemMeta(items).get(S)!;
    expect(meta.count).toBe(3);
    expect(meta.done).toBe(1);
    expect(meta.minutes).toBe(10);
  });
});
