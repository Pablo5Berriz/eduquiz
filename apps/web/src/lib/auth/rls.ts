/**
 * Wrapper ergonomique pour ouvrir une transaction Prisma scopée RLS
 * dans une Server Action ou un Route Handler.
 *
 * Combine :
 *   - `requireApiUser()` : lève UnauthenticatedError si pas connecté
 *   - `withUser({ userId, role })` de @eduquiz/db : ouvre une
 *     transaction Postgres et positionne `app.current_user_id` /
 *     `app.current_role` lus par les politiques RLS
 *
 * Usage :
 *
 * ```ts
 * 'use server';
 * import { withAuthenticatedDb } from '@/lib/auth/rls';
 *
 * export async function loadMyAttempts() {
 *   return withAuthenticatedDb(async (tx, ctx) => {
 *     return tx.attempt.findMany({ where: { userId: ctx.userId } });
 *   });
 * }
 * ```
 *
 * **Quand l'utiliser** : pour toute opération qui touche à des données
 * partagées entre utilisateurs (Lots 5+ : tentatives, progression,
 * commentaires, etc.). Tant qu'on opère uniquement sur le compte propre
 * (étapes 1.4-1.6), un `prisma` direct suffit — RLS ne couvre pas
 * `User`, `Profile`, `Account`, `Session` qui sont gérés par Auth.js.
 */

import { withUser, type Prisma, type RlsContext, type RlsRole } from '@eduquiz/db';

import { requireApiUser } from './server';

export interface WithAuthenticatedDbOptions {
  readonly maxWait?: number;
  readonly timeout?: number;
  readonly isolationLevel?: Prisma.TransactionIsolationLevel;
  /**
   * Optionnel : `requestId` à propager dans `app.current_request_id`
   * pour corréler logs ↔ AuditLog ↔ traces.
   */
  readonly requestId?: string;
}

export async function withAuthenticatedDb<T>(
  fn: (tx: Prisma.TransactionClient, ctx: RlsContext) => Promise<T>,
  options: WithAuthenticatedDbOptions = {},
): Promise<T> {
  const user = await requireApiUser();
  const ctx: RlsContext = {
    userId: user.id,
    role: user.role as RlsRole,
  };
  if (options.requestId !== undefined) {
    Object.assign(ctx, { requestId: options.requestId });
  }
  const transactionOptions: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  } = {};
  if (options.maxWait !== undefined) transactionOptions.maxWait = options.maxWait;
  if (options.timeout !== undefined) transactionOptions.timeout = options.timeout;
  if (options.isolationLevel !== undefined) transactionOptions.isolationLevel = options.isolationLevel;
  return withUser(ctx).$transaction((tx) => fn(tx, ctx), transactionOptions);
}
