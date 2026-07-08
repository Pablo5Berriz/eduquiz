import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAttemptResult,
  getPublishedQuizForScoringByActivityId,
  getPublishedQuizForTakingByActivityId,
} from './catalog';

const { mockFindUnique, mockTransaction } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@eduquiz/db', () => ({
  ActivityKind: {
    QUIZ: 'QUIZ',
    EXERCISE: 'EXERCISE',
  },
  ContentStatus: {
    PUBLISHED: 'PUBLISHED',
    DRAFT: 'DRAFT',
  },
  prismaService: {
    activity: {
      findUnique: mockFindUnique,
    },
  },
  withUser: vi.fn(() => ({ $transaction: mockTransaction })),
}));

const ACTIVITY_ID = '11111111-1111-4111-8111-111111111111';
const testDir = dirname(fileURLToPath(import.meta.url));
const webSrcDir = resolve(testDir, '..', '..');

const publishedQuizActivity = {
  id: ACTIVITY_ID,
  kind: 'QUIZ',
  status: 'PUBLISHED',
  passingScore: 70,
  lesson: {
    id: 'lesson-1',
    slug: 'fractions',
    titleFr: 'Fractions',
    titleEn: 'Fractions',
    status: 'PUBLISHED',
    course: {
      status: 'PUBLISHED',
      subject: { nameFr: 'Mathématiques', nameEn: 'Mathematics' },
      level: { nameFr: 'Primaire 5', nameEn: 'Grade 5' },
    },
    skillLinks: [{ skillId: 'skill-1' }],
  },
  quiz: {
    titleFr: 'Quiz noté',
    titleEn: 'Graded quiz',
    introductionFr: 'Réponds aux questions.',
    introductionEn: 'Answer the questions.',
    questions: [
      {
        id: 'q1',
        ordinal: 0,
        promptFr: 'Quelle fraction est plus petite ?',
        promptEn: 'Which fraction is smaller?',
        explanationFr: '3/5 est plus petit que 5/8.',
        explanationEn: '3/5 is smaller than 5/8.',
        type: 'MCQ_SINGLE',
        points: 5,
        answers: [
          {
            id: 'a1',
            ordinal: 0,
            labelFr: '3/5',
            labelEn: '3/5',
            isCorrect: true,
            pairId: null,
          },
          {
            id: 'a2',
            ordinal: 1,
            labelFr: '5/8',
            labelEn: '5/8',
            isCorrect: false,
            pairId: null,
          },
        ],
      },
      {
        id: 'q2',
        ordinal: 1,
        promptFr: 'Associe.',
        promptEn: 'Match.',
        explanationFr: 'Les décimaux équivalents sont affichés après soumission.',
        explanationEn: 'Equivalent decimals are shown after submission.',
        type: 'MATCHING',
        points: 2,
        answers: [
          {
            id: 'left-1',
            ordinal: 0,
            labelFr: '1/2',
            labelEn: '1/2',
            isCorrect: true,
            pairValueFr: '0,5',
            pairValueEn: '0.5',
          },
        ],
      },
      {
        id: 'q3',
        ordinal: 2,
        promptFr: 'Replace en ordre.',
        promptEn: 'Put in order.',
        explanationFr: 'L’ordre est révélé après soumission.',
        explanationEn: 'The order is revealed after submission.',
        type: 'ORDERING',
        points: 3,
        answers: [
          {
            id: 'step-1',
            ordinal: 0,
            labelFr: 'Première étape',
            labelEn: 'First step',
            isCorrect: true,
            pairId: null,
          },
          {
            id: 'step-2',
            ordinal: 1,
            labelFr: 'Deuxième étape',
            labelEn: 'Second step',
            isCorrect: true,
            pairId: null,
          },
        ],
      },
    ],
  },
};

describe('getPublishedQuizForTakingByActivityId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue(publishedQuizActivity);
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        attempt: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      }),
    );
  });

  it('retourne un payload de passage sans donnée de correction ni score attendu', async () => {
    const quiz = await getPublishedQuizForTakingByActivityId(ACTIVITY_ID, 'fr');

    expect(quiz).toBeTruthy();
    expect(Object.keys(quiz ?? {}).sort()).toEqual([
      'id',
      'introduction',
      'lesson',
      'questions',
      'title',
    ]);
    expect(Object.keys(quiz?.questions[0] ?? {}).sort()).toEqual([
      'answers',
      'id',
      'prompt',
      'type',
    ]);
    expect(Object.keys(quiz?.questions[0]?.answers[0] ?? {}).sort()).toEqual([
      'id',
      'label',
      'side',
    ]);
    expect(JSON.stringify(quiz)).not.toContain('isCorrect');
    expect(JSON.stringify(quiz)).not.toContain('pairId');
    expect(JSON.stringify(quiz)).not.toContain('explanation');
    expect(JSON.stringify(quiz)).not.toContain('passingScore');
    expect(JSON.stringify(quiz)).not.toContain('points');
  });

  it('conserve seulement les métadonnées nécessaires pour afficher le matching', async () => {
    const quiz = await getPublishedQuizForTakingByActivityId(ACTIVITY_ID, 'fr');
    const matchingQuestion = quiz?.questions.find((question) => question.type === 'MATCHING');

    expect(matchingQuestion?.answers[0]).toEqual({ id: 'left-1', label: '1/2', side: 'left' });
    expect(matchingQuestion?.answers[1]?.label).toBe('0,5');
    expect(matchingQuestion?.answers[1]?.side).toBe('right');
    expect(typeof matchingQuestion?.answers[1]?.id).toBe('string');
    expect(matchingQuestion?.answers[1]?.id).not.toBe('left-1');
  });

  it('génère les mêmes ids de droite MATCHING pour le passage et le scoring', async () => {
    const takingQuiz = await getPublishedQuizForTakingByActivityId(ACTIVITY_ID, 'fr');
    const scoringQuiz = await getPublishedQuizForScoringByActivityId(ACTIVITY_ID, 'fr');
    const takingMatchingQuestion = takingQuiz?.questions.find(
      (question) => question.type === 'MATCHING',
    );
    const scoringMatchingQuestion = scoringQuiz?.questions.find(
      (question) => question.type === 'MATCHING',
    );
    const clientRightAnswerId = takingMatchingQuestion?.answers.find(
      (answer) => answer.side === 'right',
    )?.id;
    const serverExpectedPairId = scoringMatchingQuestion?.answers.find(
      (answer) => answer.id === 'left-1',
    )?.pairId;

    expect(clientRightAnswerId).toBeDefined();
    expect(clientRightAnswerId).toBe(serverExpectedPairId);
    expect(JSON.stringify(takingMatchingQuestion)).not.toContain('pairId');
  });

  it("ne renvoie pas l'ordre correct naturel pour les questions ORDERING", async () => {
    const quiz = await getPublishedQuizForTakingByActivityId(ACTIVITY_ID, 'fr');
    const orderingQuestion = quiz?.questions.find((question) => question.type === 'ORDERING');

    expect(orderingQuestion?.answers.map((answer) => answer.id)).not.toEqual(['step-1', 'step-2']);
  });

  it('cache les brouillons aux apprenants', async () => {
    mockFindUnique.mockResolvedValue({ ...publishedQuizActivity, status: 'DRAFT' });

    await expect(getPublishedQuizForTakingByActivityId(ACTIVITY_ID, 'fr')).resolves.toBeNull();
  });

  it("scope la consultation d'un résultat à la tentative de l'utilisateur courant", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        attempt: {
          findFirst,
        },
      }),
    );

    await getAttemptResult({
      activityId: ACTIVITY_ID,
      attemptId: '22222222-2222-4222-8222-222222222222',
      userId: '33333333-3333-4333-8333-333333333333',
      role: 'LEARNER_ADULT',
      locale: 'fr',
      unknownAnswerLabel: 'Réponse inconnue',
      unknownOrderingAnswerLabel: 'Étape inconnue',
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: '22222222-2222-4222-8222-222222222222',
          activityId: ACTIVITY_ID,
          userId: '33333333-3333-4333-8333-333333333333',
        },
      }),
    );
  });

  it('retourne les données pédagogiques de correction uniquement après tentative autorisée', async () => {
    const attempt = {
      id: '22222222-2222-4222-8222-222222222222',
      score: 70,
      rawScore: 7,
      maxScore: 10,
      passed: true,
      submittedAt: new Date('2026-05-15T12:00:00.000Z'),
      activity: {
        passingScore: 70,
        lesson: {
          slug: 'fractions',
          titleFr: 'Fractions',
          titleEn: 'Fractions',
          course: {
            subject: { nameFr: 'Mathématiques', nameEn: 'Mathematics' },
            level: { nameFr: 'Primaire 5', nameEn: 'Grade 5' },
          },
          skillLinks: [
            {
              skill: {
                id: 'skill-1',
                nameFr: 'Comparer des fractions',
                nameEn: 'Compare fractions',
                subject: { nameFr: 'Mathématiques', nameEn: 'Mathematics' },
              },
            },
          ],
        },
        quiz: {
          titleFr: 'Quiz noté',
          titleEn: 'Graded quiz',
        },
      },
      answers: [
        {
          questionId: 'q1',
          response: { answerId: 'a2' },
          isCorrect: false,
          pointsEarned: 0,
          question: publishedQuizActivity.quiz.questions[0],
        },
        {
          questionId: 'q2',
          response: { matches: [{ leftId: 'left-1', rightId: 'unknown-right' }] },
          isCorrect: false,
          pointsEarned: 0,
          question: publishedQuizActivity.quiz.questions[1],
        },
        {
          questionId: 'q3',
          response: { orderedAnswerIds: ['step-2', 'step-1'] },
          isCorrect: false,
          pointsEarned: 0,
          question: publishedQuizActivity.quiz.questions[2],
        },
      ],
    };
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        attempt: {
          findFirst: vi.fn().mockResolvedValue(attempt),
        },
      }),
    );

    const result = await getAttemptResult({
      activityId: ACTIVITY_ID,
      attemptId: attempt.id,
      userId: '33333333-3333-4333-8333-333333333333',
      role: 'LEARNER_ADULT',
      locale: 'fr',
      unknownAnswerLabel: 'Réponse inconnue',
      unknownOrderingAnswerLabel: 'Étape inconnue',
    });

    expect(result?.passingScore).toBe(70);
    expect(result?.lesson.skills).toEqual([
      { id: 'skill-1', name: 'Comparer des fractions', subject: 'Mathématiques' },
    ]);
    expect(result?.answers[0]).toEqual(
      expect.objectContaining({
        explanation: '3/5 est plus petit que 5/8.',
        pointsPossible: 5,
        selectedAnswerLabels: ['5/8'],
        correctAnswerLabels: ['3/5'],
      }),
    );
    expect(result?.answers[1]).toEqual(
      expect.objectContaining({
        correctMatchLabels: ['1/2 → 0,5'],
        pointsPossible: 2,
      }),
    );
    expect(result?.answers[2]).toEqual(
      expect.objectContaining({
        selectedOrderingLabels: ['Deuxième étape', 'Première étape'],
        correctOrderingLabels: ['Première étape', 'Deuxième étape'],
        pointsPossible: 3,
      }),
    );
  });
});

describe('contrat statique du flux quiz noté', () => {
  it('la page de passage importe uniquement le payload non sensible', () => {
    const pageSource = readFileSync(
      resolve(webSrcDir, 'app', '[locale]', '(authenticated)', 'quiz', '[activityId]', 'page.tsx'),
      'utf8',
    );

    expect(pageSource).toContain('getPublishedQuizForTakingByActivityId');
    expect(pageSource).not.toContain('getPublishedQuizForScoringByActivityId');
    expect(pageSource).not.toContain('getPublishedQuizByActivityId');
  });

  it('QuizForm ne déclare aucun champ de correction dans son contrat de props', () => {
    const formSource = readFileSync(
      resolve(
        webSrcDir,
        'app',
        '[locale]',
        '(authenticated)',
        'quiz',
        '[activityId]',
        'QuizForm.tsx',
      ),
      'utf8',
    );

    expect(formSource).not.toContain('isCorrect');
    expect(formSource).not.toContain('pairId');
    expect(formSource).not.toContain('passingScore');
    expect(formSource).not.toContain('correctAnswer');
    expect(formSource).not.toContain('explanation');
    expect(formSource).not.toContain('readonly points');
  });

  it('le payload de scoring reste limité à la Server Action et aux tests serveur', () => {
    const pageSource = readFileSync(
      resolve(webSrcDir, 'app', '[locale]', '(authenticated)', 'quiz', '[activityId]', 'page.tsx'),
      'utf8',
    );
    const actionSource = readFileSync(resolve(webSrcDir, 'lib', 'learning', 'actions.ts'), 'utf8');
    const actionTestSource = readFileSync(
      resolve(webSrcDir, 'lib', 'learning', 'actions.test.ts'),
      'utf8',
    );

    expect(actionSource).toContain('getPublishedQuizForScoringByActivityId');
    expect(actionTestSource).toContain('getPublishedQuizForScoringByActivityId');
    expect(pageSource).not.toContain('getPublishedQuizForScoringByActivityId');
  });
});
