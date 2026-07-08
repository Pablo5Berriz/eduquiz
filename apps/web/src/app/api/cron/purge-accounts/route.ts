/**
 * Route Handler — Purge des comptes après délai de grâce (Loi 25).
 *
 * Appelé quotidiennement par un timer systemd sur le serveur Proxmox :
 *
 *   curl -sf \
 *     -H "Authorization: Bearer $PURGE_ACCOUNTS_SECRET" \
 *     https://eduquiz.ca/api/cron/purge-accounts
 *
 * Sécurité :
 *   - Protégé par un secret partagé (`PURGE_ACCOUNTS_SECRET` dans .env).
 *   - `runtime = 'nodejs'` : Prisma n'est pas compatible Edge.
 *   - `dynamic = 'force-dynamic'` : pas de cache HTTP (chaque appel est réel).
 *   - L'endpoint est délibérément absent du middleware Auth.js Edge pour ne
 *     pas créer de dépendance circulaire — la protection est le secret HTTP.
 *
 * Réponses :
 *   200  { purged: N, errors: 0 }   — tout s'est bien passé
 *   207  { purged: N, errors: M }   — succès partiel (certains comptes non purgés)
 *   401  { error: 'unauthorized' }  — secret absent ou invalide
 *   500  { error: 'not_configured' } — PURGE_ACCOUNTS_SECRET non défini dans l'env
 */

import { createHash } from 'node:crypto';

import { NextResponse } from 'next/server';

import { logger } from '../../../../lib/logger';
import { purgeExpiredAccounts } from '../../../../lib/purge/purgeExpiredAccounts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function shortHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function requestIpHash(request: Request): string {
  return shortHash(request.headers.get('x-forwarded-for') ?? 'unknown');
}

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.PURGE_ACCOUNTS_SECRET;

  if (!secret) {
    logger.error('purge.cron.not_configured', {
      hint: 'PURGE_ACCOUNTS_SECRET manquant dans .env',
    });
    return NextResponse.json(
      { error: 'not_configured' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${secret}`) {
    logger.warn('purge.cron.unauthorized', {
      keyHash: requestIpHash(request),
    });
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  logger.info('purge.cron.triggered', {
    keyHash: requestIpHash(request),
  });

  const result = await purgeExpiredAccounts();

  const status = result.errors > 0 ? 207 : 200;
  return NextResponse.json(result, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
