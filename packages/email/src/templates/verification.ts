/**
 * Template de l'email de vérification d'adresse — bilingue FR/EN.
 *
 * Format : un message texte brut + un HTML simple, sobre, lisible
 * dans tous les clients email (pas de CSS externe, styles inline,
 * aucune image distante). Pas de framework de template — concaténation
 * directe pour rester portable.
 */

import { type Locale } from '@eduquiz/i18n';

import type { EmailMessage } from '../sender.js';

export interface VerificationEmailInput {
  readonly to: string;
  readonly locale: Locale;
  /**
   * URL absolue du lien de confirmation. Le caller (apps/web) construit
   * cette URL en concaténant AUTH_URL + chemin de la route Next +
   * token. Exemple :
   *   https://eduquiz.ca/fr/verification-email/confirme/abc123
   */
  readonly verifyUrl: string;
}

interface Copy {
  subject: string;
  preheader: string;
  greeting: string;
  body: string;
  cta: string;
  fallback: string;
  validity: string;
  ignored: string;
  footer: string;
}

const COPY: Record<Locale, Copy> = {
  fr: {
    subject: 'Confirme ton adresse courriel',
    preheader: 'Active ton compte EduQuiz en un clic.',
    greeting: 'Bienvenue sur EduQuiz !',
    body: 'Pour activer ton compte, confirme ton adresse courriel en cliquant sur le bouton ci-dessous.',
    cta: 'Confirmer mon courriel',
    fallback: 'Le bouton ne fonctionne pas ? Copie-colle ce lien dans ton navigateur :',
    validity: 'Ce lien expire dans 24 heures.',
    ignored: "Tu n'as pas créé de compte EduQuiz ? Ignore simplement ce message.",
    footer: '— L’équipe EduQuiz',
  },
  en: {
    subject: 'Confirm your email address',
    preheader: 'Activate your EduQuiz account in one click.',
    greeting: 'Welcome to EduQuiz!',
    body: 'To activate your account, confirm your email by clicking the button below.',
    cta: 'Confirm my email',
    fallback: 'Button not working? Copy-paste this link into your browser:',
    validity: 'This link expires in 24 hours.',
    ignored: 'You did not create an EduQuiz account? Just ignore this message.',
    footer: '— The EduQuiz team',
  },
};

export function buildVerificationEmail(input: VerificationEmailInput): EmailMessage {
  const c = COPY[input.locale];

  const text = [
    c.greeting,
    '',
    c.body,
    '',
    `${c.cta}: ${input.verifyUrl}`,
    '',
    c.validity,
    c.ignored,
    '',
    c.footer,
  ].join('\n');

  const html = `<!doctype html>
<html lang="${input.locale}">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
    <span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(c.preheader)}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <tr>
        <td style="padding:32px;">
          <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px 0;">${escapeHtml(c.greeting)}</h1>
          <p style="font-size:16px;line-height:1.5;margin:0 0 24px 0;">${escapeHtml(c.body)}</p>
          <p style="margin:0 0 32px 0;">
            <a href="${input.verifyUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">${escapeHtml(c.cta)}</a>
          </p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0 0 8px 0;">${escapeHtml(c.fallback)}</p>
          <p style="font-size:13px;line-height:1.5;word-break:break-all;margin:0 0 24px 0;"><a href="${input.verifyUrl}" style="color:#1d4ed8;">${input.verifyUrl}</a></p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0 0 4px 0;">${escapeHtml(c.validity)}</p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0 0 16px 0;">${escapeHtml(c.ignored)}</p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0;">${escapeHtml(c.footer)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { to: input.to, subject: c.subject, text, html };
}

/** Échappement HTML minimal pour les valeurs de copy injectées. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
