/**
 * Couche d'envoi d'emails — wrapper minimaliste autour de nodemailer.
 *
 * Crée un transport SMTP unique au boot (pool keep-alive activé pour
 * mutualiser la connexion entre envois successifs). Les helpers de
 * templates (`./templates/*.ts`) construisent le `EmailMessage` puis
 * appellent `sendEmail()`.
 *
 * En dev (`SMTP_HOST=localhost`, `SMTP_PORT=1025`), pointe sur MailHog
 * — les emails s'affichent dans http://localhost:8025 sans quitter le
 * conteneur.
 */

import nodemailer, { type Transporter } from 'nodemailer';

import { getEmailEnv } from './env.js';

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  /** En-tête `Reply-To`. Optionnel (par défaut : valeur de SMTP_FROM). */
  readonly replyTo?: string;
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const env = getEmailEnv();
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
  return transporter;
}

/**
 * Envoie un email. Lève en cas d'échec — les appelants sont libres de
 * retry/log/no-op selon l'usage. Pour les emails non bloquants
 * (welcome, notification), envelopper dans un try/catch côté caller.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const env = getEmailEnv();
  const t = getTransporter();
  await t.sendMail({
    from: env.SMTP_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    replyTo: message.replyTo,
  });
}

/**
 * Réinitialise le transport cache. Réservé aux tests.
 * @internal
 */
export function _resetTransporterForTests(): void {
  transporter = undefined;
}
