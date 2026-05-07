'use server';

/**
 * Server Action — inscription d'un compte adulte (écran 19).
 *
 * Pipeline :
 *   1. Validation Zod stricte (email, password complexité, birthDate
 *      majeur, CGU coché).
 *   2. Vérification anti-collision email (avec message clair).
 *   3. Hash Argon2id via `@eduquiz/auth/password`.
 *   4. Transaction Prisma : User + Profile + ConsentRecord×2 (CGU,
 *      Privacy).
 *   5. Génération token de vérification (`@eduquiz/auth/tokens`,
 *      purpose=`verify-email`).
 *   6. Envoi email de confirmation (best-effort).
 *   7. AuditLog `AUTH_USER_CREATED`.
 *   8. Pas d'auto-login : cohérent avec le provider Credentials qui
 *      refuse `emailVerifiedAt: null`. Le caller redirige vers
 *      `/<locale>/verification-email?email=…`.
 */

import { hashPassword } from '@eduquiz/auth/password';
import { createToken } from '@eduquiz/auth/tokens';
import { AuditEventKind, ConsentEventKind, Locale, UserRole, prisma } from '@eduquiz/db';
import { buildVerificationEmail, sendEmail } from '@eduquiz/email';
import { z } from 'zod';

import { logger } from '../../logger';
import { checkRateLimit, currentClientIp } from '../rate-limit-server';
import { getCanonicalAuthUrl } from '../url';

/** Code champ → clé i18n d'erreur dans `auth.signup.adult.errors`. */
export type SignupFieldErrorCode =
  | 'emailInvalid'
  | 'emailTaken'
  | 'passwordTooShort'
  | 'passwordWeak'
  | 'birthDateInvalid'
  | 'notAdult'
  | 'termsRequired'
  | 'rateLimited'
  | 'unknown';

export interface RegisterAdultInput {
  readonly locale: 'fr' | 'en';
  readonly email: string;
  readonly password: string;
  readonly birthDate: string; // ISO date YYYY-MM-DD
  readonly acceptTerms: boolean;
  readonly acceptMarketing: boolean;
}

export type RegisterAdultResult =
  | {
      readonly ok: true;
      /** Email à afficher (masqué) sur l'écran 22. */
      readonly email: string;
    }
  | {
      readonly ok: false;
      /** Erreurs par champ — la clé est le `name` du champ HTML. */
      readonly fieldErrors: Partial<Record<keyof RegisterAdultInput | 'form', SignupFieldErrorCode>>;
    };

/** Schéma Zod : règles de format. La règle « majeur » est appliquée après. */
const inputSchema = z.object({
  locale: z.enum(['fr', 'en']),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(512),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  acceptTerms: z.literal(true),
  acceptMarketing: z.boolean(),
});

const PASSWORD_STRENGTH = /^(?=.*[A-Z])(?=.*\d).+$/;

/** Calcul d'âge à la date du jour (en années pleines). */
function ageInYears(birthDate: Date, today: Date = new Date()): number {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = today.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) age -= 1;
  return age;
}

export async function registerAdult(input: RegisterAdultInput): Promise<RegisterAdultResult> {
  // 0. Rate limit IP (anti spam d'inscription).
  const ip = currentClientIp();
  const limited = await checkRateLimit({ bucket: 'register', key: ip });
  if (!limited.allowed) {
    logger.warn('auth.register.rate_limited', { keyHash: limited.keyHash });
    return { ok: false, fieldErrors: { form: 'rateLimited' } };
  }

  // 1. Validation Zod
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof RegisterAdultInput | 'form', SignupFieldErrorCode>> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (path === 'email') fieldErrors.email = 'emailInvalid';
      else if (path === 'password') fieldErrors.password = 'passwordTooShort';
      else if (path === 'birthDate') fieldErrors.birthDate = 'birthDateInvalid';
      else if (path === 'acceptTerms') fieldErrors.acceptTerms = 'termsRequired';
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  // 2a. Force complexité du mot de passe (1 chiffre + 1 majuscule).
  if (!PASSWORD_STRENGTH.test(data.password)) {
    return { ok: false, fieldErrors: { password: 'passwordWeak' } };
  }

  // 2b. Vérif majorité.
  const birthDateObj = new Date(`${data.birthDate}T00:00:00Z`);
  if (Number.isNaN(birthDateObj.getTime())) {
    return { ok: false, fieldErrors: { birthDate: 'birthDateInvalid' } };
  }
  if (ageInYears(birthDateObj) < 18) {
    return { ok: false, fieldErrors: { birthDate: 'notAdult' } };
  }

  // 3. Anti-collision email.
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, fieldErrors: { email: 'emailTaken' } };
  }

  try {
    // 4. Hash + création User+Profile+ConsentRecord en transaction.
    const passwordHash = await hashPassword(data.password);
    const localeEnum = data.locale === 'en' ? Locale.EN : Locale.FR;
    const now = new Date();

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: UserRole.LEARNER_ADULT,
          locale: localeEnum,
          profile: {
            create: {
              firstName: '',
              lastName: '',
              birthDate: birthDateObj,
              preferredLocale: localeEnum,
              province: 'QC',
            },
          },
          consentRecords: {
            createMany: {
              data: [
                {
                  kind: ConsentEventKind.TERMS_ACCEPTED,
                  documentRef: 'CGU v1.0',
                  recordedAt: now,
                },
                {
                  kind: ConsentEventKind.PRIVACY_ACCEPTED,
                  documentRef: 'Politique v1.0',
                  recordedAt: now,
                },
                ...(data.acceptMarketing
                  ? [
                      {
                        kind: ConsentEventKind.MARKETING_OPTED_IN,
                        documentRef: 'Marketing v1.0',
                        recordedAt: now,
                      },
                    ]
                  : []),
              ],
            },
          },
        },
        select: { id: true, email: true },
      });

      // 5. AuditLog (best-effort dans la même transaction pour
      // garantir l'atomicité — si l'audit échoue, l'inscription
      // est rollback).
      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.AUTH_USER_CREATED,
          actorId: created.id,
          targetId: created.id,
          targetType: 'user',
          payload: { provider: 'credentials' } as never,
        },
      });

      return created;
    });

    // 6. Génération token + envoi email (hors transaction — l'email est
    // best-effort, on ne veut pas rollback la création de compte si SMTP
    // est down).
    const { token } = await createToken({ purpose: 'verify-email', email: user.email });

    try {
      const verifyUrl = getCanonicalAuthUrl(
        `/${data.locale}/verification-email/confirme/${encodeURIComponent(token)}`,
      );
      await sendEmail(
        buildVerificationEmail({ to: user.email, locale: localeEnum.toLowerCase() as 'fr' | 'en', verifyUrl }),
      );
    } catch {
      // L'email n'a pas pu partir : l'utilisateur pourra le redemander
      // depuis l'écran 22 via la Server Action `resendVerification`.
    }

    return { ok: true, email: user.email };
  } catch {
    return { ok: false, fieldErrors: { form: 'unknown' } };
  }
}
