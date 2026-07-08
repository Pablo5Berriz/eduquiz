'use server';

/**
 * Server Actions liées au flux de vérification d'email.
 *
 *   - `resendVerification` : redemande un lien depuis l'écran 22.
 *     Idempotent (l'ancien token est invalidé, un nouveau est créé).
 *     Pas de rate limiting hard côté serveur en 1.4 — l'écran applique
 *     un cooldown 60s côté UI, durci en 1.7 avec un bucket Redis.
 *
 *   - `confirmVerification` : consomme un token et marque l'email
 *     vérifié. Renvoie un statut détaillé pour permettre à l'écran 23
 *     d'afficher le bon message (ok / expired / invalid).
 */

import { consumeToken, createToken } from '@eduquiz/auth/tokens';
import { AuditEventKind, prismaService as prisma } from '@eduquiz/db';
import { buildVerificationEmail, buildWelcomeEmail, sendEmail } from '@eduquiz/email';

import { logger } from '../../logger';
import { checkRateLimit } from '../rate-limit-server';
import { getCanonicalAuthUrl } from '../url';

export type ResendResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'unknown' };

export async function resendVerification(input: {
  readonly email: string;
  readonly locale: 'fr' | 'en';
}): Promise<ResendResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, reason: 'unknown' };

  // Rate limit par email — préserve l'anti-énumération en retournant
  // toujours `ok: true` côté UI (le caller verra un cooldown identique).
  const limited = await checkRateLimit({ bucket: 'resendVerification', key: email });
  if (!limited.allowed) {
    logger.warn('auth.resend_verification.rate_limited', { keyHash: limited.keyHash });
    return { ok: true };
  }

  // On ne révèle pas si le compte existe : on retourne toujours `ok:true`
  // si l'email a un format valide. On envoie l'email seulement si le
  // compte existe ET que l'email n'est pas déjà vérifié.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true },
  });

  try {
    if (user && !user.emailVerifiedAt) {
      const { token } = await createToken({ purpose: 'verify-email', email });
      const verifyUrl = getCanonicalAuthUrl(
        `/${input.locale}/verification-email/confirme/${encodeURIComponent(token)}`,
      );
      await sendEmail(buildVerificationEmail({ to: email, locale: input.locale, verifyUrl }));
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unknown' };
  }
}

export type ConfirmResult =
  | { readonly ok: true; readonly email: string }
  | { readonly ok: false; readonly reason: 'invalid' | 'expired' };

export async function confirmVerification(token: string): Promise<ConfirmResult> {
  const consumed = await consumeToken(token);
  if (!consumed) return { ok: false, reason: 'invalid' };
  if (consumed.purpose !== 'verify-email') return { ok: false, reason: 'invalid' };

  // Marque l'email vérifié. Si l'utilisateur n'existe plus (compte
  // supprimé entre l'envoi et le clic), on renvoie `invalid` plutôt
  // que de fail silencieusement.
  const user = await prisma.user
    .update({
      where: { email: consumed.email },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, email: true, locale: true },
    })
    .catch(() => null);

  if (!user) return { ok: false, reason: 'invalid' };

  // Audit log + welcome email best-effort.
  try {
    await prisma.auditLog.create({
      data: {
        kind: AuditEventKind.AUTH_VERIFY_EMAIL,
        actorId: user.id,
        targetId: user.id,
        targetType: 'user',
      },
    });
  } catch {
    // ignore
  }

  try {
    const localeLower = user.locale.toLowerCase() as 'fr' | 'en';
    const signInUrl = getCanonicalAuthUrl(`/${localeLower}/connexion?verified=1`);
    await sendEmail(buildWelcomeEmail({ to: user.email, locale: localeLower, signInUrl }));
  } catch {
    // ignore — le welcome n'est pas critique
  }

  return { ok: true, email: user.email };
}
