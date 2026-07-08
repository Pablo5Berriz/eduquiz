/**
 * Configuration Auth.js v5 complète, runtime Node.js.
 *
 * Compose la base Edge-safe (`config-edge.ts`) avec :
 *   - L'adapter Prisma (utilisateurs/comptes/tokens persistés en DB)
 *   - Le provider Credentials (qui touche à la DB)
 *   - Les providers OAuth (Google, Apple) si configurés
 *   - Les events `signIn`/`signOut`/`signInError` qui logent dans
 *     `AuditLog` (table append-only) — Phase 1.7 enrichira avec une
 *     limitation de débit Redis.
 *
 * Ce module ne doit JAMAIS être importé depuis le middleware ou un
 * runtime Edge — il importe Prisma et Argon2, qui sont incompatibles.
 */

import { AuditEventKind, prisma } from '@eduquiz/db';

import { adapter } from './adapter.js';
import { authConfigEdge } from './config-edge.js';
import { getAuthEnv, isProviderConfigured } from './env.js';
import { appleProvider } from './providers/apple.js';
import { credentialsProvider } from './providers/credentials.js';
import { googleProvider } from './providers/google.js';

import type { NextAuthConfig } from 'next-auth';
import type { Provider } from 'next-auth/providers';

/**
 * Construit la liste des providers à activer en fonction de la config.
 * Credentials est toujours présent ; les OAuth sont conditionnels.
 */
function buildProviders(): Provider[] {
  const env = getAuthEnv();
  const providers: Provider[] = [credentialsProvider];
  if (isProviderConfigured(env, 'google')) providers.push(googleProvider(env));
  if (isProviderConfigured(env, 'apple')) providers.push(appleProvider(env));
  return providers;
}

/**
 * Logger d'événements d'authentification dans `AuditLog`. Best-effort :
 * une erreur ici ne doit pas bloquer le flux d'auth. La table est
 * append-only (triggers Postgres bloquent UPDATE/DELETE).
 */
async function logAudit(
  kind: AuditEventKind,
  actorId: string | null,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        kind,
        actorId,
        payload: payload as never,
      },
    });
  } catch {
    // L'audit ne doit pas bloquer l'authentification.
  }
}

export const authConfig: NextAuthConfig = {
  ...authConfigEdge,
  adapter,
  session: {
    // Credentials ne persiste pas la session en DB par défaut. On garde
    // donc JWT et on force la révocation serveur via User.sessionVersion.
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  providers: buildProviders(),

  // Hooks de cycle de vie. Tracés dans AuditLog. L'enum n'expose que
  // SIGNIN/SIGNOUT/FAILED/PASSWORD_RESET en V1 — la création de compte
  // et le link d'OAuth seront tracés à part en 1.4 (avec extension de
  // l'enum si nécessaire).
  events: {
    async signIn({ user, account }) {
      const actorId = typeof user.id === 'string' ? user.id : null;
      await logAudit(AuditEventKind.AUTH_SIGNIN, actorId, {
        provider: account?.provider ?? 'credentials',
      });
    },
    async signOut(message) {
      const actorId =
        'session' in message
          ? message.session
            ? message.session.userId
            : null
          : 'token' in message
            ? (message.token?.sub ?? null)
            : null;
      await logAudit(AuditEventKind.AUTH_SIGNOUT, actorId, {});
    },
  },

  debug: getAuthEnv().AUTH_DEBUG,
};
