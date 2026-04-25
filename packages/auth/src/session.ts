/**
 * Augmentation des types de session Auth.js v5 pour porter les champs
 * EduQuiz spécifiques (rôle, locale, état du compte).
 *
 * Ce module ne déclare que des types et de petits helpers de mapping
 * — il ne fait aucun import runtime non Edge-safe, ce qui permet de
 * l'importer aussi bien depuis le runtime Node que depuis le middleware
 * Edge.
 */

import type { Locale, UserRole } from '@eduquiz/db';

/**
 * Champs additionnels portés par notre session. Le type `User` natif
 * d'Auth.js expose déjà `id`, `name`, `email`, `image` ; on y ajoute
 * les champs métier via module augmentation ci-dessous.
 */
export interface AuthSessionUserExtras {
  readonly role: UserRole;
  readonly locale: Locale;
  readonly emailVerifiedAt: Date | null;
  readonly disabledAt: Date | null;
  readonly deletedAt: Date | null;
}

/**
 * Forme finale de `session.user` une fois augmenté. Toujours préférer
 * `AuthSessionUser` à `Session['user']` directement pour bénéficier de
 * la documentation et de l'auto-complétion sur les extras.
 */
export interface AuthSessionUser extends AuthSessionUserExtras {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly image: string | null;
}

/**
 * Augmentation du module `next-auth`. Voir
 * https://authjs.dev/getting-started/typescript pour le pattern.
 */
declare module 'next-auth' {
  interface Session {
    user: AuthSessionUser;
  }

  // Ajout sur le type `User` (utilisé par les callbacks et l'adapter)
  // pour que `signIn` et `jwt` voient les extras.
  interface User extends Partial<AuthSessionUserExtras> {
    id?: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT extends Partial<AuthSessionUserExtras> {
    sub?: string;
  }
}
