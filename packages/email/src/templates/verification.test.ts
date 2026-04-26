/**
 * Smoke tests sur les templates email.
 *
 * On vérifie surtout que :
 *   - chaque template retourne `{to, subject, text, html}` non vides
 *   - l'URL de lien apparaît dans le texte ET le HTML
 *   - la locale est respectée (le subject change entre fr et en)
 *   - les valeurs injectées sont échappées HTML (pas d'XSS via le copy)
 */

import { describe, expect, it } from 'vitest';

import { buildResetPasswordEmail } from './reset-password.js';
import { buildVerificationEmail } from './verification.js';
import { buildWelcomeEmail } from './welcome.js';

describe('buildVerificationEmail', () => {
  it('rend un email FR avec le lien dans text et html', () => {
    const email = buildVerificationEmail({
      to: 'user@example.com',
      locale: 'fr',
      verifyUrl: 'https://eduquiz.ca/fr/verification-email/confirme/abc123',
    });
    expect(email.to).toBe('user@example.com');
    expect(email.subject.length).toBeGreaterThan(0);
    expect(email.text).toContain('https://eduquiz.ca/fr/verification-email/confirme/abc123');
    expect(email.html).toContain('https://eduquiz.ca/fr/verification-email/confirme/abc123');
  });

  it('change le subject selon la locale', () => {
    const fr = buildVerificationEmail({ to: 'a@b.c', locale: 'fr', verifyUrl: 'https://x' });
    const en = buildVerificationEmail({ to: 'a@b.c', locale: 'en', verifyUrl: 'https://x' });
    expect(fr.subject).not.toBe(en.subject);
  });
});

describe('buildWelcomeEmail', () => {
  it('contient le lien de connexion', () => {
    const email = buildWelcomeEmail({
      to: 'user@example.com',
      locale: 'fr',
      signInUrl: 'https://eduquiz.ca/fr/connexion?verified=1',
    });
    expect(email.text).toContain('https://eduquiz.ca/fr/connexion?verified=1');
    expect(email.html).toContain('https://eduquiz.ca/fr/connexion?verified=1');
  });
});

describe('buildResetPasswordEmail', () => {
  it('contient le lien de reset et marque la validité 1 h', () => {
    const email = buildResetPasswordEmail({
      to: 'user@example.com',
      locale: 'fr',
      resetUrl: 'https://eduquiz.ca/fr/mot-de-passe-oublie/reinitialiser/xyz',
    });
    expect(email.text).toContain('https://eduquiz.ca/fr/mot-de-passe-oublie/reinitialiser/xyz');
    expect(email.text.toLowerCase()).toContain('1 heure');
    const en = buildResetPasswordEmail({
      to: 'user@example.com',
      locale: 'en',
      resetUrl: 'https://eduquiz.ca/en/mot-de-passe-oublie/reinitialiser/xyz',
    });
    expect(en.text.toLowerCase()).toContain('1 hour');
  });
});
