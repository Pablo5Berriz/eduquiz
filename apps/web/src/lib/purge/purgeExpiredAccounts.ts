/**
 * Purge des comptes après délai de grâce — conformité Loi 25 (Québec).
 *
 * Lorsqu'un utilisateur demande la suppression de son compte, la Server
 * Action `deleteAccount` marque `User.disabledAt` et crée un
 * `DataRequest(kind=DELETION, status=AWAITING_GRACE_PERIOD, graceExpiresAt=+30j)`.
 * Cette fonction est appelée quotidiennement par le cron Proxmox via
 * `/api/cron/purge-accounts` et exécute l'effacement réel des données
 * personnelles une fois le délai écoulé.
 *
 * Stratégie d'anonymisation (pas de hard-delete User) :
 *   Le schéma contraint l'effacement direct de la ligne User :
 *   - `ConsentRecord → onDelete: Restrict` — la DB rejette le DELETE si des
 *     consentements existent.
 *   - `DataRequest → onDelete: Cascade` — supprimer User supprimerait la
 *     piste d'audit Loi 25 (contre-productif).
 *
 *   On anonymise donc la ligne User (PII effacées, ID conservé pour les FK)
 *   et on hard-delete les tables portant les PII pédagogiques (Profile,
 *   Account OAuth, Sessions résiduelles).
 *
 * Traitement par transaction individuelle : une erreur sur un utilisateur
 * n'empêche pas le traitement des suivants.
 */

import {
  AuditEventKind,
  DataRequestKind,
  DataRequestStatus,
  prisma,
} from '@eduquiz/db';

import { logger } from '../logger';

export interface PurgeResult {
  /** Nombre de comptes purgés avec succès. */
  readonly purged: number;
  /** Nombre d'erreurs rencontrées (les comptes concernés restent inchangés). */
  readonly errors: number;
}

/**
 * Purge tous les comptes dont `DataRequest.graceExpiresAt <= now`.
 *
 * Pour chaque compte expiré (dans sa propre transaction) :
 *   1. Anonymise `User` : email → `deleted-{id}@purged.invalid`, passwordHash → null,
 *      `deletedAt = now`, `sessionVersion++`
 *   2. Hard-delete `Profile` (prénom, nom, date de naissance)
 *   3. Hard-delete `Account` (liens OAuth non supprimés lors de la demande initiale)
 *   4. Hard-delete `Session` résiduelles (défense en profondeur)
 *   5. `DataRequest.status → COMPLETED`, `completedAt = now`
 *   6. Append `AuditLog(DATA_DELETION_EXECUTED)` — piste immuable Loi 25
 *
 * @param now - Instant de référence (injectable pour les tests).
 */
export async function purgeExpiredAccounts(now = new Date()): Promise<PurgeResult> {
  const expired = await prisma.dataRequest.findMany({
    where: {
      kind: DataRequestKind.DELETION,
      status: DataRequestStatus.AWAITING_GRACE_PERIOD,
      graceExpiresAt: { lte: now },
    },
    select: { id: true, userId: true },
  });

  if (expired.length === 0) {
    logger.info('purge.no_expired_accounts', {});
    return { purged: 0, errors: 0 };
  }

  logger.info('purge.start', { count: expired.length });

  let purged = 0;
  let errors = 0;

  for (const req of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Anonymiser le compte — effacement des PII portées par User.
        //    L'email doit rester @unique : on utilise l'UUID comme discriminant.
        await tx.user.update({
          where: { id: req.userId },
          data: {
            email: `deleted-${req.userId}@purged.invalid`,
            passwordHash: null,
            deletedAt: now,
            // sessionVersion++ invalide tout JWT encore en circulation.
            sessionVersion: { increment: 1 },
          },
        });

        // 2. Supprimer le profil — toutes les PII pédagogiques.
        await tx.profile.deleteMany({ where: { userId: req.userId } });

        // 3. Supprimer les comptes OAuth.
        //    (non supprimés lors de la demande de suppression car ils ne
        //    portent pas de session active, mais ils contiennent des tokens)
        await tx.account.deleteMany({ where: { userId: req.userId } });

        // 4. Sessions résiduelles.
        //    Normalement déjà supprimées à la demande, mais on nettoie
        //    par défense en profondeur au cas où une session s'est recréée.
        await tx.session.deleteMany({ where: { userId: req.userId } });

        // 5. Clôturer le DataRequest — piste administrative.
        await tx.dataRequest.update({
          where: { id: req.id },
          data: {
            status: DataRequestStatus.COMPLETED,
            completedAt: now,
          },
        });

        // 6. AuditLog immuable — preuve d'exécution pour Loi 25.
        //    actorId = null : l'exécuteur est le système (cron), pas un humain.
        //    targetId conservé : pointe vers la ligne User anonymisée.
        await tx.auditLog.create({
          data: {
            kind: AuditEventKind.DATA_DELETION_EXECUTED,
            actorId: null,
            targetId: req.userId,
            targetType: 'user',
            payload: { dataRequestId: req.id } as never,
          },
        });
      });

      logger.info('purge.account_purged', {
        userId: req.userId,
        dataRequestId: req.id,
      });
      purged++;
    } catch (err) {
      logger.error('purge.account_error', {
        userId: req.userId,
        dataRequestId: req.id,
        error: err instanceof Error ? err.message : String(err),
      });
      errors++;
    }
  }

  logger.info('purge.done', { purged, errors });
  return { purged, errors };
}
