/**
 * Route Handler — Export Loi 25.
 *
 * GET `/api/account/export?locale=fr|en`
 *
 * Renvoie un JSON immédiat contenant l'ensemble des données
 * personnelles de l'utilisateur authentifié :
 *   - Profil (firstName, lastName, displayName, currentGrade,
 *     preferredLocale, avatarUrl, province, birthDate)
 *   - Compte (email, role, locale, emailVerifiedAt, disabledAt,
 *     deletedAt, createdAt, updatedAt)
 *   - Journal de consentement (ConsentRecord)
 *   - Journal d'audit où l'utilisateur est acteur (AuditLog filtré
 *     par actorId = userId)
 *   - Historique des DataRequest
 *
 * Trace simultanément :
 *   - création d'un DataRequest type=EXPORT, status=COMPLETED
 *   - AuditLog `DATA_EXPORT_DELIVERED`
 *
 * Force le runtime Node — Prisma + ReadableStream incompatibles avec
 * Edge.
 */

import { AuditEventKind, DataRequestKind, DataRequestStatus, prisma } from '@eduquiz/db';
import { NextResponse } from 'next/server';

import { requireApiUser, UnauthenticatedError, ForbiddenError } from '../../../../lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  let user;
  try {
    user = await requireApiUser();
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }

  // Charge tout en parallèle pour réduire la latence.
  const [profile, account, consents, audit, requests] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        firstName: true,
        lastName: true,
        displayName: true,
        currentGrade: true,
        schoolCycle: true,
        avatarUrl: true,
        preferredLocale: true,
        province: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        locale: true,
        emailVerifiedAt: true,
        disabledAt: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.consentRecord.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        kind: true,
        documentRef: true,
        payload: true,
        recordedAt: true,
        subjectUserId: true,
      },
      orderBy: { recordedAt: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: { actorId: user.id },
      select: {
        id: true,
        kind: true,
        targetId: true,
        targetType: true,
        payload: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: 'desc' },
      take: 1000, // garde-fou : très anciens comptes
    }),
    prisma.dataRequest.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        kind: true,
        status: true,
        format: true,
        graceExpiresAt: true,
        createdAt: true,
        completedAt: true,
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: '1',
    account,
    profile,
    consents,
    auditLog: audit,
    dataRequests: requests,
  };

  // Trace cet export (best-effort hors Promise.all).
  try {
    await prisma.$transaction(async (tx) => {
      const dr = await tx.dataRequest.create({
        data: {
          userId: user!.id,
          kind: DataRequestKind.EXPORT,
          status: DataRequestStatus.COMPLETED,
          format: 'JSON',
          completedAt: new Date(),
          metadata: { trigger: 'self-service' } as never,
        },
        select: { id: true },
      });
      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.DATA_EXPORT_DELIVERED,
          actorId: user!.id,
          targetId: user!.id,
          targetType: 'user',
          payload: { dataRequestId: dr.id, format: 'JSON' } as never,
        },
      });
    });
  } catch {
    // L'audit ne doit pas bloquer le téléchargement.
  }

  // Nom de fichier court avec date — l'ID utilisateur est volontairement
  // tronqué pour éviter de leak l'UUID complet dans les répertoires
  // utilisateur.
  const date = new Date().toISOString().slice(0, 10);
  const shortId = user.id.slice(0, 8);
  const filename = `eduquiz-export-${shortId}-${date}.json`;

  // Ignore intentionnellement le query `?locale=` côté contenu — la
  // payload n'est pas localisée (données brutes).
  void request;

  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
