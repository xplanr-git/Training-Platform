import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), '..');
const CI = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8').replace(/\r\n/g, '\n');
const pkg = (dir: string) =>
  JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf8')).scripts as Record<string, string>;

/**
 * The gap this exists to close, stated plainly because it cost five commits.
 *
 * CI runs three jobs: db (drizzle-kit check + tsc), web (typecheck, lint, test, build)
 * and e2e (playwright). My local gate ran only the four web ones — `npm test` is vitest,
 * not Playwright — so a broken smoke assertion shipped and CI was RED from c1c6280
 * through c1b844e, five consecutive commits, each of which I reported as green. The db
 * job I had never run at all.
 *
 * A note in a doc would not have caught that. This does: every command CI invokes must
 * be reachable from the `verify` script of the workspace it runs in, so adding a step to
 * CI without adding it locally fails here.
 */
function ciCommandsFor(job: string): string[] {
  // Slice this job out of the YAML, then take every `run:` that is a project command.
  const start = CI.indexOf(`\n  ${job}:`);
  expect(start, `job "${job}" not found in ci.yml`).toBeGreaterThan(-1);
  const rest = CI.slice(start + 1);
  const nextJob = rest.search(/\n  [a-z0-9_-]+:\n/);
  const block = nextJob === -1 ? rest : rest.slice(0, nextJob);
  return [...block.matchAll(/^\s*(?:- name: .*\n\s*)?run: (.+)$/gm)]
    .map((m) => m[1].trim())
    // npm ci and playwright install are environment setup, not checks.
    .filter((c) => !/^npm ci$/.test(c) && !/playwright install/.test(c));
}

describe('one local command runs everything CI runs', () => {
  it('every web + e2e check is in web/ verify', () => {
    const verify = pkg('web').verify;
    expect(verify, 'web/package.json needs a "verify" script').toBeTruthy();
    for (const cmd of [...ciCommandsFor('web'), ...ciCommandsFor('e2e')]) {
      expect(verify, `CI runs "${cmd}" in web/ but verify does not`).toContain(cmd);
    }
  });

  it('every db check is in db/ verify', () => {
    const verify = pkg('db').verify;
    expect(verify, 'db/package.json needs a "verify" script').toBeTruthy();
    for (const cmd of ciCommandsFor('db')) {
      // ci.yml uses `npx tsc --noEmit`; the script may drop the npx.
      const normalised = cmd.replace(/^npx /, '');
      expect(verify, `CI runs "${cmd}" in db/ but verify does not`).toContain(normalised);
    }
  });

  it('the e2e suite is one of them, since that is what was missed', () => {
    expect(pkg('web').verify).toContain('npm run e2e');
    expect(pkg('web').e2e, 'the e2e script itself must still exist').toBe('playwright test');
  });

  it('CI still has all three jobs, so the parity check has something to compare', () => {
    for (const job of ['db', 'web', 'e2e']) {
      expect(ciCommandsFor(job).length, `job "${job}" runs no checks`).toBeGreaterThan(0);
    }
  });
});

describe('CI actions are not on a deprecated runtime', () => {
  /*
   * Every run printed: "Node.js 20 is deprecated. The following actions target
   * Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4,
   * actions/setup-node@v4." That is the ACTION runtime, not our `node-version: 20`,
   * which CLAUDE.md 9 pins deliberately to Node 20 LTS — the two are unrelated and
   * easy to conflate. v5 of both actions targets Node 24.
   */
  it('checkout and setup-node are at v5 or later', () => {
    const stale = [...CI.matchAll(/uses: (actions\/(?:checkout|setup-node))@v(\d+)/g)]
      .filter((m) => Number(m[2]) < 5)
      .map((m) => `${m[1]}@v${m[2]}`);
    expect(stale, `deprecated action runtime: ${stale.join(', ')}`).toEqual([]);
  });

  it('and every job still pins a node-version, so runners cannot drift', () => {
    const pins = [...CI.matchAll(/node-version: (\S+)/g)].map((m) => m[1]);
    expect(pins.length, 'expected one node-version pin per job').toBe(3);
    expect(new Set(pins).size, `jobs disagree on Node: ${pins.join(', ')}`).toBe(1);
  });
});
