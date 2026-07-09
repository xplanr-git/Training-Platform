import { describe, it, expect } from 'vitest';
import { parsePrice, isCourseStatus, clampInt, safeHttpUrl } from '@/lib/validation';

describe('safeHttpUrl', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(safeHttpUrl('https://cdn.example.com/a.pdf')).toBe(
      'https://cdn.example.com/a.pdf',
    );
    expect(safeHttpUrl('http://example.com')).toBe('http://example.com/');
  });

  it('rejects javascript: and data: URLs (XSS vectors)', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('JavaScript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeHttpUrl('vbscript:msgbox(1)')).toBeNull();
  });

  it('rejects blank, relative, and malformed values', () => {
    expect(safeHttpUrl('')).toBeNull();
    expect(safeHttpUrl('   ')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
    expect(safeHttpUrl('/relative/path.pdf')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
  });
});

describe('clampInt', () => {
  it('returns the fallback for non-numeric / empty input (never NaN)', () => {
    expect(clampInt('abc', 0, 100, 70)).toBe(70);
    expect(clampInt('', 0, 100, 70)).toBe(70);
    expect(clampInt(null, 1, 100, 1)).toBe(1);
    expect(clampInt(undefined, 1, 100, 1)).toBe(1);
    expect(Number.isNaN(clampInt('abc', 0, 100, 70))).toBe(false);
  });

  it('clamps to the [min, max] range', () => {
    expect(clampInt('150', 0, 100, 70)).toBe(100);
    expect(clampInt('-5', 0, 100, 70)).toBe(0);
    expect(clampInt('0', 1, 100, 1)).toBe(1);
  });

  it('rounds decimals to an integer', () => {
    expect(clampInt('3.4', 1, 100, 1)).toBe(3);
    expect(clampInt('3.6', 1, 100, 1)).toBe(4);
  });

  it('passes through valid in-range integers', () => {
    expect(clampInt('70', 0, 100, 70)).toBe(70);
    expect(clampInt('5', 1, 100, 1)).toBe(5);
  });
});

describe('parsePrice', () => {
  it('treats blank / null / undefined / zero as free (null)', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('   ')).toBeNull();
    expect(parsePrice(null)).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
    expect(parsePrice('0')).toBeNull();
    expect(parsePrice('0.00')).toBeNull();
  });

  it('normalizes valid prices to a 2-decimal string', () => {
    expect(parsePrice('49')).toBe('49.00');
    expect(parsePrice('49.9')).toBe('49.90');
    expect(parsePrice('1299.50')).toBe('1299.50');
  });

  it('rejects negative prices', () => {
    expect(() => parsePrice('-1')).toThrow(/negative/i);
    expect(() => parsePrice('-0.01')).toThrow(/negative/i);
  });

  it('rejects non-numeric input', () => {
    expect(() => parsePrice('abc')).toThrow(/number/i);
    expect(() => parsePrice('$49')).toThrow(/number/i);
    expect(() => parsePrice('10,00')).toThrow(/number/i);
  });

  it('rejects sub-cent precision', () => {
    expect(() => parsePrice('9.999')).toThrow(/decimal/i);
  });

  it('rejects absurdly large values', () => {
    expect(() => parsePrice('2000000')).toThrow(/too large/i);
  });
});

describe('isCourseStatus', () => {
  it('accepts the three valid statuses', () => {
    expect(isCourseStatus('draft')).toBe(true);
    expect(isCourseStatus('published')).toBe(true);
    expect(isCourseStatus('archived')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isCourseStatus('deleted')).toBe(false);
    expect(isCourseStatus('')).toBe(false);
    expect(isCourseStatus('DRAFT')).toBe(false);
  });
});
