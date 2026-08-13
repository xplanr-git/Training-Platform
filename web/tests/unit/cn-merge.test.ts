import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cn } from '@/components/ui/utils';

/**
 * tailwind-merge treats any `text-*` class it does not recognise as a text
 * COLOUR. Before utils.ts taught it the design-system ramp, `cn('text-control',
 * 'text-primary-foreground')` returned only the colour — the Button lost its
 * 13.5px control size at runtime while its source read correctly, and the
 * filled Badge had been losing `text-meta` the same way since it shipped.
 * This is the regression test for that class of silent deletion.
 */
describe('cn() keeps ramp font-sizes alongside text colours', () => {
  it('a ramp size and a text colour are different class groups', () => {
    expect(cn('text-control', 'text-primary-foreground')).toBe(
      'text-control text-primary-foreground',
    );
    expect(cn('text-meta', 'text-status-green')).toBe('text-meta text-status-green');
  });

  it('two ramp sizes still conflict (later wins)', () => {
    expect(cn('text-meta', 'text-control')).toBe('text-control');
  });

  it('every --text-* token in the theme is known to the merge config', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
    const utils = readFileSync(join(process.cwd(), 'src/components/ui/utils.ts'), 'utf8');
    const tokens = [...css.matchAll(/--text-([a-z0-9-]+):/g)]
      .map((m) => m[1])
      // --text-h2--line-height style modifiers are not utilities themselves.
      .filter((t) => !t.includes('--') && !/-(line-height|letter-spacing)$/.test(t));
    for (const t of new Set(tokens)) {
      expect(utils, `text-${t} is a ramp utility but utils.ts does not list it`).toContain(
        `'${t}'`,
      );
    }
  });
});
