import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setActivityStatus, setCourseStatus, validateQuestionForPublishing } from './actions';

const { mockRequireRoleOrRedirect, mockPrisma } = vi.hoisted(() => ({
  mockRequireRoleOrRedirect: vi.fn(),
  mockPrisma: {
    auditLog: { create: vi.fn() },
    course: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    activity: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@eduquiz/db', () => ({
  AuditEventKind: { ADMIN_ACTION: 'ADMIN_ACTION' },
  ContentStatus: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED',
  },
  UserRole: {
    ADMIN: 'ADMIN',
    LEARNER_ADULT: 'LEARNER_ADULT',
  },
  prismaService: mockPrisma,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));

vi.mock('../auth/server', () => ({
  requireRoleOrRedirect: mockRequireRoleOrRedirect,
}));

function makeQuestion(overrides: Partial<Parameters<typeof validateQuestionForPublishing>[0]> = {}) {
  return {
    id: 'question-1',
    type: 'MCQ_SINGLE',
    promptFr: 'Question ?',
    promptEn: 'Question?',
    answers: [
      {
        id: 'answer-1',
        labelFr: 'A',
        labelEn: 'A',
        isCorrect: true,
      },
      {
        id: 'answer-2',
        labelFr: 'B',
        labelEn: 'B',
        isCorrect: false,
      },
    ],
    ...overrides,
  };
}

function makeActivity(questions: readonly ReturnType<typeof makeQuestion>[]) {
  return {
    id: 'activity-1',
    kind: 'QUIZ',
    status: 'DRAFT',
    lesson: {
      status: 'PUBLISHED',
      course: { status: 'PUBLISHED' },
    },
    quiz: {
      questions,
    },
  };
}

describe('admin content publication validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRoleOrRedirect.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  it('refuse la publication d’un quiz sans question', async () => {
    mockPrisma.activity.findUnique.mockResolvedValueOnce(makeActivity([]));

    const result = await setActivityStatus('fr', 'activity-1', 'lesson-1', 'PUBLISHED' as never);

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: 'invalid',
      }),
    );
    expect(mockPrisma.activity.update).not.toHaveBeenCalled();
  });

  it('refuse un MCQ_SINGLE sans bonne réponse', () => {
    const issues = validateQuestionForPublishing(
      makeQuestion({
        answers: [
          { id: 'a1', labelFr: 'A', labelEn: 'A', isCorrect: false },
          { id: 'a2', labelFr: 'B', labelEn: 'B', isCorrect: false },
        ],
      }),
    );

    expect(issues).toContain('Une question à choix unique doit avoir exactement une bonne réponse.');
  });

  it('refuse un MCQ_SINGLE avec plusieurs bonnes réponses', () => {
    const issues = validateQuestionForPublishing(
      makeQuestion({
        answers: [
          { id: 'a1', labelFr: 'A', labelEn: 'A', isCorrect: true },
          { id: 'a2', labelFr: 'B', labelEn: 'B', isCorrect: true },
        ],
      }),
    );

    expect(issues).toContain('Une question à choix unique doit avoir exactement une bonne réponse.');
  });

  it('refuse un ORDERING avec moins de deux éléments', () => {
    const issues = validateQuestionForPublishing(
      makeQuestion({
        type: 'ORDERING',
        answers: [{ id: 'a1', labelFr: 'A', labelEn: 'A', isCorrect: true }],
      }),
    );

    expect(issues).toContain('Une question de mise en ordre doit avoir au moins deux éléments.');
  });

  it('refuse un MATCHING incomplet', () => {
    const issues = validateQuestionForPublishing(
      makeQuestion({
        type: 'MATCHING',
        answers: [{ id: 'a1', labelFr: '1/2', labelEn: '1/2', isCorrect: true }],
      }),
    );

    expect(issues).toContain('Une question d’association doit avoir au moins une paire complète.');
  });

  it('refuse une action admin pour un utilisateur non admin', async () => {
    mockRequireRoleOrRedirect.mockRejectedValueOnce(new Error('forbidden'));

    await expect(
      setActivityStatus('fr', 'activity-1', 'lesson-1', 'PUBLISHED' as never),
    ).rejects.toThrow('forbidden');
  });

  it('crée un audit log lors d’une publication de cours', async () => {
    mockPrisma.course.findUnique
      .mockResolvedValueOnce({
        id: 'course-1',
        titleFr: 'Cours',
        titleEn: 'Course',
        subjectId: 'subject-1',
        levelId: 'level-1',
        status: 'DRAFT',
      })
      .mockResolvedValueOnce({
        id: 'course-1',
        status: 'DRAFT',
        publishedAt: null,
        archivedAt: null,
      });
    mockPrisma.course.update.mockResolvedValueOnce({
      id: 'course-1',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-15T12:00:00.000Z'),
      archivedAt: null,
    });

    const result = await setCourseStatus('fr', 'course-1', 'PUBLISHED' as never);

    expect(result).toEqual({ ok: true });
    const auditInput = mockPrisma.auditLog.create.mock.calls[0]?.[0] as
      | {
          readonly data?: {
            readonly kind?: string;
            readonly actorId?: string;
            readonly targetId?: string;
            readonly targetType?: string;
            readonly payload?: {
              readonly action?: string;
              readonly resource?: string;
              readonly resourceId?: string;
            };
          };
        }
      | undefined;

    expect(auditInput?.data?.kind).toBe('ADMIN_ACTION');
    expect(auditInput?.data?.actorId).toBe('admin-1');
    expect(auditInput?.data?.targetId).toBe('course-1');
    expect(auditInput?.data?.targetType).toBe('course');
    expect(auditInput?.data?.payload?.action).toBe('course.status.update');
    expect(auditInput?.data?.payload?.resource).toBe('course');
    expect(auditInput?.data?.payload?.resourceId).toBe('course-1');
  });
});
