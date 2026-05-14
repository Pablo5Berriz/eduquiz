import { describe, expect, it } from 'vitest';

import { scoreSingleAnswerQuiz } from './scoring';

const questions = [
  {
    id: 'question-1',
    points: 2,
    answers: [
      { id: 'answer-1-a', isCorrect: false },
      { id: 'answer-1-b', isCorrect: true },
    ],
  },
  {
    id: 'question-2',
    points: 1,
    answers: [
      { id: 'answer-2-a', isCorrect: true },
      { id: 'answer-2-b', isCorrect: false },
    ],
  },
] as const;

describe('scoreSingleAnswerQuiz', () => {
  it('normalise le score et applique le seuil de réussite', () => {
    const result = scoreSingleAnswerQuiz(
      questions,
      new Map([
        ['question-1', ['answer-1-b']],
        ['question-2', ['answer-2-b']],
      ]),
      60,
    );

    expect(result).toMatchObject({
      rawScore: 2,
      maxScore: 3,
      score: 67,
      passed: true,
    });
    expect(result.answers).toEqual([
      {
        questionId: 'question-1',
        answerId: 'answer-1-b',
        answerIds: ['answer-1-b'],
        isCorrect: true,
        pointsEarned: 2,
      },
      {
        questionId: 'question-2',
        answerId: 'answer-2-b',
        answerIds: ['answer-2-b'],
        isCorrect: false,
        pointsEarned: 0,
      },
    ]);
  });

  it('compte une réponse manquante comme incorrecte', () => {
    const result = scoreSingleAnswerQuiz(questions, new Map([['question-1', ['answer-1-a']]]), 50);

    expect(result.rawScore).toBe(0);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.answers[1]).toEqual({
      questionId: 'question-2',
      answerId: null,
      answerIds: [],
      isCorrect: false,
      pointsEarned: 0,
    });
  });

  it('score une question TRUE_FALSE comme une question à réponse unique', () => {
    const result = scoreSingleAnswerQuiz(
      [
        {
          id: 'question-true-false',
          type: 'TRUE_FALSE',
          points: 1,
          answers: [
            { id: 'true', isCorrect: false },
            { id: 'false', isCorrect: true },
          ],
        },
      ],
      new Map([['question-true-false', ['false']]]),
      100,
    );

    expect(result).toMatchObject({
      rawScore: 1,
      maxScore: 1,
      score: 100,
      passed: true,
    });
  });

  it('score une question MCQ_MULTI uniquement quand toutes les bonnes réponses sont sélectionnées', () => {
    const result = scoreSingleAnswerQuiz(
      [
        {
          id: 'question-multi',
          type: 'MCQ_MULTI',
          points: 3,
          answers: [
            { id: 'a', isCorrect: true },
            { id: 'b', isCorrect: false },
            { id: 'c', isCorrect: true },
          ],
        },
      ],
      new Map([['question-multi', ['c', 'a']]]),
      100,
    );

    expect(result).toMatchObject({
      rawScore: 3,
      maxScore: 3,
      score: 100,
      passed: true,
    });
    expect(result.answers[0]).toEqual({
      questionId: 'question-multi',
      answerId: 'c',
      answerIds: ['c', 'a'],
      isCorrect: true,
      pointsEarned: 3,
    });
  });

  it('refuse une question MCQ_MULTI partielle ou avec une mauvaise réponse', () => {
    const multiQuestions = [
      {
        id: 'question-partial',
        type: 'MCQ_MULTI',
        points: 2,
        answers: [
          { id: 'a', isCorrect: true },
          { id: 'b', isCorrect: false },
          { id: 'c', isCorrect: true },
        ],
      },
      {
        id: 'question-extra',
        type: 'MCQ_MULTI',
        points: 2,
        answers: [
          { id: 'd', isCorrect: true },
          { id: 'e', isCorrect: false },
          { id: 'f', isCorrect: true },
        ],
      },
    ] as const;

    const result = scoreSingleAnswerQuiz(
      multiQuestions,
      new Map([
        ['question-partial', ['a']],
        ['question-extra', ['d', 'e', 'f']],
      ]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });
});
