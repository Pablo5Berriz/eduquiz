import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCheckRateLimit,
  mockHashPassword,
  mockPrismaService,
  mockRequireApiUser,
  mockTransaction,
  mockTx,
  mockVerifyPassword,
  mockWarn,
  mockWithUser,
} = vi.hoisted(() => {
  const mockTx = {
    auditLog: { create: vi.fn() },
    dataRequest: { create: vi.fn() },
    profile: { update: vi.fn() },
    session: { deleteMany: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
  };
  const mockPrismaService = {
    $transaction: vi.fn(),
    profile: { update: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
  };
  const mockTransaction = vi.fn((fn: (tx: typeof mockTx) => unknown) =>
    Promise.resolve(fn(mockTx)),
  );
  return {
    mockCheckRateLimit: vi.fn(),
    mockHashPassword: vi.fn(),
    mockPrismaService,
    mockRequireApiUser: vi.fn(),
    mockTransaction,
    mockTx,
    mockVerifyPassword: vi.fn(),
    mockWarn: vi.fn(),
    mockWithUser: vi.fn(() => ({ $transaction: mockTransaction })),
  };
});

vi.mock('@eduquiz/auth/password', () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}));

vi.mock('@eduquiz/db', () => {
  return {
    AuditEventKind: {
      AUTH_PASSWORD_RESET: 'AUTH_PASSWORD_RESET',
      DATA_DELETION_REQUESTED: 'DATA_DELETION_REQUESTED',
      PROFILE_UPDATED: 'PROFILE_UPDATED',
    },
    DataRequestKind: { DELETION: 'DELETION' },
    DataRequestStatus: { AWAITING_GRACE_PERIOD: 'AWAITING_GRACE_PERIOD' },
    GradeCode: {},
    Locale: { FR: 'FR', EN: 'EN' },
    UserRole: { ADMIN: 'ADMIN', LEARNER_ADULT: 'LEARNER_ADULT' },
    prisma: mockPrismaService,
    prismaService: mockPrismaService,
    withUser: mockWithUser,
  };
});

vi.mock('../../../auth', () => ({
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('../server', () => ({
  requireApiUser: mockRequireApiUser,
}));

vi.mock('../rate-limit-server', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock('../../logger', () => ({
  logger: { warn: mockWarn },
}));

import { changePassword, requestAccountDeletion, updateLocale, updateProfile } from './account';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER = {
  id: USER_ID,
  email: 'user@example.com',
  role: 'LEARNER_ADULT',
};

function expectServicePrismaUnused(): void {
  expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
  expect(mockPrismaService.user.update).not.toHaveBeenCalled();
  expect(mockPrismaService.profile.update).not.toHaveBeenCalled();
}

describe('requestAccountDeletion rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiUser.mockResolvedValue(USER);
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      bypassed: false,
      keyHash: 'abc123def456',
    });
    mockTransaction.mockImplementation((fn: (tx: typeof mockTx) => unknown) =>
      Promise.resolve(fn(mockTx)),
    );
  });

  it('bloque et loggue uniquement keyHash, jamais userId brut', async () => {
    const result = await requestAccountDeletion({
      password: 'Password123',
      confirmText: 'SUPPRIMER',
      expectedWord: 'SUPPRIMER',
    });

    expect(result).toEqual({ ok: false, fieldErrors: { form: 'rateLimited' } });
    expect(mockWarn).toHaveBeenCalledWith('account.deletion.rate_limited', {
      keyHash: 'abc123def456',
    });
    expect(JSON.stringify(mockWarn.mock.calls)).not.toContain(USER_ID);
  });
});

describe('account actions RLS context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiUser.mockResolvedValue(USER);
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      bypassed: false,
      keyHash: 'abc123def456',
    });
    mockHashPassword.mockResolvedValue('new-hash');
    mockVerifyPassword.mockResolvedValue(true);
    mockTx.user.findUnique.mockResolvedValue({ id: USER_ID, passwordHash: 'old-hash' });
    mockTransaction.mockImplementation((fn: (tx: typeof mockTx) => unknown) =>
      Promise.resolve(fn(mockTx)),
    );
  });

  it('updateProfile utilise withUser avec le contexte RLS', async () => {
    const result = await updateProfile({
      firstName: 'Alice',
      lastName: 'Tremblay',
      displayName: '',
      currentGrade: '',
      preferredLocale: 'FR',
      avatarUrl: '',
    });

    expect(result).toEqual({ ok: true });
    expect(mockWithUser).toHaveBeenCalledWith({ userId: USER_ID, role: 'LEARNER_ADULT' });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTx.profile.update).toHaveBeenCalled();
    expect(mockTx.user.update).toHaveBeenCalled();
    expect(mockTx.auditLog.create).toHaveBeenCalled();
    expectServicePrismaUnused();
  });

  it('changePassword utilise withUser pour la lecture et les écritures', async () => {
    const result = await changePassword({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    });

    expect(result).toEqual({ ok: true });
    expect(mockWithUser).toHaveBeenCalledWith({ userId: USER_ID, role: 'LEARNER_ADULT' });
    expect(mockWithUser).toHaveBeenCalledTimes(2);
    expect(mockTx.user.findUnique).toHaveBeenCalled();
    expect(mockTx.user.update).toHaveBeenCalled();
    expect(mockTx.session.deleteMany).toHaveBeenCalled();
    expect(mockTx.auditLog.create).toHaveBeenCalled();
    expectServicePrismaUnused();
  });

  it('updateLocale utilise withUser avec le contexte RLS', async () => {
    const result = await updateLocale({ locale: 'EN' });

    expect(result).toEqual({ ok: true });
    expect(mockWithUser).toHaveBeenCalledWith({ userId: USER_ID, role: 'LEARNER_ADULT' });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTx.user.update).toHaveBeenCalled();
    expect(mockTx.profile.update).toHaveBeenCalled();
    expect(mockTx.auditLog.create).toHaveBeenCalled();
    expectServicePrismaUnused();
  });

  it('requestAccountDeletion utilise withUser et pas prismaService', async () => {
    const result = await requestAccountDeletion({
      password: 'OldPassword1',
      confirmText: 'SUPPRIMER',
      expectedWord: 'SUPPRIMER',
    });

    expect(result).toEqual({ ok: true });
    expect(mockWithUser).toHaveBeenCalledWith({ userId: USER_ID, role: 'LEARNER_ADULT' });
    expect(mockWithUser).toHaveBeenCalledTimes(2);
    expect(mockTx.user.findUnique).toHaveBeenCalled();
    expect(mockTx.user.update).toHaveBeenCalled();
    expect(mockTx.dataRequest.create).toHaveBeenCalled();
    expect(mockTx.session.deleteMany).toHaveBeenCalled();
    expect(mockTx.auditLog.create).toHaveBeenCalled();
    expectServicePrismaUnused();
  });
});
