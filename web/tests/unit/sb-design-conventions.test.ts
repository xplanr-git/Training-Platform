import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * The Structure Build sb-ui v3.0 rules, as tests.
 *
 * The restyle was a one-off; the system is not. Every rule below was applied by
 * hand across ~40 routes, and every one of them is the kind of thing that comes
 * back a single component at a time — a pale-blue selected state here, a
 * fluffy pill there — with nothing failing until the product no longer looks
 * like one product. The design package calls these out as the "designed, not
 * AI-generated" tells (GUIDELINES.md §9); this file is that section, executable.
 *
 * COMMENTS ARE STRIPPED FIRST, always. Three guards in this suite have now been
 * broken or satisfied by their own documentation — a comment explaining why
 * `bg-brand-50` was removed contains the string `bg-brand-50`. Prose is not
 * markup and must never be scanned as if it were.
 */
const SRC = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) out.push(...walk(f));
    else if (/\.(tsx?|css)$/.test(f)) out.push(f);
  }
  return out;
}

const rel = (f: string) => relative(SRC, f).split(/[\\/]/).join('/');
const strip = (s: string) =>
  s
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const FILES = walk(SRC).map((f) => ({ path: f, rel: rel(f), src: strip(readFileSync(f, 'utf8')) }));
const CSS = FILES.find((f) => f.rel === 'app/globals.css')!.src;
const TSX = FILES.filter((f) => /\.tsx?$/.test(f.rel));

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * Blue as the eye reads it, not as a name claims it.
 *
 * The `g >= r` clause is load-bearing and was added after this test flagged
 * `--color-cat-4: #7a3fb0`. Purple also has a dominant blue channel, so "b leads
 * both" alone bans the categorical palette's purple. What separates them is the
 * other two channels: blue runs green-over-red (#1f63c0 → 31/99/192), purple
 * runs red-over-green (#7a3fb0 → 122/63/176).
 */
const isBlue = (hex: string) => {
  const [r, g, b] = channels(hex);
  return b > r + 24 && b > g + 24 && g >= r;
};

/** Neutral: ink, black, white and the greys. No channel meaningfully leads. */
const isNeutral = (hex: string) => {
  const c = channels(hex);
  return Math.max(...c) - Math.min(...c) < 16;
};

describe('the retired brand ramp is not used', () => {
  /*
   * --color-brand-* still EXISTS, repointed at ink, so that anything missed
   * fails safe rather than painting the old #2563eb. That safety net is also
   * what would let the ramp quietly come back, so the utilities are banned
   * outright and the tokens are checked for having actually been repointed.
   */
  it('no component uses a brand- utility', () => {
    const offenders: string[] = [];
    for (const f of TSX) {
      for (const m of f.src.matchAll(
        /\b[a-z-]*(?:bg|text|border|ring|accent|from|to)-brand-\d+\b/g,
      )) {
        offenders.push(`${f.rel} — ${m[0]}`);
      }
    }
    expect(offenders, `use the ink/link/status tokens:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('and the shim tokens still point at ink, not at blue', () => {
    for (const name of ['--color-brand-500', '--color-brand-600', '--color-brand-700']) {
      const v = new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(CSS)?.[1];
      expect(v, `${name} is missing`).toBeTruthy();
      expect(isNeutral(v!), `${name} is ${v} — the shim must stay ink/neutral`).toBe(true);
    }
  });
});

describe('blue means "clickable text", and nothing else', () => {
  /*
   * The strongest form of this rule that a static test can hold: no NEW blue may
   * enter the palette without being one of the named exceptions. Everything else
   * in the theme has to be ink, neutral, or a status/categorical hue.
   *
   * "Blue" here means the blue channel leads the other two by a clear margin,
   * which is what the eye reads as blue regardless of the token's name.
   */
  const ALLOWED_BLUES = new Set([
    '--color-link',
    '--color-link-hover',
    '--color-focus',
    '--color-ring',
    '--color-status-blue',
    '--color-status-blue-bg',
    '--color-cat-1',
  ]);

  it('every blue token in the theme is a sanctioned one', () => {
    const offenders: string[] = [];
    for (const m of CSS.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
      const [, name, hex] = m;
      if (ALLOWED_BLUES.has(name)) continue;
      if (isBlue(hex)) offenders.push(`${name}: ${hex}`);
    }
    expect(
      offenders,
      `blue is links + focus only; these are new blues:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('the focus ring is the one non-link blue, and is still distinguishable from ink', () => {
    const focus = /--color-focus:\s*(#[0-9a-f]{6})/i.exec(CSS)?.[1];
    const ink = /--color-primary:\s*(#[0-9a-f]{6})/i.exec(CSS)?.[1];
    expect(focus).toBeTruthy();
    expect(focus).not.toBe(ink);
  });
});

describe('the keyline rule (GUIDELINES.md §2)', () => {
  /*
   * The dark keyline appears in a table under the HEADER only. Rows take the
   * light divider. This is called out in the design system as the single most
   * common mistake, and the reason it is common is that it looks tidier in
   * isolation and only reads as heavy once the whole page is assembled.
   */
  it('the header row carries the 2px dark keyline', () => {
    const table = FILES.find((f) => f.rel === 'components/ui/table.tsx')!.src;
    const header = table.slice(
      table.indexOf('function TableHeader'),
      table.indexOf('function TableBody'),
    );
    expect(header).toMatch(/border-keyline/);
    expect(header).toMatch(/border-b-2/);
  });

  it('and table ROWS never do', () => {
    const table = FILES.find((f) => f.rel === 'components/ui/table.tsx')!.src;
    // `function TableHead(` with the paren: `indexOf('function TableHead')`
    // matches `function TableHeader` FIRST, which is defined earlier in the
    // file — so the slice ran backwards and silently returned the empty string,
    // which passes a `.not.toMatch()` for entirely the wrong reason.
    const row = table.slice(
      table.indexOf('function TableRow'),
      table.indexOf('function TableHead('),
    );
    expect(row, 'the TableRow slice is empty — the delimiters moved').not.toBe('');
    expect(row, 'rows take --color-border, never the ink keyline').not.toMatch(/border-keyline/);
    expect(row).toMatch(/border-border/);
  });

  it('no page hand-rolls a dark keyline onto a TableRow', () => {
    const offenders: string[] = [];
    for (const f of TSX) {
      for (const m of f.src.matchAll(/<TableRow[^>]*border-keyline[^>]*>/g)) {
        offenders.push(`${f.rel} — ${m[0].slice(0, 80)}`);
      }
    }
    expect(offenders, `data-table rows use the light divider:\n${offenders.join('\n')}`).toEqual(
      [],
    );
  });
});

describe('nothing is fluffy (GUIDELINES.md §9)', () => {
  /*
   * `rounded-full` is legitimate for exactly two things: something that is
   * genuinely a circle (avatar, dot, radio) and controls whose universal
   * affordance is round (the switch track and thumb). Everywhere else it is the
   * pill shape the system exists to avoid, so this is an explicit allowlist
   * rather than a pattern — a pattern would have let the next pill through.
   */
  const ROUND_ALLOWED: Record<string, string> = {
    'components/ui/avatar.tsx': 'avatars are round',
    'components/ui/radio-group.tsx': 'a radio is a dot',
    'components/ui/switch.tsx': 'the switch track and thumb are the universal affordance',
    'components/ui/scroll-area.tsx': 'scrollbar thumb',
    'components/ui/badge.tsx': 'the 6px status dot',
    'app/t/[slug]/admin/courses/[courseId]/builder/quiz/[lessonId]/page.tsx':
      'the option marker is a radio-style dot',
  };

  it('rounded-full appears only where a circle is meant', () => {
    const offenders: string[] = [];
    for (const f of TSX) {
      if (!/\brounded-full\b/.test(f.src)) continue;
      if (!(f.rel in ROUND_ALLOWED)) offenders.push(f.rel);
    }
    expect(
      offenders,
      `no pills — use rounded-md (4px) or rounded-sm (2px):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('no oversized radius survives', () => {
    const offenders: string[] = [];
    for (const f of TSX) {
      for (const m of f.src.matchAll(/\brounded-(?:2xl|3xl)\b/g))
        offenders.push(`${f.rel} — ${m[0]}`);
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('drop shadows are reserved for floating layers, via the pop token', () => {
    // Cards on the shell carry none at all; a shadow on every card is the second
    // tell in §9. Floating menus use --shadow-pop so there is one pop, not five.
    const offenders: string[] = [];
    for (const f of TSX) {
      for (const m of f.src.matchAll(/\bshadow-(?:md|lg|xl|2xl)\b/g))
        offenders.push(`${f.rel} — ${m[0]}`);
    }
    expect(
      offenders,
      `use shadow-pop on floating layers, nothing elsewhere:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('the eyebrow is a kicker, never the heading', () => {
  it('every uppercase run is an 11px/700 label', () => {
    /*
     * Uppercase is allowed ONLY as the small kicker above a real heading. The
     * failure this prevents is the inverse — an uppercase eyebrow used AS the
     * heading, which leaves the page with no heading at the size the ramp
     * expects and (where it replaces an <h*>) no heading in the outline either.
     */
    const offenders: string[] = [];
    for (const f of TSX) {
      for (const m of f.src.matchAll(/className="([^"]*\buppercase\b[^"]*)"/g)) {
        const cls = m[1];
        if (!/text-\[11px\]/.test(cls) || !/font-bold/.test(cls)) {
          offenders.push(`${f.rel} — "${cls.slice(0, 70)}"`);
        }
      }
    }
    expect(
      offenders,
      `an eyebrow is 11px/700/uppercase and nothing else is uppercase:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('no heading element is uppercase', () => {
    const offenders: string[] = [];
    for (const f of TSX) {
      for (const m of f.src.matchAll(/<h[1-6][^>]*\buppercase\b[^>]*>/g)) {
        offenders.push(`${f.rel} — ${m[0].slice(0, 70)}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('and table headers are not uppercase either', () => {
    // sb keeps the table header font constant across every density; the
    // tracked-out uppercase "category" header is half the heavy-table look.
    const table = FILES.find((f) => f.rel === 'components/ui/table.tsx')!.src;
    const head = table.slice(table.indexOf('function TableHead'));
    expect(head).not.toMatch(/\buppercase\b/);
  });
});

describe('colour lives in globals.css', () => {
  /*
   * Three files legitimately cannot reach a CSS custom property, and each is
   * listed with the reason rather than pattern-matched — a pattern ("anything in
   * lib/") would quietly cover the next file that has no such excuse.
   */
  const HEX_ALLOWED: Record<string, string> = {
    'app/global-error.tsx':
      'renders its own document without the app stylesheet — it is the boundary for when the root layout itself failed',
    'app/verify/[code]/page.tsx':
      'the certificate accent crosses into style= and into print, where a custom property is not guaranteed to resolve',
    'lib/email.ts': 'HTML email has no access to the page stylesheet',
  };

  it('no component hardcodes a colour', () => {
    const offenders: string[] = [];
    for (const f of TSX) {
      if (f.rel in HEX_ALLOWED) continue;
      for (const m of f.src.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
        // A placeholder is example text shown to a user, not a painted colour.
        const around = f.src.slice(Math.max(0, (m.index ?? 0) - 20), m.index);
        if (/placeholder=["']$/.test(around)) continue;
        offenders.push(`${f.rel} — ${m[0]}`);
      }
    }
    expect(offenders, `use a token from globals.css:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('the files that must hardcode do not carry the retired blue', () => {
    for (const rel of Object.keys(HEX_ALLOWED)) {
      const f = FILES.find((x) => x.rel === rel);
      expect(f, `${rel} is gone — drop it from HEX_ALLOWED`).toBeTruthy();
      expect(f!.src, `${rel} still paints the retired brand blue`).not.toMatch(
        /#2563eb|#1d4ed8|#1e40af/i,
      );
    }
  });
});

describe('selection and hover are neutral, never a pastel wash', () => {
  it('active and selected states use ink or sunken', () => {
    /*
     * The specific regression: `data-[state=selected]:bg-brand-50` on TableRow
     * and `bg-brand-50` on both nav components. Pale blue on a selected row
     * reads as "these rows are links" in a system where blue means exactly that.
     */
    const offenders: string[] = [];
    for (const f of TSX) {
      for (const m of f.src.matchAll(
        /(?:data-\[state=(?:active|selected|checked)\]|aria-current|has-\[:checked\]):[a-z-]*bg-(?!primary|sunken|secondary|accent|surface-muted|card|transparent)([a-z0-9-]+)/g,
      )) {
        offenders.push(`${f.rel} — ${m[0]}`);
      }
    }
    expect(
      offenders,
      `selected = ink or sunken (GUIDELINES.md §6):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('state colour comes from the status tokens, not raw palette utilities', () => {
  /*
   * The monochrome system has exactly one set of state colours — the status
   * tokens (green/amber/red/blue/grey), opaque and AA-verified on their tints
   * (status-tone-conventions.test.ts). A raw Tailwind palette utility
   * (`bg-amber-50`, `text-red-600`, `text-neutral-600`) bypasses them: the same
   * warning drifts to three different ambers, none matched to the tint its text is
   * AA against, and each disappears in a greyscale print unless it also carries a
   * word. Use <Callout>, <StatusBadge>, or the text-status-* / text-destructive
   * tokens. `bg-black` / `bg-white` (no number — the video letterbox) are a
   * different thing and are deliberately left alone.
   */
  const HUES =
    'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone';
  const PALETTE = new RegExp(
    `\\b(?:bg|text|border|ring|from|to|via|fill|stroke|decoration|outline|divide|accent|caret)-(?:${HUES})-\\d{2,3}\\b`,
    'g',
  );

  it('no component paints with a numbered Tailwind palette colour', () => {
    const offenders: string[] = [];
    for (const f of TSX) {
      for (const m of f.src.matchAll(PALETTE)) {
        offenders.push(`${f.rel} — ${m[0]}`);
      }
    }
    expect(
      offenders,
      `use the status tokens (Callout / StatusBadge / text-status-* / text-destructive):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
