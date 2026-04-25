# @eduquiz/email

Envoi d'emails transactionnels EduQuiz : vérification d'adresse,
bienvenue, reset password (à venir 1.5). Wrapper minimaliste autour de
`nodemailer` + templates HTML bilingues FR/EN.

## Templates disponibles

| Helper                       | Usage                                      |
| ---------------------------- | ------------------------------------------ |
| `buildVerificationEmail`     | Lien de confirmation post-inscription      |
| `buildWelcomeEmail`          | Confirmation de compte activé              |

Tous les templates sont des fonctions pures `(input) => EmailMessage`.
Pour l'envoi, passer le résultat à `sendEmail()`.

```ts
import { buildVerificationEmail, sendEmail } from '@eduquiz/email';

await sendEmail(
  buildVerificationEmail({
    to: 'user@example.com',
    locale: 'fr',
    verifyUrl: 'https://eduquiz.ca/fr/verification-email/confirme/abc123',
  }),
);
```

## Variables d'environnement

| Variable        | Obligatoire | Défaut          | Notes                                      |
| --------------- | ----------- | --------------- | ------------------------------------------ |
| `SMTP_HOST`     | oui         | —               | `localhost` en dev (MailHog)               |
| `SMTP_PORT`     | non         | `25`            | `1025` pour MailHog, `587` pour SES STARTTLS |
| `SMTP_USER`     | non         | vide            | Auth si renseigné avec `SMTP_PASSWORD`     |
| `SMTP_PASSWORD` | non         | vide            | Idem                                       |
| `SMTP_SECURE`   | non         | `false`         | `true` pour SMTPS port 465                 |
| `SMTP_FROM`     | oui         | —               | RFC 5322, p.ex. `EduQuiz <no-reply@…>`     |

## Dev local — MailHog

`docker-compose.dev.yml` lance MailHog. Tous les emails envoyés depuis
les apps en dev pointent dessus :

- SMTP : `localhost:1025`
- UI    : `http://localhost:8025`

## Pas implémenté

- Reset password (1.5)
- Notification parent (Lots 10-11)
- React Email / templates avancés (différé jusqu'à un vrai besoin)
