import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Architectural fitness test for the JWT access-token hook.
 *
 * A real bug this locks in: the hook originally scoped claims to
 * `status = 'active'` memberships only, but nothing ever flipped an invited
 * member to active. Invited learners therefore received no `tenant_id` claim,
 * which broke the entire invite-based onboarding path — they could browse the
 * catalogue but every enrolment threw "No tenant context".
 *
 * A user can only obtain a session by proving control of the invited email
 * address, so scoping on an invited membership is safe. 'deactivated' must stay
 * excluded so suspending a member actually revokes their access.
 */

const MIGRATIONS = join(process.cwd(), '../db/migrations');

/** Strips `--` line comments so assertions test SQL, not prose. */
function stripComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .map((l) => l.replace(/--.*$/, ''))
    .join('\n');
}

/** The newest migration that redefines the access-token hook (comments stripped). */
function latestHookMigration(): string {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const hookFiles = files.filter((f) =>
    readFileSync(join(MIGRATIONS, f), 'utf8').includes(
      'function public.custom_access_token_hook',
    ),
  );
  expect(hookFiles.length, 'no migration defines custom_access_token_hook').toBeGreaterThan(0);
  return stripComments(
    readFileSync(join(MIGRATIONS, hookFiles[hookFiles.length - 1]), 'utf8'),
  );
}

describe('access-token hook membership scoping', () => {
  const sql = latestHookMigration();

  it('grants claims to invited members as well as active ones', () => {
    expect(sql).toMatch(/status\s+in\s*\(\s*'active'\s*,\s*'invited'\s*\)/i);
  });

  it('does not scope on active-only (the invite-onboarding bug)', () => {
    expect(sql).not.toMatch(/and\s+status\s*=\s*'active'/i);
  });

  it('never grants claims to deactivated members', () => {
    expect(sql).not.toMatch(/'deactivated'/i);
  });

  it('prefers an active membership when a user holds several', () => {
    expect(sql).toMatch(/order\s+by\s*\(\s*status\s*=\s*'active'\s*\)\s*desc/i);
  });

  it('lets the OLDEST membership win, so an injected one cannot take over', () => {
    // With `created_at desc`, a company_admin could invite an existing user's
    // address — creating a membership with no consent — and that newest row then
    // supplied the victim's tenant_id and role on their next token refresh,
    // re-pointing their whole session into the attacker's academy. Oldest-wins
    // means an established membership can never be displaced.
    expect(sql).toMatch(/created_at\s+asc/i);
    expect(sql).not.toMatch(/created_at\s+desc/i);
  });
});
