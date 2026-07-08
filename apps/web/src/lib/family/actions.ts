'use server';

/**
 * Server Actions — flux de rattachement parent ↔ enfant (Tâche 2.2).
 *
 * Trois actions :
 *   1. `createParentInvitation` : le parent entre l'email de l'élève →
 *      code 6 chiffres généré → link PENDING créé.
 *   2. `redeemParentCode` : le mineur saisit le code → childIpAddress
 *      enregistré → email de confirmation envoyé au parent.
 *   3. `confirmParentLink` : le parent clique le lien → state = VERIFIED.
 *
 * Sécurité :
 *   - `createParentInvitation` : réservé au rôle PARENT (ou ADMIN).
 *   - `redeemParentCode` : réservé au rôle LEARNER_MINOR ; vérifie que
 *     `childId === user.id` pour éviter la saisie d'un code d'un autre.
 *   - `confirmParentLink` : public, token 32 bytes (256 bits) 24 h.
 *   - Rate limiting sur les deux premières actions.
 *   - Toutes les mutations utilisent prismaService (cross-user).
 */

import { createToken, consumeToken } from '@eduquiz/auth/tokens';
import { AuditEventKind, ConsentEventKind, ParentLinkState, UserRole, prismaService as prisma } from '@eduquiz/db';
import { buildParentLinkConfirmEmail, sendEmail } from '@eduquiz/email';
import { headers } from 'next/headers';

import { logger } from '../logger';
import { requireApiUser } from '../auth/server';
import { checkRateLimit, currentClientIp } from '../auth/rate-limit-server';
import { getCanonicalAuthUrl } from '../auth/url';
import { resolveLocaleParam } from '../i18n/locale';

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type InvitationErrorCode =
  | 'childNotFound'
  | 'notMinor'
  | 'alreadyLinked'
  | 'maxChildren'
  | 'rateLimited'
  | 'unknown';

export type InvitationResult =
  | { readonly ok: true; readonly code: string }
  | { readonly ok: false; readonly error: InvitationErrorCode };

export type RedeemErrorCode =
  | 'codeInvalid'
  | 'codeNotForYou'
  | 'alreadyRedeemed'
  | 'rateLimited'
  | 'unknown';

export type RedeemResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: RedeemErrorCode };

export type ConfirmLinkResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'invalid' | 'expired' };

// ─────────────────────────────────────────────────────────────────────────────
//  1. createParentInvitation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère un code à 6 chiffres et crée un `ParentChildLink` PENDING.
 * Réservé au rôle PARENT (ou ADMIN). Le parent spécifie l'email du
 * compte élève à rattacher.
 */
export async function createParentInvitation(
  childEmail: string,
): Promise<InvitationResult> {
  const user = await requireApiUser();

  // Seul un PARENT (ou ADMIN) peut créer une invitation.
  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    return { ok: false, error: 'unknown' };
  }

  // Rate limiting par userId parent.
  const limited = await checkRateLimit({ bucket: 'createParentInvitation', key: user.id });
  if (!limited.allowed) {
    logger.warn('family.create_parent_invitation.rate_limited', { keyHash: limited.keyHash });
    return { ok: false, error: 'rateLimited' };
  }

  const email = childEmail.trim().toLowerCase();

  try {
    // Trouver l'enfant par email.
    const child = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!child) return { ok: false, error: 'childNotFound' };
    if (child.role !== UserRole.LEARNER_MINOR) return { ok: false, error: 'notMinor' };

    // Vérifier qu'il n'existe pas déjà un lien PENDING ou VERIFIED
    // entre ce parent et cet enfant.
    const existing = await prisma.parentChildLink.findFirst({
      where: {
        parentId: user.id,
        childId: child.id,
        state: { in: [ParentLinkState.PENDING, ParentLinkState.VERIFIED] },
      },
      select: { id: true },
    });
    if (existing) return { ok: false, error: 'alreadyLinked' };

    // Limiter à 4 enfants actifs par parent.
    const activeCount = await prisma.parentChildLink.count({
      where: {
        parentId: user.id,
        state: { in: [ParentLinkState.PENDING, ParentLinkState.VERIFIED] },
      },
    });
    if (activeCount >= 4) return { ok: false, error: 'maxChildren' };

    // Générer un code 6 chiffres unique (retry en cas de collision rare).
    const code = await generateUniqueCode();
    const codeExpiresAt = new Date(Date.now() + 24 * 60 * 60_000);

    await prisma.$transaction(async (tx) => {
      await tx.parentChildLink.create({
        data: {
          parentId: user.id,
          childId: child.id,
          invitationCode: code,
          codeExpiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.PARENT_LINK_CREATED,
          actorId: user.id,
          targetId: child.id,
          targetType: 'user',
          payload: { invitationCode: code } as never,
        },
      });
    });

    return { ok: true, code };
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. redeemParentCode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Le mineur saisit le code fourni par son parent. Enregistre l'IP et
 * envoie un email de confirmation au parent.
 */
export async function redeemParentCode(
  code: string,
  _locale: string,
): Promise<RedeemResult> {
  const user = await requireApiUser();

  // Seul un mineur peut saisir un code.
  if (user.role !== UserRole.LEARNER_MINOR) {
    return { ok: false, error: 'unknown' };
  }

  // Rate limiting par userId mineur.
  const limited = await checkRateLimit({ bucket: 'redeemParentCode', key: user.id });
  if (!limited.allowed) {
    logger.warn('family.redeem_parent_code.rate_limited', { keyHash: limited.keyHash });
    return { ok: false, error: 'rateLimited' };
  }

  const cleanCode = code.trim();

  try {
    const link = await prisma.parentChildLink.findUnique({
      where: { invitationCode: cleanCode },
      include: {
        parent: { select: { email: true, locale: true } },
        child: { select: { email: true } },
      },
    });

    // Code inconnu ou expiré.
    if (!link || link.state !== ParentLinkState.PENDING || link.codeExpiresAt < new Date()) {
      return { ok: false, error: 'codeInvalid' };
    }

    // Le code appartient à un autre enfant.
    if (link.childId !== user.id) {
      return { ok: false, error: 'codeNotForYou' };
    }

    // Code déjà utilisé (childIpAddress déjà enregistré).
    if (link.childIpAddress !== null) {
      return { ok: false, error: 'alreadyRedeemed' };
    }

    const hdrs = headers();
    const childIp = currentClientIp();
    const childUa = hdrs.get('user-agent') ?? '';

    // Enregistrer l'IP du mineur.
    await prisma.parentChildLink.update({
      where: { id: link.id },
      data: { childIpAddress: childIp, childUserAgent: childUa },
    });

    // Token de confirmation pour le parent (24 h).
    // Identifier = `confirm-parent-link:linkId`.
    const { token } = await createToken({
      purpose: 'confirm-parent-link',
      email: link.id, // linkId stocké dans le champ "email" du token
    });

    const resolvedLocale = resolveLocaleParam(
      link.parent.locale.toLowerCase() as string,
    );
    const confirmUrl = getCanonicalAuthUrl(
      `/${resolvedLocale}/rattachement/${encodeURIComponent(token)}`,
    );

    try {
      await sendEmail(
        buildParentLinkConfirmEmail({
          to: link.parent.email,
          locale: resolvedLocale,
          childEmail: link.child.email,
          confirmUrl,
        }),
      );
    } catch {
      // Best-effort — l'IP est déjà enregistrée, le parent peut renvoyer
      // le code manuellement depuis son tableau de bord (à construire).
    }

    await prisma.auditLog.create({
      data: {
        kind: AuditEventKind.PARENT_LINK_CREATED,
        actorId: user.id,
        targetId: link.id,
        targetType: 'parent_child_link',
        payload: { step: 'code_redeemed' } as never,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. confirmParentLink
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Le parent clique le lien reçu par courriel → state = VERIFIED.
 * Action publique (pas d'auth requise) : le token 256-bit suffit.
 */
export async function confirmParentLink(token: string): Promise<ConfirmLinkResult> {
  const consumed = await consumeToken(token);
  if (!consumed) return { ok: false, reason: 'invalid' };
  if (consumed.purpose !== 'confirm-parent-link') return { ok: false, reason: 'invalid' };

  const linkId = consumed.email; // le linkId est stocké dans le champ "email"

  try {
    const link = await prisma.parentChildLink.findUnique({
      where: { id: linkId },
      select: { id: true, state: true, parentId: true, childId: true },
    });

    if (!link || link.state !== ParentLinkState.PENDING) {
      return { ok: false, reason: 'invalid' };
    }

    const hdrs = headers();
    const parentIp = currentClientIp();
    const parentUa = hdrs.get('user-agent') ?? '';
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.parentChildLink.update({
        where: { id: link.id },
        data: {
          state: ParentLinkState.VERIFIED,
          verifiedAt: now,
          parentIpAddress: parentIp,
          parentUserAgent: parentUa,
        },
      });

      // ConsentRecord PARENT_CONFIRMED — preuve légale Loi 25 art. 4.1.
      // IP + user-agent du parent capturés au moment du clic sur le lien.
      await tx.consentRecord.create({
        data: {
          userId: link.parentId,
          subjectUserId: link.childId,
          kind: ConsentEventKind.PARENT_CONFIRMED,
          ipAddress: parentIp,
          userAgent: parentUa,
          payload: { linkId: link.id } as never,
        },
      });

      await tx.auditLog.create({
        data: {
          kind: AuditEventKind.PARENT_LINK_CREATED,
          actorId: link.parentId,
          targetId: link.id,
          targetType: 'parent_child_link',
          payload: { step: 'confirmed', childId: link.childId } as never,
        },
      });
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS PRIVÉS
// ─────────────────────────────────────────────────────────────────────────────

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const existing = await prisma.parentChildLink.findUnique({
      where: { invitationCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error('Unable to generate unique invitation code after 10 attempts');
}
