'use server';

/**
 * Server Actions — flux mot de passe oublié (écrans 17 et 18).
 *
 *   - `requestPasswordReset` : reçoit un email, génère un token (purpose
 *     `reset-password`) et envoie un email contenant le lien. Toujours
 *     retourne `{ ok: true }` côté UI (anti-énumération). L'envoi
 *     n'a effectivement lieu que si l'utilisateur existe ET son email
 *     est vérifié — sinon silencieux.
 *
 *   - `completePasswordReset` : reçoit token + nouveau mot de passe + sa
 *     confirmation. Valide via Zod (complexité), consomme le token,
 *     met à jour `passwordHash`, **invalide toutes les sessions
 *     actives** de l'utilisateur (sécurité forte standard), trace
 *     `AUTH_PASSWORD_RESET` dans AuditLog.
 */

import { hashPassword } from '@eduquiz/auth/password';
import { consumeToken, createToken } from '@eduquiz/auth/tokens';
import { AuditEventKind, prisma } from '@eduquiz/db';
import { buildResetPasswordEmail, sendEmail } from '@eduquiz/email';
import { z } from 'zod';

import { logger } from '../../logger';
import { checkRateLimit, currentClientIp } from '../rate-limit-server';
import { getCanonicalAuthUrl } from '../url';

export type PasswordResetFieldErrorCode =
  | 'passwordTooShort'
  | 'passwordWeak'
  | 'passwordMismatch'
  | 'tokenExpired'
  | 'tokenInvalid'
  | 'rateLimited'
  | 'unknown';

const PASSWORD_STRENGTH = /^(?=.*[A-Z])(?=.*\d).+$/;

// ─── requestPasswordReset ────────────────────────────────────────────

const requestSchema = z.object({
  locale: z.enum(['fr', 'en']),
  email: z.string().trim().toLowerCase().email().max(254),
});

export type RequestPasswordResetInput = z.infer<typeof requestSchema>;

export type RequestPasswordResetResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly fieldErrors: { readonly email?: 'emailInvalid' | 'unknown' } };

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
): Promise<RequestPasswordResetResult> {
  // Rate limit IP — applique avant validation Zod pour limiter le coût
  // d'une attaque par flood de requêtes mal formées.
  const ip = currentClientIp();
  const limited = await checkRateLimit({ bucket: 'forgotPassword', key: ip });
  if (!limited.allowed) {
    logger.warn('auth.forgot_password.rate_limited', { keyHash: limited.keyHash });
    // On retourne quand même `ok: true` pour préserver l'anti-énumération
    // côté UI — pas de différence visible avec un succès légitime.
    return { ok: true };
  }

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: { email: 'emailInvalid' } };
  }

  const { email, locale } = parsed.data;

  try {
    // Lookup discret. On ne lève PAS si l'utilisateur n'existe pas
    // (anti-énumération : on retourne toujours `ok: true`).
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true, disabledAt: true, deletedAt: true },
    });

    if (user?.emailVerifiedAt && !user.disabledAt && !user.deletedAt) {
      const { token } = await createToken({ purpose: 'reset-password', email });
      const resetUrl = getCanonicalAuthUrl(
        `/${locale}/mot-de-passe-oublie/reinitialiser/${encodeURIComponent(token)}`,
      );
      await sendEmail(buildResetPasswordEmail({ to: email, locale, resetUrl }));
    }
    return { ok: true };
  } catch {
    // Échec interne : on retourne quand même OK côté UI pour éviter de
    // révéler un état serveur exploitable.
    logger.warn('auth.forgot_password.internal_bypassed', { keyHash: limited.keyHash });
    return { ok: true };
  }
}

// ─── completePasswordReset ───────────────────────────────────────────

const completeSchema = z
  .object({
    token: z.string().min(1).max(512),
    newPassword: z.string().min(8).max(512),
    confirmPassword: z.string().min(1).max(512),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'mismatch',
  });

export type CompletePasswordResetInput = z.infer<typeof completeSchema>;

export type CompletePasswordResetResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly fieldErrors: Partial<Record<keyof CompletePasswordResetInput | 'form', PasswordResetFieldErrorCode>>;
    };

export async function completePasswordReset(
  input: CompletePasswordResetInput,
): Promise<CompletePasswordResetResult> {
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof CompletePasswordResetInput | 'form', PasswordResetFieldErrorCode>> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (path === 'newPassword') fieldErrors.newPassword = 'passwordTooShort';
      else if (path === 'confirmPassword') fieldErrors.confirmPassword = 'passwordMismatch';
      else if (path === 'token') fieldErrors.form = 'tokenInvalid';
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  if (!PASSWORD_STRENGTH.test(data.newPassword)) {
    return { ok: false, fieldErrors: { newPassword: 'passwordWeak' } };
  }

  // Consommation atomique du token. `consumeToken` retourne `null` si
  // expiré, déjà utilisé, ou inconnu. On ne distingue pas « expiré »
  // de « invalide » côté UI à ce stade — la page parente l'a déjà
  // distingué via `peekToken` au rendu si l'utilisateur veut savoir
  // pourquoi il est arrivé sur l'écran d'erreur.
  const consumed = await consumeToken(data.token);
  if (!consumed || consumed.purpose !== 'reset-password') {
    return { ok: false, fieldErrors: { form: 'tokenInvalid' } };
  }

  try {
    const passwordHash = await hashPassword(data.newPassword);

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { email: consumed.email },
        data: { passwordHash },
        select: { id: true },
      });

      // Invalide toutes les sessions actives — sécurité standard
      // après un reset. L'utilisateur devra se reconnecter sur tous
      // ses appareils. Cohérent avec la stratégie session=database.
      await tx.session.deleteMany({ where: { userId: user.id } });

      // Audit append-only.
      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.AUTH_PASSWORD_RESET,
          actorId: user.id,
          targetId: user.id,
          targetType: 'user',
          payload: { trigger: 'forgot-password' } as never,
        },
      });

      return user;
    });

    return updated ? { ok: true } : { ok: false, fieldErrors: { form: 'unknown' } };
  } catch {
    return { ok: false, fieldErrors: { form: 'unknown' } };
  }
}
