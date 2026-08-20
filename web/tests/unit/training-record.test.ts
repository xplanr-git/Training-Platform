import { describe, it, expect } from 'vitest';
import {
  buildTrainingRecordSnapshot,
  canonicalCurriculum,
  curriculumVersionHash,
  type TopicInput,
} from '@/lib/training-record';

// A trimmed but real-shaped slice of the Outdure Installer Training curriculum:
// two ordinary topics plus the warranty-critical A400 topic and its check.
const topics: TopicInput[] = [
  {
    id: 'sec-welcome',
    title: 'Welcome',
    items: [
      { id: 'l-w1', title: 'Welcome to Outdure', type: 'video' },
      { id: 'l-w2', title: 'How the training works', type: 'video' },
    ],
  },
  {
    id: 'sec-a400',
    title: 'EP 5 — A400 Fasteners',
    criticalCompetency: 'Critical fastening requirements',
    items: [
      { id: 'l-a401', title: 'A401 / A402 / A403 / A404', type: 'video' },
      { id: 'l-a409', title: 'A409 - Twistclip Screw', type: 'video' },
      { id: 'l-quiz', title: 'Knowledge Quiz A400', type: 'quiz' },
    ],
  },
];

const input = {
  course: { id: 'course-1', name: 'Outdure Installer Training' },
  certificateId: 'code-abc',
  completedAt: '2026-08-18T00:00:00.000Z',
  topics,
};

describe('buildTrainingRecordSnapshot', () => {
  it('preserves ids, display names, types and order verbatim', () => {
    const snap = buildTrainingRecordSnapshot(input);
    expect(snap.topics.map((t) => t.name)).toEqual(['Welcome', 'EP 5 — A400 Fasteners']);
    expect(snap.topics[1].items.map((i) => i.name)).toEqual([
      'A401 / A402 / A403 / A404',
      'A409 - Twistclip Screw',
      'Knowledge Quiz A400',
    ]);
    // a code-only title is kept exactly as stored — never invented/normalised
    expect(snap.topics[1].items[0].name).toBe('A401 / A402 / A403 / A404');
    expect(snap.topics[1].items.map((i) => i.type)).toEqual(['video', 'video', 'quiz']);
  });

  it('records the critical area and knowledge-check presence per topic', () => {
    const snap = buildTrainingRecordSnapshot(input);
    expect(snap.topics[0].hasKnowledgeCheck).toBe(false);
    expect(snap.topics[0].criticalArea).toBeNull();
    expect(snap.topics[1].hasKnowledgeCheck).toBe(true);
    expect(snap.topics[1].criticalArea).toBe('Critical fastening requirements');
  });

  it('summarises totals and defaults required checks to passed at completion', () => {
    const snap = buildTrainingRecordSnapshot(input);
    expect(snap.topicsTotal).toBe(2);
    expect(snap.topicsCompleted).toBe(2);
    expect(snap.requiredKnowledgeChecks).toBe(1);
    expect(snap.requiredKnowledgeChecksPassed).toBe(true);
    expect(snap.schemaVersion).toBe(1);
    expect(snap.course.name).toBe('Outdure Installer Training');
    expect(snap.certificateId).toBe('code-abc');
  });

  it('carries a curriculum version hash', () => {
    const snap = buildTrainingRecordSnapshot(input);
    expect(snap.curriculumVersionHash).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe('curriculumVersionHash — historical integrity', () => {
  it('is stable for the same curriculum shape', () => {
    expect(curriculumVersionHash(topics)).toBe(curriculumVersionHash(topics));
  });

  it('changes when a topic is renamed (so old evidence is never silently rewritten)', () => {
    const renamed: TopicInput[] = [{ ...topics[0], title: 'Welcome (updated)' }, topics[1]];
    expect(curriculumVersionHash(renamed)).not.toBe(curriculumVersionHash(topics));
  });

  it('changes when items are reordered', () => {
    const reordered: TopicInput[] = [
      topics[0],
      { ...topics[1], items: [...topics[1].items].reverse() },
    ];
    expect(curriculumVersionHash(reordered)).not.toBe(curriculumVersionHash(topics));
  });

  it('canonical form does not collide across field boundaries', () => {
    const a: TopicInput[] = [{ id: 'x', title: 'ab', items: [] }];
    const b: TopicInput[] = [{ id: 'xa', title: 'b', items: [] }];
    expect(canonicalCurriculum(a)).not.toBe(canonicalCurriculum(b));
  });
});
