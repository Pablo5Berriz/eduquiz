/**
 * Tests unitaires — submitQuizAttempt
 *
 * Toutes les dépendances I/O sont mockées :
 *   - @eduquiz/db  → withUser / $transaction
 *   - ./catalog    → getPublishedQuizByActivityId
 *   - ./scoring    → scoreSingleAnswerQuiz
 *   - ../auth/server → requireApiUser
 *   - ../i18n/locale → safeResolveLocale
 *   - next/navigation → redirect
 *
 * On teste uniquement les chemins de retour observables
 * (codes d'erreur, appels aux fonctions de scoring/DB, redirect).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submitQuizAttempt } from './actions';

// ── Mocks déclarés avant les imports du module testé ─────────────────────────

type ScoreMockCall = [readonly unknown[], ReadonlyMap<string, unknown>, number | null];

interface AttemptCreateInput {
  readonly data: {
    readonly userId: string;
    readonly activityId: string;
    readonly score: number;
    readonly rawScore: number;
    readonly maxScore: number;
    readonly passed: boolean;
    readonly [key: string]: unknown;
  };
}

interface AttemptAnswerCreateManyInput {
  readonly data: readonly {
    readonly attemptId: string;
    readonly questionId: string;
    readonly response: unknown;
    readonly isCorrect: boolean;
    readonly [key: string]: unknown;
  }[];
}

interface ProgressUpsertInput {
  readonly where: { readonly userId_skillId: { readonly skillId: string } };
  readonly create: { readonly mastery: number; readonly attemptsCount: number };
  readonly update: { readonly mastery: number; readonly attemptsCount: number };
}

interface AuditCreateInput {
  readonly data: {
    readonly actorId: string;
    readonly targetId: string;
    readonly targetType: string;
    readonly [key: string]: unknown;
  };
}

interface ExistingProgress {
  readonly skillId: string;
  readonly mastery: number;
  readonly attemptsCount: number;
}

interface TxCalls {
  readonly attemptCreate: AttemptCreateInput[];
  readonly attemptAnswerCreateMany: AttemptAnswerCreateManyInput[];
  readonly progressUpsert: ProgressUpsertInput[];
  readonly auditCreate: AuditCreateInput[];
}

interface TxProxy {
  readonly calls: TxCalls;
  readonly attempt: {
    readonly create: (args: AttemptCreateInput) => Promise<{ id: string }>;
  };
  readonly attemptAnswer: {
    readonly createMany: (args: AttemptAnswerCreateManyInput) => Promise<{ count: number }>;
  };
  readonly progress: {
    findMany: () => Promise<ExistingProgress[]>;
    readonly upsert: (args: ProgressUpsertInput) => Promise<void>;
  };
  readonly auditLog: {
    readonly create: (args: AuditCreateInput) => Promise<void>;
  };
}

const {
  mockGetPublishedQuizByActivityId,
  mockRedirect,
  mockRequireApiUser,
  mockScoreSingleAnswerQuiz,
  mockTransaction,
} = vi.hoisted(() => ({
  mockGetPublishedQuizByActivityId: vi.fn(),
  mockRedirect: vi.fn(),
  mockRequireApiUser: vi.fn(),
  mockScoreSingleAnswerQuiz: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('../auth/server', () => ({
  requireApiUser: mockRequireApiUser,
}));

vi.mock('./catalog', () => ({
  getPublishedQuizByActivityId: mockGetPublishedQuizByActivityId,
}));

vi.mock('./scoring', () => ({
  scoreSingleAnswerQuiz: mockScoreSingleAnswerQuiz,
}));

vi.mock('@eduquiz/db', async (importOriginal) => {
  const original = await importOriginal<typeof import('@eduquiz/db')>();
  return {
    ...original,
    withUser: vi.fn(() => ({ $transaction: mockTransaction })),
    AuditEventKind: original.AuditEventKind,
  };
});

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

vi.mock('../i18n/locale', () => ({
  safeResolveLocale: vi.fn((v?: string) => (v === 'en' ? 'en' : 'fr')),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1', role: 'LEARNER_ADULT' as const };
const ACTIVITY_ID = '11111111-1111-4111-8111-111111111111';

const MOCK_QUIZ = {
  id: ACTIVITY_ID,
  passingScore: 60,
  lesson: {
    id: 'lesson-1',
    slug: 'test-lesson',
    title: 'Test Lesson',
    subject: 'Math',
    level: 'P5',
    skillIds: ['skill-1', 'skill-2'],
  },
  title: 'Test Quiz',
  introduction: '',
  questions: [
    {
      id: 'q1',
      prompt: 'Q1',
      explanation: '',
      type: 'MCQ_SINGLE',
      points: 1,
      answers: [
        { id: 'a1', label: '3/4', isCorrect: true },
        { id: 'a2', label: '2/3', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      prompt: 'Q2',
      explanation: '',
      type: 'TRUE_FALSE',
      points: 1,
      answers: [
        { id: 'a3', label: 'Vrai', isCorrect: false },
        { id: 'a4', label: 'Faux', isCorrect: true },
      ],
    },
    {
      id: 'q3',
      prompt: 'Q3',
      explanation: '',
      type: 'MCQ_MULTI',
      points: 2,
      answers: [
        { id: 'a5', label: 'Deux', isCorrect: true },
        { id: 'a6', label: 'Trois', isCorrect: true },
        { id: 'a7', label: 'Quatre', isCorrect: false },
      ],
    },
    {
      id: 'q4',
      prompt: 'Q4',
      explanation: '',
      type: 'FILL_IN_THE_BLANK',
      points: 1,
      answers: [{ id: 'a8', label: 'dénominateur commun', isCorrect: true }],
    },
    {
      id: 'q5',
      prompt: 'Q5',
      explanation: '',
      type: 'MATCHING',
      points: 2,
      answers: [
        { id: 'left-1', label: '3/4', pairId: 'right-1', isCorrect: true },
        { id: 'left-2', label: '2/3', pairId: 'right-2', isCorrect: true },
      ],
    },
    {
      id: 'q6',
      prompt: 'Q6',
      explanation: '',
      type: 'ORDERING',
      points: 3,
      answers: [
        { id: 'step-1', label: 'Un', isCorrect: true },
        { id: 'step-2', label: 'Deux', isCorrect: true },
        { id: 'step-3', label: 'Trois', isCorrect: true },
      ],
    },
  ],
};

const MOCK_SCORE = {
  score: 100,
  rawScore: 10,
  maxScore: 10,
  passed: true,
  answers: [
    { questionId: 'q1', answerId: 'a1', answerIds: ['a1'], isCorrect: true, pointsEarned: 1 },
    { questionId: 'q2', answerId: 'a4', answerIds: ['a4'], isCorrect: true, pointsEarned: 1 },
    {
      questionId: 'q3',
      answerId: 'a5',
      answerIds: ['a5', 'a6'],
      isCorrect: true,
      pointsEarned: 2,
    },
    {
      questionId: 'q4',
      answerId: null,
      answerIds: [],
      text: 'dénominateur commun',
      isCorrect: true,
      pointsEarned: 1,
    },
    {
      questionId: 'q5',
      answerId: null,
      answerIds: [],
      matches: [
        { leftId: 'left-1', rightId: 'right-1' },
        { leftId: 'left-2', rightId: 'right-2' },
      ],
      isCorrect: true,
      pointsEarned: 2,
    },
    {
      questionId: 'q6',
      answerId: null,
      answerIds: [],
      orderedAnswerIds: ['step-1', 'step-2', 'step-3'],
      isCorrect: true,
      pointsEarned: 3,
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

/** FormData valide avec les bonnes réponses aux deux questions du MOCK_QUIZ. */
function makeValidFormData(overrides: Record<string, string> = {}): FormData {
  const fd = makeFormData({
    activityId: ACTIVITY_ID,
    locale: 'fr',
    startedAt: new Date(Date.now() - 5000).toISOString(),
    'question:q1': 'a1',
    'question:q2': 'a4',
    'question:q3': 'a5',
    'question:q4': 'dénominateur commun',
    'matching:q5:left-1': 'right-1',
    'matching:q5:left-2': 'right-2',
    'ordering:q6': 'step-1',
    ...overrides,
  });
  if (!('question:q3' in overrides)) {
    fd.append('question:q3', 'a6');
  }
  if (!('ordering:q6' in overrides)) {
    fd.append('ordering:q6', 'step-2');
    fd.append('ordering:q6', 'step-3');
  }
  return fd;
}

/** Tx proxy minimaliste pour les assertions dans la transaction. */
function makeTxProxy(): TxProxy {
  const calls = {
    attemptCreate: [] as AttemptCreateInput[],
    attemptAnswerCreateMany: [] as AttemptAnswerCreateManyInput[],
    progressUpsert: [] as ProgressUpsertInput[],
    auditCreate: [] as AuditCreateInput[],
  };

  return {
    calls,
    attempt: {
      create: (args: AttemptCreateInput): Promise<{ id: string }> => {
        calls.attemptCreate.push(args);
        return Promise.resolve({ id: 'attempt-1' });
      },
    },
    attemptAnswer: {
      createMany: (args: AttemptAnswerCreateManyInput): Promise<{ count: number }> => {
        calls.attemptAnswerCreateMany.push(args);
        return Promise.resolve({ count: args.data.length });
      },
    },
    progress: {
      findMany: (): Promise<ExistingProgress[]> => Promise.resolve([]),
      upsert: (args: ProgressUpsertInput): Promise<void> => {
        calls.progressUpsert.push(args);
        return Promise.resolve();
      },
    },
    auditLog: {
      create: (args: AuditCreateInput): Promise<void> => {
        calls.auditCreate.push(args);
        return Promise.resolve();
      },
    },
  };
}

function expectPresent<T>(value: T | null | undefined): T {
  expect(value).toBeDefined();
  if (value === null || value === undefined) {
    throw new Error('Expected test value to be defined');
  }
  return value;
}

function firstMockCall(mock: {
  readonly mock: { readonly calls: readonly unknown[][] };
}): readonly unknown[] {
  return expectPresent(mock.mock.calls[0]);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('submitQuizAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiUser.mockResolvedValue(MOCK_USER);
    mockGetPublishedQuizByActivityId.mockResolvedValue(MOCK_QUIZ);
    mockScoreSingleAnswerQuiz.mockReturnValue(MOCK_SCORE);
    mockTransaction.mockImplementation(async (cb: (tx: TxProxy) => Promise<unknown>) => {
      const tx = makeTxProxy();
      return cb(tx);
    });
  });

  // ── Validation FormData ─────────────────────────────────────────────────────

  it('retourne invalid si activityId manquant', async () => {
    const fd = makeFormData({ locale: 'fr' }); // pas d'activityId
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({ ok: false, error: 'invalid' });
    expect(mockGetPublishedQuizByActivityId).not.toHaveBeenCalled();
  });

  it("retourne invalid si activityId n'est pas un UUID", async () => {
    const fd = makeFormData({ activityId: 'not-a-uuid', locale: 'fr' });
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({ ok: false, error: 'invalid' });
  });

  // ── Quiz non trouvé ─────────────────────────────────────────────────────────

  it('retourne notFound si getPublishedQuizByActivityId retourne null', async () => {
    mockGetPublishedQuizByActivityId.mockResolvedValue(null);
    const result = await submitQuizAttempt(makeValidFormData());
    expect(result).toEqual({ ok: false, error: 'notFound' });
  });

  // ── Réponses manquantes ─────────────────────────────────────────────────────

  it('retourne incomplete si une réponse est absente', async () => {
    // On ne soumet que q1, pas q2.
    const fd = makeFormData({
      activityId: ACTIVITY_ID,
      locale: 'fr',
      'question:q1': 'a1',
      'question:q3': 'a5',
      'question:q4': 'dénominateur commun',
      'matching:q5:left-1': 'right-1',
      'matching:q5:left-2': 'right-2',
      // 'question:q2' absent
    });
    fd.append('question:q3', 'a6');
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({
      ok: false,
      error: 'incomplete',
      missingQuestionIds: ['q2'],
    });
  });

  it('retourne incomplete si un answerId ne correspond à aucune option valide', async () => {
    const fd = makeValidFormData({ 'question:q1': 'invalid-answer-id' });
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({
      ok: false,
      error: 'incomplete',
      missingQuestionIds: ['q1'],
    });
  });

  it('retourne incomplete si une réponse MCQ_MULTI contient une option invalide', async () => {
    const fd = makeValidFormData({ 'question:q3': 'a5' });
    fd.append('question:q3', 'invalid-answer-id');
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({
      ok: false,
      error: 'incomplete',
      missingQuestionIds: ['q3'],
    });
  });

  it('retourne incomplete si une réponse FILL_IN_THE_BLANK est vide', async () => {
    const fd = makeValidFormData({ 'question:q4': '   ' });
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({
      ok: false,
      error: 'incomplete',
      missingQuestionIds: ['q4'],
    });
  });

  it('retourne incomplete avec tous les ids manquants si aucune réponse soumise', async () => {
    const fd = makeFormData({ activityId: ACTIVITY_ID, locale: 'fr' });
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({
      ok: false,
      error: 'incomplete',
      missingQuestionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
    });
  });

  it('retourne incomplete si une réponse MATCHING a une paire manquante', async () => {
    const fd = makeValidFormData();
    fd.delete('matching:q5:left-2');
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({
      ok: false,
      error: 'incomplete',
      missingQuestionIds: ['q5'],
    });
  });

  it('retourne incomplete si une réponse MATCHING contient une valeur vide', async () => {
    const fd = makeValidFormData({ 'matching:q5:left-2': '   ' });
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({
      ok: false,
      error: 'incomplete',
      missingQuestionIds: ['q5'],
    });
  });

  // ── Scoring ─────────────────────────────────────────────────────────────────

  it('appelle scoreSingleAnswerQuiz avec les bons arguments', async () => {
    await submitQuizAttempt(makeValidFormData());

    expect(mockScoreSingleAnswerQuiz).toHaveBeenCalledOnce();
    const [questions, submittedAnswers, passingScore] = firstMockCall(
      mockScoreSingleAnswerQuiz,
    ) as ScoreMockCall;
    expect(questions).toBe(MOCK_QUIZ.questions);
    expect(submittedAnswers.get('q1')).toEqual(['a1']);
    expect(submittedAnswers.get('q2')).toEqual(['a4']);
    expect(submittedAnswers.get('q3')).toEqual(['a5', 'a6']);
    expect(submittedAnswers.get('q4')).toEqual({ text: 'dénominateur commun' });
    expect(submittedAnswers.get('q5')).toEqual({
      matches: [
        { leftId: 'left-1', rightId: 'right-1' },
        { leftId: 'left-2', rightId: 'right-2' },
      ],
    });
    expect(submittedAnswers.get('q6')).toEqual({
      orderedAnswerIds: ['step-1', 'step-2', 'step-3'],
    });
    expect(passingScore).toBe(MOCK_QUIZ.passingScore);
  });

  it('transmet une réponse ORDERING dans l’ordre exact', async () => {
    await submitQuizAttempt(makeValidFormData());

    const [, submittedAnswers] = firstMockCall(mockScoreSingleAnswerQuiz) as ScoreMockCall;
    expect(submittedAnswers.get('q6')).toEqual({
      orderedAnswerIds: ['step-1', 'step-2', 'step-3'],
    });
  });

  it('transmet une réponse ORDERING dans le mauvais ordre sans la corriger', async () => {
    const fd = makeValidFormData({ 'ordering:q6': 'step-2' });
    fd.append('ordering:q6', 'step-1');
    fd.append('ordering:q6', 'step-3');

    await submitQuizAttempt(fd);

    const [, submittedAnswers] = firstMockCall(mockScoreSingleAnswerQuiz) as ScoreMockCall;
    expect(submittedAnswers.get('q6')).toEqual({
      orderedAnswerIds: ['step-2', 'step-1', 'step-3'],
    });
  });

  it('transmet une réponse ORDERING vide au scoring', async () => {
    const fd = makeValidFormData({ 'ordering:q6': '' });

    await submitQuizAttempt(fd);

    const [, submittedAnswers] = firstMockCall(mockScoreSingleAnswerQuiz) as ScoreMockCall;
    expect(submittedAnswers.get('q6')).toEqual({ orderedAnswerIds: [] });
  });

  it('ignore les valeurs vides dans une réponse ORDERING', async () => {
    const fd = makeValidFormData({ 'ordering:q6': 'step-1' });
    fd.append('ordering:q6', '');
    fd.append('ordering:q6', 'step-2');
    fd.append('ordering:q6', '   ');
    fd.append('ordering:q6', 'step-3');

    await submitQuizAttempt(fd);

    const [, submittedAnswers] = firstMockCall(mockScoreSingleAnswerQuiz) as ScoreMockCall;
    expect(submittedAnswers.get('q6')).toEqual({
      orderedAnswerIds: ['step-1', 'step-2', 'step-3'],
    });
  });

  it('transmet une réponse ORDERING avec un élément manquant', async () => {
    const fd = makeValidFormData({ 'ordering:q6': 'step-1' });
    fd.append('ordering:q6', 'step-2');

    await submitQuizAttempt(fd);

    const [, submittedAnswers] = firstMockCall(mockScoreSingleAnswerQuiz) as ScoreMockCall;
    expect(submittedAnswers.get('q6')).toEqual({
      orderedAnswerIds: ['step-1', 'step-2'],
    });
  });

  it('transmet une réponse MATCHING même si les paires arrivent dans un ordre différent', async () => {
    const fd = makeFormData({
      activityId: ACTIVITY_ID,
      locale: 'fr',
      'question:q1': 'a1',
      'question:q2': 'a4',
      'question:q3': 'a5',
      'question:q4': 'dénominateur commun',
      'matching:q5:left-2': 'right-2',
      'matching:q5:left-1': 'right-1',
    });
    fd.append('question:q3', 'a6');

    await submitQuizAttempt(fd);

    const [, submittedAnswers] = firstMockCall(mockScoreSingleAnswerQuiz) as ScoreMockCall;
    expect(submittedAnswers.get('q5')).toEqual({
      matches: [
        { leftId: 'left-1', rightId: 'right-1' },
        { leftId: 'left-2', rightId: 'right-2' },
      ],
    });
  });

  it('transmet une mauvaise association MATCHING au scoring', async () => {
    const fd = makeValidFormData({ 'matching:q5:left-2': 'right-1' });

    await submitQuizAttempt(fd);

    const [, submittedAnswers] = firstMockCall(mockScoreSingleAnswerQuiz) as ScoreMockCall;
    expect(submittedAnswers.get('q5')).toEqual({
      matches: [
        { leftId: 'left-1', rightId: 'right-1' },
        { leftId: 'left-2', rightId: 'right-1' },
      ],
    });
  });

  // ── Transaction DB ──────────────────────────────────────────────────────────

  it('crée une tentative dans la transaction', async () => {
    let capturedCalls: TxCalls | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: TxProxy) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedCalls = tx.calls;
      return cb(tx);
    });

    await submitQuizAttempt(makeValidFormData());

    const calls = expectPresent<TxCalls>(capturedCalls);
    expect(calls.attemptCreate).toHaveLength(1);
    const createInput = expectPresent(calls.attemptCreate[0]);
    const { data } = createInput;
    expect(data.userId).toBe('user-1');
    expect(data.activityId).toBe(ACTIVITY_ID);
    expect(data.score).toBe(MOCK_SCORE.score);
    expect(data.rawScore).toBe(MOCK_SCORE.rawScore);
    expect(data.maxScore).toBe(MOCK_SCORE.maxScore);
    expect(data.passed).toBe(MOCK_SCORE.passed);
  });

  it('crée les réponses de tentative via createMany', async () => {
    let capturedCalls: TxCalls | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: TxProxy) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedCalls = tx.calls;
      return cb(tx);
    });

    await submitQuizAttempt(makeValidFormData());

    const calls = expectPresent<TxCalls>(capturedCalls);
    expect(calls.attemptAnswerCreateMany).toHaveLength(1);
    const createManyInput = expectPresent(calls.attemptAnswerCreateMany[0]);
    const { data } = createManyInput;
    const q1Answer = expectPresent(data[0]);
    const q3Answer = expectPresent(data[2]);
    const q4Answer = expectPresent(data[3]);
    const q5Answer = expectPresent(data[4]);
    const q6Answer = expectPresent(data[5]);
    expect(data).toHaveLength(MOCK_SCORE.answers.length);
    expect(q1Answer.attemptId).toBe('attempt-1');
    expect(q1Answer.questionId).toBe('q1');
    expect(q1Answer.response).toEqual({ answerId: 'a1', answerIds: ['a1'] });
    expect(q1Answer.isCorrect).toBe(true);
    expect(q3Answer.response).toEqual({ answerId: 'a5', answerIds: ['a5', 'a6'] });
    expect(q4Answer.response).toEqual({ text: 'dénominateur commun' });
    expect(q5Answer.response).toEqual({
      matches: [
        { leftId: 'left-1', rightId: 'right-1' },
        { leftId: 'left-2', rightId: 'right-2' },
      ],
    });
    expect(q6Answer.response).toEqual({
      orderedAnswerIds: ['step-1', 'step-2', 'step-3'],
    });
  });

  it('crée/met à jour la progression pour chaque compétence de la leçon', async () => {
    let capturedCalls: TxCalls | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: TxProxy) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedCalls = tx.calls;
      return cb(tx);
    });

    await submitQuizAttempt(makeValidFormData());

    // Deux compétences dans MOCK_QUIZ.lesson.skillIds
    const calls = expectPresent<TxCalls>(capturedCalls);
    expect(calls.progressUpsert).toHaveLength(MOCK_QUIZ.lesson.skillIds.length);
  });

  it('initialise la maîtrise au scoreRatio brut pour une première tentative (EMA)', async () => {
    let capturedCalls: TxCalls | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: TxProxy) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedCalls = tx.calls;
      return cb(tx);
    });

    // MOCK_SCORE: rawScore=10, maxScore=10 → scoreRatio=1.0, première tentative → mastery=1.0
    await submitQuizAttempt(makeValidFormData());

    const calls = expectPresent<TxCalls>(capturedCalls);
    const upsertData = expectPresent(calls.progressUpsert[0]);
    expect(upsertData.create.mastery).toBe(1.0);
    expect(upsertData.create.attemptsCount).toBe(1);
  });

  it("applique l'EMA (α=0.3) quand une progression existe déjà", async () => {
    // Progression existante à 0.4 pour skill-1
    const EXISTING_MASTERY = 0.4;
    let capturedCalls: TxCalls | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: TxProxy) => Promise<unknown>) => {
      const tx = makeTxProxy();
      tx.progress.findMany = () =>
        Promise.resolve([{ skillId: 'skill-1', mastery: EXISTING_MASTERY, attemptsCount: 3 }]);
      capturedCalls = tx.calls;
      return cb(tx);
    });

    // scoreRatio = 1.0 (MOCK_SCORE.rawScore/maxScore)
    // EMA : 0.3 × 1 + 0.7 × 0.4 = 0.58
    await submitQuizAttempt(makeValidFormData());

    // Trouver le call pour skill-1
    const calls = expectPresent<TxCalls>(capturedCalls);
    const skill1UpsertData = expectPresent(
      calls.progressUpsert.find((call) => call.where.userId_skillId.skillId === 'skill-1'),
    );
    const newMastery = skill1UpsertData.update.mastery;
    expect(newMastery).toBeCloseTo(0.3 * 1.0 + 0.7 * EXISTING_MASTERY, 10);
    expect(skill1UpsertData.update.attemptsCount).toBe(4);
  });

  it('écrit un AuditLog ATTEMPT_SUBMITTED dans la transaction', async () => {
    let capturedCalls: TxCalls | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: TxProxy) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedCalls = tx.calls;
      return cb(tx);
    });

    await submitQuizAttempt(makeValidFormData());

    const calls = expectPresent<TxCalls>(capturedCalls);
    expect(calls.auditCreate).toHaveLength(1);
    const auditInput = expectPresent(calls.auditCreate[0]);
    const { data } = auditInput;
    expect(data.actorId).toBe('user-1');
    expect(data.targetId).toBe('attempt-1');
    expect(data.targetType).toBe('attempt');
  });

  // ── Redirect en cas de succès ──────────────────────────────────────────────

  it('appelle redirect vers la page résultat en cas de succès', async () => {
    await submitQuizAttempt(makeValidFormData());

    expect(mockRedirect).toHaveBeenCalledOnce();
    const [url] = firstMockCall(mockRedirect) as [string];
    expect(url).toBe(`/fr/quiz/${ACTIVITY_ID}/resultat/attempt-1`);
  });

  // ── Erreur DB ───────────────────────────────────────────────────────────────

  it('retourne unknown si la transaction lève une exception', async () => {
    mockTransaction.mockRejectedValue(new Error('DB connection lost'));
    const result = await submitQuizAttempt(makeValidFormData());
    expect(result).toEqual({ ok: false, error: 'unknown' });
  });
});
