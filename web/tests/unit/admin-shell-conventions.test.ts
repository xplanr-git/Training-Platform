import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
/** Comments stripped — a guard must judge what renders, not what documents it. */
const code = (p: string) =>
  read(p)
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const SHELL = code('src/components/admin-shell.tsx');

/** The shell root, identified by the one background only it carries. */
function shellRoot(): string {
  const m = /<div className="([^"]*bg-surface-muted[^"]*)">/.exec(SHELL);
  expect(m, 'could not find the shell root div').not.toBeNull();
  return m?.[1] ?? '';
}

/**
 * The admin area is a fixed app shell: the sidebar and the page scroll independently.
 *
 * That only works if the flex container has a DEFINITE height. It was `min-h-screen`,
 * which grows with its content, so `flex-1 overflow-y-auto` on the nav and on <main>
 * could never engage — measured at 1280x720 with the real nav: 2013px of links inside
 * a 575px column, which instead made the whole DOCUMENT 2000px tall and pushed the
 * email and sign-out footer off the bottom of it.
 *
 * The failure is silent in both directions: the classes look right, and nothing throws.
 */
describe('the admin shell has a definite height', () => {
  it('the root is a fixed-height flex container', () => {
    const root = shellRoot();
    expect(root, 'could not find the shell root').toContain('flex');
    expect(root, 'min-h-* grows with content, so the children never scroll').not.toMatch(
      /\bmin-h-/,
    );
    expect(root, 'needs a definite height for flex-1 + overflow-y-auto to work').toMatch(
      /\bh-(dvh|screen)\b/,
    );
  });

  it('uses dvh, because the admin area is used on phones', () => {
    // 100vh is taller than the visible viewport while a mobile browser's toolbar is
    // showing, which would put the sign-out footer under it.
    const root = shellRoot();
    expect(root).toMatch(/\bh-dvh\b/);
  });

  it('clips at the root so only the inner regions scroll', () => {
    const root = shellRoot();
    expect(root).toMatch(/\boverflow-hidden\b/);
  });

  it('both scroll regions still declare their own overflow', () => {
    // These are the two things the definite height exists to enable. If either loses
    // its overflow, that region silently stops scrolling and content becomes
    // unreachable rather than merely awkward.
    expect(SHELL, 'the sidebar nav must scroll internally').toMatch(
      /<nav className="flex-1 overflow-y-auto/,
    );
    expect(SHELL, 'the page region must scroll internally').toMatch(
      /id="main-content"[^>]*overflow-y-auto/,
    );
  });

  it('the sidebar footer is pinned below the scrolling nav, not inside it', () => {
    // It has to be a sibling of <nav>, or it scrolls away with the links.
    // The aside composes <NavLinks/>, so compare against that rather than a literal
    // <nav> — which lives inside the NavLinks function, earlier in the file.
    const aside = SHELL.slice(SHELL.indexOf('<aside'), SHELL.indexOf('</aside>'));
    const navAt = aside.indexOf('<NavLinks');
    const footerAt = aside.lastIndexOf('<div className="border-t');
    expect(navAt, 'no NavLinks in the aside').toBeGreaterThan(-1);
    expect(footerAt, 'no footer in the aside').toBeGreaterThan(-1);
    expect(footerAt, 'the footer must come after NavLinks, or it scrolls away with the links')
      .toBeGreaterThan(navAt);
  });
});
