import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * "View as" lets an admin see the app through a member's eyes, READ-ONLY. The one
 * invariant that must never regress: an admin looking as a learner cannot write —
 * nothing may be recorded as the target, which is what keeps the audit-grade
 * evidence honest. These read the source so a dropped guard fails CI.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

function fnBody(src: string, name: string): string {
  const start = src.indexOf(`export async function ${name}(`);
  expect(start, `${name} not found`).toBeGreaterThan(-1);
  const rest = src.slice(start + 1);
  const end = rest.indexOf('\nexport async function');
  return end > -1 ? rest.slice(0, end) : rest;
}

describe('view-as is a read-only lens', () => {
  it('the learner mutations that record evidence refuse while viewing-as', () => {
    const learn = read('src/app/t/[slug]/learn/[courseSlug]/actions.ts');
    for (const fn of ['markLessonComplete', 'submitQuizAttempt']) {
      expect(fnBody(learn, fn), `${fn} must call assertNotViewingAs`).toMatch(
        /assertNotViewingAs\(/,
      );
    }
    // Heartbeats are fire-and-forget, so they short-circuit silently instead.
    expect(fnBody(learn, 'recordVideoProgress')).toMatch(/isViewingAs\(/);

    // Enrolment and checkout both refuse too.
    const courses = read('src/app/t/[slug]/courses/[courseSlug]/actions.ts');
    expect(courses.match(/assertNotViewingAs\(/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('resolves the target from the database, and only ever below the caller', () => {
    const src = read('src/lib/view-as.ts');
    // Re-validated every request: the real caller must be an admin, per the DB.
    expect(src).toMatch(/currentAdminRole\(/);
    expect(src).toMatch(/from\(memberships\)/);
    // Strictly-lower rank only — never a peer or a superior.
    expect(src).toMatch(/ROLE_RANK\[targetRole\] < ROLE_RANK\[callerRole\]/);
  });

  it('starting a session is admin-gated, hierarchy-checked, and audited', () => {
    const src = read('src/lib/view-as-actions.ts');
    expect(src).toMatch(/requireAdmin\(/);
    expect(src).toMatch(/canViewAs\(/);
    expect(src).toMatch(/'view_as\.start'/);
  });
});
