'use server';

/**
 * Server Actions de l'espace authentifié (étape 1.6).
 *
 * Toutes les actions exigent un utilisateur authentifié via
 * `requireApiUser()` (lève UnauthenticatedError sinon). Le résultat est
 * un discriminé `{ ok: true, ... }` / `{ ok: false, fieldErrors }`
 * uniforme.
 */

import { hashPassword, verifyPassword } from '@eduquiz/auth/password';
import {
  AuditEventKind,
  DataRequestKind,
  DataRequestStatus,
  GradeCode,
  Locale,
  prisma,
  UserRole,
} from '@eduquiz/db';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { signOut as signOutAuth } from '../../../auth';
import { logger } from '../../logger';
import { checkRateLimit } from '../rate-limit-server';
import { requireApiUser } from '../server';

// ─── signOutUser ─────────────────────────────────────────────────────

/**
 * Wrapper de déconnexion. Auth.js v5 retourne / `redirect()` après
 * signOut ; on intercale uniquement la cible localisée.
 */
export async function signOutUser(locale: 'fr' | 'en'): Promise<void> {
  await signOutAuth({ redirect: false });
  redirect(`/${locale}`);
}

// ─── updateProfile ───────────────────────────────────────────────────

const GRADE_CODES = ['', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5'] as const;

const profileSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  displayName: z.string().trim().max(60).optional().default(''),
  currentGrade: z.enum(GRADE_CODES).optional().default(''),
  preferredLocale: z.enum(['FR', 'EN']),
  avatarUrl: z.string().trim().url().max(2048).or(z.literal('')).optional().default(''),
});

export type UpdateProfileInput = z.infer<typeof profileSchema>;

export type UpdateProfileFieldErrorCode =
  | 'firstNameTooLong'
  | 'lastNameTooLong'
  | 'displayNameTooLong'
  | 'avatarUrlInvalid'
  | 'gradeInvalid'
  | 'localeInvalid'
  | 'unknown';

export type UpdateProfileResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly fieldErrors: Partial<Record<keyof UpdateProfileInput | 'form', UpdateProfileFieldErrorCode>>;
    };

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const user = await requireApiUser();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof UpdateProfileInput | 'form', UpdateProfileFieldErrorCode>> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (path === 'firstName') fieldErrors.firstName = 'firstNameTooLong';
      else if (path === 'lastName') fieldErrors.lastName = 'lastNameTooLong';
      else if (path === 'displayName') fieldErrors.displayName = 'displayNameTooLong';
      else if (path === 'avatarUrl') fieldErrors.avatarUrl = 'avatarUrlInvalid';
      else if (path === 'currentGrade') fieldErrors.currentGrade = 'gradeInvalid';
      else if (path === 'preferredLocale') fieldErrors.preferredLocale = 'localeInvalid';
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;
  const grade = data.currentGrade && data.currentGrade.length > 0 ? (data.currentGrade as GradeCode) : null;
  const localeEnum = data.preferredLocale as Locale;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { userId: user.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName.length > 0 ? data.displayName : null,
          currentGrade: grade,
          preferredLocale: localeEnum,
          avatarUrl: data.avatarUrl && data.avatarUrl.length > 0 ? data.avatarUrl : null,
        },
      });
      // Synchronise aussi User.locale pour qu'Auth.js voit le bon locale
      // dans le JWT/session au prochain refresh.
      await tx.user.update({ where: { id: user.id }, data: { locale: localeEnum } });
      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.PROFILE_UPDATED,
          actorId: user.id,
          targetId: user.id,
          targetType: 'profile',
        },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, fieldErrors: { form: 'unknown' } };
  }
}

// ─── changePassword ──────────────────────────────────────────────────

const PASSWORD_STRENGTH = /^(?=.*[A-Z])(?=.*\d).+$/;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(512),
    newPassword: z.string().min(8).max(512),
    confirmPassword: z.string().min(1).max(512),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'mismatch',
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type ChangePasswordFieldErrorCode =
  | 'currentRequired'
  | 'currentInvalid'
  | 'newTooShort'
  | 'newWeak'
  | 'newSameAsOld'
  | 'mismatch'
  | 'unknown';

export type ChangePasswordResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly fieldErrors: Partial<Record<keyof ChangePasswordInput | 'form', ChangePasswordFieldErrorCode>>;
    };

export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  const sessionUser = await requireApiUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ChangePasswordInput | 'form', ChangePasswordFieldErrorCode>> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (path === 'currentPassword') fieldErrors.currentPassword = 'currentRequired';
      else if (path === 'newPassword') fieldErrors.newPassword = 'newTooShort';
      else if (path === 'confirmPassword') fieldErrors.confirmPassword = 'mismatch';
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  if (!PASSWORD_STRENGTH.test(data.newPassword)) {
    return { ok: false, fieldErrors: { newPassword: 'newWeak' } };
  }
  if (data.newPassword === data.currentPassword) {
    return { ok: false, fieldErrors: { newPassword: 'newSameAsOld' } };
  }

  // Lecture passwordHash (jamais exposé côté UI).
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, passwordHash: true },
  });
  if (!dbUser?.passwordHash) {
    // Compte créé via OAuth — pas de mot de passe actuel à comparer.
    return { ok: false, fieldErrors: { currentPassword: 'currentInvalid' } };
  }
  const ok = await verifyPassword(dbUser.passwordHash, data.currentPassword);
  if (!ok) {
    return { ok: false, fieldErrors: { currentPassword: 'currentInvalid' } };
  }

  try {
    const newHash = await hashPassword(data.newPassword);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: dbUser.id }, data: { passwordHash: newHash } });
      // Invalide TOUTES les sessions (y compris l'actuelle — l'utilisateur
      // sera déconnecté). C'est cohérent avec le flux reset ; pour ne pas
      // perdre la session courante, on pourrait préserver `sessionToken`
      // courant, mais la simplicité prime en V1.
      await tx.session.deleteMany({ where: { userId: dbUser.id } });
      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.AUTH_PASSWORD_RESET,
          actorId: dbUser.id,
          targetId: dbUser.id,
          targetType: 'user',
          payload: { trigger: 'change-password' } as never,
        },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, fieldErrors: { form: 'unknown' } };
  }
}

// ─── updateLocale ────────────────────────────────────────────────────

const localeSchema = z.object({ locale: z.enum(['FR', 'EN']) });

export type UpdateLocaleInput = z.infer<typeof localeSchema>;

export type UpdateLocaleResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'invalid' | 'unknown' };

export async function updateLocale(input: UpdateLocaleInput): Promise<UpdateLocaleResult> {
  const user = await requireApiUser();
  const parsed = localeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'invalid' };
  const localeEnum = parsed.data.locale as Locale;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { locale: localeEnum } });
      await tx.profile.update({
        where: { userId: user.id },
        data: { preferredLocale: localeEnum },
      });
      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.PROFILE_UPDATED,
          actorId: user.id,
          targetId: user.id,
          targetType: 'profile',
          payload: { field: 'locale', value: localeEnum } as never,
        },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unknown' };
  }
}

// ─── requestAccountDeletion ──────────────────────────────────────────

const deletionSchema = z.object({
  password: z.string().min(1).max(512),
  /** Texte de confirmation, comparé au mot exigé côté UI. */
  confirmText: z.string().min(1),
  /** Mot exigé (lu depuis l'i18n côté caller). Évite la fuite côté client. */
  expectedWord: z.string().min(1),
});

export type RequestAccountDeletionInput = z.infer<typeof deletionSchema>;

export type DeletionFieldErrorCode =
  | 'passwordRequired'
  | 'passwordInvalid'
  | 'mustTypeWord'
  | 'rateLimited'
  | 'unknown';

export type RequestAccountDeletionResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly fieldErrors: Partial<Record<'password' | 'confirmText' | 'form', DeletionFieldErrorCode>>;
    };

export async function requestAccountDeletion(
  input: RequestAccountDeletionInput,
): Promise<RequestAccountDeletionResult> {
  const sessionUser = await requireApiUser();

  // Rate limit par utilisateur (3 tentatives par jour) — on bloque
  // un attaquant qui aurait volé une session active de bombarder
  // la suppression à coups de mauvais mot de passe.
  const limited = await checkRateLimit({ bucket: 'accountDeletion', key: sessionUser.id });
  if (!limited.allowed) {
    logger.warn('account.deletion.rate_limited', { keyHash: limited.keyHash });
    return { ok: false, fieldErrors: { form: 'rateLimited' } };
  }

  // Refus prophylactique : un ADMIN ne peut pas se supprimer via cette
  // route en V1 (évite les erreurs irréversibles). À traiter par un
  // outil dédié plus tard.
  if (sessionUser.role === UserRole.ADMIN) {
    return { ok: false, fieldErrors: { form: 'unknown' } };
  }

  const parsed = deletionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: { password: 'passwordRequired' } };
  }
  const data = parsed.data;

  if (data.confirmText.trim().toUpperCase() !== data.expectedWord.trim().toUpperCase()) {
    return { ok: false, fieldErrors: { confirmText: 'mustTypeWord' } };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, passwordHash: true },
  });
  if (!dbUser?.passwordHash) {
    return { ok: false, fieldErrors: { password: 'passwordInvalid' } };
  }
  const ok = await verifyPassword(dbUser.passwordHash, data.password);
  if (!ok) {
    return { ok: false, fieldErrors: { password: 'passwordInvalid' } };
  }

  try {
    const now = new Date();
    const graceExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.$transaction(async (tx) => {
      // Soft delete : on marque disabledAt. Le provider Credentials et
      // les helpers serveur refuseront immédiatement le login.
      await tx.user.update({
        where: { id: dbUser.id },
        data: { disabledAt: now },
      });
      // DataRequest pour audit Loi 25 + déclencheur de la purge cron.
      await tx.dataRequest.create({
        data: {
          userId: dbUser.id,
          kind: DataRequestKind.DELETION,
          status: DataRequestStatus.AWAITING_GRACE_PERIOD,
          graceExpiresAt,
          metadata: { trigger: 'self-service' } as never,
        },
      });
      // Invalide toutes les sessions actives.
      await tx.session.deleteMany({ where: { userId: dbUser.id } });
      // Audit append-only.
      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.DATA_DELETION_REQUESTED,
          actorId: dbUser.id,
          targetId: dbUser.id,
          targetType: 'user',
          payload: { graceExpiresAt: graceExpiresAt.toISOString() } as never,
        },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, fieldErrors: { form: 'unknown' } };
  }
}
