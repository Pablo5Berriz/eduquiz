# Statut d'implémentation — EduQuiz

Dernière mise à jour : 2026-05-05. (EMA mastery, tests Vitest submitQuizAttempt,
E2E découplé, TRUE_FALSE exercices guidés)

Ce document distingue la vision cible décrite dans les autres documents de
l'état réellement livré dans le dépôt. Il doit primer lorsqu'une page de doc
historique annonce une phase comme "terminée" sans nuance.

## Synthèse

EduQuiz dispose aujourd'hui d'un socle technique sérieux, d'une première surface
web adulte utilisable et d'un premier parcours pédagogique bout en bout. Le
produit n'est toutefois pas encore une V1 pédagogique complète : le coeur
éducatif existe en version minimale, mais les exercices avancés, la qualité
éditoriale des contenus, les tableaux de bord et les tests de parcours réels
restent à livrer.

| Domaine                 | Statut            | Commentaire                                                                                                                                                                                                                                                      |
| ----------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo pnpm/Turborepo | Livré             | Structure `apps/*` et `packages/*` en place.                                                                                                                                                                                                                     |
| Web Next.js public      | Livré partiel     | Vitrine, pages légales, matières/niveaux statiques ou semi-statiques.                                                                                                                                                                                            |
| Mobile Expo             | Squelette         | `_layout.tsx` et écran d'accueil seulement.                                                                                                                                                                                                                      |
| Auth adulte             | Livré partiel     | Credentials, vérification email, reset password, profil, paramètres.                                                                                                                                                                                             |
| Auth parent/mineur      | Non commencé      | UI partiellement préparée, flux de rattachement non livré.                                                                                                                                                                                                       |
| Sessions                | Livré avec nuance | Auth.js en JWT avec validation serveur via `User.sessionVersion`; les anciennes mentions "sessions DB révocables" sont obsolètes.                                                                                                                                |
| Loi 25                  | Partiel           | Consentement adulte, export JSON, soft delete, audit et **purge cron** livrés. Manque : export asynchrone/PDF, EFVP, registre incidents, validations juridiques.                                                                                                 |
| RLS                     | Livré partiel     | Politiques et helpers existent; `withUser` est désormais appelé dans toutes les routes d'apprentissage (`getAttemptResult`, `getQuizAttemptHistory`, `getLearnerLearningOverview`, `submitQuizAttempt`). Les routes admin et l'export Loi 25 restent à vérifier. |
| Catalogue pédagogique   | Livré minimal     | Mini-catalogue seedé et espace authentifié `/apprendre` connecté à la DB.                                                                                                                                                                                        |
| Leçons                  | Livré minimal     | Lecteur simple de leçon publiée avec contenu structuré `bodyFr/bodyEn`, compétences, objectifs et accès au quiz.                                                                                                                                                 |
| Exercices               | Livré minimal     | Exercices guidés `MCQ_SINGLE` et `TRUE_FALSE` affichés dans la page leçon avec feedback immédiat. `TRUE_FALSE` : boutons Vrai/Faux (plus radio). Les autres types restent à exposer.                                                                             |
| Quiz                    | Livré minimal     | `MCQ_SINGLE` et `TRUE_FALSE`, scoring, erreurs de soumission affichées, tentative immuable et résultat visible.                                                                                                                                                  |
| Progression             | Livré minimal     | Mise à jour de `Progress` par compétence et carte de progression visible dans `/apprendre`.                                                                                                                                                                      |
| Gamification            | Non livré         | Tables préparées, pas d'expérience.                                                                                                                                                                                                                              |
| Paiement Stripe         | Non livré         | Variables/infra prévues, intégration absente.                                                                                                                                                                                                                    |
| CI                      | Livré partiel     | Lint/typecheck/test/build sont câblés; e2e web minimal ajouté; mobile reste largement placeholder.                                                                                                                                                               |
| Tests                   | Partiel           | Tests unitaires auth/email/rate-limit + scoring + mastery EMA + submitQuizAttempt (11 cas). Playwright découplé du seed. Maestro mobile absent.                                                                                                                  |
| Infra Docker/Proxmox    | Préparé           | Compose dev/prod, Traefik, MinIO, Redis, Postgres, backup; validation production réelle à faire.                                                                                                                                                                 |

## Ce qui est réellement utilisable

- Visiter la vitrine publique bilingue.
- Créer un compte adulte.
- Vérifier un email.
- Se connecter avec credentials.
- Réinitialiser un mot de passe.
- Modifier son profil et sa langue.
- Demander un export JSON de données.
- Demander une suppression de compte avec délai de grâce.
- Ouvrir `/fr/apprendre` ou `/en/apprendre` après connexion.
- Lire une leçon publiée issue de la DB avec contenu structuré.
- Répondre à un exercice guidé non noté avec feedback immédiat.
- Répondre à un quiz QCM single-answer ou vrai/faux.
- Voir une erreur claire si un quiz est incomplet ou impossible à soumettre.
- Enregistrer une tentative et consulter son résultat.
- Consulter l'historique des tentatives depuis la leçon concernée.
- Mettre à jour une progression minimale par compétence.
- Consulter une carte de progression par compétence.
- Consulter les dernières tentatives depuis l'espace apprenant.

## Ce qui est seulement préparé

- Les types d'exercices avancés dans Prisma.
- Les politiques RLS et helpers d'isolation.
- L'infrastructure self-hosted.
- Le plan parent/mineur.
- La future monétisation.
- La majorité des écrans décrits dans les wireframes.

## Prochain lot recommandé

Le prochain lot doit solidifier ce premier parcours pédagogique minimal avant
paiement, gamification ou dashboard parent.

Objectif : passer d'un flux fonctionnel à un flux fiable, observable et
testable.

Livrables recommandés :

1. Renforcer Playwright : couvrir les erreurs quiz, l'historique de tentative et
   au moins un viewport mobile.
2. Support produit des autres types d'exercices (`MCQ_MULTI`,
   `FILL_IN_THE_BLANK`, `MATCHING`, `ORDERING`, `SHORT_ANSWER`) et exposition de
   `TRUE_FALSE` dans les exercices guidés.
3. Élargissement éditorial : plus de matières, plus de niveaux, relecture
   pédagogique des contenus seedés.

## Règle de documentation

Les documents de vision (`00` à `08`) peuvent décrire la cible, mais toute
affirmation du type "livré", "terminé", "Phase complète" doit être vérifiée
contre ce fichier. Si le code change le statut réel d'un domaine, ce document
doit être mis à jour dans la même PR.
