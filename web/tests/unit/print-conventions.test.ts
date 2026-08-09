import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) =>
  read(p)
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const CSS = read('src/app/globals.css');
const VERIFY = code('src/app/verify/[code]/page.tsx');

/**
 * The certificate is the only artifact anyone deliberately prints, and it is a real
 * one: a contractor uses "Save as PDF" on a phone to keep a copy to show a client.
 * Everything asserted here was verified in a browser by flipping the `@media print`
 * blocks to `all` and reading the computed styles, not by trusting the classes.
 */
describe('the certificate has a deliberate print stylesheet', () => {
  it('sets its own page margins', () => {
    // Browsers default to roughly half an inch plus their own header/footer.
    expect(CSS).toMatch(/@page\s*\{[^}]*margin:\s*14mm/);
  });

  it('neutralises the screen-only centring so no blank page trails it', () => {
    // On screen the shell is a centred full-height column. In print, min-height:100vh
    // resolves against the page box, so justify-center pushes the certificate down
    // and the leftover height can spill onto a second, empty sheet.
    const block = CSS.slice(CSS.indexOf('@media print'));
    expect(block).toMatch(/\[data-print-certificate\]\s*\{[\s\S]*?min-height:\s*0/);
    expect(block).toMatch(/justify-content:\s*flex-start/);
    expect(block).toMatch(/padding:\s*0/);
  });

  it('keeps the certificate on one sheet', () => {
    const block = CSS.slice(CSS.indexOf('@media print'));
    expect(block).toMatch(/\[data-print-certificate\] article\s*\{[\s\S]*?break-inside:\s*avoid/);
  });

  it('is scoped, so printing any other page is left alone', () => {
    // A bare `main {}` or `article {}` under @media print would silently restyle the
    // print output of every page in the app, none of which is designed for print.
    const block = CSS.slice(CSS.indexOf('@media print'));
    const selectors = [...block.matchAll(/^\s{2}([^\s{][^{]*)\{/gm)].map((m) => m[1].trim());
    expect(selectors.length).toBeGreaterThan(0);
    for (const sel of selectors) {
      expect(sel, `"${sel}" is unscoped — it would restyle every page's print output`).toContain(
        '[data-print-certificate]',
      );
    }
  });

  it('the page it targets carries the hook', () => {
    expect(VERIFY).toContain('data-print-certificate');
  });
});

describe('a printed certificate carries what makes it a certificate', () => {
  it('the verification code is inside the article and prints', () => {
    const article = VERIFY.slice(VERIFY.indexOf('<article'), VERIFY.indexOf('</article>'));
    expect(article).toContain('{code}');
    const upTo = article.slice(0, article.indexOf('{code}'));
    expect(upTo.slice(-300), 'print:hidden on the code defeats the whole page').not.toContain(
      'print:hidden',
    );
  });

  it('a revoked certificate says so IN PRINT, not just on screen', () => {
    /*
     * `print:hidden` used to sit on the whole status row. PrintButton already carries
     * its own, so the only thing that rule actually hid was the status badge — and on
     * a revoked certificate that badge is the warning. Verified in a browser: with the
     * revoked class string applied, the badge computes to display:block with a 1px
     * red border under print media.
     */
    expect(VERIFY, 'the status row must not blanket-hide itself').not.toMatch(
      /<div className="flex items-center justify-between print:hidden">/,
    );
    /*
     * Both print behaviours in one assertion, because they are one decision:
     * revoked prints WITH an outline, valid does not print at all.
     *
     * This used to pin `print:border print:border-red-700` and, below,
     * `bg-green-50 text-green-700 print:hidden` — raw palette classes that moved
     * when the badge became a StatusBadge, failing a print test for a reason
     * that had nothing to do with print. The token names are still named here
     * because on THIS guard the colour IS the subject: a printed red outline.
     *
     * The outline is what carries the warning. Browsers drop backgrounds in
     * print by default, so the tint — and the tag's dot, which is also a
     * background — cannot be relied on; the border and the red text can.
     */
    const badge = VERIFY.slice(VERIFY.indexOf('<StatusBadge'), VERIFY.indexOf('</StatusBadge>'));
    expect(badge, 'revoked must print an outline; valid must not print').toMatch(
      /cert\.revokedAt \? 'print:border print:border-status-red' : 'print:hidden'/,
    );
    // and the in-article notice, which is the other half of the warning
    const article = VERIFY.slice(VERIFY.indexOf('<article'), VERIFY.indexOf('</article>'));
    expect(article).toMatch(/was revoked on/);
  });

  it('the certificate itself carries no screen-only chrome', () => {
    // The article IS the document. Anything inside it that disappears on paper
    // is either decoration that should not be there, or information the printed
    // certificate silently loses.
    const article = VERIFY.slice(VERIFY.indexOf('<article'), VERIFY.indexOf('</article>'));
    expect(article, 'print:hidden inside the certificate drops it from the paper').not.toMatch(
      /print:hidden/,
    );
  });

  it('the print button never prints itself', () => {
    expect(code('src/components/print-button.tsx')).toContain('print:hidden');
  });
});

describe('no other page quietly acquires print rules', () => {
  it('print: variants appear only where print output is designed', () => {
    // If a `print:` class shows up elsewhere, either that page has a print design
    // nobody recorded, or someone is using the variant to hide something on screen.
    const SRC = join(process.cwd(), 'src');
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const e of readdirSync(dir)) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else if (/\.tsx?$/.test(full)) out.push(full);
      }
      return out;
    };
    const ALLOWED = new Set(['app/verify/[code]/page.tsx', 'components/print-button.tsx']);
    const offenders = walk(SRC)
      .filter((f) => /\bprint:[a-z-]/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f).replace(/\\/g, '/'))
      .filter((f) => !ALLOWED.has(f));
    expect(offenders, `unexpected print: variants:\n${offenders.join('\n')}`).toEqual([]);
  });
});
