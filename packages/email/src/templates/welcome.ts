/**
 * Email de bienvenue — envoyé après confirmation d'adresse.
 *
 * Garde un format ultra simple : un mot de bienvenue, un CTA vers la
 * page de connexion (et plus tard vers le tableau de bord). Best-effort
 * : si l'envoi échoue, le flux d'inscription continue sans le bloquer.
 */

import { type Locale } from '@eduquiz/i18n';

import type { EmailMessage } from '../sender.js';

export interface WelcomeEmailInput {
  readonly to: string;
  readonly locale: Locale;
  /** URL absolue de la page de connexion. */
  readonly signInUrl: string;
}

interface Copy {
  subject: string;
  greeting: string;
  body: string;
  cta: string;
  footer: string;
}

const COPY: Record<Locale, Copy> = {
  fr: {
    subject: 'Ton compte EduQuiz est prêt 🎉',
    greeting: 'Bienvenue parmi nous !',
    body: "Ton adresse courriel est confirmée et ton compte est actif. Tu peux maintenant te connecter et commencer à explorer le programme québécois.",
    cta: 'Me connecter',
    footer: '— L’équipe EduQuiz',
  },
  en: {
    subject: 'Your EduQuiz account is ready 🎉',
    greeting: 'Welcome aboard!',
    body: 'Your email is confirmed and your account is active. You can now sign in and start exploring the Quebec curriculum.',
    cta: 'Sign in',
    footer: '— The EduQuiz team',
  },
};

export function buildWelcomeEmail(input: WelcomeEmailInput): EmailMessage {
  const c = COPY[input.locale];
  const text = [c.greeting, '', c.body, '', `${c.cta}: ${input.signInUrl}`, '', c.footer].join('\n');

  const html = `<!doctype html>
<html lang="${input.locale}">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <tr>
        <td style="padding:32px;">
          <h1 style="font-size:22px;margin:0 0 16px 0;">${escapeHtml(c.greeting)}</h1>
          <p style="font-size:16px;line-height:1.5;margin:0 0 24px 0;">${escapeHtml(c.body)}</p>
          <p style="margin:0 0 24px 0;">
            <a href="${input.signInUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">${escapeHtml(c.cta)}</a>
          </p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0;">${escapeHtml(c.footer)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { to: input.to, subject: c.subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
