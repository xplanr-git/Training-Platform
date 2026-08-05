import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { videoUnavailableReason, isVideoFault } from '@/lib/video-availability';

/**
 * `hostConfigured` is a parameter, not an env read, so these cases are stated
 * outright instead of being simulated. The first version of this test set
 * BUNNY_LIBRARY_ID and re-imported the module for each case — theatre, because the
 * classifier never looked at env, and it could not import the module at all:
 * `lib/video.ts` pulls in React's `cache`, which exists only in the react-server
 * build. That is why this logic now lives in its own module.
 */
const noHost = { hostConfigured: false };
const withHost = { hostConfigured: true };

describe('why a video lesson has nothing to play', () => {
  // All four of these rendered as one line, "Video unavailable." — and they need
  // four different responses, three of which are nobody-in-the-academy's fault.

  it('nothing attached at all', () => {
    expect(videoUnavailableReason({}, noHost)).toEqual({ reason: 'not-attached' });
    expect(videoUnavailableReason(null, noHost)).toEqual({ reason: 'not-attached' });
    // Whitespace is not a video id.
    expect(videoUnavailableReason({ videoId: '   ' }, noHost)).toEqual({ reason: 'not-attached' });
  });

  it('a Bunny video attached with no library id on the deployment', async () => {
    // The case the backlog names: the lesson is fine, the deployment is not, and
    // nobody in the academy can do anything about it.
    expect(videoUnavailableReason({ videoId: 'abc-123', provider: 'bunny' }, noHost)).toEqual({
      reason: 'host-not-configured',
      videoId: 'abc-123',
    });
  });

  it('the SAME content with the host configured is not blamed on configuration', () => {
    // Blaming BUNNY_LIBRARY_ID when it is in fact set would send someone to fix
    // something that is not broken.
    expect(videoUnavailableReason({ videoId: 'abc-123', provider: 'bunny' }, withHost)).toEqual({
      reason: 'unexpected',
    });
  });

  it('a provider this build cannot play', async () => {
    // hostedVideoFromContent() returns null for these, which is precisely why they
    // were indistinguishable from "the author has not got round to it".
    expect(videoUnavailableReason({ videoId: 'v1', provider: 'vimeo' }, withHost)).toEqual({
      reason: 'unknown-provider',
      providerName: 'vimeo',
    });
  });

  it('a video id with no provider named', async () => {
    expect(videoUnavailableReason({ videoId: 'v1' }, withHost)).toEqual({
      reason: 'unknown-provider',
      providerName: 'unnamed',
    });
  });

  it('a legacy link that is not YouTube', async () => {
    expect(videoUnavailableReason({ youtubeUrl: 'https://vimeo.com/12345' }, withHost)).toEqual({
      reason: 'unplayable-link',
      url: 'https://vimeo.com/12345',
    });
  });

  it('a Bunny video takes precedence over a stale legacy link', async () => {
    // Lessons migrated off YouTube can carry both. The Bunny id is the real source.
    expect(
      videoUnavailableReason(
        { videoId: 'v1', provider: 'bunny', youtubeUrl: 'https://youtu.be/aaaaaaaaaaa' },
        noHost,
      ),
    ).toEqual({ reason: 'host-not-configured', videoId: 'v1' });
  });
});

describe('which reasons are faults worth logging', () => {
  it('an unattached video is not a fault — logging it would just be noise', () => {
    expect(isVideoFault({ reason: 'not-attached' })).toBe(false);
  });

  it('the rest are', () => {
    expect(isVideoFault({ reason: 'host-not-configured', videoId: 'x' })).toBe(true);
    expect(isVideoFault({ reason: 'unknown-provider', providerName: 'x' })).toBe(true);
    expect(isVideoFault({ reason: 'unplayable-link', url: 'x' })).toBe(true);
    expect(isVideoFault({ reason: 'unexpected' })).toBe(true);
  });
});

describe('the player uses it correctly', () => {
  const PAGE = readFileSync(
    join(process.cwd(), 'src/app/t/[slug]/learn/[courseSlug]/[lessonId]/page.tsx'),
    'utf8',
  ).replace(/\r\n/g, '\n');

  it('the fallback branch can never render nothing', () => {
    /*
     * The guarantee is now structural rather than defensive. The player switches on a
     * single discriminated union from resolveVideoSource, so the last branch IS the
     * unavailable case — not a `: null`. Previously this was two separate decisions (a
     * JSX ternary and a `playable` const) whose drift would leave an empty space where
     * the player belongs; that shape can no longer be written.
     */
    expect(PAGE, 'the player must resolve one source').toMatch(/const source =/);
    expect(PAGE).toMatch(/resolveVideoSource\(content, \{ libraryId:/);
    const block = PAGE.slice(PAGE.indexOf("{lesson.type === 'video' &&"));
    const videoBranch = block.slice(0, block.indexOf('))}') + 3);
    expect(videoBranch, 'the final branch must render the component, not null').toMatch(
      /\) : \([\s\S]{0,200}<VideoUnavailable/,
    );
    expect(videoBranch, 'a `: null` fallback is exactly the hole this removed').not.toMatch(
      /: null\)\}/,
    );
    expect(videoBranch, 'no second playability check beside the switch').not.toMatch(
      /bunnyLibraryId\(\) &&|youtubeEmbed\(/,
    );
  });

  it('logs a fault so a missing env var is findable in production', () => {
    // The backlog complaint was "nothing logged and no way to diagnose".
    expect(PAGE).toMatch(/isVideoFault\(source\.unavailable\)/);
    expect(PAGE).toMatch(/console\.error\('\[video unavailable\]'/);
    // Enough context to find the lesson without guessing.
    const log = PAGE.slice(PAGE.indexOf("console.error('[video unavailable]'"));
    for (const field of ['reason', 'lessonId', 'courseId', 'tenantId']) {
      expect(log.slice(0, 300)).toContain(field);
    }
  });

  it('does not log the normal mid-authoring state', () => {
    /*
     * A lesson awaiting its video is an ordinary state on a course being built; if it
     * logged, the signal for real faults would be buried. This used to need an explicit
     * `!playable &&` gate. It no longer does: the log is reached only when
     * `source.kind === 'unavailable'`, which by construction excludes anything playable,
     * and isVideoFault() then excludes not-attached.
     */
    expect(PAGE).toMatch(
      /source\?\.kind === 'unavailable' && isVideoFault\(source\.unavailable\)/,
    );
  });

  it('renders the component rather than a bare line', () => {
    expect(PAGE).toContain('<VideoUnavailable');
    expect(PAGE).not.toContain('Video unavailable.</p>');
  });
});

describe('the message suits its audience', () => {
  const C = readFileSync(join(process.cwd(), 'src/components/video-unavailable.tsx'), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('keeps the player footprint so the page does not collapse', () => {
    // The old fallback was one line of text where a 16:9 player belongs, so the
    // lesson looked broken rather than incomplete.
    expect(C).toMatch(/aspect-video/);
  });

  it('names the env var to admins only, never to learners', () => {
    // Not a secret, and the single most useful word in the message — but useless to
    // a learner, and infrastructure detail on a learner page is noise at best.
    expect(C).toContain('BUNNY_LIBRARY_ID');
    const admin = C.slice(C.indexOf('function adminMessage'));
    expect(admin, 'the env var must be named in the admin message').toContain('BUNNY_LIBRARY_ID');
    const learner = C.slice(C.indexOf('function learnerMessage'), C.indexOf('function adminMessage'));
    expect(learner, 'learner copy must not carry infrastructure detail').not.toContain(
      'BUNNY_LIBRARY_ID',
    );
  });

  it('admin detail is gated on preview, not shown to everyone', () => {
    expect(C).toMatch(/\{isPreview && \(/);
  });

  it('never blames the learner or tells them to retry when retrying cannot help', () => {
    const learner = C.slice(C.indexOf('function learnerMessage'), C.indexOf('function adminMessage'));
    expect(learner).toMatch(/Nothing is wrong at your end|not with your device/);
    expect(learner.toLowerCase()).not.toContain('try again');
  });

  it('decorative icons are hidden from screen readers', () => {
    const icons = [...C.matchAll(/<(VideoOff|Wrench)\b[^/]*\/>/g)];
    expect(icons.length).toBe(2);
    for (const [tag] of icons) expect(tag).toContain('aria-hidden="true"');
  });
});
