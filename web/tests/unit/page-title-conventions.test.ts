import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const rel = (f: string) => relative(SRC, f).replace(/\\/g, '/');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) out.push(...walk(f));
    else if (/\.tsx?$/.test(f)) out.push(f);
  }
  return out;
}

const ADMIN_PAGES = walk(join(SRC, 'app/t/[slug]/admin')).filter((f) =>
  /(^|\/)page\.tsx$/.test(rel(f)),
);

/**
 * Every admin screen rendered the root layout's static "Outdure Academy". Eleven
 * different pages produced one browser title, so tabs, history entries and
 * bookmarks were all indistinguishable — and an admin with several tabs open could
 * not tell which was which.
 */
describe('admin pages are individually titled', () => {
  it('the admin layout supplies the academy-scoped template', () => {
    const layout = read(join(SRC, 'app/t/[slug]/admin/layout.tsx'));
    expect(layout).toMatch(/export async function generateMetadata/);
    // The academy's own name, not a hardcoded one — this is what makes the title
    // correct for a second tenant.
    expect(layout).toMatch(/template: `%s · \$\{name\}`/);
    expect(layout).toMatch(/tenantBySlug\(slug\)/);
  });

  it('every admin page sets its own title', () => {
    const missing = ADMIN_PAGES.filter((f) => {
      const src = read(f);
      return (
        !/export const metadata\s*=/.test(src) &&
        !/export async function generateMetadata/.test(src)
      );
    }).map(rel);

    expect(
      missing,
      `these render the parent's default title, so their tab is indistinguishable ` +
        `from every other admin screen:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('no two admin pages claim the same title', () => {
    // A duplicate is the same defect in a smaller form.
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const f of ADMIN_PAGES) {
      const m = read(f).match(/export const metadata\s*=\s*\{\s*title:\s*'([^']+)'/);
      if (!m) continue;
      const prev = seen.get(m[1]);
      if (prev) clashes.push(`"${m[1]}" — ${prev} and ${rel(f)}`);
      else seen.set(m[1], rel(f));
    }
    expect(clashes, clashes.join('\n')).toEqual([]);
  });

  it('covers every admin page that exists', () => {
    // Guards the guard: if the glob ever resolves to nothing, the two tests above
    // pass while asserting nothing at all.
    expect(ADMIN_PAGES.length).toBeGreaterThanOrEqual(13);
  });
});
