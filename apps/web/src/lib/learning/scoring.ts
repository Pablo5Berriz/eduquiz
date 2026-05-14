export interface ScorableAnswer {
  readonly id: string;
  readonly label?: string;
  readonly pairId?: string;
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
  readonly orderedAnswerIds?: readonly string[];
  readonly text?: string;
  readonly matches?: readonly SubmittedMatch[];
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

export interface SubmittedMatch {
  readonly leftId: string;
  readonly rightId: string;
}

export interface SubmittedMatchingAnswer {
  readonly matches: readonly SubmittedMatch[];
}

export interface SubmittedOrderingAnswer {
  readonly orderedAnswerIds: readonly string[];
}

export type SubmittedQuizAnswer =
  | readonly string[]
  | SubmittedTextAnswer
  | SubmittedMatchingAnswer
  | SubmittedOrderingAnswer;

export function scoreSingleAnswerQuiz(
  questions: readonly ScorableQuestion[],
  submittedAnswers: ReadonlyMap<string, SubmittedQuizAnswer>,
  passingScore: number | null,
): QuizScore {
  const answers = questions.map((question) => {
    const submittedAnswer = submittedAnswers.get(question.id);
    const answerIds = extractSubmittedAnswerIds(submittedAnswer);
    const matches = extractSubmittedMatches(submittedAnswer);
    const orderedAnswerIds = extractSubmittedOrderedAnswerIds(submittedAnswer);
    const correctAnswerIds = question.answers
      .filter((answer) => answer.isCorrect)
      .map((answer) => answer.id);
    const text = extractSubmittedText(submittedAnswer);
    const isTextAnswer = question.type === 'FILL_IN_THE_BLANK' || question.type === 'SHORT_ANSWER';
    const isMatching = question.type === 'MATCHING';
    const isOrdering = question.type === 'ORDERING';
    const isCorrect = isOrdering
      ? sameAnswerSequence(orderedAnswerIds, correctAnswerIds)
      : isMatching
        ? sameMatchSet(
            matches,
            question.answers
              .filter((answer) => answer.isCorrect && answer.pairId !== undefined)
              .map((answer) => ({ leftId: answer.id, rightId: answer.pairId ?? '' })),
          )
        : isTextAnswer
          ? scoreTextAnswer(
              text,
              question.answers
                .filter((answer) => answer.isCorrect)
                .map((answer) => answer.label ?? ''),
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

    if (isOrdering) return { ...scoredAnswer, orderedAnswerIds };
    if (isMatching) return { ...scoredAnswer, matches };
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

function sameAnswerSequence(left: readonly string[], right: readonly string[]): boolean {
  if (left.length === 0 || left.length !== right.length) return false;
  if (new Set(left).size !== left.length) return false;
  return left.every((id, index) => id === right[index]);
}

function sameMatchSet(
  submittedMatches: readonly SubmittedMatch[],
  expectedMatches: readonly SubmittedMatch[],
): boolean {
  if (submittedMatches.length === 0 || submittedMatches.length !== expectedMatches.length) {
    return false;
  }

  const submittedKeys = submittedMatches.map(matchKey);
  if (new Set(submittedKeys).size !== submittedKeys.length) return false;

  const expectedKeys = new Set(expectedMatches.map(matchKey));
  return submittedKeys.every((key) => expectedKeys.has(key));
}

function extractSubmittedAnswerIds(answer: SubmittedQuizAnswer | undefined): readonly string[] {
  return isSubmittedAnswerIdList(answer) ? answer : [];
}

function extractSubmittedText(answer: SubmittedQuizAnswer | undefined): string {
  return isSubmittedTextAnswer(answer) ? answer.text : '';
}

function extractSubmittedMatches(
  answer: SubmittedQuizAnswer | undefined,
): readonly SubmittedMatch[] {
  return isSubmittedMatchingAnswer(answer) ? answer.matches : [];
}

function extractSubmittedOrderedAnswerIds(
  answer: SubmittedQuizAnswer | undefined,
): readonly string[] {
  return isSubmittedOrderingAnswer(answer) ? answer.orderedAnswerIds : [];
}

function isSubmittedAnswerIdList(
  answer: SubmittedQuizAnswer | undefined,
): answer is readonly string[] {
  return Array.isArray(answer);
}

function isSubmittedTextAnswer(
  answer: SubmittedQuizAnswer | undefined,
): answer is SubmittedTextAnswer {
  return answer !== undefined && !Array.isArray(answer) && 'text' in answer;
}

function isSubmittedMatchingAnswer(
  answer: SubmittedQuizAnswer | undefined,
): answer is SubmittedMatchingAnswer {
  return answer !== undefined && !Array.isArray(answer) && 'matches' in answer;
}

function isSubmittedOrderingAnswer(
  answer: SubmittedQuizAnswer | undefined,
): answer is SubmittedOrderingAnswer {
  return answer !== undefined && !Array.isArray(answer) && 'orderedAnswerIds' in answer;
}

function matchKey(match: SubmittedMatch): string {
  return `${match.leftId}\u0000${match.rightId}`;
}

function normalizeTextAnswer(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}
