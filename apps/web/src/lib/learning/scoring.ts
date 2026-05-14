export interface ScorableAnswer {
  readonly id: string;
  readonly label?: string;
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
  readonly text?: string;
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

export interface SubmittedTextAnswer {
  readonly text: string;
}

export type SubmittedQuizAnswer = readonly string[] | SubmittedTextAnswer;

export function scoreSingleAnswerQuiz(
  questions: readonly ScorableQuestion[],
  submittedAnswers: ReadonlyMap<string, SubmittedQuizAnswer>,
  passingScore: number | null,
): QuizScore {
  const answers = questions.map((question) => {
    const submittedAnswer = submittedAnswers.get(question.id);
    const answerIds = extractSubmittedAnswerIds(submittedAnswer);
    const correctAnswerIds = question.answers
      .filter((answer) => answer.isCorrect)
      .map((answer) => answer.id);
    const text = extractSubmittedText(submittedAnswer);
    const isTextAnswer = question.type === 'FILL_IN_THE_BLANK' || question.type === 'SHORT_ANSWER';
    const isCorrect = isTextAnswer
      ? scoreTextAnswer(
          text,
          question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.label ?? ''),
        )
      : question.type === 'MCQ_MULTI'
        ? sameAnswerSet(answerIds, correctAnswerIds)
        : answerIds.length === 1 &&
          correctAnswerIds.length > 0 &&
          correctAnswerIds[0] === answerIds[0];

    const scoredAnswer = {
      questionId: question.id,
      answerId: answerIds[0] ?? null,
      answerIds,
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
    };

    return isTextAnswer ? { ...scoredAnswer, text } : scoredAnswer;
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

export function scoreTextAnswer(
  answerText: string | null | undefined,
  correctVariants: readonly string[],
): boolean {
  const normalizedAnswer = normalizeTextAnswer(answerText ?? '');
  if (normalizedAnswer.length === 0) return false;

  return correctVariants.some((variant) => normalizeTextAnswer(variant) === normalizedAnswer);
}

function sameAnswerSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length === 0 || left.length !== right.length) return false;
  if (new Set(left).size !== left.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

function extractSubmittedAnswerIds(answer: SubmittedQuizAnswer | undefined): readonly string[] {
  return isSubmittedAnswerIdList(answer) ? answer : [];
}

function extractSubmittedText(answer: SubmittedQuizAnswer | undefined): string {
  return isSubmittedTextAnswer(answer) ? answer.text : '';
}

function isSubmittedAnswerIdList(
  answer: SubmittedQuizAnswer | undefined,
): answer is readonly string[] {
  return Array.isArray(answer);
}

function isSubmittedTextAnswer(
  answer: SubmittedQuizAnswer | undefined,
): answer is SubmittedTextAnswer {
  return answer !== undefined && !Array.isArray(answer);
}

function normalizeTextAnswer(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}
