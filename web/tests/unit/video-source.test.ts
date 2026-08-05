import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveVideoSource, youtubeEmbed } from '@/lib/video-source';

const LIB = { libraryId: 'lib-123' };
const NO_LIB = { libraryId: null };

/**
 * The player used to decide what a lesson plays TWICE — a JSX ternary and a `playable`
 * const beside it, testing the same two conditions. This is that decision, once, as a
 * pure function, so every case can be stated rather than reasoned about.
 */
describe('what a video lesson plays', () => {
  it('a Bunny video with a configured library', () => {
    expect(resolveVideoSource({ videoId: 'v1', provider: 'bunny' }, LIB)).toEqual({
      kind: 'bunny',
      videoId: 'v1',
      libraryId: 'lib-123',
    });
  });

  it('a legacy YouTube link when there is no hosted video', () => {
    const s = resolveVideoSource({ youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ' }, LIB);
    expect(s).toEqual({ kind: 'youtube', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' });
  });

  it('nothing attached at all', () => {
    expect(resolveVideoSource({}, LIB)).toEqual({
      kind: 'unavailable',
      unavailable: { reason: 'not-attached' },
    });
  });

  it('a Bunny video but no library id on the deployment', () => {
    expect(resolveVideoSource({ videoId: 'v1', provider: 'bunny' }, NO_LIB)).toEqual({
      kind: 'unavailable',
      unavailable: { reason: 'host-not-configured', videoId: 'v1' },
    });
  });

  it('a provider this build cannot play', () => {
    expect(resolveVideoSource({ videoId: 'v1', provider: 'vimeo' }, LIB)).toEqual({
      kind: 'unavailable',
      unavailable: { reason: 'unknown-provider', providerName: 'vimeo' },
    });
  });

  it('a legacy link that is not a YouTube link', () => {
    expect(resolveVideoSource({ youtubeUrl: 'https://vimeo.com/12345' }, LIB)).toEqual({
      kind: 'unavailable',
      unavailable: { reason: 'unplayable-link', url: 'https://vimeo.com/12345' },
    });
  });

  it('whitespace is not a video id, and not a library id', () => {
    expect(resolveVideoSource({ videoId: '   ', provider: 'bunny' }, LIB).kind).toBe('unavailable');
    expect(resolveVideoSource({ videoId: 'v1', provider: 'bunny' }, { libraryId: '  ' })).toEqual({
      kind: 'unavailable',
      unavailable: { reason: 'host-not-configured', videoId: 'v1' },
    });
  });

  it('handles null and undefined content', () => {
    expect(resolveVideoSource(null, LIB).kind).toBe('unavailable');
    expect(resolveVideoSource(undefined, LIB).kind).toBe('unavailable');
  });
});

describe('a hosted video always wins over a stale legacy link', () => {
  /*
   * Lessons migrated off YouTube can carry BOTH a Bunny id and the old youtubeUrl. The
   * Bunny id is the real source: it is the one that records watch time and supports
   * resume, and the YouTube copy records nothing.
   */
  const BOTH = {
    videoId: 'v1',
    provider: 'bunny',
    youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
  };

  it('plays Bunny when the host is configured', () => {
    expect(resolveVideoSource(BOTH, LIB).kind).toBe('bunny');
  });

  it('reports host-not-configured rather than silently playing the YouTube copy', () => {
    /*
     * The important case. Falling back to YouTube here would look like it worked while
     * recording no progress at all — a learner would finish a lesson and the platform
     * would have no evidence of it. Better to say the host is misconfigured.
     */
    expect(resolveVideoSource(BOTH, NO_LIB)).toEqual({
      kind: 'unavailable',
      unavailable: { reason: 'host-not-configured', videoId: 'v1' },
    });
  });
});

describe('youtubeEmbed', () => {
  it('accepts the three URL shapes that exist in the wild', () => {
    for (const u of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
    ]) {
      expect(youtubeEmbed(u), u).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    }
  });

  it('rejects anything else', () => {
    for (const u of ['', 'not a url', 'https://vimeo.com/12345', 'https://youtu.be/short']) {
      expect(youtubeEmbed(u), u).toBeNull();
    }
  });
});

describe('the decision is made in one place', () => {
  const PAGE = readFileSync(
    join(process.cwd(), 'src/app/t/[slug]/learn/[courseSlug]/[lessonId]/page.tsx'),
    'utf8',
  ).replace(/\r\n/g, '\n');
  const SOURCE = readFileSync(join(process.cwd(), 'src/lib/video-source.ts'), 'utf8');

  it('the player does not re-derive playability', () => {
    // The two conditions that used to be duplicated in the JSX.
    expect(PAGE).not.toMatch(/provider === 'bunny' && env\.bunnyLibraryId\(\)/);
    expect(PAGE, 'youtubeEmbed belongs to the resolver now').not.toMatch(/youtubeEmbed\(/);
    expect(PAGE, 'and there should be no `playable` const beside the switch').not.toMatch(
      /const playable\b/,
    );
  });

  it('the resolver stays free of env and of lib/video.ts', () => {
    /*
     * `libraryId` is a parameter so the decision is pure and testable, and lib/video.ts
     * imports React's `cache`, which exists only in the react-server build — anything
     * importing it cannot be unit-tested at all. That is why this module exists
     * separately, and the same reason video-availability.ts does.
     */
    expect(SOURCE).not.toMatch(/from '@\/lib\/env'/);
    expect(SOURCE).not.toMatch(/from '@\/lib\/video'/);
    expect(SOURCE).toMatch(/libraryId: string \| null/);
  });
});
