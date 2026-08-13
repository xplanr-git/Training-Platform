import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * WCAG contrast maths against the real design tokens, so colour-pairing rules are
 * computed rather than eyeballed. Shared because two suites need it and a second
 * slightly-different copy of the same formula is how you end up with two answers.
 */
const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

/**
 * A `--color-*` hex value from globals.css — the LIGHT value, by construction:
 * the `.dark` override block sits after `@theme`, so the first match is always
 * the light one. Throws if the token is gone.
 */
export function token(name: string): string {
  const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!m) throw new Error(`token ${name} not found in globals.css`);
  return m[1];
}

/** The same token's DARK value, read from inside the `.dark { … }` block. */
export function darkToken(name: string): string {
  const block = /\.dark\s*\{([\s\S]*?)\n\}/.exec(css)?.[1];
  if (!block) throw new Error('the .dark theme block is missing from globals.css');
  const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block);
  if (!m) throw new Error(`token ${name} not found in the .dark block`);
  return m[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio, 1–21. Order of arguments does not matter. */
export function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Tailwind's `neutral-700`, used for body copy on tinted panels where
 * `--color-muted` is too light. Not a project token, so it is pinned here.
 */
export const NEUTRAL_700 = '#404040';

/** WCAG 2.1 AA minimum for normal-size text. */
export const AA_NORMAL_TEXT = 4.5;
