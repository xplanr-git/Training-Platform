import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

const COURSE_PAGE = read('src/app/t/[slug]/admin/courses/[courseId]/page.tsx');
const SCHEMA = read('../db/schema.ts');

/**
 * Deleting a course is the most consequential click in the admin area, and the
 * consequence is invisible from the screen it happens on.
 *
 * The cascade is `courses -> enrollments -> certificates`, both `onDelete:
 * 'cascade'`. So removing a superseded course also destroys every certificate it
 * ever issued, and with them every public `/verify/:code` page a learner may
 * already have shown to a client or an auditor. The confirmation said only
 * "Delete this course and all its content? This cannot be undone." — "content"
 * does not read as "the credentials your learners hold".
 */
describe('deleting a course discloses what it destroys', () => {
  it('the cascade this copy describes still exists in the schema', () => {
    /*
     * The point of asserting the schema here: if someone later changes either FK to
     * `restrict` or `set null`, the copy below becomes a lie in the other direction
     * — it would warn about a loss that no longer happens. This test fails then too,
     * which is the prompt to revisit the wording rather than leave it stale.
     */
    const enrollmentsToCourses =
      /courseId: uuid\('course_id'\)[\s\S]{0,200}?references\(\(\) => courses\.id, \{ onDelete: 'cascade' \}\)/;
    const certificatesToEnrollments =
      /enrollmentId: uuid\('enrollment_id'\)[\s\S]{0,200}?references\(\(\) => enrollments\.id, \{ onDelete: 'cascade' \}\)/;

    expect(SCHEMA, 'enrollments.course_id should still cascade from courses').toMatch(
      enrollmentsToCourses,
    );
    expect(SCHEMA, 'certificates.enrollment_id should still cascade from enrollments').toMatch(
      certificatesToEnrollments,
    );
  });

  it('the confirmation names certificates and the verification links', () => {
    const confirms = [...COURSE_PAGE.matchAll(/confirm="([^"]+)"/g)].map((m) => m[1]);
    expect(confirms.length, 'expected a confirm on the course delete').toBeGreaterThan(0);

    const deleteConfirm = confirms.find((c) => /delete this course/i.test(c));
    expect(deleteConfirm, 'could not find the course delete confirmation').toBeTruthy();
    expect(deleteConfirm).toMatch(/certificate/i);
    expect(deleteConfirm).toMatch(/verification/i);
  });

  it('the danger zone shows how many certificates this course has issued', () => {
    // A real count for THIS course, not a general warning — a general one reads as
    // boilerplate and gets clicked through. It sits on the page rather than only in
    // the dialog so it is visible before the click.
    expect(COURSE_PAGE).toMatch(/issuedCertificates/);
    expect(COURSE_PAGE).toMatch(/\.from\(certificates\)/);
    expect(COURSE_PAGE, 'count the certificates, do not fetch the rows').toMatch(
      /issued: count\(\)/,
    );
  });
});
