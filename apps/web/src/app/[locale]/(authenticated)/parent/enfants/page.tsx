import { UserRole, prismaService as prisma } from '@eduquiz/db';
import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';

import { requireRoleOrRedirect } from '../../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';

import { ParentDashboardForm, type ChildLink } from './ParentDashboardForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'family.parentDashboard.title'),
    robots: { index: false, follow: false },
  };
}

export default async function ParentChildrenPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await requireRoleOrRedirect(locale, UserRole.PARENT, '/parent/enfants');
  const messages = getMessages(locale);

  // Charger les liens existants (PENDING + VERIFIED + REVOKED).
  const links = await prisma.parentChildLink.findMany({
    where: { parentId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      state: true,
      child: { select: { email: true } },
    },
  });

  const childLinks: readonly ChildLink[] = links.map((l) => ({
    id: l.id,
    childEmail: l.child.email,
    state: l.state as ChildLink['state'],
  }));

  const copy = {
    addChild: t(messages, 'family.parentDashboard.addChild'),
    childEmailLabel: t(messages, 'family.parentDashboard.childEmailLabel'),
    childEmailHint: t(messages, 'family.parentDashboard.childEmailHint'),
    submit: t(messages, 'family.parentDashboard.submit'),
    submitting: t(messages, 'family.parentDashboard.submitting'),
    codeGenerated: t(messages, 'family.parentDashboard.codeGenerated'),
    codeInstruction: t(messages, 'family.parentDashboard.codeInstruction'),
    codeExpiry: t(messages, 'family.parentDashboard.codeExpiry'),
    close: t(messages, 'family.parentDashboard.close'),
    children: t(messages, 'family.parentDashboard.children'),
    noChildren: t(messages, 'family.parentDashboard.noChildren'),
    statePending: t(messages, 'family.parentDashboard.statePending'),
    stateVerified: t(messages, 'family.parentDashboard.stateVerified'),
    stateRevoked: t(messages, 'family.parentDashboard.stateRevoked'),
    errors: {
      childNotFound: t(messages, 'family.parentDashboard.errors.childNotFound'),
      notMinor: t(messages, 'family.parentDashboard.errors.notMinor'),
      alreadyLinked: t(messages, 'family.parentDashboard.errors.alreadyLinked'),
      maxChildren: t(messages, 'family.parentDashboard.errors.maxChildren'),
      unknown: t(messages, 'family.parentDashboard.errors.unknown'),
      rateLimited: t(messages, 'family.parentDashboard.errors.rateLimited'),
    },
  };

  return (
    <Container width="md" className="py-12 sm:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
          {t(messages, 'family.parentDashboard.title')}
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          {t(messages, 'family.parentDashboard.subtitle')}
        </p>
      </div>

      <ParentDashboardForm initialLinks={childLinks} copy={copy} />
    </Container>
  );
}
