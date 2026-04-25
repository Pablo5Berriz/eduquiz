/**
 * Email de réinitialisation de mot de passe — bilingue FR/EN.
 *
 * Cohérent avec le TTL `reset-password` défini dans
 * `@eduquiz/auth/tokens` (1 h). Le message d'avertissement « ignorer
 * si vous n'avez rien demandé » est important pour la sécurité : un
 * utilisateur dont l'email est cible d'une attaque doit comprendre
 * qu'il n'a rien à faire pour s'en protéger.
 */

import { type Locale } from '@eduquiz/i18n';

import type { EmailMessage } from '../sender.js';

export interface ResetPasswordEmailInput {
  readonly to: string;
  readonly locale: Locale;
  /** URL absolue du lien de reset (avec le token dans le path). */
  readonly resetUrl: string;
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
    subject: 'Réinitialise ton mot de passe EduQuiz',
    preheader: 'Lien valide 1 heure. Ignore si tu n’as rien demandé.',
    greeting: 'Demande de nouveau mot de passe',
    body: "Tu as demandé à réinitialiser ton mot de passe EduQuiz. Clique sur le bouton ci-dessous pour en choisir un nouveau.",
    cta: 'Choisir un nouveau mot de passe',
    fallback: 'Le bouton ne fonctionne pas ? Copie-colle ce lien dans ton navigateur :',
    validity: 'Ce lien expire dans 1 heure et ne peut être utilisé qu’une seule fois.',
    ignored:
      "Tu n'as pas demandé de réinitialisation ? Ignore simplement ce message — ton mot de passe actuel reste inchangé.",
    footer: '— L’équipe EduQuiz',
  },
  en: {
    subject: 'Reset your EduQuiz password',
    preheader: 'Link valid for 1 hour. Ignore if you did not request it.',
    greeting: 'Password reset request',
    body: 'You requested to reset your EduQuiz password. Click the button below to pick a new one.',
    cta: 'Choose a new password',
    fallback: 'Button not working? Copy-paste this link into your browser:',
    validity: 'This link expires in 1 hour and can only be used once.',
    ignored:
      'You did not request a reset? Just ignore this message — your current password stays unchanged.',
    footer: '— The EduQuiz team',
  },
};

export function buildResetPasswordEmail(input: ResetPasswordEmailInput): EmailMessage {
  const c = COPY[input.locale];

  const text = [
    c.greeting,
    '',
    c.body,
    '',
    `${c.cta}: ${input.resetUrl}`,
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
            <a href="${input.resetUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">${escapeHtml(c.cta)}</a>
          </p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0 0 8px 0;">${escapeHtml(c.fallback)}</p>
          <p style="font-size:13px;line-height:1.5;word-break:break-all;margin:0 0 24px 0;"><a href="${input.resetUrl}" style="color:#1d4ed8;">${input.resetUrl}</a></p>
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
