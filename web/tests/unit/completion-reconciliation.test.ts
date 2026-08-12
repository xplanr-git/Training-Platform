import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

const BUILDER_ACTIONS = read('src/app/t/[slug]/admin/courses/[courseId]/builder/actions.ts');
const COMPLETION = read('src/lib/completion.ts');
const SCHEMA = read('../db/schema.ts');

/** Splits a module into `export async function name` → body (to the next export). */
function exportedFunctions(src: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /export async function (\w+)\s*\(/g;
  const starts: Array<{ name: string; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) starts.push({ name: m[1], index: m.index });
  starts.forEach((s, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : src.length;
    out.set(s.name, src.slice(s.index, end));
  });
  return out;
}

/**
 * Removing course content lowers the denominator progress is derived from, so a
 * deletion can complete a course for a learner who did nothing. Completion is
 * otherwise materialised only by a learner completion event, so an unreconciled
 * deletion leaves the course reading "100% complete" with the enrollment still
 * `active` and no certificate ever issued — and the learner cannot trigger it.
 *
 * deleteLesson had this right and said so in a comment. deleteSection did not, and
 * a section cascades to every lesson inside it — so the bug scaled with the size of
 * the tidy-up while the one guarded path handled the smallest case.
 */
describe('deletions that shrink a course reconcile completions', () => {
  const fns = exportedFunctions(BUILDER_ACTIONS);

  it('exports the shared reconciliation helper', () => {
    expect(COMPLETION).toMatch(/export async function reconcileCourseCompletions/);
  });

  it('deleteLesson reconciles', () => {
    expect(fns.get('deleteLesson')).toMatch(/reconcileCourseCompletions\(/);
  });

  it('deleteSection reconciles', () => {
    expect(fns.get('deleteSection')).toMatch(/reconcileCourseCompletions\(/);
  });

  it('every action that deletes lessons or sections reconciles', () => {
    /*
     * The durable form of this guard. The original defect was not that
     * deleteSection was written wrong — it was that the rule lived only as a
     * comment inside deleteLesson, so the next author had no way to know it
     * applied to them. This fails on the next such action instead.
     */
    const offenders: string[] = [];
    for (const [name, body] of fns) {
      const removesContent = /\.delete\(\s*(lessons|sections)\s*\)/.test(body);
      if (!removesContent) continue;
      if (!/reconcileCourseCompletions\(/.test(body)) {
        offenders.push(name);
      }
    }
    expect(
      offenders,
      `these remove lessons or sections without reconciling completions, so they can strand ` +
        `learners at 100% with no certificate: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('the cascade that makes deleteSection need this still exists', () => {
    // If lessons ever stop cascading from sections, deleting a section no longer
    // shrinks the course and this reconciliation is merely harmless rather than
    // required — worth knowing rather than assuming.
    expect(SCHEMA).toMatch(
      /sectionId: uuid\('section_id'\)[\s\S]{0,120}?references\(\(\) => sections\.id, \{ onDelete: 'cascade' \}\)/,
    );
  });
});
