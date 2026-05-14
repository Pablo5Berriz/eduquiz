import { describe, expect, it } from 'vitest';

import { scoreSingleAnswerQuiz, scoreTextAnswer } from './scoring';

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

  it('score une question FILL_IN_THE_BLANK avec une réponse textuelle correcte', () => {
    const result = scoreSingleAnswerQuiz(
      [
        {
          id: 'question-fill',
          type: 'FILL_IN_THE_BLANK',
          points: 2,
          answers: [
            { id: 'a', label: 'dénominateur commun', isCorrect: true },
            { id: 'b', label: 'denominateur commun', isCorrect: true },
          ],
        },
      ],
      new Map([['question-fill', { text: 'Dénominateur commun' }]]),
      100,
    );

    expect(result).toMatchObject({
      rawScore: 2,
      maxScore: 2,
      score: 100,
      passed: true,
    });
    expect(result.answers[0]).toEqual({
      questionId: 'question-fill',
      answerId: null,
      answerIds: [],
      text: 'Dénominateur commun',
      isCorrect: true,
      pointsEarned: 2,
    });
  });

  it('score une question SHORT_ANSWER avec une réponse textuelle correcte', () => {
    const result = scoreSingleAnswerQuiz(
      [
        {
          id: 'question-short',
          type: 'SHORT_ANSWER',
          points: 3,
          answers: [
            { id: 'a', label: 'trouver un dénominateur commun', isCorrect: true },
            { id: 'b', label: 'mettre sur un même dénominateur', isCorrect: true },
          ],
        },
      ],
      new Map([['question-short', { text: 'Trouver un dénominateur commun' }]]),
      100,
    );

    expect(result).toMatchObject({
      rawScore: 3,
      maxScore: 3,
      score: 100,
      passed: true,
    });
    expect(result.answers[0]).toEqual({
      questionId: 'question-short',
      answerId: null,
      answerIds: [],
      text: 'Trouver un dénominateur commun',
      isCorrect: true,
      pointsEarned: 3,
    });
  });

  it('refuse une question SHORT_ANSWER avec une réponse absente des variantes', () => {
    const result = scoreSingleAnswerQuiz(
      [
        {
          id: 'question-short',
          type: 'SHORT_ANSWER',
          points: 3,
          answers: [{ id: 'a', label: 'trouver un dénominateur commun', isCorrect: true }],
        },
      ],
      new Map([['question-short', { text: 'je ne sais pas' }]]),
      80,
    );

    expect(result).toMatchObject({
      rawScore: 0,
      maxScore: 3,
      score: 0,
      passed: false,
    });
    expect(result.answers[0]).toEqual({
      questionId: 'question-short',
      answerId: null,
      answerIds: [],
      text: 'je ne sais pas',
      isCorrect: false,
      pointsEarned: 0,
    });
  });

  it('score une question MATCHING quand les paires sont dans le bon ordre', () => {
    const result = scoreSingleAnswerQuiz(
      [matchingQuestion],
      new Map([
        [
          'question-matching',
          {
            matches: [
              { leftId: 'left-1', rightId: 'right-1' },
              { leftId: 'left-2', rightId: 'right-2' },
            ],
          },
        ],
      ]),
      100,
    );

    expect(result).toMatchObject({
      rawScore: 2,
      maxScore: 2,
      score: 100,
      passed: true,
    });
    expect(result.answers[0]).toEqual({
      questionId: 'question-matching',
      answerId: null,
      answerIds: [],
      matches: [
        { leftId: 'left-1', rightId: 'right-1' },
        { leftId: 'left-2', rightId: 'right-2' },
      ],
      isCorrect: true,
      pointsEarned: 2,
    });
  });

  it('score une question MATCHING quand les paires sont dans un ordre différent', () => {
    const result = scoreSingleAnswerQuiz(
      [matchingQuestion],
      new Map([
        [
          'question-matching',
          {
            matches: [
              { leftId: 'left-2', rightId: 'right-2' },
              { leftId: 'left-1', rightId: 'right-1' },
            ],
          },
        ],
      ]),
      100,
    );

    expect(result.rawScore).toBe(2);
    expect(result.score).toBe(100);
    expect(result.answers[0]?.isCorrect).toBe(true);
  });

  it('refuse une question MATCHING avec une mauvaise association', () => {
    const result = scoreSingleAnswerQuiz(
      [matchingQuestion],
      new Map([
        [
          'question-matching',
          {
            matches: [
              { leftId: 'left-1', rightId: 'right-2' },
              { leftId: 'left-2', rightId: 'right-1' },
            ],
          },
        ],
      ]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.score).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });

  it('refuse une question MATCHING avec une paire manquante', () => {
    const result = scoreSingleAnswerQuiz(
      [matchingQuestion],
      new Map([
        [
          'question-matching',
          {
            matches: [{ leftId: 'left-1', rightId: 'right-1' }],
          },
        ],
      ]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });

  it('refuse une question MATCHING avec une paire en trop', () => {
    const result = scoreSingleAnswerQuiz(
      [matchingQuestion],
      new Map([
        [
          'question-matching',
          {
            matches: [
              { leftId: 'left-1', rightId: 'right-1' },
              { leftId: 'left-2', rightId: 'right-2' },
              { leftId: 'left-3', rightId: 'right-3' },
            ],
          },
        ],
      ]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });

  it('refuse une question MATCHING avec une réponse vide', () => {
    const result = scoreSingleAnswerQuiz(
      [matchingQuestion],
      new Map([['question-matching', { matches: [] }]]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });

  it('score une question ORDERING avec un ordre exact', () => {
    const result = scoreSingleAnswerQuiz(
      [orderingQuestion],
      new Map([['question-ordering', { orderedAnswerIds: ['step-1', 'step-2', 'step-3'] }]]),
      100,
    );

    expect(result).toMatchObject({
      rawScore: 3,
      maxScore: 3,
      score: 100,
      passed: true,
    });
    expect(result.answers[0]).toEqual({
      questionId: 'question-ordering',
      answerId: null,
      answerIds: [],
      orderedAnswerIds: ['step-1', 'step-2', 'step-3'],
      isCorrect: true,
      pointsEarned: 3,
    });
  });

  it('refuse une question ORDERING avec le bon ensemble dans le mauvais ordre', () => {
    const result = scoreSingleAnswerQuiz(
      [orderingQuestion],
      new Map([['question-ordering', { orderedAnswerIds: ['step-2', 'step-1', 'step-3'] }]]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });

  it('refuse une question ORDERING avec une réponse vide', () => {
    const result = scoreSingleAnswerQuiz(
      [orderingQuestion],
      new Map([['question-ordering', { orderedAnswerIds: [] }]]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });

  it('refuse une question ORDERING avec un élément manquant', () => {
    const result = scoreSingleAnswerQuiz(
      [orderingQuestion],
      new Map([['question-ordering', { orderedAnswerIds: ['step-1', 'step-2'] }]]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });

  it('refuse une question ORDERING avec un élément en trop', () => {
    const result = scoreSingleAnswerQuiz(
      [orderingQuestion],
      new Map([
        ['question-ordering', { orderedAnswerIds: ['step-1', 'step-2', 'step-3', 'step-4'] }],
      ]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });

  it('refuse une question ORDERING avec un doublon', () => {
    const result = scoreSingleAnswerQuiz(
      [orderingQuestion],
      new Map([['question-ordering', { orderedAnswerIds: ['step-1', 'step-1', 'step-3'] }]]),
      50,
    );

    expect(result.rawScore).toBe(0);
    expect(result.answers[0]?.isCorrect).toBe(false);
  });
});

const matchingQuestion = {
  id: 'question-matching',
  type: 'MATCHING',
  points: 2,
  answers: [
    { id: 'left-1', pairId: 'right-1', isCorrect: true },
    { id: 'left-2', pairId: 'right-2', isCorrect: true },
  ],
} as const;

const orderingQuestion = {
  id: 'question-ordering',
  type: 'ORDERING',
  points: 3,
  answers: [
    { id: 'step-1', isCorrect: true },
    { id: 'step-2', isCorrect: true },
    { id: 'step-3', isCorrect: true },
  ],
} as const;

describe('scoreTextAnswer', () => {
  const variants = ['réponse correcte', 'bonne réponse'];

  it('accepte une réponse exacte', () => {
    expect(scoreTextAnswer('réponse correcte', variants)).toBe(true);
  });

  it('accepte une casse différente', () => {
    expect(scoreTextAnswer('RÉPONSE CORRECTE', variants)).toBe(true);
  });

  it('accepte une variante sans accents', () => {
    expect(scoreTextAnswer('reponse correcte', variants)).toBe(true);
  });

  it('réduit les espaces multiples', () => {
    expect(scoreTextAnswer('  réponse   correcte  ', variants)).toBe(true);
  });

  it('refuse une réponse vide', () => {
    expect(scoreTextAnswer('   ', variants)).toBe(false);
  });

  it('refuse une réponse absente des variantes', () => {
    expect(scoreTextAnswer('autre réponse', variants)).toBe(false);
  });
});
