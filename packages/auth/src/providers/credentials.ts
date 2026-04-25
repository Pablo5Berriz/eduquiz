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

import { AuditEventKind, Locale, prisma, UserRole } from '@eduquiz/db';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { hashPassword, needsRehash, verifyPassword } from '../password.js';

import type { Provider } from 'next-auth/providers';

/**
 * Codes internes de raison d'échec d'authentification, jamais exposés
 * à l'utilisateur. Tracés dans `AuditLog.payload.reason` pour permettre
 * la détection d'attaques (énumération d'emails, credential stuffing)
 * et le rate limiting Redis qui sera ajouté en 1.7.
 */
type FailReason =
  | 'invalid_input'
  | 'unknown_user'
  | 'disabled'
  | 'no_password'
  | 'unverified'
  | 'bad_password';

/**
 * Trace un échec d'authentification. Best-effort : ne bloque jamais le
 * flux. `actorId` est posé si on a réussi à identifier l'utilisateur,
 * `null` sinon (cas `invalid_input` / `unknown_user`).
 */
async function logFailedSignIn(
  reason: FailReason,
  email: string,
  actorId: string | null,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        kind: AuditEventKind.AUTH_FAILED,
        actorId,
        targetType: 'user',
        payload: { reason, email } as never,
      },
    });
  } catch {
    // L'audit ne doit pas bloquer le retour.
  }
}

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
    if (!parsed.success) {
      // Email peut être absent/mal formé — on ne loggue rien d'utile
      // et on ne révèle pas la raison côté UI.
      const emailHint =
        typeof (rawCredentials as { email?: unknown })?.email === 'string'
          ? ((rawCredentials as { email: string }).email).slice(0, 254)
          : '';
      await logFailedSignIn('invalid_input', emailHint, null);
      return null;
    }

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

    if (!user) {
      await logFailedSignIn('unknown_user', email, null);
      return null;
    }
    if (user.disabledAt || user.deletedAt) {
      await logFailedSignIn('disabled', email, user.id);
      return null;
    }
    if (!user.passwordHash) {
      // compte créé via OAuth, pas de password
      await logFailedSignIn('no_password', email, user.id);
      return null;
    }
    if (!user.emailVerifiedAt) {
      // refus tant que email non vérifié
      await logFailedSignIn('unverified', email, user.id);
      return null;
    }

    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      await logFailedSignIn('bad_password', email, user.id);
      return null;
    }

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
