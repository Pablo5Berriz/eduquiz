export interface ScorableAnswer {
  readonly id: string;
  readonly isCorrect: boolean;
}

export interface ScorableQuestion {
  readonly id: string;
  readonly type?: string;
  readonly points: number;
  readonly answers: readonly ScorableAnswer[];
}

export interface ScoredAnswer {
  readonly questionId: string;
  readonly answerId: string | null;
  readonly answerIds: readonly string[];
  readonly isCorrect: boolean;
  readonly pointsEarned: number;
}

export interface QuizScore {
  readonly score: number;
  readonly rawScore: number;
  readonly maxScore: number;
  readonly passed: boolean;
  readonly answers: readonly ScoredAnswer[];
}

export function scoreSingleAnswerQuiz(
  questions: readonly ScorableQuestion[],
  submittedAnswerIds: ReadonlyMap<string, readonly string[]>,
  passingScore: number | null,
): QuizScore {
  const answers = questions.map((question) => {
    const answerIds = submittedAnswerIds.get(question.id) ?? [];
    const correctAnswerIds = question.answers
      .filter((answer) => answer.isCorrect)
      .map((answer) => answer.id);
    const isCorrect =
      question.type === 'MCQ_MULTI'
        ? sameAnswerSet(answerIds, correctAnswerIds)
        : answerIds.length === 1 &&
          correctAnswerIds.length > 0 &&
          correctAnswerIds[0] === answerIds[0];

    return {
      questionId: question.id,
      answerId: answerIds[0] ?? null,
      answerIds,
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
    };
  });

  const rawScore = answers.reduce((total, answer) => total + answer.pointsEarned, 0);
  const maxScore = questions.reduce((total, question) => total + question.points, 0);
  const score = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

  return {
    score,
    rawScore,
    maxScore,
    passed: score >= (passingScore ?? 0),
    answers,
  };
}

function sameAnswerSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length === 0 || left.length !== right.length) return false;
  if (new Set(left).size !== left.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}
