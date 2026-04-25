/**
 * Validation Zod stricte des variables d'environnement SMTP.
 *
 * En dev local : `SMTP_HOST=localhost`, `SMTP_PORT=1025` (MailHog).
 * En prod : SES, SendGrid, Postmark, ou tout autre relai SMTP standard.
 */

import { z } from 'zod';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

const emailEnvSchema = z.object({
  SMTP_HOST: z.string({ required_error: 'SMTP_HOST est requis' }).min(1),
  SMTP_PORT: z.coerce.number().int().positive().max(65_535).default(25),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => (v ? TRUE_VALUES.has(v.toLowerCase()) : false)),
  /**
   * Adresse expéditeur. Forme RFC 5322 acceptée
   * (ex. `EduQuiz <no-reply@eduquiz.local>`).
   */
  SMTP_FROM: z
    .string({ required_error: 'SMTP_FROM est requis' })
    .min(3, 'SMTP_FROM doit être renseigné'),
});

export type EmailEnv = z.infer<typeof emailEnvSchema>;

let cached: EmailEnv | undefined;

export function getEmailEnv(source: NodeJS.ProcessEnv = process.env): EmailEnv {
  if (cached) return cached;
  const result = emailEnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(racine)'} : ${i.message}`)
      .join('\n');
    throw new Error(`Configuration SMTP invalide :\n${issues}`);
  }
  cached = result.data;
  return cached;
}

/**
 * Réinitialise le cache. Réservé aux tests.
 * @internal
 */
export function _resetEmailEnvCacheForTests(): void {
  cached = undefined;
}
