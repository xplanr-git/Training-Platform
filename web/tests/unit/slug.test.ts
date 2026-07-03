import { describe, it, expect } from 'vitest';
import { normalizeSlug, validateSlug } from '@/lib/slug';

describe('normalizeSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(normalizeSlug('Acme Training Co.')).toBe('acme-training-co');
    expect(normalizeSlug('  Foo__Bar  ')).toBe('foo-bar');
  });
});

describe('validateSlug', () => {
  it('accepts valid slugs', () => {
    expect(validateSlug('acme')).toBeNull();
    expect(validateSlug('acme-training-co')).toBeNull();
  });

  it('rejects too short, bad chars, and reserved', () => {
    expect(validateSlug('ab')).toMatch(/at least/);
    expect(validateSlug('Acme')).toMatch(/lowercase/);
    expect(validateSlug('a--b')).toMatch(/lowercase/);
    expect(validateSlug('admin')).toMatch(/reserved/);
  });
});
