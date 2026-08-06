import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * CLAUDE.md §7.11: every mutation on tenants, memberships, roles, courses,
 * enrollments and certificates must go through the audit helper.
 *
 * It was being violated in fifteen places at once, and nothing noticed —
 * including a whole file (builder/quiz/actions.ts) that imported no audit
 * helper at all. A silent change to a pass threshold or an answer key is
 * precisely the accreditation-relevant event the log exists to record, and it
 * was going unrecorded.
 *
 * The rule cannot be checked perfectly from source, so this checks the thing
 * that actually failed: an actions file that writes must import `audited`, and
 * every write must sit inside a transaction with one. A file with a `.insert(`,
 * `.update(` or `.delete(` and no `audited(` is the exact shape of the gap.
 */

const SRC = join(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (e.name === 'actions.ts' || e.name === 'route.ts') out.push(f);
  }
  return out;
}

const rel = (f: string) => f.replace(process.cwd(), '').replace(/\\/g, '/');
/** Comments stripped: four earlier guards in this repo were satisfied by their own prose. */
const code = (f: string) =>
  readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

/**
 * Files that write but legitimately do not audit.
 *
 * Kept explicit and short. Anything added here needs a reason in writing —
 * an allowlist that grows quietly is how §7.11 was lost the first time.
 */
const EXEMPT: Array<[string, string]> = [
  [
    '/src/app/t/[slug]/learn/[courseSlug]/actions.ts',
    // Writes progress_events on every video ping — auditing each one would bury
    // the log in telemetry. progress_events IS the record for those, and it is
    // itself append-only. Its accreditation-relevant writes (quiz attempts,
    // completions, certificates) ARE audited, asserted separately below.
    'append-only progress telemetry; its certificate/attempt writes are audited',
  ],
];

describe('every writing action routes through the audit helper', () => {
  const writers = walk(SRC).filter((f) => /\.(insert|update|delete)\(/.test(code(f)));

  it('finds a realistic number of writing files, so the scan is not silently empty', () => {
    expect(writers.length).toBeGreaterThanOrEqual(8);
  });

  it('no writing action file is missing the audit helper', () => {
    const exemptPaths = EXEMPT.map(([p]) => p);
    const missing = writers
      .filter((f) => !exemptPaths.includes(rel(f)))
      .filter((f) => !/audited\(/.test(code(f)))
      .map(rel);
    expect(
      missing,
      `these mutate without an audit trail (CLAUDE.md §7.11):\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('the exemption list still matches real files, so it cannot rot into a blanket pass', () => {
    for (const [path] of EXEMPT) {
      expect(
        writers.map(rel),
        `${path} is exempted but is no longer a writing action file — remove the exemption`,
      ).toContain(path);
    }
  });
});

describe('the mutations that had no audit trail now have one', () => {
  /*
   * Named individually rather than counted. Each of these was found missing, and
   * a count would silently pass again if one were removed while another was added.
   */
  const read = (p: string) => code(join(SRC, p));

  it('the course builder audits structure changes', () => {
    const src = read('app/t/[slug]/admin/courses/[courseId]/builder/actions.ts');
    for (const action of [
      'section.create',
      'section.delete',
      'section.reorder',
      'lesson.create',
      'lesson.update',
      'lesson.delete',
      'lesson.reorder',
    ]) {
      expect(src, `${action} is not audited`).toMatch(new RegExp(`'${action}'`));
    }
  });

  it('the quiz builder audits threshold and answer-key changes', () => {
    const src = read('app/t/[slug]/admin/courses/[courseId]/builder/quiz/actions.ts');
    // This file imported no audit helper at all.
    expect(src).toMatch(/import \{[\s\S]*?audited[\s\S]*?\} from '@training-platform\/db'/);
    for (const action of [
      'quiz.create',
      'quiz.settings_change',
      'quiz_question.create',
      'quiz_question.delete',
    ]) {
      expect(src, `${action} is not audited`).toMatch(new RegExp(`'${action}'`));
    }
  });

  it('a quiz attempt is recorded with the threshold in force at the time', () => {
    // An admin can change the threshold afterwards, so the score alone does not
    // establish whether the learner passed the bar that applied to them.
    const src = read('app/t/[slug]/learn/[courseSlug]/actions.ts');
    expect(src).toMatch(/'quiz_attempt\.(passed|failed)'/);
    expect(src).toMatch(/threshold,/);
  });

  it('Stripe subscription changes are audited, since they decide entitlement', () => {
    const src = read('app/api/webhooks/stripe/route.ts');
    expect(src).toMatch(/subscription\.\$\{|'subscription\.create'|'subscription\.update'/);
    expect(src).toMatch(/actorUserId: null/);
  });

  it('filling a blank user name is audited on both paths', () => {
    // `users` is one global row shared across academies, so this write is
    // visible on another academy's certificates.
    for (const p of [
      'app/t/[slug]/admin/people/actions.ts',
      'app/t/[slug]/join/actions.ts',
    ] as const) {
      expect(read(p), `${p} does not audit the name fill`).toMatch(/'user\.name_filled'/);
    }
  });
});

describe('quiz attempts are bounded', () => {
  const src = code(join(SRC, 'app/t/[slug]/learn/[courseSlug]/actions.ts'));

  it('checks an attempt cap BEFORE grading', () => {
    // Unlimited submissions against a server returning pass/fail is a
    // brute-forced pass, and a pass auto-issues a certificate.
    expect(src).toMatch(/maxAttempts/);
    const cap = src.indexOf('used >= maxAttempts');
    const grade = src.indexOf('gradeQuiz(');
    expect(cap, 'no attempt cap').toBeGreaterThan(-1);
    expect(grade).toBeGreaterThan(-1);
    // The count query and the throw must precede the insert of a new attempt.
    expect(src.indexOf('insert(quizAttempts)')).toBeGreaterThan(cap);
  });

  it('rate-limits on the enrolment, not the address', () => {
    // An IP key would punish a training room on one connection and be
    // sidestepped by a phone.
    expect(src).toMatch(/rateLimit\([^)]*enrollmentId/);
    expect(src).toMatch(/RULES\.quizAttempt/);
  });

  it('only counts attempts that were actually submitted', () => {
    expect(src).toMatch(/isNotNull\(quizAttempts\.submittedAt\)/);
  });
});

describe('ids that arrive together are checked against each other', () => {
  it('addLesson confirms the section is in THIS course', () => {
    // courseId and sectionId arrive separately and were each checked against the
    // tenant but never against each other, so a lesson could be filed into a
    // different course of the caller's own academy.
    const src = code(join(SRC, 'app/t/[slug]/admin/courses/[courseId]/builder/actions.ts'));
    const body = src.slice(src.indexOf('export async function addLesson'));
    expect(body.slice(0, 1400)).toMatch(/eq\(sections\.courseId, courseId\)/);
  });

  it('ensureQuiz confirms the lesson is in the caller tenant and course', () => {
    // lessonId went straight into the insert unchecked, so a quiz row in the
    // caller's academy could point at another academy's lesson.
    const src = code(join(SRC, 'app/t/[slug]/admin/courses/[courseId]/builder/quiz/actions.ts'));
    const body = src.slice(src.indexOf('export async function ensureQuiz'));
    expect(body.slice(0, 1200)).toMatch(/eq\(lessons\.tenantId, ctx\.tenantId\)/);
    expect(body.slice(0, 1200)).toMatch(/eq\(lessons\.courseId, courseId\)/);
  });
});

describe('a caller-supplied redirect target is validated', () => {
  it('markLessonComplete runs nextHref through safeRedirect', () => {
    // It was returned verbatim as `redirectTo` and fed to router.push by
    // nav-form.tsx — an open redirect reachable by any enrolled learner.
    const src = code(join(SRC, 'app/t/[slug]/learn/[courseSlug]/actions.ts'));
    expect(src).toMatch(/safeRedirect\(nextHref/);
    expect(src).not.toMatch(/redirectTo: nextHref \?\?/);
  });
});
