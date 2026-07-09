import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Architectural fitness test for the authorization boundary.
 *
 * Server Actions run with the service-role Drizzle connection, which BYPASSES
 * RLS — so authorization must be enforced in app code, not the database. Two
 * classes of bug were fixed and are locked in here:
 *
 *  1. Admin actions must call `requireAdmin()` (enforces role), never just
 *     `withTenant()` (which only resolves the tenant and lets any authenticated
 *     member through). See src/lib/tenant.ts.
 *  2. Learner completion actions must scope work to the caller's enrollment via
 *     `verifyEnrollment()` and validate the target lesson with
 *     `assertLessonInCourse()`, so course/lesson ids can't be forged.
 *
 * This test reads the source directly, so removing a guard fails CI even though
 * types still compile.
 */

const ADMIN_DIR = join(process.cwd(), 'src/app/t/[slug]/admin');
const LEARN_ACTIONS = join(
  process.cwd(),
  'src/app/t/[slug]/learn/[courseSlug]/actions.ts',
);

/** Recursively collects every `actions.ts` under a directory. */
function findActionFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findActionFiles(full));
    else if (entry.name === 'actions.ts') out.push(full);
  }
  return out;
}

describe('admin Server Actions authorization', () => {
  const files = findActionFiles(ADMIN_DIR);

  it('finds the admin action files', () => {
    // Guards against a silently-empty test if the tree is refactored/moved.
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it.each(files.map((f) => [f.replace(process.cwd(), '').replace(/\\/g, '/'), f]))(
    'admin action %s enforces role via requireAdmin() and never uses withTenant()',
    (_label, file) => {
      const src = readFileSync(file, 'utf8');
      expect(src).toMatch(/requireAdmin\(/);
      // withTenant() resolves the tenant but does NOT check role — banned here.
      expect(src).not.toMatch(/withTenant\(/);
      // Direct getTenantContext() in an action would sidestep the role check too.
      expect(src).not.toMatch(/getTenantContext\(/);
    },
  );
});

describe('learner completion actions integrity', () => {
  it('exists', () => {
    expect(existsSync(LEARN_ACTIONS)).toBe(true);
  });

  it('scopes completion to the enrollment and validates the lesson', () => {
    const src = readFileSync(LEARN_ACTIONS, 'utf8');
    // Ownership: the enrollment must belong to the caller + tenant.
    expect(src).toMatch(/verifyEnrollment\(/);
    // Integrity: the target lesson must belong to the enrollment's course.
    expect(src).toMatch(/assertLessonInCourse\(/);
  });
});
