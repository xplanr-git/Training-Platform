import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const EMAIL = read('src/lib/email.ts');
const PEOPLE_ACTIONS = read('src/app/t/[slug]/admin/people/actions.ts');

/** One exported function body from lib/email.ts. */
function emailBody(name: string): string {
  const start = EMAIL.indexOf(`export async function ${name}(`);
  expect(start, `${name} not found`).toBeGreaterThan(-1);
  const end = EMAIL.indexOf('\n}\n', start);
  expect(end, `could not delimit ${name}`).toBeGreaterThan(start);
  return EMAIL.slice(start, end);
}

/**
 * Accepting a request someone made is the opposite direction of travel from
 * inviting them.
 *
 * acceptJoinRequest sent sendInviteEmail — "You've been invited to X" / "Accept
 * your invitation →" — to a person who already had an account, had already chosen
 * a password at /join, and had already asked. It told them to accept something
 * they initiated and pointed at a step they had completed. The likeliest reading
 * is that their first attempt failed and this is a retry.
 */
describe('an accepted join request is not worded as an invitation', () => {
  it('acceptJoinRequest sends the acceptance email, not the invite', () => {
    const start = PEOPLE_ACTIONS.indexOf('export async function acceptJoinRequest(');
    expect(start, 'acceptJoinRequest not found').toBeGreaterThan(-1);
    const body = PEOPLE_ACTIONS.slice(start, PEOPLE_ACTIONS.indexOf('\n}\n', start));
    expect(body).toMatch(/sendJoinAcceptedEmail\(/);
    expect(body, 'the invite wording does not fit a request the user made').not.toMatch(
      /sendInviteEmail\(/,
    );
  });

  it('the genuine invite path still sends the invite email', () => {
    // The fix must not blur the two. An admin inviting someone unprompted IS an
    // invitation, and that path keeps its wording.
    expect(PEOPLE_ACTIONS).toMatch(/sendInviteEmail\(/);
  });

  it('the acceptance copy never tells them to accept anything', () => {
    const body = emailBody('sendJoinAcceptedEmail');
    expect(body).not.toMatch(/invited/i);
    expect(body).not.toMatch(/accept your/i);
    // It points at signing in, because they already have a password.
    expect(body).toMatch(/Sign in/);
  });

  it('the invite copy is untouched', () => {
    const body = emailBody('sendInviteEmail');
    expect(body).toMatch(/invited/i);
  });
});
