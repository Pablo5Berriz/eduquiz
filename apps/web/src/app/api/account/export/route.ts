/**
 * Route Handler — Export Loi 25.
 *
 * GET `/api/account/export?locale=fr|en&format=json|pdf`
 *
 * Renvoie les données personnelles de l'utilisateur authentifié au
 * format choisi (défaut : JSON).
 *
 * Payload :
 *   - Profil (firstName, lastName, displayName, currentGrade, ...)
 *   - Compte (email, role, locale, emailVerifiedAt, ...)
 *   - Journal de consentement (ConsentRecord)
 *   - Journal d'audit acteur (AuditLog, derniers 1 000)
 *   - Historique des DataRequest
 *
 * Trace simultanément :
 *   - DataRequest type=EXPORT, status=COMPLETED
 *   - AuditLog `DATA_EXPORT_DELIVERED`
 *
 * Force le runtime Node — Prisma + pdf-lib incompatibles avec Edge.
 */

import { AuditEventKind, DataRequestKind, DataRequestStatus, withUser } from '@eduquiz/db';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { requireApiUser, UnauthenticatedError, ForbiddenError } from '../../../../lib/auth/server';

import type { RlsRole } from '@eduquiz/db';

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

  const ctx = { userId: user.id, role: user.role as RlsRole };

  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') ?? 'fr';
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase();

  // Toutes les lectures dans une transaction RLS-scoped.
  const [profile, account, consents, audit, requests] = await withUser(ctx).$transaction(
    async (tx) => {
      const profile = await tx.profile.findUnique({
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
      });
      const account = await tx.user.findUnique({
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
      });
      const consents = await tx.consentRecord.findMany({
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
      });
      const audit = await tx.auditLog.findMany({
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
        take: 1000,
      });
      const requests = await tx.dataRequest.findMany({
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
      });
      return [profile, account, consents, audit, requests] as const;
    },
  );

  const exportedAt = new Date().toISOString();
  const exportPayload = {
    exportedAt,
    schemaVersion: '1',
    account,
    profile,
    consents,
    auditLog: audit,
    dataRequests: requests,
  };

  const date = new Date().toISOString().slice(0, 10);
  const shortId = user.id.slice(0, 8);
  const isPdf = format === 'pdf';
  const fileFormat = isPdf ? 'PDF' : 'JSON';

  // Trace cet export (best-effort).
  try {
    await withUser(ctx).$transaction(async (tx) => {
      const dr = await tx.dataRequest.create({
        data: {
          userId: user.id,
          kind: DataRequestKind.EXPORT,
          status: DataRequestStatus.COMPLETED,
          format: fileFormat,
          completedAt: new Date(),
          metadata: { trigger: 'self-service' } as never,
        },
        select: { id: true },
      });
      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.DATA_EXPORT_DELIVERED,
          actorId: user.id,
          targetId: user.id,
          targetType: 'user',
          payload: { dataRequestId: dr.id, format: fileFormat } as never,
        },
      });
    });
  } catch {
    // L'audit ne doit pas bloquer le téléchargement.
  }

  if (isPdf) {
    const pdfBytes = await buildExportPdf(exportPayload, locale);
    const filename = `eduquiz-export-${shortId}-${date}.pdf`;
    const pdfBody = new Uint8Array(pdfBytes.byteLength);
    pdfBody.set(pdfBytes);
    return new Response(pdfBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const filename = `eduquiz-export-${shortId}-${date}.json`;
  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

interface ExportPayload {
  exportedAt: string;
  schemaVersion: string;
  account: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  consents: readonly Record<string, unknown>[];
  auditLog: readonly Record<string, unknown>[];
  dataRequests: readonly Record<string, unknown>[];
}

async function buildExportPdf(payload: ExportPayload, locale: string): Promise<Uint8Array> {
  const isFr = locale === 'fr';

  const L = {
    docTitle: isFr ? 'Mes données personnelles — EduQuiz' : 'My personal data — EduQuiz',
    exportedAt: isFr ? 'Généré le' : 'Generated on',
    law: isFr ? 'Conformément à la Loi 25 du Québec.' : 'In compliance with Quebec Law 25.',
    account: isFr ? 'Compte' : 'Account',
    profile: isFr ? 'Profil' : 'Profile',
    consents: isFr ? 'Journal de consentements' : 'Consent log',
    audit: isFr ? "Journal d'audit (derniers 50)" : 'Audit log (last 50)',
    dataRequests: isFr ? 'Demandes de données' : 'Data requests',
    none: isFr ? 'Aucune entrée.' : 'No entries.',
    // account fields
    id: 'ID',
    email: 'Email',
    role: isFr ? 'Rôle' : 'Role',
    localeLabel: isFr ? 'Langue' : 'Locale',
    emailVerified: isFr ? 'Email vérifié le' : 'Email verified at',
    createdAt: isFr ? 'Créé le' : 'Created at',
    updatedAt: isFr ? 'Mis à jour le' : 'Updated at',
    disabledAt: isFr ? 'Désactivé le' : 'Disabled at',
    deletedAt: isFr ? 'Supprimé le' : 'Deleted at',
    // profile fields
    firstName: isFr ? 'Prénom' : 'First name',
    lastName: isFr ? 'Nom' : 'Last name',
    displayName: isFr ? 'Pseudo' : 'Display name',
    birthDate: isFr ? 'Date de naissance' : 'Birth date',
    grade: isFr ? 'Niveau scolaire' : 'Grade',
    province: isFr ? 'Province' : 'Province',
  };

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 612;
  const PAGE_H = 792;
  const M = 60; // margin
  const CONTENT_W = PAGE_W - M * 2;
  const LINE_H = 13;
  const BODY = 9;
  const SECTION = 11;
  const TITLE = 16;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - M;

  function ensureSpace(needed: number): void {
    if (y - needed < M) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - M;
    }
  }

  function clip(val: unknown, max = 80): string {
    if (val === null || val === undefined) return '—';
    const raw =
      val instanceof Date
        ? val.toISOString()
        : typeof val === 'string' ||
            typeof val === 'number' ||
            typeof val === 'boolean' ||
            typeof val === 'bigint'
          ? String(val)
          : JSON.stringify(val);
    const s = raw;
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }

  function drawSectionHeader(title: string): void {
    ensureSpace(SECTION + LINE_H + 10);
    y -= 8;
    page.drawText(title, {
      x: M,
      y,
      size: SECTION,
      font: bold,
      color: rgb(0.12, 0.12, 0.45),
      maxWidth: CONTENT_W,
    });
    y -= SECTION + 2;
    page.drawLine({
      start: { x: M, y },
      end: { x: PAGE_W - M, y },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75),
    });
    y -= 6;
  }

  function drawField(label: string, value: unknown): void {
    ensureSpace(LINE_H + 2);
    const labelText = `${label}: `;
    const labelW = bold.widthOfTextAtSize(labelText, BODY);
    page.drawText(labelText, {
      x: M,
      y,
      size: BODY,
      font: bold,
      color: rgb(0.35, 0.35, 0.35),
    });
    page.drawText(clip(value), {
      x: M + labelW,
      y,
      size: BODY,
      font: regular,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: CONTENT_W - labelW,
    });
    y -= LINE_H;
  }

  function drawBullet(text: string): void {
    ensureSpace(LINE_H + 2);
    page.drawText('•', { x: M, y, size: BODY, font: regular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(clip(text, 100), {
      x: M + 12,
      y,
      size: BODY,
      font: regular,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: CONTENT_W - 12,
    });
    y -= LINE_H;
  }

  function drawMuted(text: string): void {
    ensureSpace(LINE_H);
    page.drawText(text, {
      x: M,
      y,
      size: BODY,
      font: regular,
      color: rgb(0.55, 0.55, 0.55),
      maxWidth: CONTENT_W,
    });
    y -= LINE_H;
  }

  // ── Document title ────────────────────────────────────────────────────────
  ensureSpace(TITLE + LINE_H * 2 + 20);
  page.drawText(L.docTitle, {
    x: M,
    y,
    size: TITLE,
    font: bold,
    color: rgb(0.08, 0.08, 0.45),
    maxWidth: CONTENT_W,
  });
  y -= TITLE + 6;
  page.drawText(`${L.exportedAt}: ${payload.exportedAt}`, {
    x: M,
    y,
    size: BODY,
    font: regular,
    color: rgb(0.5, 0.5, 0.5),
    maxWidth: CONTENT_W,
  });
  y -= LINE_H;
  page.drawText(L.law, {
    x: M,
    y,
    size: BODY,
    font: regular,
    color: rgb(0.5, 0.5, 0.5),
    maxWidth: CONTENT_W,
  });
  y -= LINE_H + 4;

  // ── Account ───────────────────────────────────────────────────────────────
  drawSectionHeader(L.account);
  if (payload.account) {
    const a = payload.account;
    drawField(L.id, a.id);
    drawField(L.email, a.email);
    drawField(L.role, a.role);
    drawField(L.localeLabel, a.locale);
    drawField(L.emailVerified, a.emailVerifiedAt);
    drawField(L.createdAt, a.createdAt);
    drawField(L.updatedAt, a.updatedAt);
    if (a.disabledAt) drawField(L.disabledAt, a.disabledAt);
    if (a.deletedAt) drawField(L.deletedAt, a.deletedAt);
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  drawSectionHeader(L.profile);
  if (payload.profile) {
    const p = payload.profile;
    drawField(L.firstName, p.firstName);
    drawField(L.lastName, p.lastName);
    drawField(L.displayName, p.displayName);
    drawField(L.birthDate, p.birthDate);
    drawField(L.grade, p.currentGrade);
    drawField(L.province, p.province);
    drawField(L.createdAt, p.createdAt);
    drawField(L.updatedAt, p.updatedAt);
  }

  // ── Consents ──────────────────────────────────────────────────────────────
  drawSectionHeader(L.consents);
  if (payload.consents.length === 0) {
    drawMuted(L.none);
  } else {
    for (const c of payload.consents) {
      drawBullet(
        `${clip(c.recordedAt, 24)} — ${clip(c.kind)} ${c.subjectUserId ? `(subject: ${clip(c.subjectUserId, 8)}…)` : ''}`,
      );
    }
  }

  // ── Audit log (last 50) ───────────────────────────────────────────────────
  drawSectionHeader(L.audit);
  const auditSlice = payload.auditLog.slice(0, 50);
  if (auditSlice.length === 0) {
    drawMuted(L.none);
  } else {
    for (const a of auditSlice) {
      drawBullet(
        `${clip(a.recordedAt, 24)} — ${clip(a.kind)} → ${clip(a.targetType)}/${clip(a.targetId, 8)}…`,
      );
    }
  }

  // ── Data requests ─────────────────────────────────────────────────────────
  drawSectionHeader(L.dataRequests);
  if (payload.dataRequests.length === 0) {
    drawMuted(L.none);
  } else {
    for (const r of payload.dataRequests) {
      drawBullet(
        `${clip(r.createdAt, 24)} — ${clip(r.kind)} / ${clip(r.status)} / ${clip(r.format)}`,
      );
    }
  }

  return pdfDoc.save();
}
