import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WEB = resolve(process.cwd());
const ROOT = resolve(WEB, '..');
const strip = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const code = (...p: string[]) => strip(readFileSync(join(WEB, ...p), 'utf8'));

const JOIN = code('src', 'app', 't', '[slug]', 'join', 'actions.ts');
const PEOPLE = code('src', 'app', 't', '[slug]', 'admin', 'people', 'actions.ts');
const LOGIN = code('src', 'app', 'login', 'actions.ts');
const SCHEMA = readFileSync(join(ROOT, 'db', 'schema.ts'), 'utf8');

/**
 * Public sign-up is gated on admin approval (owner decision, 2026-08-06), and
 * the whole design rests on one property: a 'pending' membership grants nothing.
 *
 * That holds STRUCTURALLY rather than by a permission check — the access-token
 * hook and primaryMembership both select `status in ('active','invited')`, so a
 * pending row produces no tenant claim and resolves to no academy. The danger is
 * that this is invisible: adding 'pending' to either list would silently turn an
 * unapproved request into a member, with nothing on screen to show it. Hence the
 * assertions below, which are the only thing standing between those two lists
 * and a quiet regression.
 */
describe('a pending membership grants nothing', () => {
  it('the status exists in the schema', () => {
    expect(SCHEMA).toMatch(/pgEnum\('membership_status',\s*\[[\s\S]*?'pending'/);
  });

  it('the migration that adds it is append-only and additive', () => {
    const files = readdirSync(join(ROOT, 'db', 'migrations')).filter((f) => f.endsWith('.sql'));
    const added = files.filter((f) =>
      readFileSync(join(ROOT, 'db', 'migrations', f), 'utf8').includes("ADD VALUE 'pending'"),
    );
    expect(added, 'exactly one migration should introduce it').toHaveLength(1);
    // SQL comments stripped: this file's own comment explains that two
    // DROP CONSTRAINT statements were removed from what drizzle-kit generated,
    // and the assertion below matched that explanation rather than any code.
    const sql = readFileSync(join(ROOT, 'db', 'migrations', added[0]), 'utf8').replace(
      /^\s*--.*$/gm,
      '',
    );
    // ALTER TYPE ... ADD VALUE cannot remove or rewrite anything. If this file
    // ever grows a DROP or an UPDATE it is no longer the safe migration it claims.
    expect(sql).not.toMatch(/\bDROP\b|\bUPDATE\b|\bDELETE\b/i);
  });

  it('the access-token hook still ignores it', () => {
    // The newest hook migration wins; assert on all of them so an older one
    // cannot be reintroduced.
    const dir = join(ROOT, 'db', 'migrations');
    const hooks = readdirSync(dir).filter((f) => /hook/.test(f) && f.endsWith('.sql'));
    expect(hooks.length).toBeGreaterThan(0);
    for (const f of hooks) {
      const sql = readFileSync(join(dir, f), 'utf8');
      if (!/status in \(/.test(sql)) continue;
      expect(sql, `${f} grants a tenant claim to pending members`).not.toMatch(
        /status in \([^)]*'pending'/,
      );
    }
  });

  it('primaryMembership still ignores it, so sign-in resolves to no academy', () => {
    expect(LOGIN).toMatch(/inArray\(memberships\.status, \['active', 'invited'\]\)/);
    expect(LOGIN).not.toMatch(/'pending'/);
  });

  it('an admin cannot set someone to pending through the generic status action', () => {
    // SETTABLE_MEMBER_STATUSES is the allowlist parseMemberStatus enforces.
    const validation = code('src', 'lib', 'validation.ts');
    const list = validation.match(/SETTABLE_MEMBER_STATUSES = \[([^\]]*)\]/)?.[1] ?? '';
    expect(list, 'no settable statuses found').not.toBe('');
    expect(list).not.toContain('pending');
  });

  it('someone waiting is told so, rather than told to ask', () => {
    // They land on the apex dashboard, which used to say "ask an administrator
    // to invite you" — advice they had already taken.
    const dash = code('src', 'app', 'dashboard', 'page.tsx');
    expect(dash).toMatch(/eq\(memberships\.status, 'pending'\)/);
    expect(dash).toMatch(/waiting for an administrator/);
  });
});

describe('requesting access', () => {
  it('creates the membership as pending, as a learner', () => {
    expect(JOIN).toMatch(/status: 'pending'/);
    expect(JOIN).toMatch(/role: 'learner'/);
  });

  it('is rate limited before it does anything at all', () => {
    /*
     * Not merely "before createUser". An earlier version of this test asserted
     * only that, and passed when the check was moved inside the branch that mints
     * an account — which left an existing address able to make unlimited
     * requests, and let an attacker hammer the tenant and user lookups unmetered.
     * Found by sabotage: the weaker assertion stayed green.
     *
     * So: the limit must precede the first database read AND the first branch.
     */
    expect(JOIN).toMatch(/RULES\.join/);
    const limit = JOIN.indexOf('rateLimitExceeded(');
    const firstRead = JOIN.search(/await db\b|db\s*\n?\s*\.select\(/);
    const firstBranch = JOIN.search(/^\s*if \(/m);
    expect(limit).toBeGreaterThan(-1);
    expect(firstRead).toBeGreaterThan(-1);
    expect(limit, 'the limit must precede the first database read').toBeLessThan(firstRead);
    expect(limit, 'the limit must not sit inside a branch').toBeLessThan(firstBranch);
  });

  it('requires a name, for the same reason invitations do', () => {
    expect(JOIN).toMatch(/if \(!name\)/);
    const msg = JOIN.match(/error: '([^']*name[^']*)'/i)?.[1] ?? '';
    expect(msg.toLowerCase()).toContain('certificate');
  });

  it('does not reveal whether an address already has an account', () => {
    /*
     * Account enumeration: distinguishing "request sent" from "you already have
     * an account" turns a public form into an oracle for which of the dealer
     * network's addresses are registered. Every branch returns the same shape.
     */
    expect(JOIN, 'the already-a-member branch must not say so').toMatch(
      /if \(already\) return \{ ok: true \};/,
    );
    const createFail = JOIN.slice(JOIN.indexOf('if (error || !created.user)'));
    expect(createFail.slice(0, 400)).toMatch(/return \{ ok: true \}/);
  });

  it('never overwrites a name that is already set', () => {
    // `users` is one row shared across academies.
    expect(JOIN).toMatch(/if \(!existingUser!\.name\.trim\(\)\)/);
  });

  it('leaves academy provisioning alone', () => {
    // /signup provisions a whole tenant and must not be reachable from here.
    expect(JOIN).not.toMatch(/provisionTenant|insert\(tenants\)/);
  });

  it('is audited', () => {
    expect(JOIN).toMatch(/action: 'membership\.requested'/);
  });
});

describe('accepting and declining', () => {
  const accept = PEOPLE.slice(PEOPLE.indexOf('export async function acceptJoinRequest'));
  const decline = PEOPLE.slice(PEOPLE.indexOf('export async function declineJoinRequest'));

  it('both exist and require an admin', () => {
    expect(accept).toMatch(/requireAdmin\(\)/);
    expect(decline).toMatch(/requireAdmin\(\)/);
  });

  it('both act only on a row that is still pending, in this academy', () => {
    /*
     * The status is in the WHERE clause rather than read-then-written, so these
     * cannot resurrect a deactivated member or re-decide a settled request — and
     * the tenant scope matters because Drizzle bypasses RLS.
     */
    for (const [label, src] of [
      ['accept', accept],
      ['decline', decline],
    ] as const) {
      const clause = src.slice(0, src.indexOf('.returning()'));
      expect(clause, `${label} is not scoped to the tenant`).toMatch(
        /eq\(memberships\.tenantId, ctx\.tenantId!\)/,
      );
      expect(clause, `${label} does not require the row to still be pending`).toMatch(
        /eq\(memberships\.status, 'pending'\)/,
      );
    }
  });

  it('accept moves to invited, not straight to active', () => {
    // 'invited' lets the existing activateMembershipOnSignIn flip them to
    // 'active' on their next sign-in. Jumping to 'active' would record a
    // sign-in that never happened.
    expect(accept).toMatch(/\.set\(\{ status: 'invited' \}\)/);
    expect(accept).not.toMatch(/\.set\(\{ status: 'active' \}\)/);
  });

  it('decline removes the membership and NOT the account', () => {
    expect(decline).toMatch(/\.delete\(memberships\)/);
    // The same person may belong to another academy through the shared users row.
    expect(decline).not.toMatch(/deleteUser|\.delete\(users\)/);
  });

  it('both are audited, and a failed match reports rather than passing silently', () => {
    expect(accept).toMatch(/action: 'membership\.request_accepted'/);
    expect(decline).toMatch(/action: 'membership\.request_declined'/);
    expect(accept).toMatch(/if \(!updated\) throw new Error/);
    expect(decline).toMatch(/if \(!deleted\) throw new Error/);
  });

  it('a mail failure cannot undo an acceptance', () => {
    const mail = accept.indexOf('sendInviteEmail');
    const commit = accept.indexOf('if (!updated) throw');
    expect(mail).toBeGreaterThan(commit);
    expect(accept.slice(commit, mail)).toMatch(/try \{/);
  });
});

describe('the way in is reachable', () => {
  /*
   * The route shipped linked from nowhere. A public sign-up page that only exists
   * if you already know its URL is not public sign-up, and nothing in the test
   * suite noticed — every other assertion was about what /join DOES, not whether
   * anyone can get to it.
   */
  const HOME = code('src', 'app', 'page.tsx');

  it('the marketing page offers it', () => {
    expect(HOME).toMatch(/href="\/join"/);
    expect(HOME).toMatch(/Request access/);
  });

  it('and only where it can resolve', () => {
    /*
     * /join is tenant-scoped — middleware rewrites it to /t/<slug>/join — so on a
     * bare multi-tenant apex there is no academy to join and the link would 404.
     * Gated on the single-tenant slug, which is the only thing that lets the apex
     * resolve one.
     */
    expect(HOME).toMatch(/defaultTenantSlug\(\)/);
    const gate = HOME.indexOf('defaultTenantSlug()');
    const link = HOME.indexOf('href="/join"');
    expect(gate).toBeLessThan(link);
    expect(HOME).toMatch(/\{joinable && \(/);
  });

  it('the page it points at exists', () => {
    // A link to a route nobody created is the same defect one step later.
    expect(() => code('src', 'app', 't', '[slug]', 'join', 'page.tsx')).not.toThrow();
  });
});

describe('the storefront is navigable, because / now lands there', () => {
  /*
   * When `/` started following the session, the catalogue became the landing page
   * for every signed-in learner — and it had NO navigation whatsoever. Three
   * course links and nothing else: no way to reach the dashboard, no way to sign
   * out, on a page people now arrive at by default. sign-out-button.tsx's own
   * doc comment says it "needs to be reachable from every signed-in surface
   * (admin sidebar + learner header)", which this had quietly stopped honouring.
   *
   * Found by the owner looking at the deployed site, not by any test here — the
   * routing change was verified as "signed-out still gets marketing" and nobody
   * asked what the signed-in destination actually contained.
   */
  const STORE = code('src', 'app', 't', '[slug]', 'page.tsx');

  it('knows whether anyone is signed in', () => {
    expect(STORE).toMatch(/auth\.getSession\(\)/);
    expect(STORE).toMatch(/const signedIn =/);
  });

  it('reads the viewer inside the existing Promise.all, not in series', () => {
    // The §1 work parallelised this page's queries; a serial session read would
    // hand that back for a nav bar.
    // Anchored on the QUERY batch specifically: the page opens with a different
    // Promise.all that destructures params, and matching that one instead made
    // this assertion fail against correct code.
    const batch = STORE.slice(STORE.indexOf('const [countRows'));
    const end = batch.indexOf(']);');
    expect(end).toBeGreaterThan(-1);
    expect(batch.slice(0, end)).toMatch(/auth\.getSession\(\)/);
  });

  it('offers a signed-in learner their dashboard and a way out', () => {
    expect(STORE).toMatch(/href="\/dashboard"/);
    expect(STORE).toMatch(/<SignOutButton/);
  });

  it('and offers a visitor both ways in', () => {
    expect(STORE).toMatch(/href="\/login"/);
    expect(STORE).toMatch(/href="\/join"/);
  });

  it('shows one set or the other, never both', () => {
    // A "Sign in" link beside a "Sign out" button would be nonsense.
    expect(STORE).toMatch(/\{signedIn \?/);
  });
});

describe('signing out does not make you wait for work nobody sees', () => {
  /*
   * Reported as "signing out takes ages". The button awaited a global signOut —
   * a network round trip to Supabase to revoke the refresh token everywhere,
   * preceded by a token refresh if the access token had expired — and then did
   * router.push('/login') FOLLOWED BY router.refresh(). That refresh re-renders
   * the route being LEFT, which since `/` started landing on the catalogue is the
   * slowest page in the app: 854ms warm and 2.9s cold, measured against
   * production. So the button sat on "Signing out…" re-rendering a page the
   * person was already navigating away from.
   */
  const BTN = code('src', 'components', 'sign-out-button.tsx');

  it('clears the session locally, without a network round trip', () => {
    expect(BTN).toMatch(/signOut\(\{ scope: 'local' \}\)/);
  });

  it('leaves with one hard navigation, not two RSC fetches', () => {
    expect(BTN).toMatch(/window\.location\.replace\('\/login'\)/);
    expect(BTN, 'router.refresh re-renders the page being left').not.toMatch(/router\.refresh\(/);
    expect(BTN, 'a soft push keeps the client cache holding a signed-in render').not.toMatch(
      /router\.push\(/,
    );
  });

  it('uses replace, so Back does not return to a page with no session', () => {
    expect(BTN).not.toMatch(/window\.location\.assign|window\.location\.href =/);
  });

  it('still reports that it is working', () => {
    // A hard navigation is not instant; without this the button looks dead.
    expect(BTN).toMatch(/Signing out/);
    expect(BTN).toMatch(/disabled=\{pending\}/);
  });

  it('the storefront does not re-validate a session the middleware just validated', () => {
    /*
     * getUser() is a network call to Supabase; getSession() reads the cookie.
     * The middleware calls getUser on every request already, so using it again
     * here made the landing page pay twice — for a decision about which nav
     * links to draw.
     */
    const STORE = code('src', 'app', 't', '[slug]', 'page.tsx');
    expect(STORE).toMatch(/auth\.getSession\(\)/);
    expect(STORE, 'getUser here duplicates the middleware').not.toMatch(/auth\.getUser\(\)/);
    // And the middleware must still be the one doing real validation.
    expect(code('src', 'lib', 'supabase', 'middleware.ts')).toMatch(/auth\.getUser\(\)/);
  });
});
