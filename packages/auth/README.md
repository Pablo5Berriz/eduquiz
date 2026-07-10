# @eduquiz/auth

Backbone Auth.js v5 du monorepo EduQuiz : adapter Prisma, providers, helpers
serveur (rôles, mots de passe Argon2id, tokens de vérification).

Étape 1.3 du plan de livraison : **plomberie seulement**, aucune UI. Les écrans
inscription/connexion/reset password arrivent en 1.4/1.5.

## Architecture

Auth.js v5 + Next.js 14 oblige à séparer la config en deux variantes :

- `@eduquiz/auth` (Node) — config complète : adapter Prisma, provider
  Credentials (Argon2id), providers OAuth (Google, Apple), events `signIn` /
  `signOut` qui logent dans `AuditLog`.
- `@eduquiz/auth/edge` (Edge-safe) — config minimaliste sans adapter ni
  Credentials, dédiée au middleware Next.js (qui tourne sur Edge runtime où
  Prisma et `argon2` ne tournent pas).

## Modules publics

| Import                      | Contenu                                                |
| --------------------------- | ------------------------------------------------------ |
| `@eduquiz/auth`             | `authConfig`, `adapter`, types de session              |
| `@eduquiz/auth/edge`        | `authConfigEdge` pour le middleware                    |
| `@eduquiz/auth/env`         | `getAuthEnv()`, `isProviderConfigured()`               |
| `@eduquiz/auth/password`    | `hashPassword`, `verifyPassword`, `needsRehash`        |
| `@eduquiz/auth/tokens`      | `createToken`, `consumeToken`, `peekToken`             |
| `@eduquiz/auth/permissions` | `requireUser`, `requireRole`, `isAdmin`, `isParent`... |

## Variables d'environnement

Voir `.env.example` à la racine du repo. Toutes les variables `AUTH_*` sont
validées au boot par un schéma Zod (`env.ts`). Démarrage refusé si `AUTH_SECRET`
est absent ou trop court (< 32 caractères).

| Variable             | Obligatoire | Défaut  | Notes                                    |
| -------------------- | ----------- | ------- | ---------------------------------------- |
| `AUTH_SECRET`        | oui         | —       | ≥ 32 char ; `openssl rand -base64 33`    |
| `AUTH_URL`           | oui         | —       | URL canonique publique                   |
| `AUTH_TRUST_HOST`    | non         | `true`  | `true` derrière reverse proxy            |
| `AUTH_GOOGLE_ID`     | non         | vide    | Active Google si renseigné (avec SECRET) |
| `AUTH_GOOGLE_SECRET` | non         | vide    | Idem                                     |
| `AUTH_APPLE_ID`      | non         | vide    | Active Apple si renseigné (Service ID)   |
| `AUTH_APPLE_SECRET`  | non         | vide    | JWT signé avec la clé privée Apple .p8   |
| `AUTH_DEBUG`         | non         | `false` | Verbose Auth.js (jamais en prod)         |

## Stratégie de session

Côté Node (vrai signin/signout) : **stratégie `database`** — sessions persistées
dans la table `sessions`, ce qui permet la révocation immédiate (déconnexion
forcée admin, expiration Loi 25), l'audit IP/UA et la cohérence avec RLS.

Côté Edge (middleware) : **stratégie `jwt`** — le middleware ne peut pas parler
à Prisma, il lit donc un JWT signé porté par le cookie de session. Les valeurs
du JWT sont rafraîchies à chaque cycle Node (signin, refresh de session
quotidien). Conséquence : un changement de rôle prend effet au prochain refresh
(≤ 24 h) ou à la prochaine connexion.

## Sécurité

- **Mots de passe** : Argon2id, paramètres OWASP 2024 (m=19456 KiB, t=2, p=1).
  Re-hash automatique au login si paramètres obsolètes.
- **Tokens** : 256 bits aléatoires (`crypto.randomBytes(32)`), encodés
  base64url, à usage unique, suppression atomique en transaction.
- **Cookies** : `__Secure-eduquiz.session-token` en prod (`Secure`, `httpOnly`,
  `SameSite=Lax`).
- **Loi 25** : refus de connexion si `disabledAt` ou `deletedAt` non null. Tous
  les `signIn` et `signOut` tracés dans `AuditLog` (table append-only, triggers
  Postgres bloquent UPDATE/DELETE).
- **Rate limiting** : non présent en 1.3 — ajouté en 1.7 (bucket Redis dans
  `events.signIn` + Credentials authorize).

## Pas implémenté en 1.3

- Écrans inscription / connexion / reset password (1.4-1.5)
- Espace authentifié et UI de profil (1.6)
- Limitation tentatives Redis (1.7)
- Adapter mobile Expo
- Provider Email magic link (préparé via tokens, non câblé)
