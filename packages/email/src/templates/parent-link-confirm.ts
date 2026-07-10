/**
 * Template de l'email de confirmation de rattachement parent ↔ enfant.
 *
 * Envoyé au parent après que l'enfant a saisi le code d'invitation.
 * Le parent clique sur le CTA pour valider définitivement le lien.
 */

import { type Locale } from '@eduquiz/i18n';

import type { EmailMessage } from '../sender.js';

export interface ParentLinkConfirmEmailInput {
  readonly to: string;
  readonly locale: Locale;
  /** Email du compte mineur qui a saisi le code. */
  readonly childEmail: string;
  /** URL absolue de confirmation (contient le token 32 bytes). */
  readonly confirmUrl: string;
}

interface Copy {
  subject: string;
  preheader: string;
  greeting: string;
  body: string;
  cta: string;
  fallback: string;
  validity: string;
  notYou: string;
  footer: string;
}

const COPY: Record<Locale, Copy> = {
  fr: {
    subject: 'Confirme le rattachement de ton enfant',
    preheader: "Un élève a saisi ton code d'invitation EduQuiz.",
    greeting: 'Bonjour,',
    body: "Le compte élève {childEmail} a saisi ton code d'invitation EduQuiz. Clique ci-dessous pour confirmer le rattachement et activer la supervision.",
    cta: 'Confirmer le rattachement',
    fallback: 'Le bouton ne fonctionne pas ? Copie-colle ce lien dans ton navigateur :',
    validity: 'Ce lien expire dans 24 heures.',
    notYou:
      "Tu n'es pas à l'origine de cette invitation ? Ignore ce message — aucune action n'est requise.",
    footer: "— L'équipe EduQuiz",
  },
  en: {
    subject: "Confirm your child's account link",
    preheader: 'A student entered your EduQuiz invitation code.',
    greeting: 'Hello,',
    body: 'Student account {childEmail} entered your EduQuiz invitation code. Click below to confirm the link and enable supervision.',
    cta: 'Confirm the link',
    fallback: 'Button not working? Copy-paste this link into your browser:',
    validity: 'This link expires in 24 hours.',
    notYou: "Didn't create this invitation? Just ignore this message — no action required.",
    footer: '— The EduQuiz team',
  },
};

export function buildParentLinkConfirmEmail(input: ParentLinkConfirmEmailInput): EmailMessage {
  const c = COPY[input.locale];
  const body = c.body.replace('{childEmail}', input.childEmail);

  const text = [
    c.greeting,
    '',
    body,
    '',
    `${c.cta}: ${input.confirmUrl}`,
    '',
    c.validity,
    c.notYou,
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
          <p style="font-size:16px;line-height:1.5;margin:0 0 8px 0;">${escapeHtml(c.greeting)}</p>
          <p style="font-size:16px;line-height:1.5;margin:0 0 24px 0;">${escapeHtml(body)}</p>
          <p style="margin:0 0 32px 0;">
            <a href="${input.confirmUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">${escapeHtml(c.cta)}</a>
          </p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0 0 8px 0;">${escapeHtml(c.fallback)}</p>
          <p style="font-size:13px;line-height:1.5;word-break:break-all;margin:0 0 24px 0;"><a href="${input.confirmUrl}" style="color:#1d4ed8;">${input.confirmUrl}</a></p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0 0 4px 0;">${escapeHtml(c.validity)}</p>
          <p style="font-size:13px;line-height:1.5;color:#475569;margin:0 0 16px 0;">${escapeHtml(c.notYou)}</p>
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
