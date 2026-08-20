import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SkipLink } from '@/components/skip-link';

afterEach(cleanup);

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const GLOBALS = read('src/app/globals.css');
const ADMIN_SHELL = read('src/components/admin-shell.tsx');
const PLAYER = read('src/app/t/[slug]/learn/[courseSlug]/[lessonId]/page.tsx');

describe('skip link', () => {
  it('renders a hidden anchor pointing at the main landmark', () => {
    render(<SkipLink />);
    const a = screen.getByRole('link', { name: /skip to content/i });
    expect(a.getAttribute('href')).toBe('#main-content');
    // BOTH classes matter: .sr-only hides it, .skip-link:focus reveals it. With
    // only .sr-only it stays a 1x1 clipped box even when focused.
    expect(a.className).toContain('sr-only');
    expect(a.className).toContain('skip-link');
  });

  it('the CSS that reveals it on focus is still present', () => {
    /*
     * The reveal is the whole feature. Without this rule the link is focusable but
     * invisible, which is worse than having none — a sighted keyboard user lands on
     * something they cannot see.
     *
     * Verified in a real browser with a real Tab press: 139x41, position: fixed,
     * top-left, focus ring visible. Note for anyone re-testing it: a programmatic
     * element.focus() does NOT match :focus while the document lacks window focus,
     * so an automated check that focuses the link and measures it will report a 1x1
     * box and look exactly like a bug. Use a real key press or do not test it.
     */
    expect(GLOBALS).toMatch(/\.skip-link:focus\s*\{/);
    const rule = GLOBALS.slice(GLOBALS.indexOf('.skip-link:focus'));
    expect(rule).toMatch(/width:\s*auto/);
    expect(rule).toMatch(/height:\s*auto/);
    // Tailwind v4 hides .sr-only with clip-path, not clip — releasing only `clip`
    // leaves a correctly sized box that paints nothing, focus ring included.
    expect(rule).toMatch(/clip-path:\s*none/);
  });

  it('is present on the surfaces whose header or nav precedes their content', () => {
    for (const [name, src] of [
      ['admin-shell', ADMIN_SHELL],
      ['lesson player', PLAYER],
    ] as const) {
      expect(src, `${name} should render <SkipLink />`).toMatch(/<SkipLink\s*\/>/);
      expect(src, `${name} needs a matching #main-content target`).toMatch(/id="main-content"/);
    }
    // The admin shell's skip target is its <main> landmark itself — a real side
    // nav precedes it. The lesson player's target moved (see the ordering test).
    expect(ADMIN_SHELL).toMatch(/<main[^>]*id="main-content"/);
  });

  it('the lesson player puts it before the content it skips to', () => {
    /*
     * Ordering is the point — a skip link after what it skips is useless.
     *
     * The PX redesign (2026-08) moved the course outline BELOW the lesson content
     * (no side rail), so there is no longer an <aside> for the link to precede;
     * what it skips is the back-nav/progress/title header group repeated on every
     * lesson. The assertion is therefore: SkipLink renders before the
     * #main-content anchor it jumps to.
     *
     * Comments are stripped first, and that is not incidental: the first version of
     * this test failed because the prose explaining the fix named the elements it
     * was searching for, and indexOf found the prose instead of the element.
     */
    const src = PLAYER.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const link = src.indexOf('<SkipLink />');
    const target = src.indexOf('id="main-content"');
    expect(link).toBeGreaterThan(-1);
    expect(target).toBeGreaterThan(-1);
    expect(link).toBeLessThan(target);
  });
});
