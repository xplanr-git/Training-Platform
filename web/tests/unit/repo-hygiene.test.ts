import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/** Repo root — vitest runs from web/. */
const ROOT = resolve(process.cwd(), '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.next' || e === '.git' || e === 'dist') continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else out.push(f);
  }
  return out;
}
const rel = (f: string) => relative(ROOT, f).split(/[\\/]/).join('/');

describe('line endings are LF, and something enforces it', () => {
  /*
   * This is the guard I wanted two passes ago and did not have.
   *
   * 31 tracked files were LF in HEAD but CRLF in the working tree, with nothing
   * declaring a convention. Editing any of them produced a diff touching every line:
   * a 26-line change to the lesson player showed up as 932 changed lines, which makes
   * review impossible without altering a single byte of behaviour. Zero files were CRLF
   * in HEAD, so LF was already the convention — it just was not written down.
   */
  it('.gitattributes pins LF for everything', () => {
    const p = join(ROOT, '.gitattributes');
    expect(existsSync(p), 'no .gitattributes — nothing stops a CRLF checkout').toBe(true);
    expect(readFileSync(p, 'utf8')).toMatch(/^\*\s+text=auto\s+eol=lf$/m);
  });

  it('no file in the v2 app contains a CRLF', () => {
    /*
     * Scoped to web/ and db/ — the Next app and its schema, i.e. the code that is
     * actually edited. Deliberately NOT the whole repo: the legacy Vite prototype at
     * the root (src/, supabase/functions, supabase/migrations/00*, vite.config.ts) is
     * 127 CRLF files that CLAUDE.md schedules for deletion, and docs/_archive is
     * marked as paths deliberately not taken. Normalising either would be churn on
     * code nobody will edit again. If the prototype is ever revived, widen this.
     */
    const CHECK = /\.(tsx?|jsx?|css|json|md|sql|mjs|cjs)$/;
    const offenders = [join(ROOT, 'web'), join(ROOT, 'db')]
      .filter((d) => existsSync(d))
      .flatMap((d) => walk(d))
      .filter((f) => CHECK.test(f))
      // Generated files, excluded for different reasons: Next rewrites next-env.d.ts on
      // every build, and db/migrations/meta is drizzle-kit's own journal — CLAUDE.md
      // forbids editing a shipped migration, and that includes its metadata.
      .filter((f) => !f.endsWith('next-env.d.ts'))
      .filter((f) => !rel(f).startsWith('db/migrations/meta/'))
      .filter((f) => readFileSync(f).includes('\r\n'))
      .map(rel);
    expect(
      offenders,
      `CRLF makes the next edit look like a whole-file rewrite:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('prettier cannot fight the house style', () => {
  /*
   * The repo had NO prettier config, so `npx prettier --write` used prettier's own
   * defaults — double quotes — and reformatted a whole file away from the codebase's
   * single-quote style before it was reverted.
   *
   * Measured, not assumed: single quotes outnumber double 3176 to 1647 across 167
   * files; p99 line length is 102, so printWidth 100 fits. At that width 106 of 167
   * files still differ from prettier's output, so this repo is NOT prettier-formatted
   * and no sweep has been run — the config exists so that IF anyone reaches for
   * prettier, it produces house style rather than fighting it.
   */
  const cfg = JSON.parse(readFileSync(join(ROOT, '.prettierrc.json'), 'utf8'));

  it('exists and pins the two settings that actually caused damage', () => {
    expect(cfg.singleQuote, 'prettier defaults to double quotes').toBe(true);
    expect(cfg.endOfLine, 'prettier would otherwise write CRLF on Windows').toBe('lf');
  });

  it('and the rest matches what was measured', () => {
    expect(cfg.semi).toBe(true);
    expect(cfg.tabWidth).toBe(2);
    expect(cfg.printWidth).toBe(100);
  });

  it('an editor config agrees with it', () => {
    const ec = readFileSync(join(ROOT, '.editorconfig'), 'utf8');
    expect(ec).toMatch(/end_of_line\s*=\s*lf/);
    expect(ec).toMatch(/indent_size\s*=\s*2/);
  });
});
