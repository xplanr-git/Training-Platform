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
