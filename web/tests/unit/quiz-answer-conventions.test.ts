import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WEB = resolve(process.cwd());
const strip = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const code = (...p: string[]) => strip(readFileSync(join(WEB, ...p), 'utf8'));

const FIELDS = code('src', 'components', 'quiz-answer-fields.tsx');
const QUIZ_PAGE = code(
  'src',
  'app',
  't',
  '[slug]',
  'admin',
  'courses',
  '[courseId]',
  'builder',
  'quiz',
  '[lessonId]',
  'page.tsx',
);
const QUIZ_ACTIONS = code(
  'src',
  'app',
  't',
  '[slug]',
  'admin',
  'courses',
  '[courseId]',
  'builder',
  'quiz',
  'actions.ts',
);
const LIB = code('src', 'lib', 'quiz.ts');

/**
 * The answer key must never go back to being a typed number.
 *
 * It used to be a free-text box the author put 1-based option numbers into
 * ("2", or "1,3") beside a True/False select, with BOTH rendered whatever the
 * question type was — the markup's own comment admitted an author could "fill in
 * the wrong box and the question silently takes the other one's answer".
 *
 * Worse, the numbers were validated by a filter that dropped whatever it did not
 * like, so with three options "1,4" saved [0]: the author marked two answers,
 * saw no error, and one silently vanished. "2,2" saved [1,1], which gradeQuiz
 * can never match because it compares option sets exactly — an unpassable
 * question, and a quiz lesson can only be completed by passing.
 */
describe('the answer key is picked, not typed', () => {
  it('no free-text field collects the correct option', () => {
    for (const [label, src] of [
      ['quiz page', QUIZ_PAGE],
      ['answer fields', FIELDS],
    ] as const) {
      expect(src, `${label} still has a text input named correct`).not.toMatch(
        /<Input[^>]*name="correct"/,
      );
      expect(src, `${label} still asks for option numbers`).not.toMatch(
        /placeholder="e\.g\. 2 or 1,3"/,
      );
    }
  });

  it('the choices are radios or checkboxes named correct', () => {
    expect(FIELDS).toMatch(/name="correct"/);
    expect(FIELDS).toMatch(/type=\{type === 'mcq' \? 'radio' : 'checkbox'\}/);
  });

  it('they are built from the options the author typed', () => {
    // The point of the picker: the answer is chosen beside its own text, so
    // there is no 1-based/0-based translation for the author to get wrong.
    expect(FIELDS).toMatch(/optionsText/);
    expect(FIELDS).toMatch(/options\.map\(\(option, i\) =>/);
    expect(FIELDS, 'the submitted value must stay 1-based').toMatch(/value=\{i \+ 1\}/);
  });

  it('each choice is named by its own option text', () => {
    // Verified in a browser: one <label> per control, accessible name "Three" /
    // "Four" / "Five". aria-label is deliberately absent — a11y-conventions
    // forbids one on a control inside a wrapping label (WCAG 2.5.3).
    const choiceBlock = FIELDS.slice(FIELDS.indexOf('options.map'));
    expect(choiceBlock).toMatch(/<label[^>]*>/);
    expect(choiceBlock).toMatch(/<span>\{option\}<\/span>/);
    expect(choiceBlock).not.toMatch(/aria-label/);
  });

  it('the group is a fieldset with a legend saying how many to pick', () => {
    expect(FIELDS).toMatch(/<fieldset/);
    expect(FIELDS).toMatch(/<legend/);
    expect(FIELDS).toMatch(/Tick the correct answer/);
    expect(FIELDS).toMatch(/Tick every correct answer/);
  });

  it('only the control that applies to the chosen type is rendered', () => {
    // The old form showed the number box and the True/False select at once.
    expect(FIELDS).toMatch(/type === 'true_false' \?/);
    expect(FIELDS, 'the options textarea is for choice types only').toMatch(
      /\{isChoice && \(/,
    );
  });

  it('an empty option list explains itself instead of showing an answer box', () => {
    expect(FIELDS).toMatch(/options\.length === 0/);
    expect(FIELDS).toMatch(/Type the options above/);
  });
});

describe('the action validates the answer key instead of filtering it', () => {
  it('it reads every submitted value, not just the first', () => {
    // Checkboxes sharing a name submit one value each; get() returns only the
    // first, which would silently discard every answer after the first.
    expect(QUIZ_ACTIONS).toMatch(/\.getAll\('correct'\)/);
  });

  it('it delegates to parseCorrectIndices', () => {
    expect(QUIZ_ACTIONS).toMatch(/parseCorrectIndices\(/);
  });

  it('the old silent filter is gone', () => {
    expect(QUIZ_ACTIONS, 'this dropped out-of-range answers without telling anyone').not.toMatch(
      /Number\.isInteger\(n\) && n >= 0 && n < options\.length/,
    );
    expect(QUIZ_ACTIONS, 'this truncated a two-answer mcq to one').not.toMatch(
      /correct = \[correct\[0\]\]/,
    );
  });

  it('true_false cannot store a non-index', () => {
    // `Number(formData.get('correct_tf'))` stored NaN for a crafted post.
    expect(QUIZ_ACTIONS).toMatch(/tf === 1 \? 1 : 0/);
  });

  it('the parser rejects rather than drops, and de-duplicates', () => {
    expect(LIB).toMatch(/throw new Error/);
    expect(LIB, 'a duplicate index makes a question unpassable').toMatch(/new Set\(indices\)/);
    expect(LIB, 'filter(Boolean) keeps " 2 " and "2," working').toMatch(
      /\.split\(\/\[,;\\s\]\+\/\)\.filter\(Boolean\)/,
    );
  });
});

describe('a course cannot be published with a question nobody can pass', () => {
  /*
   * Strict parsing only helps rows written from now on. The publish guard is what
   * covers the ones the old parser already wrote — and the only outcome that
   * actually reaches a learner is a published course they cannot finish.
   */
  const COURSE_ACTIONS = code('src', 'app', 't', '[slug]', 'admin', 'courses', 'actions.ts');

  it('the publish path checks the stored answer keys', () => {
    expect(COURSE_ACTIONS).toMatch(/jsonb_array_length\(\$\{quizQuestions\.correct\}\) = 0/);
    expect(COURSE_ACTIONS, 'duplicates are unpassable').toMatch(/count\(distinct e\.value\)/);
    expect(COURSE_ACTIONS, 'an index past the option list is unpassable').toMatch(
      /c::int >= jsonb_array_length\(\$\{quizQuestions\.options\}\)/,
    );
  });

  it('it is scoped to the tenant, since Drizzle bypasses RLS', () => {
    const guard = COURSE_ACTIONS.slice(COURSE_ACTIONS.indexOf('jsonb_array_length') - 1200);
    expect(guard).toMatch(/eq\(quizQuestions\.tenantId, ctx\.tenantId!\)/);
  });

  it('its messages are short enough to survive friendly()', () => {
    // The previous zero-questions message was 143 characters, so NavForm replaced
    // the whole explanation with "Something went wrong" and the admin learned
    // nothing. Both are now built by nameFirst() to stay bounded.
    expect(COURSE_ACTIONS).toMatch(/function nameFirst\(/);
    for (const m of COURSE_ACTIONS.matchAll(/throw new Error\(`([^`]+)`\)/g)) {
      const literal = m[1].replace(/\$\{[^}]*\}/g, 'x'.repeat(45));
      expect(literal.length, `too long once the title is filled in: "${m[1]}"`).toBeLessThan(120);
    }
  });
});
