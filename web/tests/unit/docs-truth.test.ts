import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Guards on the documentation that a reader acts on.
 *
 * CLAUDE.md calls itself the single source of truth and was, at the time these
 * were written, the most drifted file in the repo: `Last reviewed: 2026-05-11`
 * while §7.13 cited work from August, §3 describing a 5-table prototype against
 * 22 real tables, and §4 presenting five FIXED security issues as live and
 * exploitable — which sent every reader hunting bugs that no longer existed and
 * devalued the entries that were still real.
 *
 * These check the specific claims that go stale silently and mislead when they
 * do. They cannot check prose; they can check that counts match reality, that
 * archived documents stay archived, and that the two sentences which would
 * directly cause a bug never come back.
 */

const ROOT = resolve(process.cwd(), '..');
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

describe('CLAUDE.md matches the repository it describes', () => {
  const claude = read('CLAUDE.md');

  it('states a migration count that matches db/migrations', () => {
    const files = readdirSync(join(ROOT, 'db', 'migrations')).filter((f) => f.endsWith('.sql'));
    const highest = files.sort().at(-1)!.slice(0, 4);
    expect(claude, `highest migration is ${highest}; CLAUDE.md §8 must say so`).toContain(
      `0000–${highest}`,
    );
    // §7.3: the next number is one higher than the highest existing.
    const next = String(Number(highest) + 1).padStart(4, '0');
    expect(claude, `§8 should tell the next contributor the next number is ${next}`).toContain(
      `Next number is ${next}`,
    );
  });

  it('states a table count that matches db/schema.ts', () => {
    const schema = read('db', 'schema.ts');
    const tables = [...schema.matchAll(/pgTable\(/g)].length;
    expect(claude, `schema.ts defines ${tables} tables`).toContain(`${tables} tables`);
  });

  it('no longer describes the app as a prototype', () => {
    // It said "This codebase is a high-fidelity prototype, not a working
    // product" for three months after the product went live.
    expect(claude).not.toMatch(/is a \*\*high-fidelity prototype\*\*/);
    expect(claude).toMatch(/shipped product, not a prototype/);
  });

  it('does not present the closed security issues as live', () => {
    /*
     * §4 listed the hardcoded admin bypass, the missing edge-function role
     * checks, the committed anon key, the absent role claim and the localStorage
     * suspension as "real, exploitable, and present in main". All five were
     * fixed. A reader who trusts that goes looking for bugs that do not exist.
     */
    expect(claude).not.toContain('These are real, exploitable, and present in `main`');
    expect(claude).toMatch(/Items 1–6 below are \*\*FIXED\*\*/);
  });

  it('acknowledges single-tenant mode rather than denying what is deployed', () => {
    // §1 read as denying the thing actually in production, which invited a
    // contributor to "fix" the deployment or to take PLATFORM_OVERVIEW.md as
    // evidence the mission had changed.
    expect(claude).toMatch(/Single-tenant mode is a deployment configuration/);
    expect(claude).toMatch(/DEFAULT_TENANT_SLUG/);
  });

  it('§8 points at the code that exists', () => {
    for (const path of ['web/', 'db/', 'DEPLOY.md', 'PLATFORM_OVERVIEW.md']) {
      expect(claude, `§8's file map omits ${path}`).toContain(path);
    }
    // make-server was deleted; §3 and §8 both still referenced it.
    expect(claude).not.toMatch(/make-server\/index\.tsx/);
  });
});

describe('the archived documents stay archived', () => {
  /*
   * All three sat in the repo ROOT — the most discoverable place a new
   * contributor looks — and each contradicted CLAUDE.md from there: Prisma and
   * NextAuth, a separate API service with X-Tenant-ID headers (the exact shape
   * §7.8 forbids), and ~70 tables against the 22 that exist.
   */
  const ARCHIVED = ['IMPLEMENTATION_PLAN.md', 'API_SPECIFICATION.md', 'DATABASE_SCHEMA.md'];

  it.each(ARCHIVED)('%s is not back in the repo root', (f) => {
    expect(existsSync(join(ROOT, f)), `${f} is in the root again`).toBe(false);
    expect(existsSync(join(ROOT, 'docs', '_archive', f))).toBe(true);
  });

  it.each(ARCHIVED)('%s carries the do-not-act banner', (f) => {
    const src = read('docs', '_archive', f);
    expect(src.slice(0, 400)).toMatch(/ARCHIVED — DO NOT ACT ON THIS DOCUMENT/);
  });
});

describe('the two sentences that would directly cause a bug', () => {
  it('db/README no longer calls the RLS-bypassing connection "RLS-enforced"', () => {
    /*
     * The single most dangerous sentence in the repo. client.ts connects as the
     * owner role and bypasses RLS entirely — its own header says so. A developer
     * trusting the README would omit tenant filters and leak across academies.
     */
    // Whitespace-tolerant: the README hard-wraps, so a phrase can straddle a
    // newline. Matching the exact spacing would fail on a reflow rather than on
    // a regression, which is the wrong thing to be sensitive to.
    const readme = read('db', 'README.md').replace(/\s+/g, ' ');
    expect(readme).not.toMatch(/`db` \(RLS-enforced, request-scoped\)/);
    expect(readme).toMatch(/BYPASSES row-level security/);
    expect(readme).toMatch(/scoped by `tenant_id` in application code/);
  });

  it('db/README no longer tells the reader to edit a shipped migration', () => {
    /*
     * "**Hand-written; edit here for policy changes**" is a direct instruction
     * to violate CLAUDE.md §7.3.
     *
     * Matched on that INSTRUCTION form, not on the bare phrase: the README now
     * quotes the removed sentence while explaining why it was wrong, and a
     * looser pattern would flag the explanation as the offence.
     */
    const readme = read('db', 'README.md').replace(/\s+/g, ' ');
    expect(readme).not.toMatch(/\*\*Hand-written; edit here for policy changes/);
    expect(readme).toMatch(/SHIPPED — never edit it/);
    expect(readme).toMatch(/A policy change is a NEW numbered migration/);
  });

  it('db/client.ts does not point at a helper that was removed', () => {
    // It told callers to "call withTenant() first", which has not existed for
    // months — so the one instruction on how to scope safely was unfollowable.
    const client = read('db', 'client.ts');
    expect(client).not.toMatch(/call withTenant\(\) first/);
    expect(client).toMatch(/requireAdminForSlug/);
  });
});

describe('DEPLOY.md and PLATFORM_OVERVIEW.md agree on whether anything shipped', () => {
  it('DEPLOY.md records what is done and what is outstanding', () => {
    // It read as though nothing had shipped while PLATFORM_OVERVIEW said the
    // platform was live. Both were right about different things and neither
    // said which.
    const deploy = read('DEPLOY.md');
    expect(deploy).toMatch(/## Status — where this runbook actually stands/);
    expect(deploy).toMatch(/The platform IS\s*\n?\s*live/);
    expect(deploy).toMatch(/Outstanding, in priority order/);
    // The four §8 items must stay named until they are done.
    expect(deploy).toMatch(/Rotate the LEGACY anon key/);
  });

  it('PLATFORM_OVERVIEW.md says how it relates to CLAUDE.md', () => {
    const overview = read('PLATFORM_OVERVIEW.md');
    expect(overview).toMatch(/Relationship to \[CLAUDE\.md\]/);
    expect(overview).toMatch(/single-tenant mode/);
  });

  it('neither claims the unapplied migrations are applied', () => {
    for (const f of ['DEPLOY.md', 'PLATFORM_OVERVIEW.md', 'CLAUDE.md']) {
      expect(read(f), `${f} should flag 0014-0016 as unapplied`).toMatch(
        /0014.{0,4}0016|`0014`, `0015`, `0016`/,
      );
    }
  });
});

describe('repo hygiene', () => {
  it('the root package is not still named after the Figma export', () => {
    const pkg = JSON.parse(read('package.json')) as {
      name: string;
      scripts: Record<string, string>;
    };
    expect(pkg.name).not.toBe('@figma/my-make-file');
  });

  it('root `npm run dev` starts the real app, not the retired prototype', () => {
    // It ran `vite`, silently starting the retired Vite prototype — so the
    // documented way to run the project ran the wrong project.
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(pkg.scripts.dev).toContain('web');
    expect(pkg.scripts.dev).not.toBe('vite');
  });

  it('a root verify fans out to both workspaces, which is what §7.13 requires', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(pkg.scripts.verify).toContain('db');
    expect(pkg.scripts.verify).toContain('web');
  });

  it('tmp/ is ignored and its junk is untracked', () => {
    expect(read('.gitignore')).toMatch(/^tmp\/$/m);
    for (const f of ['tmp/dashboard_replacement.txt', 'tmp/patch_check.txt']) {
      expect(existsSync(join(ROOT, f)), `${f} is back`).toBe(false);
    }
  });

  it('the preview config offers the real app first', () => {
    const launch = JSON.parse(read('.claude', 'launch.json')) as {
      configurations: Array<{ name: string }>;
    };
    expect(launch.configurations[0].name).toBe('web-dev');
  });
});
