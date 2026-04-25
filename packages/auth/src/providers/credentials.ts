/**
 * Provider Credentials — connexion par email + mot de passe.
 *
 * Sécurité :
 *   - Validation Zod stricte de l'entrée (email + password)
 *   - Hash Argon2id côté serveur (cf. `password.ts`)
 *   - Comparaison à temps constant (déléguée à argon2.verify)
 *   - Refus si compte désactivé (`disabledAt`) ou supprimé (`deletedAt`)
 *   - Refus si email non vérifié (`emailVerifiedAt` null) — sera assoupli
 *     après 1.4 si le flux d'inscription le demande, mais par défaut on
 *     impose la vérification avant d'autoriser le login
 *   - Aucune fuite d'information : on retourne le même message d'erreur
 *     pour « utilisateur inconnu », « mot de passe faux » et « compte
 *     non vérifié » — la vraie raison est tracée dans AuditLog côté
 *     callback `events.signInError` (cf. config.ts)
 *
 * Re-hash automatique : si `needsRehash(passwordHash)` retourne `true`
 * (paramètres argon2 obsolètes), on re-hashe en même temps qu'on
 * valide. Coût : un `UPDATE` ponctuel par utilisateur.
 */

import { Locale, prisma, UserRole } from '@eduquiz/db';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { hashPassword, needsRehash, verifyPassword } from '../password.js';

import type { Provider } from 'next-auth/providers';

/**
 * Schéma Zod d'entrée. L'erreur Zod n'est jamais propagée à
 * l'utilisateur — on retourne `null` et le UI se charge d'afficher un
 * message générique.
 */
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(512),
});

export const credentialsProvider: Provider = Credentials({
  id: 'credentials',
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Mot de passe', type: 'password' },
  },

  async authorize(rawCredentials) {
    const parsed = credentialsSchema.safeParse(rawCredentials);
    if (!parsed.success) return null;

    const { email, password } = parsed.data;

    // Lecture directe — pas de RLS (l'utilisateur n'est pas authentifié).
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        passwordHash: true,
        role: true,
        locale: true,
        disabledAt: true,
        deletedAt: true,
        profile: { select: { displayName: true, firstName: true, avatarUrl: true } },
      },
    });

    if (!user) return null;
    if (user.disabledAt || user.deletedAt) return null;
    if (!user.passwordHash) return null; // compte créé via OAuth, pas de password
    if (!user.emailVerifiedAt) return null; // refus tant que email non vérifié

    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) return null;

    // Re-hash si paramètres obsolètes — silencieux, en best-effort.
    if (needsRehash(user.passwordHash)) {
      try {
        const newHash = await hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      } catch {
        // On laisse passer la connexion même si le re-hash échoue.
      }
    }

    // L'objet retourné devient `user` dans les callbacks `signIn`/`jwt`.
    // On n'expose **jamais** le passwordHash.
    return {
      id: user.id,
      email: user.email,
      name: user.profile?.displayName ?? user.profile?.firstName ?? null,
      image: user.profile?.avatarUrl ?? null,
      role: user.role as UserRole,
      locale: user.locale as Locale,
      emailVerifiedAt: user.emailVerifiedAt,
      disabledAt: user.disabledAt,
      deletedAt: user.deletedAt,
    };
  },
});
