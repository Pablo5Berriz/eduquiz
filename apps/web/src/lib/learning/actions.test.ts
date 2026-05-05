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

// ── Mocks déclarés avant les imports du module testé ─────────────────────────

const mockRequireApiUser = vi.fn();
vi.mock('../auth/server', () => ({
  requireApiUser: mockRequireApiUser,
}));

const mockGetPublishedQuizByActivityId = vi.fn();
vi.mock('./catalog', () => ({
  getPublishedQuizByActivityId: mockGetPublishedQuizByActivityId,
}));

const mockScoreSingleAnswerQuiz = vi.fn();
vi.mock('./scoring', () => ({
  scoreSingleAnswerQuiz: mockScoreSingleAnswerQuiz,
}));

const mockTransaction = vi.fn();
vi.mock('@eduquiz/db', async (importOriginal) => {
  const original = await importOriginal<typeof import('@eduquiz/db')>();
  return {
    ...original,
    withUser: vi.fn(() => ({ $transaction: mockTransaction })),
    AuditEventKind: original.AuditEventKind,
  };
});

const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

vi.mock('../i18n/locale', () => ({
  safeResolveLocale: vi.fn((v?: string) => (v === 'en' ? 'en' : 'fr')),
}));

// ── Subject (importé APRÈS les mocks) ────────────────────────────────────────

import { submitQuizAttempt } from './actions';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-1', role: 'LEARNER_ADULT' as const };

const MOCK_QUIZ = {
  id: 'activity-1',
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
  ],
};

const MOCK_SCORE = {
  score: 100,
  rawScore: 2,
  maxScore: 2,
  passed: true,
  answers: [
    { questionId: 'q1', answerId: 'a1', isCorrect: true, pointsEarned: 1 },
    { questionId: 'q2', answerId: 'a4', isCorrect: true, pointsEarned: 1 },
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
  return makeFormData({
    activityId: 'activity-1',
    locale: 'fr',
    startedAt: new Date(Date.now() - 5000).toISOString(),
    'question:q1': 'a1',
    'question:q2': 'a4',
    ...overrides,
  });
}

/** Tx proxy minimaliste pour les assertions dans la transaction. */
function makeTxProxy() {
  return {
    attempt: { create: vi.fn().mockResolvedValue({ id: 'attempt-1' }) },
    attemptAnswer: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    progress: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue(undefined),
    },
    auditLog: { create: vi.fn().mockResolvedValue(undefined) },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('submitQuizAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiUser.mockResolvedValue(MOCK_USER);
    mockGetPublishedQuizByActivityId.mockResolvedValue(MOCK_QUIZ);
    mockScoreSingleAnswerQuiz.mockReturnValue(MOCK_SCORE);
    mockTransaction.mockImplementation(async (cb: (tx: ReturnType<typeof makeTxProxy>) => Promise<unknown>) => {
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
      activityId: 'activity-1',
      locale: 'fr',
      'question:q1': 'a1',
      // 'question:q2' absent
    });
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

  it('retourne incomplete avec tous les ids manquants si aucune réponse soumise', async () => {
    const fd = makeFormData({ activityId: 'activity-1', locale: 'fr' });
    const result = await submitQuizAttempt(fd);
    expect(result).toEqual({
      ok: false,
      error: 'incomplete',
      missingQuestionIds: ['q1', 'q2'],
    });
  });

  // ── Scoring ─────────────────────────────────────────────────────────────────

  it('appelle scoreSingleAnswerQuiz avec les bons arguments', async () => {
    await submitQuizAttempt(makeValidFormData());

    expect(mockScoreSingleAnswerQuiz).toHaveBeenCalledOnce();
    const [questions, submittedAnswers, passingScore] = mockScoreSingleAnswerQuiz.mock.calls[0];
    expect(questions).toBe(MOCK_QUIZ.questions);
    expect(submittedAnswers.get('q1')).toBe('a1');
    expect(submittedAnswers.get('q2')).toBe('a4');
    expect(passingScore).toBe(MOCK_QUIZ.passingScore);
  });

  // ── Transaction DB ──────────────────────────────────────────────────────────

  it('crée une tentative dans la transaction', async () => {
    let capturedTx: ReturnType<typeof makeTxProxy> | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: ReturnType<typeof makeTxProxy>) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedTx = tx;
      return cb(tx);
    });

    await submitQuizAttempt(makeValidFormData());

    expect(capturedTx!.attempt.create).toHaveBeenCalledOnce();
    const data = capturedTx!.attempt.create.mock.calls[0][0].data;
    expect(data.userId).toBe('user-1');
    expect(data.activityId).toBe('activity-1');
    expect(data.score).toBe(MOCK_SCORE.score);
    expect(data.rawScore).toBe(MOCK_SCORE.rawScore);
    expect(data.maxScore).toBe(MOCK_SCORE.maxScore);
    expect(data.passed).toBe(MOCK_SCORE.passed);
  });

  it('crée les réponses de tentative via createMany', async () => {
    let capturedTx: ReturnType<typeof makeTxProxy> | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: ReturnType<typeof makeTxProxy>) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedTx = tx;
      return cb(tx);
    });

    await submitQuizAttempt(makeValidFormData());

    expect(capturedTx!.attemptAnswer.createMany).toHaveBeenCalledOnce();
    const { data } = capturedTx!.attemptAnswer.createMany.mock.calls[0][0];
    expect(data).toHaveLength(MOCK_SCORE.answers.length);
    expect(data[0].attemptId).toBe('attempt-1');
    expect(data[0].questionId).toBe('q1');
    expect(data[0].isCorrect).toBe(true);
  });

  it('crée/met à jour la progression pour chaque compétence de la leçon', async () => {
    let capturedTx: ReturnType<typeof makeTxProxy> | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: ReturnType<typeof makeTxProxy>) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedTx = tx;
      return cb(tx);
    });

    await submitQuizAttempt(makeValidFormData());

    // Deux compétences dans MOCK_QUIZ.lesson.skillIds
    expect(capturedTx!.progress.upsert).toHaveBeenCalledTimes(
      MOCK_QUIZ.lesson.skillIds.length,
    );
  });

  it('initialise la maîtrise au scoreRatio brut pour une première tentative (EMA)', async () => {
    let capturedTx: ReturnType<typeof makeTxProxy> | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: ReturnType<typeof makeTxProxy>) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedTx = tx;
      return cb(tx);
    });

    // MOCK_SCORE: rawScore=2, maxScore=2 → scoreRatio=1.0, première tentative → mastery=1.0
    await submitQuizAttempt(makeValidFormData());

    const upsertCall = capturedTx!.progress.upsert.mock.calls[0][0];
    expect(upsertCall.create.mastery).toBe(1.0);
    expect(upsertCall.create.attemptsCount).toBe(1);
  });

  it("applique l'EMA (α=0.3) quand une progression existe déjà", async () => {
    // Progression existante à 0.4 pour skill-1
    const EXISTING_MASTERY = 0.4;
    let capturedTx: ReturnType<typeof makeTxProxy> | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: ReturnType<typeof makeTxProxy>) => Promise<unknown>) => {
      const tx = makeTxProxy();
      tx.progress.findMany = vi.fn().mockResolvedValue([
        { skillId: 'skill-1', mastery: EXISTING_MASTERY, attemptsCount: 3 },
      ]);
      capturedTx = tx;
      return cb(tx);
    });

    // scoreRatio = 1.0 (MOCK_SCORE.rawScore/maxScore)
    // EMA : 0.3 × 1 + 0.7 × 0.4 = 0.58
    await submitQuizAttempt(makeValidFormData());

    // Trouver le call pour skill-1
    const skill1Call = capturedTx!.progress.upsert.mock.calls.find(
      (call) => call[0].where.userId_skillId.skillId === 'skill-1',
    );
    expect(skill1Call).toBeDefined();
    const newMastery = skill1Call![0].update.mastery;
    expect(newMastery).toBeCloseTo(0.3 * 1.0 + 0.7 * EXISTING_MASTERY, 10);
    expect(skill1Call![0].update.attemptsCount).toBe(4);
  });

  it('écrit un AuditLog ATTEMPT_SUBMITTED dans la transaction', async () => {
    let capturedTx: ReturnType<typeof makeTxProxy> | null = null;
    mockTransaction.mockImplementation(async (cb: (tx: ReturnType<typeof makeTxProxy>) => Promise<unknown>) => {
      const tx = makeTxProxy();
      capturedTx = tx;
      return cb(tx);
    });

    await submitQuizAttempt(makeValidFormData());

    expect(capturedTx!.auditLog.create).toHaveBeenCalledOnce();
    const { data } = capturedTx!.auditLog.create.mock.calls[0][0];
    expect(data.actorId).toBe('user-1');
    expect(data.targetId).toBe('attempt-1');
    expect(data.targetType).toBe('attempt');
  });

  // ── Redirect en cas de succès ──────────────────────────────────────────────

  it('appelle redirect vers la page résultat en cas de succès', async () => {
    await submitQuizAttempt(makeValidFormData());

    expect(mockRedirect).toHaveBeenCalledOnce();
    const url: string = mockRedirect.mock.calls[0][0];
    expect(url).toMatch(/^\/fr\/quiz\/activity-1\/resultat\/attempt-1$/);
  });

  // ── Erreur DB ───────────────────────────────────────────────────────────────

  it('retourne unknown si la transaction lève une exception', async () => {
    mockTransaction.mockRejectedValue(new Error('DB connection lost'));
    const result = await submitQuizAttempt(makeValidFormData());
    expect(result).toEqual({ ok: false, error: 'unknown' });
  });
});
