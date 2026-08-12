import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
/** Comments stripped: a guard must judge what runs, not what documents it. */
const code = (p: string) =>
  read(p)
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) out.push(...walk(f));
    else if (/\.tsx?$/.test(f)) out.push(f);
  }
  return out;
}
const rel = (f: string) => relative(SRC, f).replace(/\\/g, '/');
const FILES = walk(SRC);

/**
 * The tenant row for a slug was being read three or four times per admin
 * navigation — by `requireAdminForSlug` (from the layout, then again from the page
 * beneath it), by the tenant shell, and by the admin layout. The storefront
 * repeated it across `generateMetadata` and the page body, and `/join` did it twice
 * in one file.
 *
 * It is worse than a wasted query: `db/client.ts` configures a 5-connection pool,
 * so under concurrency the copies stop overlapping and serialise into extra waves
 * before a single row of real data is fetched.
 */
describe('the tenant row is resolved once per request', () => {
  it('tenantBySlug is request-cached', () => {
    const src = code(join(SRC, 'lib/tenant.ts'));
    expect(src, 'tenantBySlug must be wrapped in React cache()').toMatch(
      /export const tenantBySlug = cache\(/,
    );
  });

  it('requireAdminForSlug resolves through it rather than querying again', () => {
    const src = code(join(SRC, 'lib/tenant.ts'));
    const start = src.indexOf('export async function requireAdminForSlug(');
    expect(start, 'requireAdminForSlug not found').toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf('\n}\n', start));
    expect(body).toMatch(/tenantBySlug\(slug\)/);
    expect(body, 'do not re-query the tenants table here').not.toMatch(/\.from\(tenants\)/);
  });

  it('no page or layout resolves a single tenant for itself', () => {
    /*
     * Scoped deliberately, three ways:
     *
     * - Pages and layouts only — the render path, where the duplication lived and
     *   where the request cache applies.
     * - Only a query that resolves ONE tenant (filtered by slug or id). The platform
     *   console at app/platform/page.tsx lists every tenant, which is a different
     *   query with nothing to deduplicate.
     * - A join starting `.from(courses).innerJoin(tenants, ...)` passes, because it
     *   is not fetching the tenant row for its own sake.
     *
     * Server Actions are NOT covered: signup/actions.ts checks slug availability and
     * join/actions.ts resolves inside a mutation, and both must see the live row
     * rather than a value cached earlier in the same request.
     */
    const offenders: string[] = [];
    for (const f of FILES) {
      const name = rel(f);
      if (!/(^|\/)(page|layout)\.tsx$/.test(name)) continue;
      const src = code(f);
      const resolvesOne = /\.from\(tenants\)/.test(src) && /eq\(tenants\.(slug|id)\s*,/.test(src);
      if (resolvesOne) offenders.push(name);
    }
    expect(
      offenders,
      `resolve the tenant through tenantBySlug(slug) from @/lib/tenant so the row is ` +
        `fetched once per request:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
