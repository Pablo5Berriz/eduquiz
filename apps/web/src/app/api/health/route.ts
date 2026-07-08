import { prisma } from '@eduquiz/db';
import { NextResponse } from 'next/server';

/**
 * Endpoint de santé combiné liveness + readiness.
 *
 * Utilisé par les probes Docker/Proxmox (étape 0.5) et par les checks
 * de déploiement CI. Ne dépend JAMAIS d'une authentification — il est
 * appelé anonymement par le proxy.
 *
 * Vérifie :
 *   - l'application répond (trivialement, si ce handler s'exécute)
 *   - la base Postgres est joignable (`SELECT 1`)
 *
 * Redis et MinIO seront ajoutés quand les clients respectifs seront
 * câblés systématiquement. En cas d'échec partiel on renvoie `503` avec
 * le détail par dépendance, pour qu'un monitoring puisse pager
 * précisément.
 */

export const runtime = 'nodejs'; // Prisma n'est pas compatible edge
export const dynamic = 'force-dynamic'; // pas de cache HTTP, état en temps réel

type Status = 'ok' | 'degraded' | 'down';

interface HealthReport {
  readonly status: Status;
  readonly version: string;
  readonly checks: {
    readonly app: 'ok';
    readonly database: 'ok' | 'down';
  };
  readonly uptimeSeconds: number;
  readonly timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthReport>> {
  const timestamp = new Date().toISOString();
  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.npm_package_version ?? '0.0.0';

  let database: 'ok' | 'down' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: unknown) {
    database = 'down';
     
    console.error('[health] database check failed:', err);
  }

  const status: Status = database === 'ok' ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status,
      version,
      checks: { app: 'ok', database },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp,
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
