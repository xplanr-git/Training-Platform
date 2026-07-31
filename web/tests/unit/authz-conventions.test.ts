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

/** Recursively collects every `page.tsx` under a directory. */
function findPageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findPageFiles(full));
    else if (entry.name === 'page.tsx') out.push(full);
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

describe('admin pages verify the academy in the URL', () => {
  const pages = findPageFiles(ADMIN_DIR).filter(
    // The gated "coming soon" panel and the new-course form render no tenant
    // data, so they have nothing to scope.
    (f) => !/coming-soon|courses[\\/]new/.test(f),
  );

  it('finds the admin pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(11);
  });

  it.each(pages.map((f) => [f.replace(process.cwd(), '').replace(/\\/g, '/'), f]))(
    'admin page %s scopes to the URL slug via requireAdminForSlug()',
    (_label, file) => {
      const src = readFileSync(file, 'utf8');
      // Must pass the slug — the previous bare withTenant() call meant the URL's
      // academy was never checked against the caller's claims.
      expect(src).toMatch(/requireAdminForSlug\(\s*slug\s*\)/);
      // withTenant is gone; a reintroduced bare call is the exact regression.
      expect(src).not.toMatch(/withTenant\(/);
    },
  );
});

describe('tenant guards', () => {
  // Normalized: on a CRLF checkout, '\n}\n' never matches and the body slice
  // below silently widens to the rest of the file — which would let this suite
  // pass with the guard removed.
  const src = readFileSync(join(process.cwd(), 'src/lib/tenant.ts'), 'utf8').replace(
    /\r\n/g,
    '\n',
  );

  /** Extracts one top-level exported function body, failing if it can't. */
  function bodyOf(name: string): string {
    const start = src.indexOf(`export async function ${name}(`);
    expect(start, `${name} not found`).toBeGreaterThan(-1);
    const end = src.indexOf('\n}\n', start);
    expect(end, `could not delimit ${name}`).toBeGreaterThan(start);
    return src.slice(start, end);
  }

  it('refuses suspended and cancelled tenants', () => {
    // Server Actions do not render through the tenant shell, and Drizzle
    // bypasses RLS — so the status check has to live in the guard itself.
    expect(src).toMatch(/'suspended'/);
    expect(src).toMatch(/'cancelled'/);
    expect(src).toMatch(/async function assertTenantActive\(/);
  });

  it.each(['requireAdmin', 'requireAdminForSlug'])(
    '%s asserts the tenant is still active',
    (fn) => {
      expect(bodyOf(fn)).toMatch(/assertTenantActive\(|'suspended'/);
    },
  );

  it('no longer exports the opt-in withTenant guard', () => {
    // Its verification was a parameter nobody passed. requireAdminForSlug takes
    // the slug as a required argument so the check cannot be skipped.
    expect(src).not.toMatch(/export async function withTenant\(/);
  });

  it('pins every role to its own academy, with no platform_admin bypass', () => {
    const body = bodyOf('requireAdminForSlug');
    // The mismatch must actually stop the render. notFound() rather than a
    // thrown error (which renders a 500) or a 403 (which would confirm another
    // academy exists).
    expect(body).toMatch(/const tenantMismatch = ctx\.tenantId !== tenant\.id/);
    expect(body).toMatch(/if \(tenantMismatch\) notFound\(\)/);
    // A bypass here is the regression: it made pages show the URL's academy
    // while every Server Action still wrote to the caller's own tenant, so
    // saving School Settings overwrote the wrong academy.
    expect(body).not.toMatch(/role !== 'platform_admin' && ctx\.tenantId !== tenant\.id/);
  });

  it('sends signed-out and non-admin callers somewhere useful', () => {
    const body = bodyOf('requireAdminForSlug');
    expect(body).toMatch(/redirect\('\/login'\)/);
    expect(body).toMatch(/redirect\('\/dashboard'\)/);
  });
});

describe('assignable roles cannot be escalated', () => {
  const PEOPLE_ACTIONS = join(process.cwd(), 'src/app/t/[slug]/admin/people/actions.ts');
  const src = readFileSync(PEOPLE_ACTIONS, 'utf8');

  it('validates the role at runtime rather than casting it', () => {
    // `formData.get('role') as InviteRole` compiled fine and constrained
    // nothing: the role arrives from the caller and the Postgres enum accepts
    // platform_admin. Both write paths must go through the allowlist.
    expect(src.match(/parseAssignableRole\(/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(src).not.toMatch(/as InviteRole/);
  });

  it('never writes a role straight from the caller', () => {
    expect(src).not.toMatch(/\.set\(\{\s*role\s*\}\)/);
    expect(src).not.toMatch(/role: String\(/);
  });

  it('excludes platform_admin from the assignable list', () => {
    const validation = readFileSync(join(process.cwd(), 'src/lib/validation.ts'), 'utf8');
    const list = validation.slice(
      validation.indexOf('ASSIGNABLE_ROLES'),
      validation.indexOf('] as const', validation.indexOf('ASSIGNABLE_ROLES')),
    );
    expect(list).not.toMatch(/platform_admin/);
    expect(list).toMatch(/company_admin/);
  });
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
