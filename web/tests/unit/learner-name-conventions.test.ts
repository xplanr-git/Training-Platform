import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');
/** Comments stripped: a guard satisfied by its own explanatory prose proves nothing. */
const code = (...p: string[]) =>
  readFileSync(join(SRC, ...p), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const ACTIONS = code('app', 't', '[slug]', 'admin', 'people', 'actions.ts');
const FORM = code('app', 't', '[slug]', 'admin', 'people', 'invite-form.tsx');

/**
 * A learner's name is unrepairable once blank, so it has to be right at entry.
 *
 * `users.name` is NOT NULL DEFAULT '', and the invite form left the field
 * optional next to a required email. A blank one reaches the certificate, and
 * there is nowhere to fix it afterwards — verified by exhaustion, not inference:
 * the only two writes to `users` are inserts (signup and invite), there is no
 * profile or account route, /auth/set-password collects a password only, and the
 * People table renders the name as inert text. Re-inviting could not fix it
 * either, because the insert sits inside `if (!userId)`.
 *
 * So: required at the door, and fillable when it is already blank.
 */
describe('an invitation cannot create a nameless learner', () => {
  it('the Server Action rejects a blank name', () => {
    // Server-side is the load-bearing half: a Server Action is directly
    // invocable, so the form attribute is a courtesy, not a constraint.
    expect(ACTIONS).toMatch(/if\s*\(\s*!name\s*\)/);
  });

  it('it rejects before any write, not after', () => {
    const guard = ACTIONS.search(/if\s*\(\s*!name\s*\)/);
    const firstWrite = ACTIONS.search(/db\s*\n?\s*\.(insert|update)\(|db\.transaction\(/);
    expect(guard).toBeGreaterThan(-1);
    expect(firstWrite).toBeGreaterThan(-1);
    expect(guard, 'the name check must precede the first write').toBeLessThan(firstWrite);
  });

  it('the name is trimmed, so whitespace is not a name', () => {
    expect(ACTIONS).toMatch(/formData\.get\('name'\)[^\n]*\)\s*\.trim\(\)/);
  });

  it('the form marks the field required', () => {
    const nameInput = FORM.match(/<Input[^>]*id="inv-name"[^>]*\/>/s)?.[0] ?? '';
    expect(nameInput, 'no inv-name input found').not.toBe('');
    expect(nameInput).toMatch(/\brequired\b/);
  });

  it('the error says why the name matters, not just that it is missing', () => {
    // "Name is required" gives an admin no reason to care. The certificate does.
    const msg = ACTIONS.match(/error:\s*'([^']*name is required[^']*)'/i)?.[1] ?? '';
    expect(msg, 'no name-required message found').not.toBe('');
    expect(msg.toLowerCase()).toContain('certificate');
  });
});

describe('a name typed for someone already known is not thrown away', () => {
  /*
   * The insert sits inside `if (!userId)`, so for an email that already had a
   * `users` row the typed name was silently discarded while the form reported
   * "Invitation sent." That is the only path that can repair an existing blank,
   * so it now fills the name — but only when blank.
   */
  it('a blank existing name gets filled', () => {
    // `db.` or `tx.`: the write now runs inside a transaction so it can be
    // audited alongside — `users` is global, so this rename shows up on every
    // academy the person belongs to. Matching either keeps the assertion about
    // the BEHAVIOUR rather than about which handle performs it.
    expect(ACTIONS).toMatch(/(db|tx)\s*\.update\(users\)\s*\.set\(\{\s*name\s*\}\)/);
  });

  it('and a name that is already set is never overwritten', () => {
    // `users` is one global row shared across academies (looked up by email,
    // memberships unique on (tenant,user)). An unconditional update would let
    // this academy rename the person on another academy's certificates.
    expect(ACTIONS).toMatch(/!\s*existingUser!?\.?\.?name\.trim\(\)/);
    const update = ACTIONS.search(/\.update\(users\)/);
    const cond = ACTIONS.search(/!\s*existingUser!?\.?\.?name\.trim\(\)/);
    expect(cond).toBeGreaterThan(-1);
    expect(cond, 'the blank check must gate the update').toBeLessThan(update);
  });

  it('the update is scoped to that one user id', () => {
    const tail = ACTIONS.slice(ACTIONS.search(/\.update\(users\)/));
    // `userId!` as well as `userId`: inside a transaction callback TypeScript no
    // longer narrows the outer let, so the non-null assertion is required. The
    // scoping — one user id, never a broader predicate — is what matters.
    expect(tail.slice(0, 200)).toMatch(/\.where\(eq\(users\.id,\s*userId!?\)\)/);
  });

  it('the fill is audited, because `users` is shared across academies', () => {
    // A write with effects on another academy's certificates and no record of
    // who caused it is exactly what CLAUDE.md §7.11 exists to prevent.
    const tail = ACTIONS.slice(ACTIONS.search(/\.update\(users\)/));
    expect(tail.slice(0, 600)).toMatch(/audited\(tx,/);
    expect(tail.slice(0, 600)).toMatch(/'user\.name_filled'/);
  });
});

describe('nothing renders a bare empty learner name', () => {
  /*
   * The em-dash fallback was already in place at all three display sites and no
   * test protected it, so "This certifies that" followed by nothing was one
   * deleted `|| '—'` away.
   */
  const sites: Array<[string, string[]]> = [
    ['verify page', ['app', 'verify', '[code]', 'page.tsx']],
    ['admin certificates', ['app', 't', '[slug]', 'admin', 'certificates', 'page.tsx']],
    ['admin people', ['app', 't', '[slug]', 'admin', 'people', 'page.tsx']],
  ];

  for (const [label, path] of sites) {
    it(`${label} falls back rather than printing an empty string`, () => {
      expect(code(...path)).toMatch(/(learnerName|\bm\.name|\bname)\s*\|\|\s*'—'/);
    });
  }

  it('the certificate heading and the name are still separate elements', () => {
    // If they were ever concatenated, the fallback would read "This certifies
    // that —" as one string and the guard above would stop meaning anything.
    const verify = code('app', 'verify', '[code]', 'page.tsx');
    expect(verify).toMatch(/This certifies that<\/p>/);
  });
});
