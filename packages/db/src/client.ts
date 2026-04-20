/**
 * PrismaClient singleton + helpers RLS pour EduQuiz.
 *
 * Deux façons de consommer la base :
 *
 * 1. `prisma` (default export + export nommé)
 *    Client partagé, sans contexte utilisateur. Réservé aux tâches
 *    back-office (jobs planifiés, webhooks Stripe, migration de données,
 *    seeds) qui ont légitimement besoin d'ignorer RLS. À n'utiliser JAMAIS
 *    dans un handler HTTP déclenché par un utilisateur sans s'être
 *    explicitement assuré que la route est réservée aux admins.
 *
 * 2. `withUser(userId, role).$transaction(async (tx) => { ... })`
 *    Client scoppé à un utilisateur : ouvre une transaction PostgreSQL
 *    et injecte les variables de session lues par les politiques RLS
 *    (cf. `prisma/rls/00_helpers.sql`). C'est le mode à privilégier dans
 *    toutes les routes Next.js authentifiées.
 */

import { PrismaClient } from './generated/client/index.js';

import type { Prisma } from './generated/client/index.js';

const isProd = process.env.NODE_ENV === 'production';

const createPrismaClient = (): PrismaClient =>
  new PrismaClient({
    log: isProd
      ? [
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ]
      : [
          { level: 'query', emit: 'event' },
          { level: 'info', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ],
    errorFormat: isProd ? 'minimal' : 'pretty',
  });

const globalForPrisma = globalThis as unknown as {
  __eduquizPrisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.__eduquizPrisma ?? createPrismaClient();

if (!isProd) {
  globalForPrisma.__eduquizPrisma = prisma;
}

/**
 * Rôle tel qu'il sera injecté dans `app.current_role` côté PostgreSQL.
 * Aligné sur l'enum `UserRole` mais dupliqué ici pour éviter un import
 * circulaire avec `enums.ts` et pour garder la fonction utilisable sans
 * charger tout le client.
 */
export type RlsRole = 'LEARNER_ADULT' | 'LEARNER_MINOR' | 'PARENT' | 'ADMIN';

export interface RlsContext {
  readonly userId: string;
  readonly role: RlsRole;
  readonly requestId?: string;
}

/**
 * Ouvre une transaction Postgres dans laquelle les variables de session
 * `app.current_user_id`, `app.current_role` et (optionnel)
 * `app.current_request_id` sont positionnées avant l'exécution du callback.
 *
 * Usage typique :
 *
 * ```ts
 * const progress = await withUser({ userId, role }).$transaction(async (tx) => {
 *   return tx.progress.findMany({ where: { userId } });
 * });
 * ```
 *
 * Retourne un objet compatible avec `prisma.$transaction(fn)`. Les options
 * de transaction standard (`maxWait`, `timeout`, `isolationLevel`) sont
 * supportées via le second argument.
 */
export const withUser = (ctx: RlsContext) => ({
  $transaction: <T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> =>
    prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_id', $1, true)`, ctx.userId);
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_role', $1, true)`, ctx.role);
      if (ctx.requestId !== undefined) {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_request_id', $1, true)`,
          ctx.requestId,
        );
      }
      return fn(tx);
    }, options),
});

export type { Prisma } from './generated/client/index.js';
export { PrismaClient } from './generated/client/index.js';
