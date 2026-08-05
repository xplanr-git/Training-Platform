import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const WEB = resolve(process.cwd());
const EXAMPLE = readFileSync(join(WEB, '.env.example'), 'utf8');

/**
 * Every env var the code reads must be documented in .env.example.
 *
 * This is the guard for a failure mode that had already happened twice, silently
 * and in different ways:
 *
 *  - DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD / LIVE_BASE_URL were read by the
 *    four specs in tests/live and appeared in NO env file and no doc. The
 *    password defaulted to ''. So four authored end-to-end journeys — the whole
 *    authed golden path, the quiz path — could not be run by anyone who had not
 *    read the specs and guessed. The backlog recorded this as "zero end-to-end
 *    coverage of authenticated routes", which was wrong: the coverage existed
 *    and was undiscoverable, which is a different and cheaper problem.
 *
 *  - BUNNY_LIBRARY_ID / BUNNY_API_KEY / BUNNY_CDN_HOSTNAME were in .env.local
 *    and read by lib/env.ts, but absent from .env.example — so anyone setting up
 *    from the example got no video host, and every video lesson rendered the
 *    "host not configured" state.
 *
 * Direction matters: read-but-undocumented is the bug (you cannot run the thing).
 * Documented-but-unread is fine and deliberately not asserted — the STRIPE_PRICE_*
 * trio is documented ahead of the billing work.
 */
const SYSTEM = new Set([
  'NODE_ENV',
  'CI',
  'TZ',
  'PORT',
  'ANALYZE',
  'NEXT_RUNTIME',
  'VERCEL',
  'VERCEL_URL',
  'VERCEL_ENV',
  'VERCEL_GIT_COMMIT_SHA',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.next') continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (/\.(ts|tsx)$/.test(f)) out.push(f);
  }
  return out;
}

function envReads(): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  for (const f of [...walk(join(WEB, 'src')), ...walk(join(WEB, 'tests'))]) {
    const src = readFileSync(f, 'utf8');
    const at = relative(WEB, f).split(/[\\/]/).join('/');
    for (const m of src.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
      if (!found.has(m[1])) found.set(m[1], new Set());
      found.get(m[1])!.add(at);
    }
    for (const m of src.matchAll(/process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g)) {
      if (!found.has(m[1])) found.set(m[1], new Set());
      found.get(m[1])!.add(at);
    }
  }
  return found;
}

const documented = new Set([...EXAMPLE.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]));

describe('.env.example documents every var the code reads', () => {
  it('has no undocumented reads', () => {
    const missing = [...envReads()]
      .filter(([name]) => !documented.has(name) && !SYSTEM.has(name))
      .map(([name, files]) => `${name} (read in ${[...files].sort().join(', ')})`);
    expect(
      missing,
      `these are unsettable by anyone working from .env.example:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('found a realistic number of reads, so the scan is not silently empty', () => {
    expect(envReads().size).toBeGreaterThan(10);
  });

  it('still documents the vars whose absence had already broken something', () => {
    // Bunny: absent -> every video lesson renders "host not configured".
    // Live suite: absent -> four authed journeys unrunnable and undiscoverable.
    for (const v of [
      'BUNNY_LIBRARY_ID',
      'BUNNY_API_KEY',
      'BUNNY_CDN_HOSTNAME',
      'DEMO_ADMIN_EMAIL',
      'DEMO_ADMIN_PASSWORD',
      'ALLOW_LIVE_WRITES',
      'LIVE_BASE_URL',
    ]) {
      expect(documented.has(v), `${v} missing from .env.example`).toBe(true);
    }
  });

  it('.env.example carries no real-looking secret values', () => {
    // It is committed; a pasted key here would be a leak.
    expect(EXAMPLE).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
    expect(EXAMPLE).not.toMatch(/sk_live_|whsec_[A-Za-z0-9]{16,}/);
    expect(EXAMPLE, 'a real project ref means someone pasted their own env').not.toMatch(
      /https:\/\/[a-z]{20}\.supabase\.co/,
    );
  });
});
