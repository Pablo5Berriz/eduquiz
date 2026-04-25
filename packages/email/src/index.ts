/**
 * Point d'entrée du paquet @eduquiz/email.
 *
 * Expose :
 *   - `sendEmail`             : envoi générique (nodemailer + SMTP)
 *   - `buildVerificationEmail`: template du lien de confirmation
 *   - `buildWelcomeEmail`     : template post-vérification
 *   - `getEmailEnv`           : validation Zod des SMTP_*
 *
 * Les templates sont des fonctions pures qui retournent un
 * `EmailMessage` ; les passer ensuite à `sendEmail()` pour l'envoi.
 * Cette séparation rend les templates triviaux à tester sans mock SMTP.
 */

export { sendEmail, type EmailMessage } from './sender.js';
export { buildVerificationEmail, type VerificationEmailInput } from './templates/verification.js';
export { buildWelcomeEmail, type WelcomeEmailInput } from './templates/welcome.js';
export { buildResetPasswordEmail, type ResetPasswordEmailInput } from './templates/reset-password.js';
export { getEmailEnv, type EmailEnv } from './env.js';
