import { prisma } from '@eduquiz/db';
import { NextResponse } from 'next/server';

/**
 * Endpoint de santé.
 *
 * Utilisé par les probes Docker/Proxmox (étape 0.5) et par les checks
 * de déploiement CI. Ne doit JAMAIS dépendre d'une authentification —
 * il est appelé anonymement par le proxy.
 *
 * Vérifie :
 *   - l'application répond (trivialement, si ce handler s'exécute)
 *   - la base Postgres est joignable (SELECT 1)
 *
 * Redis et MinIO seront ajoutés quand les clients respectifs seront
 * câblés. En cas d'échec partiel on renvoie `503` avec le détail par
 * dépendance, pour qu'un monitoring puisse pager précisément.
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
  readonly timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthReport>> {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version ?? '0.0.0';

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
      checks: {
        app: 'ok',
        database,
      },
      timestamp,
    },
    { status: status === 'ok' ? 200 : 503 },
  );
}
