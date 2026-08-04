import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Empty states were the most inconsistent thing in the app: five different
 * treatments for "there is nothing here", every one of them grey top to bottom so
 * an empty table read as broken rather than new, and most of them a dead end.
 *
 * These guards keep the three decisions that mattered.
 */
const APP = join(process.cwd(), 'src/app');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const pages = walk(APP).filter((f) => f.endsWith('page.tsx'));
const rel = (f: string) => relative(APP, f).replace(/\\/g, '/');
const EMPTY_COMPONENTS = /EmptyState|EmptyRow|NoMatches/;

describe('a search that matches nothing is not the same as nothing existing', () => {
  // The classic empty-state bug, and it is invisible until it happens to a real
  // user: someone with forty courses mistypes a search and gets told to "create
  // your first course". Different situation, different copy, and above all a
  // different way out — clear the search, not create something.
  const searchable = pages.filter((f) => {
    const src = readFileSync(f, 'utf8');
    return /q\?: string/.test(src) && /length === 0/.test(src);
  });

  it('finds the pages that support search', () => {
    // storefront, admin courses, admin people
    expect(searchable.map(rel).sort()).toEqual([
      't/[slug]/admin/courses/page.tsx',
      't/[slug]/admin/people/page.tsx',
      't/[slug]/page.tsx',
    ]);
  });

  it('each branches its empty state on whether a search is active', () => {
    const conflated = searchable
      .filter((f) => {
        const src = readFileSync(f, 'utf8');
        // Look inside the empty branch itself, and match `<NoMatches` with its
        // angle bracket. Scanning the whole file for the bare word matched the
        // *import* line, so deleting the usage and leaving the import passed —
        // which is exactly how this guard was caught not biting.
        const at = src.search(/\w+\.length === 0/);
        if (at === -1) return false;
        const branch = src.slice(at, at + 900);
        return !/<NoMatches/.test(branch) && !/query \?/.test(branch);
      })
      .map(rel);

    expect(
      conflated,
      `these tell a searcher to create their first item:\n${conflated.join('\n')}`,
    ).toEqual([]);
  });

  it('the way out of a fruitless search is clearing it', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/empty-state.tsx'), 'utf8');
    const noMatches = src.slice(src.indexOf('export function NoMatches'));
    expect(noMatches).toContain('Clear search');
    expect(noMatches).toContain('href: basePath');
  });
});

describe('empty states use the shared component', () => {
  it('no page hand-rolls a centred block of muted text in place of content', () => {
    // This was the anti-pattern in all five original treatments. Two legitimate
    // uses of centred muted text remain and are listed by name — a link under the
    // forgot-password form and a print footnote on the certificate page. Neither
    // stands in for absent content.
    const ALLOWED = new Set(['login/forgot/page.tsx', 'verify/[code]/page.tsx']);

    const offenders: string[] = [];
    for (const f of walk(APP)) {
      const name = rel(f);
      if (ALLOWED.has(name)) continue;
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/className="([^"]*)"/g)) {
        const c = m[1];
        if (c.includes('text-center') && c.includes('text-muted')) {
          offenders.push(`${name} — className="${c}"`);
        }
      }
    }
    expect(
      offenders,
      `use <EmptyState> / <EmptyRow> instead:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('every zero-length branch renders an empty-state component', () => {
    const bare: string[] = [];
    for (const f of pages) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/length === 0/g)) {
        // The component should appear in the branch this condition opens.
        const window = src.slice(m.index ?? 0, (m.index ?? 0) + 500);
        if (!EMPTY_COMPONENTS.test(window)) {
          bare.push(`${rel(f)} — a zero-length branch with no empty-state component`);
        }
      }
    }
    expect(bare, bare.join('\n')).toEqual([]);
  });
});

describe('an empty state does not look disabled', () => {
  const src = readFileSync(join(process.cwd(), 'src/components/empty-state.tsx'), 'utf8');

  it('the title is foreground text, not muted', () => {
    // The substantive fix. Muted grey is what this app uses for disabled and
    // secondary text, so a fully-muted empty state reads as "broken", not "new".
    const title = /<p className="([^"]*font-semibold[^"]*)">\{title\}<\/p>/.exec(src);
    expect(title, 'EmptyState should render a semibold title').not.toBeNull();
    expect(title?.[1] ?? '').not.toContain('text-muted');
  });

  it('the explanation underneath stays muted, so there is a hierarchy', () => {
    expect(src).toMatch(/text-sm leading-relaxed text-muted/);
  });

  it('decorative icons are hidden from screen readers', () => {
    const iconBlock = src.slice(src.indexOf('{icon ?'), src.indexOf('{icon ?') + 400);
    expect(iconBlock).toContain('aria-hidden="true"');
  });
});

describe('the explanation text stays readable (WCAG 2.1 AA, 1.4.3)', () => {
  // Muted text on a muted background clears 4.5:1 by very little — 4.63:1 as
  // written. Nudge either token and it silently drops below AA, with nothing on
  // screen to show that it did. So compute it from the tokens rather than trust
  // a one-off eyeball, which is what every previous check of this amounted to.
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

  function token(name: string): string {
    const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
    if (!m) throw new Error(`token ${name} not found in globals.css`);
    return m[1];
  }

  /** WCAG relative luminance. */
  function luminance(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function ratio(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  it('sanity-checks the maths against known pairs', () => {
    expect(ratio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(ratio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('muted description text on the empty-state background clears 4.5:1', () => {
    const r = ratio(token('--color-muted'), token('--color-surface-muted'));
    expect(r, `--color-muted on --color-surface-muted is ${r.toFixed(2)}:1, AA needs 4.5:1`).
      toBeGreaterThanOrEqual(4.5);
  });

  it('the title clears it comfortably too', () => {
    expect(ratio(token('--color-foreground'), token('--color-surface-muted'))).toBeGreaterThan(7);
  });
});
