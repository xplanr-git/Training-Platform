export interface GradableQuestion {
  id: string;
  correct: number[];
  points: number;
}

export interface GradedQuestion {
  questionId: string;
  selected: number[];
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface QuizResult {
  score: number; // 0–100
  passed: boolean;
  earned: number;
  totalPoints: number;
  perQuestion: GradedQuestion[];
}

/**
 * Parses an author's answer key — 1-based option numbers as typed — into the
 * 0-based indices `correct` stores. Throws rather than dropping anything.
 *
 * The previous version filtered instead of validating:
 *
 *   .split(',').map((n) => Number(n.trim()) - 1)
 *   .filter((n) => Number.isInteger(n) && n >= 0 && n < options.length)
 *
 * so every typo became silent data loss. With three options, "1,4" saved [0] —
 * the author marked two answers, got no error, and one of them vanished. "2,2"
 * saved [1,1], which `gradeQuiz` can never match because it compares sets
 * all-or-nothing, so the question became unpassable. And an mcq key of "1,3"
 * was truncated to [0] by the caller, silently picking one of the two.
 *
 * Splitting on any run of comma, semicolon or whitespace also makes "1 3" and
 * "1; 3" work, which used to yield NaN and be dropped.
 *
 * Messages stay under 120 characters: NavForm's friendly() replaces anything
 * longer with a generic apology, which would undo the point of naming the
 * offending number.
 */
export function parseCorrectIndices(
  raw: string,
  optionCount: number,
  type: 'mcq' | 'multi_select' | 'true_false',
): number[] {
  // filter(Boolean) is required, not defensive: ' 2 ' splits to ['','2',''] and
  // '2,' to ['2',''], both of which are accepted today.
  const tokens = raw.split(/[,;\s]+/).filter(Boolean);
  if (tokens.length === 0) {
    throw new Error(
      'Enter the number of the correct option — 2 for the second one, or 1,3 for two of them.',
    );
  }

  const indices: number[] = [];
  for (const token of tokens) {
    if (!/^\d+$/.test(token)) {
      throw new Error(`"${token}" is not an option number. Use 2, or 1,3 for two answers.`);
    }
    const oneBased = Number(token);
    if (oneBased < 1 || oneBased > optionCount) {
      throw new Error(`There is no option ${oneBased} — this question has ${optionCount}.`);
    }
    indices.push(oneBased - 1);
  }

  // De-duplicate: [1,1] is ungradeable, since gradeQuiz compares option sets.
  const unique = [...new Set(indices)];
  if (type === 'mcq' && unique.length > 1) {
    throw new Error(
      'Multiple choice (one answer) takes a single number. Switch the type to allow several.',
    );
  }
  return unique.sort((a, b) => a - b);
}

function setsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

/**
 * Pure quiz grader. `responses` maps question id → selected option indices.
 * An option-set is correct only if it exactly matches the question's correct
 * set (all-or-nothing per question). Score is percent of points earned.
 */
export function gradeQuiz(
  questions: GradableQuestion[],
  responses: Record<string, number[]>,
  passThreshold: number,
): QuizResult {
  let earned = 0;
  let totalPoints = 0;
  const perQuestion: GradedQuestion[] = questions.map((q) => {
    const selected = responses[q.id] ?? [];
    const isCorrect = setsEqual(selected, q.correct);
    const pointsAwarded = isCorrect ? q.points : 0;
    earned += pointsAwarded;
    totalPoints += q.points;
    return { questionId: q.id, selected, isCorrect, pointsAwarded };
  });
  const score = totalPoints === 0 ? 0 : Math.round((earned / totalPoints) * 100);
  return { score, passed: score >= passThreshold, earned, totalPoints, perQuestion };
}
