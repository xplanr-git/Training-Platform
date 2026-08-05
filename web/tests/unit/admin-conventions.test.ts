import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

const BUILDER = 'src/app/t/[slug]/admin/courses/[courseId]/builder/page.tsx';
const QUIZ = 'src/app/t/[slug]/admin/courses/[courseId]/builder/quiz/[lessonId]/page.tsx';
const SHELL = 'src/components/admin-shell.tsx';
// The quiz page's type/options/answer-key controls moved into this client
// component when the answer key became a picker. Without it in the list below,
// a nameless control there would ship green — the guard walked page files only.
const ANSWER_FIELDS = 'src/components/quiz-answer-fields.tsx';

describe('every control in the dense admin forms has a name that survives typing', () => {
  /*
   * The builder was, in the backlog's words, "a dense row of unlabelled inputs" —
   * and worse than it looked. Some controls had NO name at all (the lesson-title
   * Input, the lesson-type select, which cannot fall back to a placeholder). The
   * rest were placeholder-only, and a placeholder disappears the moment a field has
   * a value — which on an EDIT form is always. So the row was anonymous for exactly
   * the lessons an author is most likely to be editing.
   */
  for (const [name, path] of [
    ['course builder', BUILDER],
    ['quiz builder', QUIZ],
    ['quiz answer fields', ANSWER_FIELDS],
  ] as const) {
    it(`${name}: no Input, select or textarea is nameless`, () => {
      const src = read(path);
      const nameless: string[] = [];
      // Ids referenced by a <Label htmlFor> count as named.
      const labelled = new Set([...src.matchAll(/htmlFor="([^"]+)"/g)].map((m) => m[1]));

      /**
       * A control WRAPPED in a <label> is named by that label's text, and that is the
       * better pattern where a visible label already exists — adding aria-label there
       * OVERRIDES the visible text, so the accessible name no longer contains it and
       * 2.5.3 Label in Name fails. Two controls in the quiz builder had exactly that,
       * because the first version of this guard only recognised aria-label and
       * htmlFor, and I satisfied it the wrong way.
       */
      const wrappedInLabel = (at: number) => {
        const before = src.slice(0, at);
        return before.lastIndexOf('<label') > before.lastIndexOf('</label>');
      };

      for (const m of src.matchAll(/<(Input|select|textarea)\b([\s\S]{0,400}?)\/?>/g)) {
        const attrs = m[2];
        if (/type="hidden"/.test(attrs)) continue;
        const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
        if (/aria-label=/.test(attrs)) continue;
        if (id && labelled.has(id)) continue;
        if (wrappedInLabel(m.index ?? 0)) continue;
        nameless.push(`${path}:${src.slice(0, m.index ?? 0).split('\n').length} <${m[1]}>`);
      }
      expect(
        nameless,
        `give these an aria-label or a <Label htmlFor>:\n${nameless.join('\n')}`,
      ).toEqual([]);
    });
  }

  it('a title= tooltip is not used in place of a name', () => {
    // title= is not an accessible name for a form control in any assistive tech
    // worth relying on, and it never appears for keyboard or touch users.
    for (const path of [BUILDER, QUIZ]) {
      const src = read(path);
      const offenders = [...src.matchAll(/<(Input|select|textarea)\b([\s\S]{0,400}?)\/?>/g)]
        .filter((m) => /\btitle="/.test(m[2]) && !/aria-label=/.test(m[2]))
        .map((m) => `${path}:${src.slice(0, m.index ?? 0).split('\n').length}`);
      expect(offenders, offenders.join('\n')).toEqual([]);
    }
  });
});

describe('the quiz builder does not describe behaviour it does not have', () => {
  /*
   * The empty state used to read "Learners must answer every question to finish the
   * lesson, and you choose the pass mark in the quiz settings." Both halves were
   * false, and both were written into this repo by an earlier pass of this same
   * backlog: quiz-form.tsx sets no `required` on anything, gradeQuiz scores an empty
   * selection as WRONG rather than blocking submission, and there is no screen called
   * "quiz settings" — the control on this page is labelled "Pass threshold (%)".
   */
  const src = read(QUIZ);

  it('does not claim every question must be answered', () => {
    expect(src).not.toMatch(/must answer every question/i);
  });

  it('does not send the author to a screen that does not exist', () => {
    expect(src, 'the control is labelled "Pass threshold (%)"').not.toMatch(/quiz settings/i);
  });

  it('nothing in the quiz form actually forces an answer, which is why', () => {
    // If this ever changes, the copy above may become sayable — so it is asserted
    // rather than left as a comment.
    const form = read('src/components/quiz-form.tsx');
    expect(form).not.toMatch(/\brequired\b/);
  });

  it('only the answer-key control for the chosen type is rendered', () => {
    /*
     * This replaces a weaker guard. Both answer-key controls used to render
     * unconditionally — a number box for multiple choice and a True/False select —
     * with only one ever read, so the labels had to carry "— multiple choice only"
     * and "— True / False only" to stop an author filling the wrong one and having
     * the question silently take the other's answer.
     *
     * The picker branches on the type instead, so exactly one control exists at a
     * time and the disambiguating suffixes are not just unnecessary but wrong:
     * nothing is on screen to disambiguate from. Asserting the branch keeps that
     * true; if both ever render again, the labels have to come back.
     */
    const fields = read(ANSWER_FIELDS);
    expect(fields).toMatch(/type === 'true_false' \?/);
    expect(src, 'the page no longer owns these controls').not.toMatch(/multiple choice only/);
    expect(src).not.toMatch(/True \/ False only/);
  });
});

describe('admin nav highlights exactly one section', () => {
  it('matches on whole path segments, not a bare prefix', () => {
    const src = read(SHELL);
    expect(
      src,
      'a bare startsWith lights up two items as soon as one path prefixes another',
    ).toMatch(/activePath === base \|\| activePath\.startsWith\(`\$\{base\}\/`\)/);
    expect(src).not.toMatch(/activePath\.startsWith\(base\)\s*&&/);
  });
});
