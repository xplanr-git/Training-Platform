import { describe, it, expect } from 'vitest';
import { safeRedirect } from '@/lib/safe-redirect';

const ORIGIN = 'https://training.structurebuild.co';

describe('safeRedirect', () => {
  it('keeps ordinary site-relative paths', () => {
    expect(safeRedirect('/admin/courses', ORIGIN)).toBe('/admin/courses');
    expect(safeRedirect('/learn/x?a=1#top', ORIGIN)).toBe('/learn/x?a=1#top');
  });

  it('falls back for missing or empty input', () => {
    expect(safeRedirect(null, ORIGIN)).toBe('/dashboard');
    expect(safeRedirect(undefined, ORIGIN)).toBe('/dashboard');
    expect(safeRedirect('', ORIGIN)).toBe('/dashboard');
    expect(safeRedirect(null, ORIGIN, '/auth/set-password')).toBe('/auth/set-password');
  });

  it('rejects absolute off-origin URLs', () => {
    expect(safeRedirect('https://evil.example/x', ORIGIN)).toBe('/dashboard');
    expect(safeRedirect('http://evil.example', ORIGIN)).toBe('/dashboard');
  });

  it('rejects protocol-relative URLs', () => {
    // The original bug on /login: startsWith('/') was true for this.
    expect(safeRedirect('//evil.example', ORIGIN)).toBe('/dashboard');
    expect(safeRedirect('//evil.example/path', ORIGIN)).toBe('/dashboard');
  });

  it('rejects the backslash form the string-matching guard missed', () => {
    // The WHATWG parser treats '\' as '/' for http(s), so these resolved
    // off-origin while passing a `startsWith('//')` check. Reachable as %5C.
    expect(safeRedirect('/\\evil.example', ORIGIN)).toBe('/dashboard');
    expect(safeRedirect('\\\\evil.example', ORIGIN)).toBe('/dashboard');
    expect(safeRedirect('/\\/evil.example', ORIGIN)).toBe('/dashboard');
  });

  it('never returns an off-origin target for tab/newline tricks', () => {
    // Tab, CR and LF are stripped by the parser before resolution, so the only
    // thing that matters is where the result actually points.
    for (const raw of ['/\tevil.example', '/\n//evil.example', '/\r\\evil.example']) {
      const out = safeRedirect(raw, ORIGIN);
      expect(new URL(out, ORIGIN).origin).toBe(ORIGIN);
    }
  });

  it('rejects non-http schemes', () => {
    expect(safeRedirect('javascript:alert(1)', ORIGIN)).toBe('/dashboard');
    expect(safeRedirect('data:text/html,x', ORIGIN)).toBe('/dashboard');
    expect(safeRedirect('mailto:a@b.c', ORIGIN)).toBe('/dashboard');
  });

  it('whatever it returns always resolves back to the same origin', () => {
    const hostile = [
      '//evil.example',
      '/\\evil.example',
      'https://evil.example',
      'javascript:alert(1)',
      '/\t/\\evil.example',
      '////evil.example',
      'https:evil.example',
    ];
    for (const raw of hostile) {
      expect(new URL(safeRedirect(raw, ORIGIN), ORIGIN).origin).toBe(ORIGIN);
    }
  });
});
